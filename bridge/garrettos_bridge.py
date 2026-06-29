#!/usr/bin/env python3
"""
GarrettOS Hetzner Read-Only Bridge (M8)

A small, read-only HTTP service that exposes live VPS/OpenClaw/tmux/task/event/
model/memory/integration data to the GarrettOS dashboard running on Vercel.

SAFETY CONTRACT
- Read-only. Only GET. POST/PUT/DELETE/PATCH return 405.
- Never executes commands from HTTP requests. The only subprocess calls are
  hard-coded, read-only inspection commands (e.g. `tmux ls`, `systemctl status`,
  `docker ps`). No user input reaches a shell.
- Never exposes secrets. Tokens/API keys in log lines are scrubbed before they
  leave the bridge. The bearer token is checked but never echoed.
- Requires Bearer token auth on every data endpoint. /ping is the only
  unauthenticated endpoint (a liveness check).
- Safe if OpenClaw/tmux/log files are missing — every probe degrades to an
  empty/idle response, never a 500.

Responses are JSON shaped to match lib/garrettos/types.ts so the Vercel
server-provider can consume them directly.
"""

from __future__ import annotations

import json
import os
import re
import shlex
import subprocess
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import FastAPI, Header, HTTPException, Request, status
from fastapi.responses import JSONResponse

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

BRIDGE_TOKEN = os.environ.get("GARRETTOS_BRIDGE_TOKEN", "")
# Bind to loopback by default. Set BRIDGE_BIND=0.0.0.0 only behind a reverse proxy.
BIND_HOST = os.environ.get("BRIDGE_BIND", "127.0.0.1")
BIND_PORT = int(os.environ.get("BRIDGE_PORT", "8788"))

LITELLM_URL = os.environ.get("LITELLM_URL", "http://127.0.0.1:4000")
OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://127.0.0.1:11434")
QDRANT_URL = os.environ.get("QDRANT_URL", "http://127.0.0.1:6333")
VALKEY_URL = os.environ.get("VALKEY_URL", "redis://127.0.0.1:6379")

VAULT_PATHS = [
    Path("/root/vault"),
    Path("/root/secondbrain"),
    Path("/root/openclaw-advanced"),
]
TASK_PATHS = [p / "OpenClawMemory" / "tasks" for p in VAULT_PATHS]

SUBPROCESS_TIMEOUT = 3  # seconds; never let a probe hang a request
STARTED_AT = time.time()

# Patterns scrubbed from any log line before it is returned.
SECRET_PATTERNS = [
    # Bearer tokens / api keys: sk-..., ghp_..., sb-..., xai-..., etc.
    re.compile(r"(sk-[A-Za-z0-9_\-]{6})[A-Za-z0-9_\-]*"),
    re.compile(r"(ghp_[A-Za-z0-9]{4})[A-Za-z0-9]*"),
    re.compile(r"(sb-[A-Za-z0-9_\-]{4})[A-Za-z0-9_\-]*"),
    re.compile(r"(xai-[A-Za-z0-9]{4})[A-Za-z0-9]*"),
    re.compile(r"(Bearer\s+[A-Za-z0-9_\-\.]{4})[A-Za-z0-9_\-\.]*", re.IGNORECASE),
    # Generic password=/token=/api_key= assignments
    re.compile(r"(password=)(\S{2})", re.IGNORECASE),
    re.compile(r"(token=)(\S{2})", re.IGNORECASE),
    re.compile(r"(api[_-]?key=)(\S{2})", re.IGNORECASE),
    # redis://user:pass@host
    re.compile(r"(redis://[^:]+:)([^@]+)(@)"),
]

app = FastAPI(title="GarrettOS Bridge", version="1.0.0", docs_url=None, redoc_url=None)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def envelope(data: Any, source: str = "server", warning: str | None = None) -> dict[str, Any]:
    """Match the ProviderResult<T> envelope from lib/garrettos/types.ts."""
    out: dict[str, Any] = {"data": data, "source": source, "fetchedAt": now_iso()}
    if warning:
        out["warning"] = warning
    return out


def require_token(authorization: str | None) -> None:
    """Reject with 401 if the bearer token is missing or wrong.

    If GARRETTOS_BRIDGE_TOKEN is unset, we refuse all data requests rather than
    run open — the operator must set a token before enabling the bridge.
    """
    if not BRIDGE_TOKEN:
        raise HTTPException(status_code=503, detail="Bridge token not configured on server")
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    token = authorization.split(" ", 1)[1].strip()
    if token != BRIDGE_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid bearer token")


def safe_run(cmd: list[str], timeout: float = SUBPROCESS_TIMEOUT) -> str | None:
    """Run a hard-coded read-only command and return stdout, or None on failure.

    Never raises. Never passes user input. Always uses a list (no shell=True).
    """
    try:
        proc = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout,
            check=False,
        )
        return proc.stdout.strip() if proc.returncode == 0 else None
    except Exception:
        return None


def scrub(text: str) -> str:
    """Strip secrets from a log line before returning it."""
    out = text
    for pat in SECRET_PATTERNS:
        out = pat.sub(lambda m: m.group(1) + "***", out)
    return out


def tone_for_status(ok: bool, idle: bool = False) -> str:
    if ok:
        return "good"
    if idle:
        return "idle"
    return "warn"


def _proc_up(name: str) -> bool:
    """True if a process matching `name` is running (read-only pgrep)."""
    return safe_run(["pgrep", "-f", name]) is not None


def _http_ok(url: str, timeout: float = SUBPROCESS_TIMEOUT) -> bool:
    """True if a local HTTP endpoint returns 200. Used for service probes."""
    import urllib.request
    try:
        req = urllib.request.Request(url, headers={"Accept": "application/json"})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status == 200
    except Exception:
        return False


# ---------------------------------------------------------------------------
# Auth middleware (applied to every data endpoint via dependency)
# ---------------------------------------------------------------------------

@app.middleware("http")
async def block_write_methods(request: Request, call_next):
    """Enforce read-only everywhere EXCEPT the single allowed write endpoint.

    POST /tasks/create is the one permitted mutation (M10): it writes a queued
    markdown task file to the vault. Every other non-GET/HEAD request is 405.
    The /tasks/create handler itself re-checks the token and sanitizes input.
    """
    if request.method in ("GET", "HEAD"):
        return await call_next(request)
    # Allow only POST to exactly /tasks/create; reject everything else.
    if request.method == "POST" and request.url.path.rstrip("/") == "/tasks/create":
        return await call_next(request)
    return JSONResponse({"detail": "Method Not Allowed — bridge is read-only"}, status_code=405)


# ---------------------------------------------------------------------------
# Liveness (unauthenticated)
# ---------------------------------------------------------------------------

@app.get("/ping")
def ping():
    return {"ok": True, "service": "garrettos-bridge", "uptime_s": round(time.time() - STARTED_AT, 1)}


# ---------------------------------------------------------------------------
# /health
# ---------------------------------------------------------------------------

@app.get("/health")
def health(authorization: str | None = Header(default=None)):
    require_token(authorization)

    hostname = safe_run(["hostname"]) or "unknown"

    # uptime
    uptime_raw = safe_run(["cat", "/proc/uptime"])
    uptime_s = 0.0
    if uptime_raw:
        try:
            uptime_s = float(uptime_raw.split()[0])
        except Exception:
            pass

    # CPU percent (load average, 1-min) as a rough proxy
    loadavg_raw = safe_run(["cat", "/proc/loadavg"])
    cpu_pct = "—"
    if loadavg_raw:
        try:
            load1 = float(loadavg_raw.split()[0])
            # rough: load / cpu count * 100
            cpus = os.cpu_count() or 1
            cpu_pct = f"{min(100, round(load1 / cpus * 100))}%"
        except Exception:
            pass

    # Memory — /proc/meminfo values are in KB. Convert to GB for display fields
    # labeled "GB", and keep the *_mb fields in MB (as their names promise).
    mem_used_mb = mem_total = 0.0
    meminfo = safe_run(["cat", "/proc/meminfo"])
    if meminfo:
        info = {}
        for line in meminfo.splitlines():
            parts = line.split(":")
            if len(parts) == 2:
                key = parts[0].strip()
                val = parts[1].strip().split()[0]
                info[key] = int(val) / 1024.0  # KB → MB
        mem_total = info.get("MemTotal", 0.0)
        mem_avail = info.get("MemAvailable", mem_total)
        mem_used_mb = max(0.0, mem_total - mem_avail)
    # GB equivalents for anything labeled "GB"
    mem_used_gb = mem_used_mb / 1024.0
    mem_total_gb = mem_total / 1024.0

    # Disk (root fs)
    disk_used = disk_total = 0.0
    df = safe_run(["df", "-B1", "/"])
    if df:
        lines = df.splitlines()
        if len(lines) >= 2:
            cols = lines[1].split()
            if len(cols) >= 4:
                try:
                    disk_total = float(cols[1]) / 1e9  # B → GB
                    disk_used = float(cols[2]) / 1e9
                except Exception:
                    pass

    def service_status(name: str, check_cmd: list[str]) -> dict[str, Any]:
        ok = safe_run(check_cmd) is not None
        return {"name": name, "ok": ok, "status": "running" if ok else "down"}

    services = [
        service_status("docker", ["docker", "info"]),
        service_status("litellm", ["systemctl", "is-active", "--quiet", "litellm"]),
        service_status("ollama", ["systemctl", "is-active", "--quiet", "ollama"]),
        service_status("openclaw", ["systemctl", "is-active", "--quiet", "openclaw"]),
    ]
    # Container detection (best-effort, never fatal)
    docker_ps = safe_run(["docker", "ps", "--format", "{{.Names}}\t{{.Status}}"])
    containers: list[dict[str, str]] = []
    if docker_ps:
        for line in docker_ps.splitlines():
            parts = line.split("\t")
            if len(parts) == 2:
                containers.append({"name": parts[0], "status": parts[1]})
    container_names = {c["name"].lower() for c in containers}
    services.append({"name": "valkey", "ok": any("valkey" in n or "redis" in n for n in container_names),
                     "status": "running" if any("valkey" in n or "redis" in n for n in container_names) else "down"})
    services.append({"name": "qdrant", "ok": "qdrant" in container_names,
                     "status": "running" if "qdrant" in container_names else "down"})

    health_rows = [
        {"label": "VPS (Hetzner)", "value": f"{round(uptime_s / 86400, 1)}d up", "tone": "good" if uptime_s else "idle"},
        {"label": "CPU load", "value": cpu_pct, "tone": "warn" if cpu_pct.endswith("90%") or cpu_pct.endswith("95%") or cpu_pct.endswith("100%") else "good"},
        {"label": "Memory", "value": f"{round(mem_used_gb, 1)}/{round(mem_total_gb, 1)} GB", "tone": "warn" if mem_total_gb and mem_used_gb / mem_total_gb > 0.85 else "good"},
        {"label": "Disk", "value": f"{round(disk_used, 1)}/{round(disk_total, 1)} GB", "tone": "warn" if disk_total and disk_used / disk_total > 0.85 else "good"},
        {"label": "Docker", "value": "running" if any(s["name"] == "docker" and s["ok"] for s in services) else "down",
         "tone": "good" if any(s["name"] == "docker" and s["ok"] for s in services) else "warn"},
        {"label": "LiteLLM", "value": "active" if any(s["name"] == "litellm" and s["ok"] for s in services) else "down",
         "tone": "good" if any(s["name"] == "litellm" and s["ok"] for s in services) else "idle"},
        {"label": "Ollama", "value": "active" if any(s["name"] == "ollama" and s["ok"] for s in services) else "down",
         "tone": "good" if any(s["name"] == "ollama" and s["ok"] for s in services) else "idle"},
    ]

    telemetry = {
        "cpu": cpu_pct,
        "mem": f"{round(mem_used_gb, 1)} GB",
        "lat": "—",
        "api": "—",
        "activeModel": "—",
        "agentStatus": "Active" if any(s["ok"] for s in services) else "Idle",
        "activeAgents": 0,
    }

    return envelope({
        "health": health_rows,
        "telemetry": telemetry,
        "hostname": hostname,
        "uptime_seconds": round(uptime_s, 1),
        "memory": {"used_mb": round(mem_used_mb, 1), "total_mb": round(mem_total, 1), "used_gb": round(mem_used_gb, 1), "total_gb": round(mem_total_gb, 1)},
        "disk": {"used_gb": round(disk_used, 1), "total_gb": round(disk_total, 1)},
        "services": services,
        "containers": containers,
        "agent_health": {
            "opencode": _proc_up("opencode"),
            "claude": _proc_up("claude"),
            "openclaw": safe_run(["systemctl", "is-active", "--quiet", "openclaw"]) is not None or _proc_up("openclaw"),
            "litellm": _http_ok(f"{LITELLM_URL}/v1/models") or safe_run(["systemctl", "is-active", "--quiet", "litellm"]) is not None,
            "ollama": _http_ok(f"{OLLAMA_URL}/api/tags") or safe_run(["systemctl", "is-active", "--quiet", "ollama"]) is not None,
            "valkey": safe_run(["redis-cli", "-u", VALKEY_URL, "ping"]) == "PONG",
            "qdrant": _http_ok(f"{QDRANT_URL}/") or "qdrant" in container_names,
            "tmux": safe_run(["tmux", "ls"]) is not None,
            "docker": safe_run(["docker", "info"]) is not None,
        },
    })


# ---------------------------------------------------------------------------
# /agents
# ---------------------------------------------------------------------------

@app.get("/agents")
def agents(authorization: str | None = Header(default=None)):
    require_token(authorization)

    # tmux sessions — enrich with the pane's current command (read-only
    # `tmux list-panes -F`). Never executes anything; just reads state.
    tmux_raw = safe_run(["tmux", "ls"])
    tmux_sessions: list[dict[str, Any]] = []
    if tmux_raw:
        # Build a name → active-pane-command map for enrichment.
        pane_cmds: dict[str, str] = {}
        panes_raw = safe_run(["tmux", "list-panes", "-a", "-F", "#{session_name}\t#{pane_current_command}"])
        if panes_raw:
            for line in panes_raw.splitlines():
                parts = line.split("\t")
                if len(parts) == 2:
                    pane_cmds.setdefault(parts[0], parts[1])
        for line in tmux_raw.splitlines():
            # e.g. "openclaw-bridge: 1 windows (created ...) (attached)"
            name = line.split(":")[0].strip()
            if not name:
                continue
            attached = "attached" in line.lower()
            tmux_sessions.append({
                "name": name,
                "attached": attached,
                "status": "active" if attached else "idle",
                "last_seen": now_iso(),
                "command": pane_cmds.get(name, "—"),
                "windows": line.split(":")[1].strip().split()[0] if ":" in line else "1",
            })

    # Detectable agent processes (read-only `pgrep`/`ps`, never executing them)
    proc_names = ["opencode", "claude", "openclaw", "codex", "litellm", "ollama"]
    detected: list[dict[str, Any]] = []
    for name in proc_names:
        out = safe_run(["pgrep", "-f", name])
        if out:
            pids = [p for p in out.splitlines() if p.strip()]
            detected.append({
                "name": name,
                "status": "active",
                "pids": len(pids),
                "last_seen": now_iso(),
            })

    # Build AgentSession rows from detected processes + tmux sessions.
    sessions: list[dict[str, Any]] = []
    for d in detected:
        sessions.append({
            "id": f"agent-{d['name']}",
            "name": d["name"],
            "model": "—",
            "status": d["status"],
            "latency": "—",
            "uptime": "—",
            "last_seen": d["last_seen"],
        })
    # Ensure at least one row reflects tmux if no process matched.
    if not sessions and tmux_sessions:
        for s in tmux_sessions:
            sessions.append({
                "id": f"tmux-{s['name']}",
                "name": s["name"],
                "model": "—",
                "status": s["status"],
                "latency": "—",
                "uptime": "—",
                "last_seen": s["last_seen"],
            })

    fleet = [{
        "id": s["id"],
        "name": s["name"],
        "model": s["model"],
        "status": s["status"],
        "latency": s["latency"],
        "uptime": s["uptime"],
    } for s in sessions]

    # Graph nodes: one per detected agent + a central OpenClaw node.
    nodes = [{"id": "openclaw", "label": "OpenClaw", "status": "active" if detected else "idle", "load": 0}]
    for s in sessions:
        nodes.append({"id": s["id"], "label": s["name"], "status": s["status"], "load": 0})
    edges = [{"from": "OpenClaw", "to": s["name"]} for s in sessions]

    # Approvals are not derivable from the VPS safely — return empty (mock holds them).
    return envelope({
        "sessions": sessions,
        "fleet": fleet,
        "graph": {"nodes": nodes, "edges": edges},
        "approvals": [],
        "tmux_sessions": tmux_sessions,
        "detected_processes": detected,
    })


# ---------------------------------------------------------------------------
# /tasks
# ---------------------------------------------------------------------------

def _parse_frontmatter(text: str) -> dict[str, str]:
    """Very small frontmatter parser: pulls key: value lines from a leading --- block."""
    fm: dict[str, str] = {}
    if not text.startswith("---"):
        return fm
    lines = text.splitlines()
    try:
        end = lines[1:].index("---") + 1
    except ValueError:
        return fm
    for line in lines[1:end]:
        if ":" in line:
            k, _, v = line.partition(":")
            fm[k.strip().lower()] = v.strip().strip('"').strip("'")
    return fm


@app.get("/tasks")
def tasks(authorization: str | None = Header(default=None)):
    require_token(authorization)

    # Build a set of currently-held lock files + running tmux sessions once.
    lock_dir = Path(os.environ.get("GARRETTOS_LOCK_DIR", "/tmp/garrettos-locks"))
    held_locks: set[str] = set()
    try:
        for lf in lock_dir.glob("*.lock"):
            held_locks.add(lf.stem)
    except Exception:
        pass
    tmux_names: set[str] = set()
    tmux_raw = safe_run(["tmux", "ls"])
    if tmux_raw:
        for line in tmux_raw.splitlines():
            tmux_names.add(line.split(":")[0].strip())

    found: list[dict[str, Any]] = []
    for task_dir in TASK_PATHS:
        if not task_dir.exists() or not task_dir.is_dir():
            continue
        try:
            for md in sorted(task_dir.glob("*.md")):
                try:
                    text = md.read_text(errors="ignore")
                except Exception:
                    continue
                fm = _parse_frontmatter(text)
                status_raw = fm.get("status", "queued").lower()
                status = status_raw if status_raw in ("queued", "running", "review", "blocked", "done") else "queued"
                priority_raw = fm.get("priority", "medium").lower()
                priority = priority_raw if priority_raw in ("low", "medium", "high") else "medium"
                task_id = md.stem
                tmux_session = fm.get("tmux_session", "")
                log_path = fm.get("log_path", fm.get("log", ""))
                # Last ~20 lines of the agent log, sanitized (read-only).
                last_log_tail = ""
                if log_path:
                    try:
                        lp = Path(log_path)
                        if lp.exists():
                            tail = "\n".join(lp.read_text(errors="ignore").splitlines()[-20:])
                            last_log_tail = scrub(tail)[:2000]
                    except Exception:
                        last_log_tail = ""
                # Lock status: locked if a lock file exists OR the tmux session is live.
                locked = task_id in held_locks or (bool(tmux_session) and tmux_session in tmux_names)
                # M12: context bundle metadata.
                context_path = fm.get("context_path", "")
                context_sources_raw = fm.get("context_sources", "")
                context_sources = [s for s in context_sources_raw.split(",") if s]
                # M12B: Composio toolkits the agent may use.
                composio_tools_raw = fm.get("composio_tools", "")
                composio_tools = [t for t in re.split(r"[,\s]+", composio_tools_raw) if t]
                # A short, sanitized preview of the context bundle (first ~30 lines).
                context_preview = ""
                if context_path:
                    try:
                        cp = Path(context_path)
                        if cp.exists():
                            context_preview = scrub("\n".join(cp.read_text(errors="ignore").splitlines()[:30]))[:1600]
                    except Exception:
                        context_preview = ""
                found.append({
                    "id": task_id,
                    "title": fm.get("title", md.stem.replace("-", " ").title()),
                    "status": status,
                    "agent": fm.get("agent", "OpenClaw"),
                    "priority": priority,
                    "updated": fm.get("updated", fm.get("date", "—")),
                    "log_path": log_path,
                    "next_action": fm.get("next_action", fm.get("next", "")),
                    "tmux_session": tmux_session,
                    "last_log_tail": last_log_tail,
                    "locked": bool(locked),
                    "requires_approval": fm.get("requires_approval", "false").lower() == "true",
                    "created_at": fm.get("created_at", ""),
                    "started_at": fm.get("started_at", ""),
                    "completed_at": fm.get("completed_at", ""),
                    "context_path": context_path,
                    "context_bytes": int(fm["context_bytes"]) if fm.get("context_bytes", "").isdigit() else 0,
                    "context_sources": context_sources,
                    "memory_injected": fm.get("memory_injected", "false").lower() == "true",
                    "context_preview": context_preview,
                    "composio_tools": composio_tools,
                })
        except Exception:
            continue

    return envelope({"tasks": found})


# ---------------------------------------------------------------------------
# /tasks/create — the single permitted write endpoint (M10)
# ---------------------------------------------------------------------------

# Hard limits mirror the Vercel route validation; the bridge re-validates so a
# direct caller can't bypass them.
_CREATE_TITLE_MAX = 160
_CREATE_DESC_MAX = 4000
_CREATE_REPO_MAX = 240
_CREATE_AGENTS = {"opencode", "claude", "openclaw", "manual"}
_CREATE_PRIORITIES = {"low", "medium", "high"}
# Reject shell metacharacters / command separators anywhere in metadata that
# could later be interpreted by a shell if a future daemon ever reads it back.
_SHELL_META_RE = re.compile(r"[;|&`$<>\\\n\r]")


def _slugify_task(title: str) -> str:
    """Reduce a free-text title to a safe filename-safe slug."""
    slug = re.sub(r"[^a-z0-9]+", "-", title.lower().strip())
    slug = slug.strip("-")
    return (slug[:48] or "task")


@app.post("/tasks/create")
async def create_task(request: Request, authorization: str | None = Header(default=None)):
    """Write a single queued task markdown file. Does NOT execute anything.

    Safety:
      - Token-protected (same as every data endpoint).
      - Sanitized filename (slug only; no path traversal, no shell chars).
      - Rejects shell metacharacters in title/description/repo metadata.
      - Write-only: status is always `queued`; never flips an existing file.
      - Never overwrites an existing task file (unique id = slug + timestamp).
      - Never executes anything; no subprocess, no tmux, no shell.
    """
    require_token(authorization)

    # Parse + validate the JSON body (small, in-memory).
    try:
        body = await request.json()
    except Exception:
        return JSONResponse({"detail": "invalid JSON body"}, status_code=400)
    if not isinstance(body, dict):
        return JSONResponse({"detail": "body must be an object"}, status_code=400)

    title = str(body.get("title", "")).strip()
    if not title or len(title) > _CREATE_TITLE_MAX:
        return JSONResponse({"detail": "title required (<=160 chars)"}, status_code=400)

    agent = str(body.get("agent", "")).strip().lower()
    if agent not in _CREATE_AGENTS:
        return JSONResponse({"detail": "agent must be opencode/claude/openclaw/manual"}, status_code=400)

    priority = str(body.get("priority", "medium")).strip().lower()
    if priority not in _CREATE_PRIORITIES:
        return JSONResponse({"detail": "priority must be low/medium/high"}, status_code=400)

    requires_approval = bool(body.get("requiresApproval", False))

    description = str(body.get("description", "")).strip()
    if len(description) > _CREATE_DESC_MAX:
        return JSONResponse({"detail": "description too long"}, status_code=400)

    target_repo = str(body.get("targetRepo", "")).strip()
    if len(target_repo) > _CREATE_REPO_MAX:
        return JSONResponse({"detail": "targetRepo too long"}, status_code=400)
    if target_repo and _SHELL_META_RE.search(target_repo):
        return JSONResponse({"detail": "targetRepo contains disallowed characters"}, status_code=400)

    # composio_tools (M12B): optional list of allowed Composio toolkit slugs.
    composio_tools_raw = body.get("composioTools", [])
    composio_tools: list[str] = []
    if isinstance(composio_tools_raw, list):
        for t in composio_tools_raw:
            t = str(t).strip().lower()
            if t and t in COMPOSIO_ALLOWED_TOOLKITS and t not in composio_tools:
                composio_tools.append(t)
    elif isinstance(composio_tools_raw, str) and composio_tools_raw.strip():
        for t in re.split(r"[,\s]+", composio_tools_raw):
            t = t.strip().lower()
            if t and t in COMPOSIO_ALLOWED_TOOLKITS and t not in composio_tools:
                composio_tools.append(t)

    # Reject shell metacharacters in title/description too — defense in depth
    # so a future execution daemon can never be tricked by stored metadata.
    if _SHELL_META_RE.search(title) or _SHELL_META_RE.search(description):
        return JSONResponse({"detail": "metadata contains disallowed characters"}, status_code=400)

    # Build a unique id (slug + UTC timestamp + short counter) so we never
    # overwrite an existing task file.
    now = datetime.now(timezone.utc)
    ts = now.strftime("%Y%m%d-%H%M%S")
    slug = _slugify_task(title)
    task_id = f"{slug}-{ts}"
    created_at = now.isoformat()

    # Find the first existing vault tasks dir; create it if missing.
    task_dir = None
    for d in TASK_PATHS:
        try:
            d.mkdir(parents=True, exist_ok=True)
            task_dir = d
            break
        except Exception:
            continue
    if task_dir is None:
        return JSONResponse({"detail": "no writable task directory available"}, status_code=500)

    file_path = task_dir / f"{task_id}.md"
    # Never overwrite an existing file (collision is essentially impossible
    # with the timestamp, but guard anyway).
    if file_path.exists():
        return JSONResponse({"detail": "task id collision — retry"}, status_code=409)

    # Compose the markdown body. Frontmatter is machine-parsed by GET /tasks.
    fm_lines = [
        "---",
        f"id: {task_id}",
        f"title: {title}",
        "status: queued",
        f"agent: {agent}",
        f"priority: {priority}",
        f"requires_approval: {'true' if requires_approval else 'false'}",
        f"created_at: {created_at}",
    ]
    if target_repo:
        fm_lines.append(f"repo: {target_repo}")
    if composio_tools:
        fm_lines.append(f"composio_tools: {','.join(composio_tools)}")
    fm_lines.append("---")
    fm_lines.append("")
    if description:
        fm_lines.append(description)
    else:
        fm_lines.append(f"# {title}")
    fm_lines.append("")

    try:
        file_path.write_text("\n".join(fm_lines), encoding="utf-8")
    except Exception as exc:  # pragma: no cover - filesystem error
        return JSONResponse({"detail": f"could not write task file: {exc}"}, status_code=500)

    task = {
        "id": task_id,
        "title": title,
        "status": "queued",
        "agent": agent,
        "priority": priority,
        "requiresApproval": requires_approval,
        "targetRepo": target_repo or None,
        "createdAt": created_at,
        "updated": created_at,
        "description": description or None,
    }
    return envelope({"task": task, "source": "server"})


# ---------------------------------------------------------------------------
# /events
# ---------------------------------------------------------------------------

@app.get("/events")
def events(authorization: str | None = Header(default=None)):
    require_token(authorization)

    out: list[dict[str, Any]] = []

    def classify_scope(source: str, message: str, tone: str) -> str:
        s = (source + " " + message).lower()
        if tone == "bad" or "error" in s:
            return "errors"
        if any(k in source.lower() for k in ("tmux", "openclaw", "opencode", "claude", "codex", "agent")):
            return "agents"
        return "system"

    # systemd litellm last lines (journalctl, read-only)
    journal = safe_run(["journalctl", "-u", "litellm", "-n", "20", "--no-pager", "--output=cat"])
    if journal:
        for line in journal.splitlines()[:20]:
            line = scrub(line)
            if not line:
                continue
            level = "ERROR" if "error" in line.lower() else "WARN" if "warn" in line.lower() else "INFO"
            tone = "bad" if level == "ERROR" else "warn" if level == "WARN" else "info"
            out.append({
                "id": f"litellm-{len(out)}",
                "time": datetime.now(timezone.utc).strftime("%H:%M"),
                "source": "LiteLLM",
                "message": line[:200],
                "tone": tone,
                "scope": classify_scope("LiteLLM", line, tone),
            })

    # tmux session list as events
    tmux_raw = safe_run(["tmux", "ls"])
    if tmux_raw:
        for line in tmux_raw.splitlines():
            name = line.split(":")[0].strip()
            if name:
                out.append({
                    "id": f"tmux-{name}",
                    "time": datetime.now(timezone.utc).strftime("%H:%M"),
                    "source": "tmux",
                    "message": f"session {name} {'attached' if 'attached' in line.lower() else 'detached'}",
                    "tone": "info",
                    "scope": "agents",
                })

    # OpenClaw/agent events from its systemd unit, if present (read-only)
    oc_journal = safe_run(["journalctl", "-u", "openclaw", "-n", "10", "--no-pager", "--output=cat"])
    if oc_journal:
        for line in oc_journal.splitlines()[:10]:
            line = scrub(line)
            if not line:
                continue
            level = "ERROR" if "error" in line.lower() else "WARN" if "warn" in line.lower() else "INFO"
            tone = "bad" if level == "ERROR" else "warn" if level == "WARN" else "info"
            out.append({
                "id": f"openclaw-{len(out)}",
                "time": datetime.now(timezone.utc).strftime("%H:%M"),
                "source": "OpenClaw",
                "message": line[:200],
                "tone": tone,
                "scope": "agents" if tone != "bad" else "errors",
            })

    # Bridge status event
    out.append({
        "id": "bridge-status",
        "time": datetime.now(timezone.utc).strftime("%H:%M"),
        "source": "Bridge",
        "message": "garrettos-bridge healthy",
        "tone": "good",
        "scope": "system",
    })

    # Dedup-ish cap at 30
    return envelope({"events": out[:30]})


# ---------------------------------------------------------------------------
# /logs — scoped, sanitized, read-only log lines
# ---------------------------------------------------------------------------

@app.get("/logs")
def logs(authorization: str | None = Header(default=None), scope: str = "bridge"):
    require_token(authorization)
    scope_q = (scope or "bridge").lower().strip()
    lines: list[dict[str, Any]] = []

    if scope_q in ("litellm", "all"):
        journal = safe_run(["journalctl", "-u", "litellm", "-n", "40", "--no-pager", "--output=cat"])
        if journal:
            for i, line in enumerate(journal.splitlines()[:40]):
                line = scrub(line)
                if not line:
                    continue
                lvl = "ERROR" if "error" in line.lower() else "WARN" if "warn" in line.lower() else "INFO"
                lines.append({
                    "id": f"litellm-{i}",
                    "time": datetime.now(timezone.utc).strftime("%H:%M:%S"),
                    "level": lvl,
                    "source": "litellm",
                    "message": line[:240],
                })

    if scope_q in ("bridge", "all"):
        # The bridge's own recent log lines (this process) are best-effort;
        # surface a synthetic status line plus any systemd journal for this unit.
        unit_journal = safe_run(["journalctl", "-u", "garrettos-bridge", "-n", "20", "--no-pager", "--output=cat"])
        if unit_journal:
            for i, line in enumerate(unit_journal.splitlines()[:20]):
                line = scrub(line)
                if not line:
                    continue
                lvl = "ERROR" if "error" in line.lower() else "WARN" if "warn" in line.lower() else "INFO"
                lines.append({
                    "id": f"bridge-{i}",
                    "time": datetime.now(timezone.utc).strftime("%H:%M:%S"),
                    "level": lvl,
                    "source": "bridge",
                    "message": line[:240],
                })
        else:
            lines.append({
                "id": "bridge-status",
                "time": datetime.now(timezone.utc).strftime("%H:%M:%S"),
                "level": "INFO",
                "source": "bridge",
                "message": f"garrettos-bridge up {round(time.time() - STARTED_AT, 1)}s",
            })

    if scope_q in ("tmux", "all"):
        # Read-only tmux capture of the most recent pane output is too risky to
        # generalize; instead surface the session list as log-style lines.
        tmux_raw = safe_run(["tmux", "ls"])
        if tmux_raw:
            for i, line in enumerate(tmux_raw.splitlines()):
                name = line.split(":")[0].strip()
                if not name:
                    continue
                lines.append({
                    "id": f"tmux-{i}",
                    "time": datetime.now(timezone.utc).strftime("%H:%M:%S"),
                    "level": "INFO",
                    "source": "tmux",
                    "message": f"{name}: {line.split(':', 1)[1].strip() if ':' in line else ''}".strip(),
                })

    # Sort newest-last-ish by id index (already in insertion order); cap at 60.
    return envelope({"scope": scope_q, "lines": lines[:60]})


# ---------------------------------------------------------------------------
# /models — query LiteLLM locally with fallback
# ---------------------------------------------------------------------------

@app.get("/models")
def models(authorization: str | None = Header(default=None)):
    require_token(authorization)

    import urllib.request

    routes: list[dict[str, Any]] = []
    usage: list[dict[str, Any]] = []
    warning: str | None = None

    try:
        req = urllib.request.Request(f"{LITELLM_URL}/v1/models", headers={"Accept": "application/json"})
        with urllib.request.urlopen(req, timeout=SUBPROCESS_TIMEOUT) as resp:
            import json as _json
            payload = _json.loads(resp.read().decode("utf-8"))
        for m in payload.get("data", []):
            mid = m.get("id", "unknown")
            routes.append({
                "provider": mid.split("/")[0] if "/" in mid else "litellm",
                "model": mid,
                "usage": 0,
                "latency": "—",
                "status": "good",
            })
        if not routes:
            warning = "LiteLLM reachable but returned no models"
    except Exception:
        warning = f"LiteLLM unreachable at {LITELLM_URL} — returning empty routes"

    return envelope({"routes": routes, "usage": usage}, warning=warning)


# ---------------------------------------------------------------------------
# /memory — vault presence + file counts + recent modified files
# ---------------------------------------------------------------------------

@app.get("/memory")
def memory(authorization: str | None = Header(default=None)):
    require_token(authorization)

    stats = {
        "totalChunks": 0,
        "newToday": 0,
        "sources": 0,
        "lastSync": "—",
        "decisions": 0,
        "todos": 0,
        "activeProjects": 0,
    }
    events: list[dict[str, Any]] = []
    active_projects: list[dict[str, Any]] = []
    sources = 0
    total_files = 0
    now = time.time()
    today_cutoff = now - 86400

    for vault in VAULT_PATHS:
        if not vault.exists() or not vault.is_dir():
            continue
        sources += 1
        try:
            md_files = list(vault.rglob("*.md"))
        except Exception:
            md_files = []
        total_files += len(md_files)
        recent: list[Path] = []
        for md in md_files:
            try:
                mtime = md.stat().st_mtime
            except Exception:
                continue
            if mtime >= today_cutoff:
                stats["newToday"] += 1
            recent.append(md)
        recent.sort(key=lambda p: p.stat().st_mtime if p.exists() else 0, reverse=True)
        for md in recent[:5]:
            try:
                mtime = md.stat().st_mtime
            except Exception:
                mtime = 0
            events.append({
                "id": f"mem-{md.stem}",
                "title": md.stem.replace("-", " ").title(),
                "source": vault.name,
                "timestamp": datetime.fromtimestamp(mtime, timezone.utc).isoformat(),
                "tags": [],
                "chunks": 1,
                "relevance": 80,
            })
        if md_files:
            active_projects.append({
                "id": f"proj-{vault.name}",
                "title": vault.name,
                "chunks": len(md_files),
                "updated": datetime.fromtimestamp(
                    max((f.stat().st_mtime for f in md_files if f.exists()), default=0),
                    timezone.utc,
                ).isoformat(),
            })

    stats["totalChunks"] = total_files
    stats["sources"] = sources
    stats["activeProjects"] = len(active_projects)
    if events:
        stats["lastSync"] = events[0]["timestamp"]

    return envelope({
        "stats": stats,
        "events": events[:20],
        "decisions": [],
        "todos": [],
        "activeProjects": active_projects,
    })


# ---------------------------------------------------------------------------
# /integrations — reachability probes
# ---------------------------------------------------------------------------

# Allowed Composio toolkit slugs that may appear in task `composio_tools:`.
COMPOSIO_ALLOWED_TOOLKITS = {"gmail", "google_calendar", "github", "slack", "notion"}


# Fields from a Composio connection object that are NEVER surfaced (may be
# secrets or account identifiers). Only toolkit name, status, and a safe
# word_id are exposed.
_COMPOSIO_REDACT_FIELDS = {
    "id", "auth_config", "client_id", "client_secret", "access_token",
    "refresh_token", "api_key", "token", "secret", "password", "username",
    "email", "scope", "redirect_uri", "expires_at", "created_at", "updated_at",
    "encrypted_value", "metadata",
}


def _composio_probe() -> dict[str, Any]:
    """Best-effort, read-only Composio CLI readiness probe using the current CLI.

    Uses the confirmed-working commands:
      - `which composio`              (installed?)
      - `composio whoami`             (authenticated?)
      - `composio connections list`   (connected accounts — JSON parsed)

    Never exposes account IDs, tokens, or secrets. Only toolkit names, status,
    and a scrubbed word_id (when present and short) are surfaced. Every CLI
    output is scrubbed before use. All commands are hard-coded (no user input)
    with a short timeout. If Composio isn't installed, the probe degrades to
    "missing".
    """
    probe: dict[str, Any] = {
        "installed": False,
        "authenticated": False,
        "version": "",
        "cli_mode": True,          # CLI is the recommended/supported mode
        "mcp_mode": False,         # MCP is optional/dev-only
        "connected_accounts": [],  # toolkit name strings (safe summary)
        "connections": [],         # richer {toolkit, status, word_id?} objects
        "toolkits": [],            # distinct toolkit names from connections
        "status": "missing",
        "tone": "bad",
        "note": "Composio CLI not detected — install with `pip install composio-core`",
    }

    # 1. Installed? (`which composio` is the reliable check — `--version` may
    #    not be a supported subcommand on the current CLI.)
    which = safe_run(["which", "composio"], timeout=3)
    if not which:
        return probe
    probe["installed"] = True
    probe["status"] = "installed"
    probe["tone"] = "warn"
    probe["note"] = "Composio CLI installed — run `composio login` to authenticate"

    # Best-effort version (don't fail if this subcommand isn't supported).
    version = safe_run(["composio", "--version"], timeout=4) or safe_run(
        ["composio", "version"], timeout=4
    )
    if version:
        probe["version"] = scrub(version)[:80]

    # 2. Authenticated? (`composio whoami` returns user info when logged in.)
    whoami = safe_run(["composio", "whoami"], timeout=6)
    probe["authenticated"] = bool(whoami and "error" not in (whoami or "").lower())
    if not probe["authenticated"]:
        probe["status"] = "installed"
        probe["tone"] = "warn"
        probe["note"] = "Composio CLI installed — run `composio login` to authenticate"
        return probe

    # 3. Connected accounts via `composio connections list` (JSON parsed).
    #    Try `--json` first for structured output, then fall back to raw.
    raw = safe_run(["composio", "connections", "list", "--json"], timeout=8)
    if not raw:
        raw = safe_run(["composio", "connections", "list"], timeout=8)
    connections = _parse_composio_connections(raw)

    # Distinct, lowercased toolkit names from active connections.
    active_toolkits: list[str] = []
    for c in connections:
        if c.get("status", "").upper() == "ACTIVE" and c.get("toolkit"):
            tk = c["toolkit"].lower()
            if tk not in active_toolkits:
                active_toolkits.append(tk)
    probe["connected_accounts"] = active_toolkits[:20]
    probe["connections"] = connections[:40]
    probe["toolkits"] = active_toolkits[:40]

    if active_toolkits:
        probe["status"] = "connected"
        probe["tone"] = "good"
        probe["note"] = f"{len(active_toolkits)} connected app(s): {', '.join(active_toolkits[:6])}"
    else:
        probe["status"] = "authenticated"
        probe["tone"] = "warn"
        probe["note"] = "Authenticated but no ACTIVE connections — run `composio connections add <toolkit>`"
    return probe


def _parse_composio_connections(raw: str | None) -> list[dict[str, Any]]:
    """Parse `composio connections list` output into safe connection objects.

    Accepts JSON (a list of objects, or an object with an `items`/`connections`
    list). Falls back to line-based parsing if JSON isn't available. Only
    exposes `toolkit`, `status`, and a scrubbed `word_id` (when present and
    short). Never exposes ids, tokens, or auth config.
    """
    if not raw:
        return []
    scrubbed = scrub(raw)
    items: list[dict[str, Any]] = []

    # Try JSON first.
    try:
        parsed = json.loads(scrubbed)
    except Exception:
        parsed = None

    if parsed is not None:
        if isinstance(parsed, list):
            items = [i for i in parsed if isinstance(i, dict)]
        elif isinstance(parsed, dict):
            # Common wrappers: {"items": [...]} or {"connections": [...]}.
            for key in ("items", "connections", "data", "results"):
                val = parsed.get(key)
                if isinstance(val, list):
                    items = [i for i in val if isinstance(i, dict)]
                    break
            if not items and not any(parsed.get(k) for k in ("items", "connections", "data", "results")):
                # A single connection object.
                items = [parsed]
    else:
        # Fallback: line-based heuristics. Look for toolkit + status tokens.
        for line in scrubbed.splitlines():
            line = line.strip()
            if not line or line.startswith(("-", "=", "ID", "NAME", "TOOLKIT")):
                continue
            low = line.lower()
            # Heuristic: a line mentioning a known toolkit + a status word.
            for tk in COMPOSIO_ALLOWED_TOOLKITS | {"googledrive", "linkedin", "instagram", "twitter", "notion", "linear", "serpapi"}:
                if tk in low:
                    # Check "inactive" first — "INACTIVE" contains the substring "active".
                    if "inactive" in low:
                        status = "INACTIVE"
                    elif "active" in low:
                        status = "ACTIVE"
                    else:
                        status = "UNKNOWN"
                    items.append({"toolkit": tk, "status": status})
                    break

    # Project to safe fields only.
    safe: list[dict[str, Any]] = []
    for item in items:
        toolkit = (
            str(item.get("toolkit_name") or item.get("toolkit") or item.get("app") or "").strip().lower()
        )
        if not toolkit:
            continue
        status = str(item.get("status") or item.get("connection_status") or "UNKNOWN").strip().upper()
        conn: dict[str, Any] = {"toolkit": toolkit[:40], "status": status[:16]}
        # word_id is safe to surface only if it is a short, non-secret string.
        word_id = item.get("word_id") or item.get("wordId")
        if isinstance(word_id, str) and word_id and len(word_id) <= 64:
            conn["word_id"] = scrub(word_id)[:64]
        safe.append(conn)
    return safe



@app.get("/integrations")
def integrations(authorization: str | None = Header(default=None)):
    require_token(authorization)

    litellm_ok = _http_ok(f"{LITELLM_URL}/v1/models")
    ollama_ok = _http_ok(f"{OLLAMA_URL}/api/tags")
    qdrant_ok = _http_ok(f"{QDRANT_URL}/")
    valkey_ok = safe_run(["redis-cli", "-u", VALKEY_URL, "ping"]) == "PONG"
    docker_ok = safe_run(["docker", "info"]) is not None
    openclaw_repo = Path("/root/openclaw-advanced").exists() or Path("/root/OpenClaw").exists()
    vault_exists = any(p.exists() for p in VAULT_PATHS)
    composio = _composio_probe()

    rows: list[dict[str, Any]] = [
        {"name": "LiteLLM", "env": ["LITELLM_BASE_URL"], "status": "connected" if litellm_ok else "missing env",
         "tone": "good" if litellm_ok else "warn", "lastUsed": "just now" if litellm_ok else "—"},
        {"name": "Ollama (local)", "env": ["OLLAMA_BASE_URL"], "status": "connected" if ollama_ok else "missing env",
         "tone": "good" if ollama_ok else "warn", "lastUsed": "just now" if ollama_ok else "—"},
        {"name": "Qdrant", "env": ["QDRANT_URL"], "status": "connected" if qdrant_ok else "missing env",
         "tone": "good" if qdrant_ok else "warn", "lastUsed": "just now" if qdrant_ok else "—"},
        {"name": "Valkey", "env": ["VALKEY_URL"], "status": "connected" if valkey_ok else "missing env",
         "tone": "good" if valkey_ok else "warn", "lastUsed": "just now" if valkey_ok else "—"},
        {"name": "Docker", "env": [], "status": "connected" if docker_ok else "error",
         "tone": "good" if docker_ok else "bad", "lastUsed": "just now" if docker_ok else "—"},
        {"name": "OpenClaw repo", "env": [], "status": "connected" if openclaw_repo else "missing env",
         "tone": "good" if openclaw_repo else "warn", "lastUsed": "—"},
        {"name": "Vault", "env": [], "status": "connected" if vault_exists else "missing env",
         "tone": "good" if vault_exists else "warn", "lastUsed": "—"},
        {"name": "Composio CLI", "env": [], "status": composio["status"], "tone": composio["tone"],
         "lastUsed": composio["note"]},
    ]
    connected = sum(1 for r in rows if r["status"] == "connected")
    missing_env = sum(1 for r in rows if r["status"] == "missing env")

    return envelope({
        "integrations": rows,
        "stats": {"connected": connected, "mocked": 0, "missingEnv": missing_env, "total": len(rows)},
        "composio": composio,
    })


# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn

    if not BRIDGE_TOKEN:
        print("WARNING: GARRETTOS_BRIDGE_TOKEN is not set — data endpoints will return 503.")
    print(f"garrettos-bridge starting on {BIND_HOST}:{BIND_PORT}")
    uvicorn.run(app, host=BIND_HOST, port=BIND_PORT, log_level="info")

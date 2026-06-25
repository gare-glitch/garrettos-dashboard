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


# ---------------------------------------------------------------------------
# Auth middleware (applied to every data endpoint via dependency)
# ---------------------------------------------------------------------------

@app.middleware("http")
async def block_write_methods(request: Request, call_next):
    """Enforce read-only: reject anything that isn't GET or HEAD."""
    if request.method not in ("GET", "HEAD"):
        return JSONResponse({"detail": "Method Not Allowed — bridge is read-only"}, status_code=405)
    return await call_next(request)


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
    })


# ---------------------------------------------------------------------------
# /agents
# ---------------------------------------------------------------------------

@app.get("/agents")
def agents(authorization: str | None = Header(default=None)):
    require_token(authorization)

    # tmux sessions
    tmux_raw = safe_run(["tmux", "ls"])
    tmux_sessions: list[dict[str, Any]] = []
    if tmux_raw:
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
            })

    # Detectable agent processes (read-only `pgrep`/`ps`, never executing them)
    proc_names = ["opencode", "claude", "openclaw", "codex"]
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
    for i, d in enumerate(detected):
        sessions.append({
            "id": f"agent-{d['name']}",
            "name": d["name"],
            "model": "—",
            "status": d["status"],
            "latency": "—",
            "uptime": "—",
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
                found.append({
                    "id": md.stem,
                    "title": fm.get("title", md.stem.replace("-", " ").title()),
                    "status": status,
                    "agent": fm.get("agent", "OpenClaw"),
                    "priority": priority,
                })
        except Exception:
            continue

    return envelope({"tasks": found})


# ---------------------------------------------------------------------------
# /events
# ---------------------------------------------------------------------------

@app.get("/events")
def events(authorization: str | None = Header(default=None)):
    require_token(authorization)

    out: list[dict[str, Any]] = []

    # systemd litellm last lines (journalctl, read-only)
    journal = safe_run(["journalctl", "-u", "litellm", "-n", "20", "--no-pager", "--output=cat"])
    if journal:
        for line in journal.splitlines()[:20]:
            line = scrub(line)
            if not line:
                continue
            level = "ERROR" if "error" in line.lower() else "WARN" if "warn" in line.lower() else "INFO"
            out.append({
                "id": f"litellm-{len(out)}",
                "time": datetime.now(timezone.utc).strftime("%H:%M"),
                "source": "LiteLLM",
                "message": line[:200],
                "tone": "bad" if level == "ERROR" else "warn" if level == "WARN" else "info",
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
                })

    # Bridge status event
    out.append({
        "id": "bridge-status",
        "time": datetime.now(timezone.utc).strftime("%H:%M"),
        "source": "Bridge",
        "message": "garrettos-bridge healthy",
        "tone": "good",
    })

    # Dedup-ish cap at 30
    return envelope({"events": out[:30]})


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

def _http_ok(url: str, timeout: float = SUBPROCESS_TIMEOUT) -> bool:
    import urllib.request
    try:
        req = urllib.request.Request(url, headers={"Accept": "application/json"})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status == 200
    except Exception:
        return False


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
    ]
    connected = sum(1 for r in rows if r["status"] == "connected")
    missing_env = sum(1 for r in rows if r["status"] == "missing env")

    return envelope({
        "integrations": rows,
        "stats": {"connected": connected, "mocked": 0, "missingEnv": missing_env, "total": len(rows)},
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

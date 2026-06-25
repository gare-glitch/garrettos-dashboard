#!/usr/bin/env python3
"""
garrettos_loop_daemon.py — GarrettOS Safe Loop Daemon v1 (M11).

Reads queued task markdown files from the vault and launches supervised tmux
agent runs. All execution happens locally on the VPS via polling — never over
HTTP. The dashboard/bridge only READS state; it cannot trigger execution.

SAFETY MODEL
  - No execution over public HTTP. The daemon polls local files only.
  - No HTTP request can directly run a command.
  - No destructive shell commands. The daemon runs exactly one allow-listed
    agent binary per task (opencode / claude / openclaw); `manual` never runs.
  - No auto-deploy. Tasks that complete go to `review`, never to a deploy step.
  - The task body is INPUT TEXT ONLY — it is passed to the agent as the initial
    prompt via stdin. It is NEVER executed as a shell command.
  - File locks prevent duplicate runs of the same task.
  - `requires_approval: true` tasks are NOT started automatically; they are
    left as `queued` until a human flips them to `approved` (status stays
    queued, but the daemon skips them and emits a status line).
  - Dry-run mode validates + reports what WOULD happen without spawning tmux.

TASK FORMAT (frontmatter)
  ---
  id: <slug>
  title: <text>
  status: queued | running | review | blocked | done
  agent: opencode | claude | openclaw | manual
  priority: low | medium | high
  requires_approval: true | false
  repo: <optional target repo>
  created_at: <iso>
  started_at: <iso, daemon writes>
  completed_at: <iso, daemon writes>
  tmux_session: <name, daemon writes>
  log_path: <path, daemon writes>
  ---
  <body — the agent's initial prompt>

USAGE
  python3 scripts/garrettos_loop_daemon.py            # run continuously
  python3 scripts/garrettos_loop_daemon.py --once     # one sweep then exit
  python3 scripts/garrettos_loop_daemon.py --dry-run --once
"""

from __future__ import annotations

import argparse
import os
import re
import shlex
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

# Make the validator importable when run from the repo.
SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))
from garrettos_task_validate import (  # noqa: E402
    ALLOWED_AGENTS,
    SHELL_META_RE,
    ID_SAFE_RE,
    parse_frontmatter,
    validate_task_file,
)


# ---------------------------------------------------------------------------
# Config (env-overridable)
# ---------------------------------------------------------------------------

def _env_paths(var: str, default: list[str]) -> list[Path]:
    raw = os.environ.get(var, "")
    if raw.strip():
        return [Path(p) for p in raw.split(":") if p.strip()]
    return [Path(p) for p in default]

TASK_ROOTS = _env_paths(
    "GARRETTOS_TASK_ROOTS",
    ["/root/vault/OpenClawMemory/tasks", "/root/secondbrain/OpenClawMemory/tasks", "./garrettos/tasks"],
)
LOG_DIR = Path(os.environ.get("GARRETTOS_LOG_DIR", "/root/garrettos-logs"))
LOCK_DIR = Path(os.environ.get("GARRETTOS_LOCK_DIR", "/tmp/garrettos-locks"))
NEEDS_HELP_FILE = Path(os.environ.get("GARRETTOS_NEEDS_HELP_FILE", "/root/NEEDS_HELP.md"))
POLL_INTERVAL = float(os.environ.get("GARRETTOS_POLL_INTERVAL", "10"))
MAX_RUNTIME = float(os.environ.get("GARRETTOS_MAX_RUNTIME", "0")) or None  # 0 = unlimited
TMUX_PREFIX = "garrettos_"
DRY_RUN = False
ONCE = False

STATUS_ORDER = ("queued", "running", "review", "blocked", "done")
REPO_ROOT = Path(os.environ.get("GARRETTOS_REPO_ROOT", "/root"))


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def log(msg: str) -> None:
    print(f"[{datetime.now(timezone.utc).strftime('%H:%M:%S')}] {msg}", flush=True)


def safe_run(cmd: list[str], timeout: int = 5) -> str | None:
    """Run a read-only command with a timeout. Returns stdout or None on failure."""
    try:
        proc = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout,
            check=False,
        )
        if proc.returncode != 0:
            return None
        return proc.stdout.strip() or None
    except Exception:
        return None


def slugify_session(task_id: str) -> str:
    """Build a safe tmux session name (tmux disallows some chars)."""
    safe = re.sub(r"[^a-z0-9._-]+", "-", task_id.lower())
    safe = safe.strip("-")
    return f"{TMUX_PREFIX}{safe[:180] or 'task'}"


# ---------------------------------------------------------------------------
# Task file I/O
# ---------------------------------------------------------------------------

def read_task(path: Path) -> tuple[dict[str, str], str] | None:
    try:
        text = path.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return None
    return parse_frontmatter(text)


def rewrite_frontmatter(path: Path, updates: dict[str, str]) -> bool:
    """Rewrite a task file's frontmatter in place, preserving the body.

    Only inserts/updates the given keys; never deletes existing keys not in
    `updates`. Returns True on success.
    """
    try:
        text = path.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return False
    fm, body = parse_frontmatter(text)
    fm.update({k: v for k, v in updates.items() if v is not None})
    # Re-serialize frontmatter in a stable key order.
    preferred = [
        "id", "title", "status", "agent", "priority", "requires_approval",
        "repo", "created_at", "started_at", "completed_at",
        "tmux_session", "log_path", "next_action",
    ]
    lines = ["---"]
    for key in preferred:
        if key in fm and fm[key] != "":
            lines.append(f"{key}: {fm[key]}")
    for key, val in fm.items():
        if key in preferred or val == "":
            continue
        lines.append(f"{key}: {val}")
    lines.append("---")
    lines.append("")
    if body:
        lines.append(body)
    out = "\n".join(lines) + "\n"
    try:
        path.write_text(out, encoding="utf-8")
        return True
    except Exception:
        return False


def collect_queued() -> list[Path]:
    """Find all queued task files across the configured roots."""
    files: list[Path] = []
    seen: set[str] = set()
    for root in TASK_ROOTS:
        root = root.resolve() if root.is_absolute() else (Path.cwd() / root).resolve()
        if not root.exists() or not root.is_dir():
            continue
        for md in sorted(root.glob("*.md")):
            key = str(md.resolve())
            if key in seen:
                continue
            seen.add(key)
            files.append(md)
    return files


# ---------------------------------------------------------------------------
# Locks
# ---------------------------------------------------------------------------

def lock_path(task_id: str) -> Path:
    LOCK_DIR.mkdir(parents=True, exist_ok=True)
    return LOCK_DIR / f"{task_id}.lock"


def acquire_lock(task_id: str) -> bool:
    """Try to create a lock file atomically. Returns True if acquired."""
    lp = lock_path(task_id)
    try:
        fd = os.open(str(lp), os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
        os.write(fd, f"{os.getpid()}\n{now_iso()}\n".encode())
        os.close(fd)
        return True
    except FileExistsError:
        return False


def release_lock(task_id: str) -> None:
    lp = lock_path(task_id)
    try:
        lp.unlink(missing_ok=True)
    except Exception:
        pass


# ---------------------------------------------------------------------------
# Agent launching
# ---------------------------------------------------------------------------

def agent_command(agent: str) -> list[str] | None:
    """Return the allow-listed command argv for an agent, or None if the agent
    is not launchable (e.g. openclaw not detectable, or manual)."""
    agent = agent.lower()
    if agent == "opencode":
        return ["opencode"]
    if agent == "claude":
        return ["claude"]
    if agent == "openclaw":
        # Detect an existing OpenClaw launcher; if none, the caller marks blocked.
        for candidate in ("openclaw", "openclaw-run"):
            if safe_run(["which", candidate]):
                return [candidate]
        return None
    if agent == "manual":
        return None  # manual never executes
    return None


def tmux_session_exists(session: str) -> bool:
    return safe_run(["tmux", "has-session", "-t", session]) is not None or _tmux_has_session(session)


def _tmux_has_session(session: str) -> bool:
    """`tmux has-session` exits 0 on success; safe_run treats non-zero as None.
    This inverts that so we can detect an existing session."""
    try:
        subprocess.run(["tmux", "has-session", "-t", session], capture_output=True, timeout=3, check=True)
        return True
    except Exception:
        return False


def spawn_tmux_agent(
    session: str,
    agent_argv: list[str],
    body: str,
    log_file: Path,
    repo: str | None,
) -> bool:
    """Spawn a detached tmux session that runs the agent with the body piped to
    its stdin, teeing output to a log file. Returns True on success.

    The body is passed via a temporary prompt file (NEVER as a shell argument)
    and fed to the agent through shell redirection `< file`. The agent command
    itself is from the allow-list and is NOT user-controlled.
    """
    log_file.parent.mkdir(parents=True, exist_ok=True)
    prompt_file = log_file.with_suffix(".prompt")
    try:
        prompt_file.write_text(body, encoding="utf-8")
    except Exception:
        return False

    repo_dir = REPO_ROOT
    if repo:
        candidate = REPO_ROOT / repo
        if candidate.is_dir():
            repo_dir = candidate

    # Build the inner command. The agent reads the prompt from stdin.
    # `tee` mirrors output to the log file. `;` separates the tee from the
    # exit-capture so the log captures the full run.
    agent_cmd = " ".join(shlex.quote(a) for a in agent_argv)
    # The inner shell command is constructed from an ALLOW-LISTED agent argv
    # only; the body lives in the prompt file and is never interpolated.
    inner = (
        f"cd {shlex.quote(str(repo_dir))} && "
        f"{agent_cmd} < {shlex.quote(str(prompt_file))} 2>&1 | tee {shlex.quote(str(log_file))}; "
        f"echo \"__GARRETTOS_EXIT__:$?\" >> {shlex.quote(str(log_file))}"
    )

    cmd = [
        "tmux", "new-session", "-d", "-s", session,
        "bash", "-lc", inner,
    ]
    try:
        subprocess.run(cmd, capture_output=True, text=True, timeout=5, check=True)
        return True
    except Exception:
        return False


def read_log_tail(log_file: Path, lines: int = 40) -> str:
    try:
        text = log_file.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return ""
    return "\n".join(text.splitlines()[-lines:])


def detect_exit(log_file: Path) -> int | None:
    """Look for the __GARRETTOS_EXIT__:N marker the inner command appends."""
    try:
        text = log_file.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return None
    m = re.search(r"__GARRETTOS_EXIT__:(-?\d+)\s*$", text)
    return int(m.group(1)) if m else None


# ---------------------------------------------------------------------------
# Core loop
# ---------------------------------------------------------------------------

def process_task(path: Path) -> None:
    """Validate + (if dry-run skipped) launch a single queued task."""
    parsed = read_task(path)
    if not parsed:
        log(f"SKIP {path.name} — unreadable")
        return
    fm, body = parsed

    task_id = fm.get("id", path.stem).strip()
    status = fm.get("status", "queued").lower()
    agent = fm.get("agent", "").lower()
    requires_approval = (fm.get("requires_approval", "false").lower() == "true")

    if status != "queued":
        return  # only queued tasks are eligible

    # Validate before doing anything.
    issues = validate_task_file(path)
    if issues:
        log(f"INVALID {path.name}:")
        for issue in issues:
            log(f"  [{issue.field_name}] {issue.message}")
        rewrite_frontmatter(path, {"status": "blocked", "next_action": "Fix task validation issues"})
        append_needs_help(task_id, "task failed validation", "\n".join(f"- [{i.field_name}] {i.message}" for i in issues))
        return

    # Approval gate: never auto-start tasks that require approval.
    if requires_approval:
        log(f"HOLD {task_id} — requires_approval is true; waiting for human to set requires_approval: false")
        return

    # manual tasks never execute — move straight to review.
    if agent == "manual":
        log(f"MANUAL {task_id} — marking review (no execution)")
        rewrite_frontmatter(path, {"status": "review", "completed_at": now_iso()})
        return

    agent_argv = agent_command(agent)
    if agent_argv is None:
        log(f"BLOCK {task_id} — agent '{agent}' not launchable on this host")
        rewrite_frontmatter(
            path,
            {"status": "blocked", "next_action": f"Install or enable the '{agent}' agent, then flip status back to queued"},
        )
        append_needs_help(task_id, f"agent '{agent}' not launchable", "No matching binary found on PATH.")
        return

    # Lock to prevent duplicate runs.
    if not acquire_lock(task_id):
        log(f"LOCKED {task_id} — another run already holds the lock")
        return

    session = slugify_session(task_id)
    log_file = LOG_DIR / f"{task_id}.log"

    if DRY_RUN:
        log(f"DRY-RUN would start {task_id}: tmux -s {session} agent={agent_argv} log={log_file}")
        release_lock(task_id)
        return

    # Mark running + record metadata BEFORE spawning.
    rewrite_frontmatter(
        path,
        {"status": "running", "started_at": now_iso(), "tmux_session": session, "log_path": str(log_file)},
    )
    log(f"START {task_id} -> tmux {session}")

    ok = spawn_tmux_agent(session, agent_argv, body, log_file, fm.get("repo"))
    if not ok:
        log(f"FAIL  {task_id} — could not spawn tmux session {session}")
        rewrite_frontmatter(path, {"status": "blocked", "next_action": "tmux spawn failed — check tmux service and disk space"})
        append_needs_help(task_id, "tmux spawn failed", f"session={session} log={log_file}")
        release_lock(task_id)
        return

    # The daemon does NOT block on the tmux session; a reconcile pass marks
    # review/blocked once the agent exits. This keeps the loop responsive.
    release_lock(task_id)


def reconcile_running() -> None:
    """Find running tasks whose tmux session has ended and mark their outcome."""
    for path in collect_queued():
        parsed = read_task(path)
        if not parsed:
            continue
        fm, _ = parsed
        if fm.get("status", "").lower() != "running":
            continue
        task_id = fm.get("id", path.stem).strip()
        session = fm.get("tmux_session", slugify_session(task_id))
        log_file = Path(fm.get("log_path", str(LOG_DIR / f"{task_id}.log")))

        # Still running?
        if _tmux_has_session(session):
            # Enforce max runtime if configured.
            if MAX_RUNTIME:
                started = fm.get("started_at", "")
                if started and _elapsed_seconds(started) > MAX_RUNTIME:
                    log(f"TIMEOUT {task_id} — exceeded {MAX_RUNTIME}s, killing tmux session")
                    safe_run(["tmux", "kill-session", "-t", session])
                    rewrite_frontmatter(path, {"status": "blocked", "next_action": f"Exceeded max runtime {MAX_RUNTIME}s — review log and re-queue if needed"})
                    append_needs_help(task_id, f"max runtime exceeded ({MAX_RUNTIME}s)", read_log_tail(log_file))
            continue

        # Session ended — determine exit code from the log marker.
        exit_code = detect_exit(log_file)
        if exit_code is None:
            # No marker yet but session gone — treat as blocked (unknown exit).
            log(f"UNKNOWN {task_id} — session gone, no exit marker")
            rewrite_frontmatter(path, {"status": "blocked", "completed_at": now_iso(), "next_action": "Session ended without an exit marker — inspect the log"})
            append_needs_help(task_id, "session ended without exit marker", read_log_tail(log_file))
            continue

        if exit_code == 0:
            log(f"DONE  {task_id} — exit 0, marking review")
            rewrite_frontmatter(path, {"status": "review", "completed_at": now_iso()})
        else:
            log(f"BLOCK {task_id} — exit {exit_code}, marking blocked")
            backtrace = read_log_tail(log_file, lines=40)
            rewrite_frontmatter(path, {"status": "blocked", "completed_at": now_iso(), "next_action": "Agent exited nonzero — review the log tail and re-queue"})
            append_needs_help(task_id, f"agent exited {exit_code}", backtrace)


def _elapsed_seconds(iso: str) -> float:
    try:
        started = datetime.fromisoformat(iso.replace("Z", "+00:00"))
        return (datetime.now(timezone.utc) - started).total_seconds()
    except Exception:
        return 0.0


def append_needs_help(task_id: str, reason: str, detail: str) -> None:
    """Append a blocked-task entry to /root/NEEDS_HELP.md (idempotent per task)."""
    try:
        NEEDS_HELP_FILE.parent.mkdir(parents=True, exist_ok=True)
        existing = ""
        if NEEDS_HELP_FILE.exists():
            existing = NEEDS_HELP_FILE.read_text(encoding="utf-8", errors="ignore")
        header = f"## {task_id}"
        if header in existing:
            return  # already recorded
        entry = f"{header}\n- reason: {reason}\n- time: {now_iso()}\n\n```\n{detail[:2000]}\n```\n\n"
        NEEDS_HELP_FILE.write_text(existing + entry, encoding="utf-8")
    except Exception:
        pass


def sweep() -> None:
    """One polling sweep: reconcile running tasks, then process queued tasks."""
    if not DRY_RUN:
        reconcile_running()
    queued = collect_queued()
    started_any = False
    for path in queued:
        parsed = read_task(path)
        if not parsed:
            continue
        if parsed[0].get("status", "").lower() == "queued":
            process_task(path)
            started_any = True
    if not started_any and not DRY_RUN:
        # Still log a heartbeat even when nothing is queued.
        pass


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main(argv: list[str] | None = None) -> int:
    global DRY_RUN, ONCE
    parser = argparse.ArgumentParser(description="GarrettOS Safe Loop Daemon v1.")
    parser.add_argument("--once", action="store_true", help="Run a single sweep and exit.")
    parser.add_argument("--dry-run", action="store_true", help="Validate + report what would happen; spawn nothing.")
    parser.add_argument("--interval", type=float, default=None, help="Override poll interval (seconds).")
    args = parser.parse_args(argv)

    DRY_RUN = args.dry_run
    ONCE = args.once
    if args.interval is not None:
        global POLL_INTERVAL
        POLL_INTERVAL = args.interval

    LOG_DIR.mkdir(parents=True, exist_ok=True)
    LOCK_DIR.mkdir(parents=True, exist_ok=True)

    mode = "dry-run" if DRY_RUN else ("once" if ONCE else "continuous")
    log(f"garrettos-loop-daemon starting ({mode}) poll={POLL_INTERVAL}s roots={[str(r) for r in TASK_ROOTS]}")

    if ONCE or DRY_RUN:
        sweep()
        log("sweep complete")
        return 0

    while True:
        try:
            sweep()
        except KeyboardInterrupt:
            log("interrupted — exiting")
            return 0
        except Exception as exc:  # noqa: BLE001 — never let the loop die on one error
            log(f"ERROR during sweep: {exc}")
        time.sleep(POLL_INTERVAL)


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
"""
garrettos_status.py — report GarrettOS loop daemon + task queue status.

Shows:
  - queued / running / review / blocked / done task counts
  - active garrettos_* tmux sessions
  - the latest blocked task logs (tail)
  - bridge health (if reachable on localhost)

Usage:
  python3 scripts/garrettos_status.py
  python3 scripts/garrettos_status.py --bridge-url http://127.0.0.1:8788 --bridge-token $TOKEN
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))
from garrettos_task_validate import parse_frontmatter  # noqa: E402

DEFAULT_ROOTS = [
    Path("/root/vault/OpenClawMemory/tasks"),
    Path("/root/secondbrain/OpenClawMemory/tasks"),
    Path("./garrettos/tasks"),
]
LOG_DIR = Path(os.environ.get("GARRETTOS_LOG_DIR", "/root/garrettos-logs"))
LOCK_DIR = Path(os.environ.get("GARRETTOS_LOCK_DIR", "/tmp/garrettos-locks"))
TMUX_PREFIX = "garrettos_"
NEEDS_HELP_FILE = Path(os.environ.get("GARRETTOS_NEEDS_HELP_FILE", "/root/NEEDS_HELP.md"))


def safe_run(cmd: list[str], timeout: int = 5) -> str | None:
    try:
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout, check=False)
        return proc.stdout.strip() if proc.returncode == 0 else None
    except Exception:
        return None


def _env_roots() -> list[Path]:
    """Honor GARRETTOS_TASK_ROOTS (colon-separated) so all three tools agree."""
    raw = os.environ.get("GARRETTOS_TASK_ROOTS", "")
    if raw.strip():
        return [Path(p) for p in raw.split(":") if p.strip()]
    return DEFAULT_ROOTS


def collect_tasks() -> list[dict[str, Any]]:
    tasks: list[dict[str, Any]] = []
    seen: set[str] = set()
    for root in _env_roots():
        root = root.resolve() if root.is_absolute() else (Path.cwd() / root).resolve()
        if not root.exists() or not root.is_dir():
            continue
        for md in sorted(root.glob("*.md")):
            key = str(md.resolve())
            if key in seen:
                continue
            seen.add(key)
            try:
                text = md.read_text(encoding="utf-8", errors="ignore")
            except Exception:
                continue
            fm, _ = parse_frontmatter(text)
            tasks.append({
                "path": md,
                "id": fm.get("id", md.stem),
                "status": fm.get("status", "queued").lower(),
                "agent": fm.get("agent", ""),
                "title": fm.get("title", md.stem),
                "tmux_session": fm.get("tmux_session", ""),
                "log_path": fm.get("log_path", ""),
            })
    return tasks


def tmux_sessions() -> list[dict[str, str]]:
    raw = safe_run(["tmux", "ls"])
    if not raw:
        return []
    out: list[dict[str, str]] = []
    for line in raw.splitlines():
        name = line.split(":")[0].strip()
        if not name.startswith(TMUX_PREFIX):
            continue
        attached = "attached" in line.lower()
        out.append({"name": name, "attached": attached, "raw": line})
    return out


def log_tail(path: str, lines: int = 30) -> str:
    try:
        text = Path(path).read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return ""
    return "\n".join(text.splitlines()[-lines:])


def bridge_health(url: str, token: str | None) -> dict[str, Any]:
    """Probe the bridge /ping (unauthenticated) and /health (token)."""
    out: dict[str, Any] = {"url": url, "ping": False, "health": False}
    import urllib.request
    try:
        with urllib.request.urlopen(f"{url}/ping", timeout=3) as resp:
            out["ping"] = resp.status == 200
    except Exception:
        out["ping"] = False
    if token:
        try:
            req = urllib.request.Request(f"{url}/health", headers={"Authorization": f"Bearer {token}"})
            with urllib.request.urlopen(req, timeout=3) as resp:
                out["health"] = resp.status == 200
        except Exception:
            out["health"] = False
    return out


def print_status(include_bridge: str | None, bridge_token: str | None) -> int:
    tasks = collect_tasks()
    counts: dict[str, int] = {"queued": 0, "running": 0, "review": 0, "blocked": 0, "done": 0}
    blocked: list[dict[str, Any]] = []
    running: list[dict[str, Any]] = []
    for t in tasks:
        s = t["status"] if t["status"] in counts else "queued"
        counts[s] += 1
        if s == "blocked":
            blocked.append(t)
        if s == "running":
            running.append(t)

    sessions = tmux_sessions()
    lock_files = list(LOCK_DIR.glob("*.lock")) if LOCK_DIR.exists() else []

    print("=" * 60)
    print(f"GarrettOS Loop Daemon Status — {datetime.now(timezone.utc).isoformat()}")
    print("=" * 60)
    print()
    print("Task counts:")
    for status in ("queued", "running", "review", "blocked", "done"):
        print(f"  {status:8s} {counts[status]}")
    print(f"  {'total':8s} {len(tasks)}")
    print()

    print("Active garrettos_ tmux sessions:")
    if not sessions:
        print("  (none)")
    for s in sessions:
        print(f"  {s['name']}  {'attached' if s['attached'] else 'detached'}")
    print()

    print("Locks:")
    if not lock_files:
        print("  (none)")
    for lf in lock_files:
        print(f"  {lf.name}")
    print()

    if running:
        print("Running tasks:")
        for t in running:
            print(f"  {t['id']}  agent={t['agent']}  tmux={t.get('tmux_session', '-')}")
        print()

    if blocked:
        print("Blocked tasks (latest log tail):")
        for t in blocked:
            print(f"\n--- {t['id']} ---")
            lp = t.get("log_path", "")
            if lp:
                tail = log_tail(lp, lines=30)
                print(tail or "(empty log)")
            else:
                print("(no log_path recorded)")
        print()
        if NEEDS_HELP_FILE.exists():
            print(f"See also: {NEEDS_HELP_FILE}")
    else:
        print("Blocked tasks: (none)")
    print()

    if include_bridge:
        bh = bridge_health(include_bridge, bridge_token)
        print("Bridge health:")
        print(f"  url    {bh['url']}")
        print(f"  ping   {'ok' if bh['ping'] else 'unreachable'}")
        print(f"  health {'ok' if bh['health'] else 'unreachable' if bridge_token else 'no token'}")
        print()

    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Report GarrettOS loop daemon + task queue status.")
    parser.add_argument("--bridge-url", default=os.environ.get("OPENCLAW_VPS_BRIDGE_URL", ""), help="Bridge base URL to probe.")
    parser.add_argument("--bridge-token", default=os.environ.get("OPENCLAW_VPS_BRIDGE_TOKEN", ""), help="Bridge bearer token.")
    args = parser.parse_args(argv)
    return print_status(args.bridge_url or None, args.bridge_token or None)


if __name__ == "__main__":
    sys.exit(main())

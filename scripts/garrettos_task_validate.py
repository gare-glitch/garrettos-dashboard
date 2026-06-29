#!/usr/bin/env python3
"""
garrettos_task_validate.py — validate GarrettOS task markdown files.

A task markdown file must:
  - start with a `---` frontmatter block,
  - have `id`, `title`, `agent`, `status` fields,
  - use an allowed agent (opencode / claude / openclaw / manual),
  - use an allowed status (queued / running / review / blocked / done),
  - have a non-empty body after the frontmatter,
  - contain no dangerous shell metacharacters in any metadata field,
  - contain no path-traversal / control characters in the id.

Usage:
  python3 scripts/garrettos_task_validate.py [--root DIR ...]

Exits 0 if all tasks are valid; exits 1 if any task is invalid.
"""

from __future__ import annotations

import argparse
import os
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

ALLOWED_AGENTS = {"opencode", "claude", "openclaw", "manual"}
ALLOWED_STATUSES = {"queued", "running", "review", "blocked", "done"}
ALLOWED_PRIORITIES = {"low", "medium", "high"}
REQUIRED_FIELDS = ("id", "title", "agent", "status")

# Shell metacharacters / command separators that must never appear in metadata
# that a future execution path could read back. The body is input text only and
# is NEVER executed as a shell, so it is not scanned for these.
SHELL_META_RE = re.compile(r"[;|&`$<>\\\n\r]")
# Path traversal / control chars in the id (used to build filenames + tmux names).
ID_SAFE_RE = re.compile(r"^[a-z0-9][a-z0-9._-]*$")

DEFAULT_ROOTS = [
    Path("/root/vault/OpenClawMemory/tasks"),
    Path("/root/secondbrain/OpenClawMemory/tasks"),
    Path("./garrettos/tasks"),
]


def _env_roots() -> list[Path] | None:
    """Honor GARRETTOS_TASK_ROOTS (colon-separated) so all three tools agree."""
    raw = os.environ.get("GARRETTOS_TASK_ROOTS", "")
    if raw.strip():
        return [Path(p) for p in raw.split(":") if p.strip()]
    return None

MAX_TITLE = 160
MAX_BODY = 16000


@dataclass
class TaskIssue:
    path: Path
    field_name: str
    message: str


@dataclass
class TaskWarning:
    """A non-blocking advisory (e.g. missing repo or missing memory sources).
    Warnings never cause a nonzero exit — they only inform the operator."""
    path: Path
    field_name: str
    message: str


@dataclass
class ValidationReport:
    checked: int = 0
    valid: int = 0
    issues: list[TaskIssue] = field(default_factory=list)
    warnings: list[TaskWarning] = field(default_factory=list)

    @property
    def ok(self) -> bool:
        return self.checked > 0 and not self.issues

    def add(self, path: Path, field_name: str, message: str) -> None:
        self.issues.append(TaskIssue(path, field_name, message))

    def warn(self, path: Path, field_name: str, message: str) -> None:
        self.warnings.append(TaskWarning(path, field_name, message))


def parse_frontmatter(text: str) -> tuple[dict[str, str], str]:
    """Split a markdown file into (frontmatter dict, body). Mirrors the bridge parser."""
    if not text.startswith("---"):
        return {}, text
    lines = text.splitlines()
    try:
        end = lines[1:].index("---") + 1
    except ValueError:
        return {}, text
    fm: dict[str, str] = {}
    for line in lines[1:end]:
        if ":" in line:
            k, _, v = line.partition(":")
            fm[k.strip().lower()] = v.strip().strip('"').strip("'")
    body = "\n".join(lines[end + 1 :]).strip()
    return fm, body


def validate_task_file(path: Path) -> list[TaskIssue]:
    """Validate a single task markdown file. Returns a list of issues (empty = valid)."""
    issues: list[TaskIssue] = []
    try:
        text = path.read_text(encoding="utf-8", errors="ignore")
    except Exception as exc:  # noqa: BLE001
        return [TaskIssue(path, "file", f"unreadable: {exc}")]

    if not text.startswith("---"):
        return [TaskIssue(path, "frontmatter", "missing leading --- block")]

    fm, body = parse_frontmatter(text)

    # Required fields
    for name in REQUIRED_FIELDS:
        if not fm.get(name):
            issues.append(TaskIssue(path, name, "required field is missing or empty"))

    # id must be filename-safe (used for tmux session names + lock files + log paths)
    task_id = fm.get("id", "").strip()
    if task_id and not ID_SAFE_RE.match(task_id):
        issues.append(
            TaskIssue(path, "id", "must be lowercase alnum/._- and start with alnum")
        )
    # id must match the filename stem so the bridge and daemon agree on identity.
    if task_id and task_id != path.stem:
        issues.append(
            TaskIssue(path, "id", f"id '{task_id}' does not match filename '{path.stem}'")
        )

    # agent must be allowed
    agent = fm.get("agent", "").strip().lower()
    if agent and agent not in ALLOWED_AGENTS:
        issues.append(
            TaskIssue(path, "agent", f"must be one of {sorted(ALLOWED_AGENTS)}")
        )

    # status must be allowed
    status = fm.get("status", "").strip().lower()
    if status and status not in ALLOWED_STATUSES:
        issues.append(
            TaskIssue(path, "status", f"must be one of {sorted(ALLOWED_STATUSES)}")
        )

    # priority (optional) must be allowed if present
    priority = fm.get("priority", "").strip().lower()
    if priority and priority not in ALLOWED_PRIORITIES:
        issues.append(
            TaskIssue(path, "priority", f"must be one of {sorted(ALLOWED_PRIORITIES)}")
        )

    # title length
    title = fm.get("title", "")
    if title and len(title) > MAX_TITLE:
        issues.append(TaskIssue(path, "title", f"must be <= {MAX_TITLE} chars"))

    # Dangerous shell metacharacters in ANY metadata field (defense in depth).
    for key, val in fm.items():
        if key in ("status", "priority"):
            continue
        if val and SHELL_META_RE.search(val):
            issues.append(
                TaskIssue(path, key, "contains disallowed shell metacharacters")
            )

    # body must be non-empty (the body is the agent's prompt)
    if not body:
        issues.append(TaskIssue(path, "body", "task has no body — nothing to prompt the agent with"))
    elif len(body) > MAX_BODY:
        issues.append(TaskIssue(path, "body", f"must be <= {MAX_BODY} chars"))

    return issues


def warn_task_file(path: Path) -> list[TaskWarning]:
    """Non-blocking advisories for a task file. Never affects the exit code.

    - Warns if the task has no `repo` (the agent will launch in the default
      repo root, which may not be what the operator intended).
    - Warns if none of the standard memory sources exist on disk (the agent
      would launch with little/no injected context).
    """
    warnings: list[TaskWarning] = []
    try:
        text = path.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return warnings
    fm, _ = parse_frontmatter(text)

    repo = fm.get("repo", "").strip()
    if not repo:
        warnings.append(TaskWarning(path, "repo", "no repo set — agent will run in the default repo root"))

    # Check whether any memory source files exist (best-effort, non-fatal).
    try:
        from garrettos_context_builder import (  # local import to avoid a hard cycle
            VAULT_ROOT,
            SECONDBRAIN_ROOT,
            OPENCLAW_ADVANCED_CLAUDE,
            MEMORY_FILE_NAMES,
        )
    except Exception:
        return warnings  # builder not importable — skip the memory check

    found_memory = False
    for root in (VAULT_ROOT, SECONDBRAIN_ROOT):
        for name in MEMORY_FILE_NAMES:
            try:
                if (root / name).is_file():
                    found_memory = True
                    break
            except Exception:
                continue
        if found_memory:
            break
    try:
        if OPENCLAW_ADVANCED_CLAUDE.is_file():
            found_memory = True
    except Exception:
        pass

    if not found_memory:
        warnings.append(
            TaskWarning(path, "memory", "no memory source files found — agent will launch with minimal context")
        )

    return warnings


def collect_task_files(roots: list[Path]) -> list[Path]:
    files: list[Path] = []
    for root in roots:
        root = root.resolve() if root.is_absolute() else (Path.cwd() / root).resolve()
        if not root.exists() or not root.is_dir():
            continue
        files.extend(sorted(root.glob("*.md")))
    # Dedupe by resolved path.
    seen: set[str] = set()
    unique: list[Path] = []
    for f in files:
        key = str(f.resolve())
        if key not in seen:
            seen.add(key)
            unique.append(f)
    return unique


def run(roots: list[Path], quiet: bool = False) -> ValidationReport:
    report = ValidationReport()
    files = collect_task_files(roots)
    for path in files:
        report.checked += 1
        issues = validate_task_file(path)
        if issues:
            report.issues.extend(issues)
        else:
            report.valid += 1
            if not quiet:
                print(f"OK   {path}")
        # Warnings are collected regardless of validity (non-blocking).
        report.warnings.extend(warn_task_file(path))
    return report


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Validate GarrettOS task markdown files.")
    parser.add_argument(
        "--root",
        action="append",
        type=Path,
        default=None,
        help="Task directory to scan (repeatable). Defaults to the standard vault paths.",
    )
    parser.add_argument("--quiet", action="store_true", help="Only print issues, not OK files.")
    args = parser.parse_args(argv)

    roots = args.root if args.root else (_env_roots() or DEFAULT_ROOTS)
    report = run(roots, quiet=args.quiet)

    print()
    print(f"Checked: {report.checked}  Valid: {report.valid}  Issues: {len(report.issues)}  Warnings: {len(report.warnings)}")
    if report.warnings:
        print()
        for w in report.warnings:
            print(f"WARN  {w.path}  [{w.field_name}]  {w.message}")
    if report.issues:
        print()
        for issue in report.issues:
            print(f"FAIL  {issue.path}  [{issue.field_name}]  {issue.message}")
        return 1
    if report.checked == 0:
        print("No task files found — nothing to validate.")
        return 0
    print("All tasks valid.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

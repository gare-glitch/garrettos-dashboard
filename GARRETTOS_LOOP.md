# GarrettOS Safe Loop Daemon (M11)

The Safe Loop Daemon turns queued GarrettOS task markdown files into supervised
tmux agent runs. It runs **locally on the Hetzner VPS only** — it polls task
files on a timer and launches agents. The dashboard and bridge never trigger
execution; they only **read** state.

This document covers install, env vars, dry run, task creation, tmux
inspection, daemon control, blocked-task recovery, and the safety model.

---

## 1. What it does

Every 10 seconds the daemon:

1. Polls the task folders (`GARRETTOS_TASK_ROOTS`).
2. Reconciles `running` tasks — checks whether their tmux session has ended
   and marks the outcome (`review` on exit 0, `blocked` on nonzero exit).
3. Finds `status: queued` tasks.
4. Validates each task (id/title/agent/status, no dangerous metadata, non-empty
   body, filename-safe id).
5. Honors the approval gate: `requires_approval: true` tasks are **not** started.
6. For `manual` agents: marks `review` without executing.
7. For `opencode` / `claude` / `openclaw`: acquires a lock, marks `running`,
   writes `started_at` / `tmux_session` / `log_path`, and spawns a detached
   tmux session (`garrettos_<task_id>`) that pipes the task body to the agent
   on stdin and tees output to a log file.
8. On exit 0: marks `review` + writes `completed_at`.
9. On nonzero exit: marks `blocked`, appends a backtrace, and writes an entry
   to `/root/NEEDS_HELP.md`.
10. Releases the lock.

The daemon does **not** block on the tmux session — it reconciles running
tasks on the next sweep, so one slow agent never freezes the loop.

---

## 2. Files

| File | Purpose |
| --- | --- |
| `scripts/garrettos_loop_daemon.py` | The daemon. Polls, validates, locks, spawns tmux, marks outcome. |
| `scripts/garrettos_status.py` | Status report: counts, tmux sessions, blocked logs, bridge health. |
| `scripts/garrettos_task_validate.py` | Validates all task markdown files; exits nonzero if invalid. |
| `systemd/garrettos-loop.service` | systemd unit that runs the daemon continuously. |
| `systemd/garrettos-loop.env` | Env file template — copy to `/etc/garrettos-loop.env`. |
| `bridge/garrettos_bridge.py` | `/tasks` now also returns `tmux_session`, `log_path`, `last_log_tail`, `locked`, `requires_approval`, and timestamps. |

---

## 3. Task format

Tasks are markdown files in a task folder. The filename stem **must equal the
`id` field**. The body after the frontmatter is the agent's initial prompt.

```markdown
---
id: refactor-auth-module
title: Refactor the auth module to use the new session store
status: queued
agent: opencode
priority: high
requires_approval: false
repo: my-app
created_at: 2026-06-24T23:50:00+00:00
started_at:
completed_at:
tmux_session:
log_path:
---

Refactor `lib/auth/session.ts` to use the new Redis-backed session store.

Requirements:
- keep the public API stable
- add tests for token rotation
- do not change the middleware contract
```

### Field reference

| Field | Required | Notes |
| --- | --- | --- |
| `id` | yes | Filename-safe slug (`^[a-z0-9][a-z0-9._-]*$`). Must match the filename stem. |
| `title` | yes | <= 160 chars. No shell metacharacters. |
| `status` | yes | `queued` \| `running` \| `review` \| `blocked` \| `done` |
| `agent` | yes | `opencode` \| `claude` \| `openclaw` \| `manual` |
| `priority` | no | `low` \| `medium` \| `high` (default `medium`) |
| `requires_approval` | no | `true` keeps the task `queued` until a human sets it to `false`. |
| `repo` | no | Subdir under `GARRETTOS_REPO_ROOT` to `cd` into before launching. |
| `created_at` | no | ISO timestamp (M10 writer sets this). |
| `started_at` | daemon | Written when the daemon starts the task. |
| `completed_at` | daemon | Written when the daemon marks the task finished. |
| `tmux_session` | daemon | `garrettos_<id>`. |
| `log_path` | daemon | `/root/garrettos-logs/<id>.log`. |
| `next_action` | daemon | Hint appended when a task is blocked. |

---

## 4. Environment variables

All optional; defaults are shown.

| Var | Default | Meaning |
| --- | --- | --- |
| `GARRETTOS_TASK_ROOTS` | `/root/vault/OpenClawMemory/tasks:/root/secondbrain/OpenClawMemory/tasks:./garrettos/tasks` | Colon-separated task folders. |
| `GARRETTOS_LOG_DIR` | `/root/garrettos-logs` | Where agent logs are written. |
| `GARRETTOS_LOCK_DIR` | `/tmp/garrettos-locks` | Per-task lock files. |
| `GARRETTOS_NEEDS_HELP_FILE` | `/root/NEEDS_HELP.md` | Appended to when a task blocks. |
| `GARRETTOS_POLL_INTERVAL` | `10` | Seconds between sweeps. |
| `GARRETTOS_MAX_RUNTIME` | `0` | Max seconds per task; `0` = unlimited. |
| `GARRETTOS_REPO_ROOT` | `/root` | Root for resolving `repo:` targets. |

---

## 5. Install (on the Hetzner VPS)

```bash
# 1. Pull the repo (or rsync it).
cd /root
git clone <repo-url> garrettos-dashboard          # or: cd existing garrettos-dashboard && git pull
cd garrettos-dashboard
git checkout garrettos-command-center

# 2. Make sure agents are on PATH for the daemon user (root).
which opencode && which claude                      # optional
sudo apt-get install -y tmux                        # if missing

# 3. (Optional) Python venv so the service path matches the unit.
python3 -m venv venv
./venv/bin/pip install --upgrade pip

# 4. Install the env file + systemd unit.
sudo cp systemd/garrettos-loop.env /etc/garrettos-loop.env
# edit /etc/garrettos-loop.env if your paths differ
sudo cp systemd/garrettos-loop.service /etc/systemd/system/garrettos-loop.service
sudo systemctl daemon-reload
```

> The unit expects the venv interpreter at
> `/root/garrettos-dashboard/venv/bin/python3`. If you run without a venv, edit
> the `ExecStart=` line to point at `/usr/bin/python3`.

---

## 6. Dry run

Validate and report what **would** happen without spawning anything:

```bash
cd /root/garrettos-dashboard
python3 scripts/garrettos_loop_daemon.py --dry-run --once
```

Validate all task files:

```bash
python3 scripts/garrettos_task_validate.py
```

Status snapshot:

```bash
python3 scripts/garrettos_status.py
```

Example `--dry-run --once` output:

```
[23:51:02] garrettos-loop-daemon starting (dry-run) poll=10.0s roots=[...]
[23:51:02] DRY-RUN would start refactor-auth-module: tmux -s garrettos_refactor-auth-module agent=['opencode'] log=/root/garrettos-logs/refactor-auth-module.log
[23:51:02] sweep complete
```

---

## 7. Start / stop / restart the daemon

```bash
sudo systemctl enable --now garrettos-loop.service   # start + enable on boot
sudo systemctl status garrettos-loop.service
sudo systemctl restart garrettos-loop.service
sudo systemctl stop garrettos-loop.service
```

Tail the daemon logs (journald):

```bash
sudo journalctl -u garrettos-loop.service -f
```

---

## 8. Creating a task

**Via the dashboard:** open `/openclaw`, click **New Task**, or use the
Command Palette (`⌘K` → New Task), or say "new task" if voice is on. The
composer writes a `status: queued` markdown file through the bridge's single
write endpoint.

**By hand** (on the VPS):

```bash
cat > /root/vault/OpenClawMemory/tasks/refactor-auth-module.md <<'EOF'
---
id: refactor-auth-module
title: Refactor the auth module to use the new session store
status: queued
agent: opencode
priority: high
requires_approval: false
repo: my-app
created_at: 2026-06-24T23:50:00+00:00
---

Refactor lib/auth/session.ts to use the new Redis-backed session store.
EOF
```

The next sweep picks it up. Validate first with
`python3 scripts/garrettos_task_validate.py`.

---

## 9. Inspecting a running task

The daemon names tmux sessions `garrettos_<task_id>`.

```bash
tmux ls | grep garrettos_                 # list GarrettOS sessions
tmux attach -t garrettos_refactor-auth-module    # attach (detach with Ctrl-b d)
tail -f /root/garrettos-logs/refactor-auth-module.log   # raw log
```

The dashboard `/openclaw` task board shows the tmux session name, a live LOCK
pip, and the last few log lines for running/blocked tasks.

---

## 10. Stopping a running task

```bash
tmux kill-session -t garrettos_refactor-auth-module
```

The next reconcile pass sees the session is gone, looks for the
`__GARRETTOS_EXIT__:<code>` marker the wrapper appends, and marks the task
`review` (exit 0) or `blocked` (nonzero / no marker). If you kill a task
manually and want it re-run, flip the frontmatter `status:` back to `queued`.

---

## 11. Recovering blocked tasks

1. Read the suggestion in the task card's "Suggested next action", or:
   ```bash
   cat /root/NEEDS_HELP.md
   ```
2. Inspect the log:
   ```bash
   tail -100 /root/garrettos-logs/<task_id>.log
   ```
3. Fix the cause (install a missing agent, fix the repo, narrow the prompt).
4. Re-queue the task by editing the frontmatter:
   ```bash
   # set status back to queued, clear the stale next_action
   sed -i 's/^status: blocked/status: queued/' /root/vault/OpenClawMemory/tasks/<task_id>.md
   ```
   (The validator + daemon re-validate on the next sweep, so a malformed
   re-queue just blocks again safely.)
5. Re-validate: `python3 scripts/garrettos_task_validate.py`.

When a blocked task is recovered, the matching `## <task_id>` block stays in
`/root/NEEDS_HELP.md` as an audit record — the daemon never duplicates an
existing header.

---

## 12. Safety model

| Rule | How it is enforced |
| --- | --- |
| No execution over public HTTP | The bridge exposes no execute endpoint. The `/tasks/create` POST only **writes** a queued file. |
| No HTTP request runs a command | Execution happens only in the local daemon polling files. |
| No destructive shell commands | Only allow-listed agent binaries (`opencode`, `claude`, `openclaw`) may run; `manual` never runs. |
| No auto-deploy | Finished tasks go to `review`, never to a deploy step. |
| No merging to main | The daemon has no git/deploy integration. |
| Body is input text only | The task body is written to a `.prompt` file and fed to the agent via stdin redirection (`< file`). It is never interpolated into a shell string. |
| Safe shell escaping | The agent argv is allow-listed and `shlex.quote`-d; repo + prompt paths are `shlex.quote`-d. |
| No duplicate runs | Each task acquires an exclusive `O_CREAT \| O_EXCL` lock file before starting. |
| Approval gate | `requires_approval: true` tasks are skipped until a human flips them. |
| Max runtime | `GARRETTOS_MAX_RUNTIME` kills the tmux session and marks the task blocked if exceeded. |
| Filename safety | The validator rejects ids that are not `^[a-z0-9][a-z0-9._-]*$` and that don't match the filename stem. |
| Metadata injection defense | The validator rejects shell metacharacters in all metadata fields. |
| systemd hardening | The unit runs with `NoNewPrivileges`, `ProtectSystem=strict`, `PrivateTmp`, and a locked `ReadWritePaths` allowlist. |

---

## 13. Status script reference

```bash
python3 scripts/garrettos_status.py
python3 scripts/garrettos_status.py --bridge-url http://127.0.0.1:8788 --bridge-token "$OPENCLAW_VPS_BRIDGE_TOKEN"
```

Output: task counts by status, active `garrettos_*` tmux sessions, current
lock files, running tasks, blocked tasks with their latest log tail, and
bridge ping/health if a URL is supplied.

---

## 14. Validation script reference

```bash
python3 scripts/garrettos_task_validate.py            # validate all
python3 scripts/garrettos_task_validate.py --root /path/to/tasks --quiet
```

Exits `0` if every task is valid, `1` if any task is invalid. Use this in CI
or before flipping a blocked task back to `queued`.

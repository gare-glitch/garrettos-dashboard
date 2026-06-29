# GarrettOS Agent Memory Injection (M12)

Memory injection makes every GarrettOS task execution start with useful
project and personal context, instead of launching agents from a blank prompt.
It runs **server-side only** as part of the M11 Safe Loop Daemon.

---

## What it does

Before the loop daemon spawns an agent (opencode / claude / openclaw), it calls
the **context builder**, which assembles a safe, structured "prompt context
bundle" from available memory and project files. The daemon:

1. Writes the bundle to `/root/garrettos-logs/<task_id>.context.md` for inspection.
2. Composes a combined prompt = `SYSTEM CONTEXT` + `CURRENT TASK` + `EXECUTION RULES`.
3. Feeds that combined prompt to the agent on stdin (the task body is input
   text only — never executed as a shell command).

The bridge surfaces the bundle metadata (`context_path`, `context_bytes`,
`context_sources`, `memory_injected`, `context_preview`) so the `/openclaw`
dashboard can show a "MEM" badge, the source count, and a context preview per
task.

---

## Source priority order

Sources are gathered in this fixed priority order (lower = included first when
capping kicks in):

| # | Source | Path |
| --- | --- | --- |
| 1 | vault current context | `$VAULT_ROOT/current_context.md` |
| 2 | vault active projects | `$VAULT_ROOT/active_projects.md` |
| 3 | vault decisions | `$VAULT_ROOT/decisions.md` |
| 4 | vault todos | `$VAULT_ROOT/todos.md` |
| 5 | vault user profile | `$VAULT_ROOT/user_profile.md` |
| 6 | vault recent memory | `$VAULT_ROOT/recent_memory.md` |
| 7–12 | secondbrain mirrors | `$SECONDBRAIN_ROOT/<same six files>` |
| 13 | OpenClaw CLAUDE.md | `/root/openclaw-advanced/CLAUDE.md` |
| 14 | repo README.md | `<repo>/README.md` |
| 15 | repo package.json | `<repo>/package.json` |
| 16 | git branch/status | `git` summary in the repo |
| 17 | the task itself | the task frontmatter + body |

`VAULT_ROOT` defaults to `/root/vault/OpenClawMemory`; `SECONDBRAIN_ROOT` to
`/root/secondbrain/OpenClawMemory`. The repo is resolved as
`$GARRETTOS_REPO_ROOT/<repo>` from the task's frontmatter `repo:` field.

Missing or unreadable files are silently skipped.

---

## How context is capped

Two limits keep the bundle from overwhelming the agent's context window:

| Var | Default | Meaning |
| --- | --- | --- |
| `GARRETTOS_CONTEXT_PER_SOURCE_CAP` | `8000` | Max chars per source (truncated with a `…[truncated]` marker). |
| `GARRETTOS_CONTEXT_TOTAL_CAP` | `48000` | Max chars for the whole bundle (~12k tokens). |

When the running total approaches the total cap, lower-priority sources are
truncated or dropped entirely (if less than 200 chars of room remains, the
remaining sources are skipped). The task body itself is always included as the
final section.

---

## How secrets are sanitized

The builder runs every source through a conservative secret-redaction pass
before including it. The following patterns are replaced with `[REDACTED]`:

- OpenAI / Anthropic keys (`sk-...`, `sk-ant-...`)
- GitHub tokens (`ghp_...`, `gho_...`, etc.)
- Slack tokens (`xox[abp]-...`)
- AWS access keys (`AKIA...`) and secret access key assignments
- Generic `api_key=` / `secret=` / `token=` / `password=` / `bearer=` assignments (value >= 12 chars)
- `Bearer <token>` headers
- Private key blocks (`-----BEGIN ... PRIVATE KEY-----` … `-----END ...`)

Redaction is conservative by design: it errs toward redacting anything that
looks like a credential. It does **not** execute or interpret memory files —
they are treated as opaque text.

---

## How to inspect generated context

Each running/finished task has a context bundle on disk:

```bash
cat /root/garrettos-logs/<task_id>.context.md
```

The dashboard `/openclaw` task board shows a `MEM` badge, the source count +
byte size, and a short context preview for running / review / blocked tasks.

From the CLI:

```bash
# Dry-run: report which sources would be injected, write nothing.
python3 scripts/garrettos_context_builder.py --task /path/to/task.md --dry-run

# Write the bundle to a file.
python3 scripts/garrettos_context_builder.py --task /path/to/task.md --out /tmp/context.md

# The repo is read from the task frontmatter; override with --repo.
python3 scripts/garrettos_context_builder.py --task /path/to/task.md --repo my-app
```

The loop daemon's dry-run also reports the context sources it would inject:

```bash
python3 scripts/garrettos_loop_daemon.py --dry-run --once
# DRY-RUN would start refactor-auth: ... context=4 sources (vault/current_context.md,repo/README.md,repo/git-status) 945b
#         + vault/current_context.md         50b
#         + repo/README.md                   24b
#         ...
```

---

## How to add new memory sources

Edit `scripts/garrettos_context_builder.py` → `candidate_sources()`. Add a new
`Source(label, path, priority, kind)` entry. `kind` is one of
`memory` / `project` / `git` / `task` and controls the `memory_injected` flag
(any non-`task` source counts as injected context). Give new sources a
`priority` that places them where you want them in the cap order.

You can also point the builder at a different vault root without code changes:

```bash
export GARRETTOS_VAULT_ROOT=/root/my-other-vault/OpenClawMemory
```

---

## How this improves OpenCode / Claude / OpenClaw

| Without M12 | With M12 |
| --- | --- |
| Agent launches from a blank prompt with only the task body. | Agent sees current project context, active projects, recent decisions, the user's working style, the repo README, package.json, and git status. |
| Agent may duplicate work already decided against. | Agent sees `decisions.md` and avoids re-litigating settled choices. |
| Agent may miss the target repo's build commands. | Agent sees `package.json` scripts and the README. |
| Agent may expose a secret that happened to be in a memory file. | Secrets are redacted before the agent ever sees them. |
| No audit trail of what context was injected. | A `.context.md` file + dashboard badge + source list per task. |

The per-agent behavioral contract (preflight, allowed ops, dangerous actions)
lives in `lib/garrettos/agent-policies.md` and is delivered to the agent as
part of the `EXECUTION RULES` section of the combined prompt.

---

## Troubleshooting

**"MEM" badge not showing on a task.**
The task hasn't been started yet (queued tasks have no context), or no
non-task sources were found. Run the validator to check for the missing-memory
warning:
```bash
python3 scripts/garrettos_task_validate.py
# WARN  .../task.md  [memory]  no memory source files found — agent will launch with minimal context
```

**Context bundle is empty / tiny.**
The vault root or repo root env vars don't point where you think. Dry-run the
builder to see what it finds:
```bash
python3 scripts/garrettos_context_builder.py --task /path/to/task.md --dry-run
```

**A source was truncated.**
It exceeded `GARRETTOS_CONTEXT_PER_SOURCE_CAP` (default 8000 chars) or the total
cap was reached. Raise the caps via env vars if your memory files are large, or
split the source into smaller files.

**Secret still appears in the context file.**
The redaction patterns are conservative but not exhaustive. Add a pattern to
`_SECRET_PATTERNS` in `scripts/garrettos_context_builder.py`, then re-run. Never
commit a real secret to test this — use a synthetic one.

**Agent launched but ignored the context.**
Confirm the combined prompt was written: check
`/root/garrettos-logs/<task_id>.prompt`. Some agents need a flag to read from
stdin; ensure the allow-listed launch command for that agent reads stdin (the
daemon pipes the prompt via `< file`).

---

## Safety model

- Memory files are **context, not commands**. They are never executed.
- The task body is input text only, embedded inside the combined prompt; it is
  never interpolated into a shell string.
- Secrets are redacted before the agent sees them.
- All execution stays server-side in the loop daemon; the bridge only reads
  the resulting context metadata.
- The builder is read-only; it never writes to memory files or the repo.

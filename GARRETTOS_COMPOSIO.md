# GarrettOS Composio CLI Integration (M12B)

Composio is the safe external-actions layer for GarrettOS agents. It lets an
agent running inside a supervised tmux session call external services
(Gmail, Google Calendar, GitHub, Slack, Notion) through the Composio CLI.

**This is a foundation only.** The dashboard displays Composio readiness and
connected apps, but **no browser button executes a Composio action**. All
execution happens server-side, inside tmux agent runs launched by the M11 loop
daemon, gated by the M12 agent policies.

---

## Architecture

```
Dashboard (read-only)          Bridge (read-only probes)        VPS (execution)
 /settings  ──────────►  /api/garrettos/integrations  ──────►  /integrations
 /openclaw                    ▲                                    │
   ComposioStatusCard         │ composio { installed, auth,        │ composio CLI
   (display only)             │   accounts, toolkits }             │ (called by agents
                              │                                    │  inside tmux runs)
                              │                                    ▲
   TaskComposer ──► /tasks/create ──► bridge writes task.md ──► loop daemon ──► tmux ──► agent
      composio_tools:             (queued record only)            (polls, launches)        (may call composio CLI)
```

- The **bridge** only runs read-only Composio CLI probes (`composio --version`,
  `composio whoami`, `composio apps list`, `composio toolkits list`). It never
  runs an action and never exposes tokens.
- The **dashboard** only displays the probe results. No action buttons.
- The **loop daemon** launches agents in tmux; the agent may call the Composio
  CLI if the task's `composio_tools:` field lists the toolkit.

---

## Composio readiness checks (bridge `/integrations`)

The bridge `/integrations` endpoint now includes a `composio` object:

| Field | Type | Meaning |
| --- | --- | --- |
| `installed` | bool | `composio` binary found on PATH. |
| `authenticated` | bool | `composio whoami` succeeded. |
| `version` | string | Scrubbed version string. |
| `cliMode` | bool | Always `true` — CLI is the recommended mode. |
| `mcpMode` | bool | Always `false` — MCP is optional/dev-only. |
| `connectedAccounts` | string[] | Connected app slugs (scrubbed, capped at 20). |
| `toolkits` | string[] | Available toolkit slugs (scrubbed, capped at 40). |
| `status` | string | `not installed` / `not authenticated` / `authenticated` / `connected`. |
| `tone` | string | `warn` / `info` / `good` — for the UI chip. |
| `note` | string | Human-readable hint. |

Every CLI output is run through `scrub()` before being surfaced, so tokens and
API keys are never exposed over HTTP.

---

## Task metadata: `composio_tools`

A task may declare which Composio toolkits the agent may use:

```markdown
---
id: send-weekly-digest
title: Send the weekly digest email
status: queued
agent: openclaw
priority: medium
requires_approval: true
repo: garrettos-dashboard
composio_tools: gmail,google_calendar
---

Send this week's digest to the configured recipient list. Use Gmail to send
and Google Calendar to pull this week's events.
```

- `composio_tools` is optional. If absent, the agent should not call Composio.
- Allowed values: `gmail`, `google_calendar`, `github`, `slack`, `notion`.
- The validator (`garrettos_task_validate.py`) rejects unknown toolkit slugs as
  a **failure** (not a warning) — a typo here would let an agent call a toolkit
  the operator didn't intend.
- The `TaskComposer` UI exposes these as toggle chips; the API route and bridge
  both re-validate against the allow-list.

---

## Agent policy (summary)

The full policy lives in `lib/garrettos/agent-policies.md` → "Composio
external-actions policy (M12B)". Key rules:

- Composio may only be called **inside a tmux agent run** — never from the
  dashboard, never over HTTP.
- **No destructive action without `requires_approval: true`.** Destructive =
  send / delete / modify / overwrite data on an external service.
- **Gmail / Calendar / GitHub actions require an explicit instruction in the
  task body** (recipient, repo, event details). The agent must not invent these.
- An agent may only use toolkits listed in the task's `composio_tools:`.
- **Never expose Composio tokens in logs.**

---

## Install (on the Hetzner VPS)

```bash
# 1. Install the Composio CLI.
pip install composio-core       # or: pipx install composio-core
composio --version              # confirm it's on PATH

# 2. Authenticate (interactive — run as the daemon user, e.g. root).
composio login                  # opens a browser/device-code flow

# 3. Connect the apps you want agents to use.
composio apps add gmail
composio apps add google_calendar
composio apps add github

# 4. Verify from the bridge's perspective.
# (the bridge token must be set)
curl -s -H "Authorization: Bearer $OPENCLAW_VPS_BRIDGE_TOKEN" \
  http://127.0.0.1:8788/integrations | python3 -m json.tool
# Look for the "composio" object with installed: true, authenticated: true.
```

The bridge probes Composio on every `/integrations` call, so no daemon restart
is needed — the dashboard `/settings` and `/openclaw` pages will show the new
status on the next poll.

---

## Dashboard display

- **`/settings` → Integrations tab:** a `Composio CLI` card at the top shows
  installed/auth state, connected apps, available toolkits, and the
  CLI-mode-recommended / MCP-mode-dev-only guidance. This is display only.
- **`/openclaw`:** the same `ComposioStatusCard` appears near the bottom of the
  page so operators can confirm readiness before queueing a Composio task.
- **`/openclaw` task board:** tasks with `composio_tools` show a
  `composio: gmail, google_calendar` line on the card.
- **`TaskComposer`:** a "Composio tools (optional)" row of toggle chips lets
  the operator declare which toolkits a new task may use.

---

## CLI vs MCP mode

| Mode | Status | Use |
| --- | --- | --- |
| **CLI mode** | Recommended / supported | Agents call `composio` inside tmux runs. The bridge probes this. The dashboard recommends it. |
| **MCP mode** | Optional / dev-only | Not wired into the loop daemon. Shown as "Dev-only" in the UI. Do not use for production agent runs. |

The `cliMode` / `mcpMode` flags in the readiness object are static in this
foundation (`cliMode: true`, `mcpMode: false`) and exist so the UI can label
them correctly now and so a future MCP integration can flip `mcpMode` without a
schema change.

---

## Troubleshooting

**Composio card shows "not installed".**
`composio` isn't on the daemon user's PATH. Install it (`pip install
composio-core`) and confirm `which composio` works as that user. The bridge
probes `composio --version` / `composio version`.

**Shows "not authenticated".**
Run `composio login` on the VPS as the daemon user. The bridge checks
`composio whoami`.

**Connected apps list is empty after connecting.**
The bridge tries `composio apps list` then falls back to
`composio connected-accounts list`. If your Composio version uses a different
subcommand, the list may not parse — but installed/auth will still be correct.
The list is display-only; agents resolve accounts through the CLI at runtime.

**A task's `composio_tools` was rejected by the validator.**
Only `gmail`, `google_calendar`, `github`, `slack`, `notion` are allowed. Fix
the frontmatter and re-run `python3 scripts/garrettos_task_validate.py`.

**Token appeared in a log.**
This should not happen — the bridge scrubs all CLI output. If an agent prints a
token in its own log, that's an agent-policy violation. Add the token pattern to
the bridge `SECRET_PATTERNS` / context-builder `_SECRET_PATTERNS` so future
output is redacted, and rotate the exposed token.

---

## Safety model

| Rule | How it is enforced |
| --- | --- |
| No action execution from the dashboard | There are no action buttons; `ComposioStatusCard` is display only. |
| No execution over HTTP | The bridge only runs read-only probes; it has no action endpoint. |
| Execution only in tmux agent runs | The loop daemon is the only launcher; agents call the CLI inside their session. |
| No destructive actions without approval | `requires_approval: true` gates task start; the agent policy forbids destructive Composio calls otherwise. |
| Gmail/Calendar/GitHub need explicit instruction | The agent policy requires the task body to specify recipient/repo/event. |
| Toolkit allow-list | `composio_tools` is validated against a fixed set in the validator, API route, and bridge. |
| Never expose tokens | All bridge CLI output is scrubbed; agent policy forbids printing tokens. |

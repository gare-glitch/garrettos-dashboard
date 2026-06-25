# GarrettOS Hetzner Read-Only Bridge (M8)

A small, **read-only** Python (FastAPI) service that runs on the Hetzner VPS and
exposes live server / OpenClaw / tmux / task / event / model / memory /
integration data to the GarrettOS dashboard running on Vercel.

Responses are JSON shaped to match `lib/garrettos/types.ts` so the Vercel
`serverProvider` can consume them directly with zero adapter code.

## Safety contract

- **Read-only.** Only `GET` / `HEAD`. Every other method returns `405`.
- **Never executes commands from HTTP requests.** The only subprocess calls are
  hard-coded, read-only inspection commands (`tmux ls`, `systemctl is-active`,
  `docker ps`, `cat /proc/...`, `df`, `pgrep`, `journalctl`, `redis-cli ping`).
  No user input ever reaches a shell — all subprocess calls use argument lists,
  never `shell=True`.
- **Never exposes secrets.** Bearer tokens / API keys in log lines are scrubbed
  before they leave the bridge. The bearer token is checked but never echoed.
- **Requires Bearer token auth** on every data endpoint. `/ping` is the only
  unauthenticated endpoint (a liveness check). If `GARRETTOS_BRIDGE_TOKEN` is
  unset, all data endpoints return `503` rather than run open.
- **Safe if services/files are missing.** Every probe degrades to an empty/idle
  response, never a `500`.

## Endpoints

| Method | Path | Auth | Returns |
|--------|------|------|---------|
| GET | `/ping` | none | liveness (`{ ok, service, uptime_s }`) |
| GET | `/health` | bearer | `HealthPayload` (+ hostname, uptime, mem, disk, services, containers) |
| GET | `/agents` | bearer | `AgentsPayload` (+ tmux sessions, detected processes) |
| GET | `/tasks` | bearer | `TasksPayload` (from `*/OpenClawMemory/tasks/*.md` frontmatter) |
| GET | `/events` | bearer | `EventsPayload` (journalctl + tmux + bridge status, secrets scrubbed) |
| GET | `/models` | bearer | `ModelsPayload` (queries LiteLLM `/v1/models`, empty on failure) |
| GET | `/memory` | bearer | `MemoryPayload` (vault file counts + recent modified files) |
| GET | `/integrations` | bearer | `IntegrationsPayload` (reachability probes) |

Every data response is wrapped in the `ProviderResult<T>` envelope:
`{ data, source: "server", warning?, fetchedAt }`.

## Deploy on the Hetzner VPS

### 1. Copy the bridge

```bash
# On your laptop, from the repo root:
scp -r bridge/ root@<vps-ip>:/root/garrettos-bridge

# Or clone the repo on the VPS and symlink:
ssh root@<vps-ip>
git clone https://github.com/gare-glitch/garrettos-dashboard.git /root/garrettos-dashboard
ln -s /root/garrettos-dashboard/bridge /root/garrettos-bridge
```

### 2. Create a venv and install deps

```bash
ssh root@<vps-ip>
cd /root/garrettos-bridge
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

### 3. Set the bridge token

```bash
# Generate a strong token:
openssl rand -hex 32

# Write it to /root/garrettos-bridge/.env (chmod 600):
cat > /root/garrettos-bridge/.env <<'EOF'
GARRETTOS_BRIDGE_TOKEN=<paste-token-here>
# Optional overrides — defaults shown:
# BRIDGE_BIND=127.0.0.1
# BRIDGE_PORT=8788
# LITELLM_URL=http://127.0.0.1:4000
# OLLAMA_URL=http://127.0.0.1:11434
# QDRANT_URL=http://127.0.0.1:6333
# VALKEY_URL=redis://127.0.0.1:6379
EOF
chmod 600 /root/garrettos-bridge/.env
```

### 4. Install + start the systemd unit

```bash
cp /root/garrettos-bridge/garrettos-bridge.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now garrettos-bridge
systemctl status garrettos-bridge
journalctl -u garrettos-bridge -n 20 --no-pager
```

### 5. Test it locally on the VPS

```bash
source /root/garrettos-bridge/.env
GARRETTOS_BRIDGE_TOKEN=$GARRETTOS_BRIDGE_TOKEN ./test_bridge.sh

# Or manual curls:
TOKEN=$(grep GARRETTOS_BRIDGE_TOKEN /root/garrettos-bridge/.env | cut -d= -f2)
curl -s http://127.0.0.1:8788/ping
curl -s -H "Authorization: Bearer $TOKEN" http://127.0.0.1:8788/health | head
curl -s -H "Authorization: Bearer $TOKEN" http://127.0.0.1:8788/agents | head
curl -s -H "Authorization: Bearer $TOKEN" http://127.0.0.1:8788/integrations | head
```

## Expose to Vercel

The bridge binds to `127.0.0.1:8788` by default. To let Vercel reach it, pick
**one** of:

### Option A — reverse proxy (recommended)

Put Caddy / nginx / Traefik in front with TLS and restrict to known egress.
Example Caddyfile:

```caddy
garrettos-bridge.<your-domain> {
    reverse_proxy 127.0.0.1:8788
    # Optional: IP allowlist for Vercel egress
}
```

Then set `BRIDGE_BIND=127.0.0.1` (keep the default) and point Vercel at the
public HTTPS URL.

### Option B — bind to 0.0.0.0 behind a firewall

Only if you firewall port 8788 to Vercel egress IPs. Set in `.env`:

```
BRIDGE_BIND=0.0.0.0
```

**Never** bind to `0.0.0.0` without a firewall — the token alone is not enough
protection against internet exposure.

## Configure Vercel env vars

In the Vercel project settings (server-only — do NOT prefix with `NEXT_PUBLIC_`):

| Env | Value |
|-----|-------|
| `GARRETTOS_DATA_MODE` | `server` |
| `OPENCLAW_VPS_BRIDGE_URL` | `https://garrettos-bridge.<your-domain>` (or `http://<vps-ip>:8788`) |
| `OPENCLAW_VPS_BRIDGE_TOKEN` | the token from `/root/garrettos-bridge/.env` |

Optionally set `NEXT_PUBLIC_GARRETTOS_DATA_MODE=server` so the Settings page
readiness card shows "mode: server".

Redeploy the dashboard. The System / OpenClaw / Home / Memory panels should flip
their source chips from `Mock` to `Live`. If the VPS is unreachable, they fall
back to `Stale`/`Mock` automatically — the dashboard keeps rendering.

## What each endpoint reads

- **/health** — `hostname`, `/proc/uptime`, `/proc/loadavg`, `/proc/meminfo`,
  `df /`, `systemctl is-active` for litellm/ollama/openclaw, `docker info` +
  `docker ps` for valkey/qdrant container detection.
- **/agents** — `tmux ls` for sessions; `pgrep -f` for opencode/claude/openclaw/
  codex processes. Marks sessions active/idle + `last_seen`.
- **/tasks** — scans `/root/vault/OpenClawMemory/tasks`, `/root/secondbrain/
  OpenClawMemory/tasks`, `/root/openclaw-advanced/tasks` for `*.md` files and
  parses leading frontmatter (`status`, `priority`, `title`, `agent`). Returns
  empty list if none exist.
- **/events** — `journalctl -u litellm -n 20`, `tmux ls`, and a bridge-status
  event. Every line is scrubbed of tokens/API keys before returning.
- **/models** — `GET http://127.0.0.1:4000/v1/models` with a 3s timeout; empty
  `routes` on any failure (never crashes).
- **/memory** — walks `/root/vault`, `/root/secondbrain`, `/root/openclaw-
  advanced` for `*.md`, counts files, counts files modified in the last 24h,
  and lists the 5 most-recent per vault.
- **/integrations** — reachability probes: LiteLLM `/v1/models`, Ollama
  `/api/tags`, Qdrant `/`, `redis-cli ping`, `docker info`, and `Path.exists()`
  for the OpenClaw repo + vaults.

## Local development

```bash
cd bridge
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
GARRETTOS_BRIDGE_TOKEN=dev-token .venv/bin/python garrettos_bridge.py
# in another terminal:
GARRETTOS_BRIDGE_TOKEN=dev-token ./test_bridge.sh
```

## Files

- `garrettos_bridge.py` — the FastAPI app (single file, ~500 lines)
- `requirements.txt` — fastapi + uvicorn, pinned
- `garrettos-bridge.service` — systemd unit (runs as root, loopback, hardened)
- `test_bridge.sh` — smoke test (auth gate, read-only gate, shapes)
- `README.md` — this file

#!/usr/bin/env bash
# bridge/test_bridge.sh — smoke-test the GarrettOS bridge.
#
# Usage:
#   GARRETTOS_BRIDGE_TOKEN=secret ./bridge/test_bridge.sh
#   GARRETTOS_BRIDGE_TOKEN=secret BRIDGE_URL=http://127.0.0.1:8788 ./bridge/test_bridge.sh
#
# Exits non-zero if any data endpoint fails or returns a non-200 without a token.
set -euo pipefail

BRIDGE_URL="${BRIDGE_URL:-http://127.0.0.1:8788}"
TOKEN="${GARRETTOS_BRIDGE_TOKEN:?GARRETTOS_BRIDGE_TOKEN must be set}"

pass=0
fail=0
ok() { echo "  ✓ $1"; pass=$((pass+1)); }
bad() { echo "  ✗ $1"; fail=$((fail+1)); }

echo "Testing GarrettOS bridge at $BRIDGE_URL"
echo

# /ping — unauthenticated, must return 200 + ok:true
echo "[1/9] /ping (no auth)"
if curl -fsS "$BRIDGE_URL/ping" | grep -q '"ok":true'; then
  ok "/ping returns ok"
else
  bad "/ping failed"
fi

# Auth gate — every data endpoint must 401 without a token
echo "[2/9] auth gate (no token → 401)"
for ep in health agents tasks events models memory integrations; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "$BRIDGE_URL/$ep" || true)
  if [ "$code" = "401" ] || [ "$code" = "403" ]; then
    ok "/$ep rejects no-token ($code)"
  else
    bad "/$ep did not reject no-token (got $code)"
  fi
done

# Auth gate — wrong token must 401
echo "[3/9] auth gate (wrong token → 401)"
code=$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer wrong-token" "$BRIDGE_URL/health" || true)
if [ "$code" = "401" ]; then
  ok "wrong token rejected"
else
  bad "wrong token not rejected (got $code)"
fi

# Read-only — non-GET methods must 405
echo "[4/9] read-only (POST → 405)"
code=$(curl -s -o /dev/null -w '%{http_code}' -X POST -H "Authorization: Bearer $TOKEN" "$BRIDGE_URL/health" || true)
if [ "$code" = "405" ]; then
  ok "POST rejected"
else
  bad "POST not rejected (got $code)"
fi

# Data endpoints — must 200 with a ProviderResult envelope (source/server)
echo "[5/9] data endpoints (valid token)"
for ep in health agents tasks events models memory integrations; do
  body=$(curl -fsS -H "Authorization: Bearer $TOKEN" "$BRIDGE_URL/$ep" || true)
  if echo "$body" | grep -q '"source"'; then
    ok "/$ep returns envelope"
  else
    bad "/$ep did not return envelope"
  fi
done

# Shape checks
echo "[6/9] /health shape"
curl -fsS -H "Authorization: Bearer $TOKEN" "$BRIDGE_URL/health" | grep -q '"telemetry"' && ok "has telemetry" || bad "missing telemetry"
curl -fsS -H "Authorization: Bearer $TOKEN" "$BRIDGE_URL/health" | grep -q '"hostname"' && ok "has hostname" || bad "missing hostname"

echo "[7/9] /agents shape"
curl -fsS -H "Authorization: Bearer $TOKEN" "$BRIDGE_URL/agents" | grep -q '"fleet"' && ok "has fleet" || bad "missing fleet"

echo "[8/9] /memory shape"
curl -fsS -H "Authorization: Bearer $TOKEN" "$BRIDGE_URL/memory" | grep -q '"stats"' && ok "has stats" || bad "missing stats"

echo "[9/9] /integrations shape"
curl -fsS -H "Authorization: Bearer $TOKEN" "$BRIDGE_URL/integrations" | grep -q '"connected"' && ok "has stats.connected" || bad "missing stats"

echo
echo "Results: $pass passed, $fail failed"
[ "$fail" -eq 0 ] && exit 0 || exit 1

/**
 * Verify GarrettOS envelope normalization produces exactly one layer:
 *   { data: <payload>, source, fetchedAt }
 *
 * Run: node scripts/verify-garrettos-envelope.mjs
 *
 * Mirrors the unwrapBridge() logic in lib/garrettos/server-provider.ts and the
 * normalizeEnvelope() logic in lib/garrettos/use-garrettos-data.ts. Exits 0
 * if every case collapses to a single layer; exits 1 otherwise.
 */

// Mirror unwrapBridge (server-provider). Detect an envelope by data+source+
// fetchedAt, recurse up to depth 3.
function unwrapBridge(json, depth = 0) {
  if (json === null || json === undefined) return null;
  if (typeof json !== 'object') return null;
  const obj = json;
  const isEnvelope =
    'data' in obj && 'source' in obj && 'fetchedAt' in obj && typeof obj.fetchedAt === 'string';
  if (isEnvelope && depth < 3) return unwrapBridge(obj.data, depth + 1);
  return json;
}

// Mirror normalizeEnvelope (client hook). If outer.data is itself an envelope,
// unwrap one level.
function normalizeEnvelope(json) {
  if (!json || typeof json !== 'object') throw new Error('malformed');
  const outer = json;
  const inner = outer.data;
  if (inner && typeof inner === 'object' && 'data' in inner && 'source' in inner && 'fetchedAt' in inner) {
    return { data: inner.data, source: inner.source ?? outer.source, warning: inner.warning ?? outer.warning, fetchedAt: inner.fetchedAt ?? outer.fetchedAt };
  }
  return outer;
}

const health = { health: [{ label: 'CPU', value: '24%', tone: 'good' }], telemetry: { cpu: '24%', mem: '1.2 GB', lat: '12ms', api: '1.2k/hr', activeModel: 'x', agentStatus: 'Active', activeAgents: 1 } };
const stamp = '2026-06-24T22:00:00.000Z';

let failures = 0;
function check(name, cond) {
  console.log(`  ${cond ? 'PASS' : 'FAIL'}  ${name}`);
  if (!cond) failures++;
}

// Case 1: bridge returns a single envelope — server-provider unwraps .data.
console.log('Case 1: single bridge envelope → unwrapBridge returns payload');
const single = { data: health, source: 'server', fetchedAt: stamp };
const u1 = unwrapBridge(single);
check('unwrapBridge(single).health exists', u1 && Array.isArray(u1.health));
check('unwrapBridge(single) has no .source', !('source' in u1));

// Case 2: double-nested envelope — must collapse to payload.
console.log('\nCase 2: double-nested envelope → unwrapBridge returns payload');
const doubled = { data: { data: health, source: 'server', fetchedAt: stamp }, source: 'server', fetchedAt: stamp };
const u2 = unwrapBridge(doubled);
check('unwrapBridge(doubled).health exists', u2 && Array.isArray(u2.health));
check('unwrapBridge(doubled) has no .data', !('data' in u2 && typeof u2.data === 'object'));

// Case 3: client hook sees a double-nested route response — normalizeEnvelope
// unwraps one level so json.data is the payload.
console.log('\nCase 3: client receives double-nested → normalizeEnvelope unwraps');
const n3 = normalizeEnvelope(doubled);
check('normalizeEnvelope.data.health exists', n3.data && Array.isArray(n3.data.health));
check('normalizeEnvelope.source preserved', n3.source === 'server');

// Case 4: client receives a clean single envelope — normalizeEnvelope passes through.
console.log('\nCase 4: client receives clean single envelope → passthrough');
const n4 = normalizeEnvelope(single);
check('normalizeEnvelope(single).data.health exists', n4.data && Array.isArray(n4.data.health));
check('normalizeEnvelope(single).source preserved', n4.source === 'server');

// Case 5: bare payload (non-bridge upstream) — unwrapBridge returns as-is.
console.log('\nCase 5: bare payload (no envelope) → unwrapBridge returns as-is');
const bare = { health: health.health, telemetry: health.telemetry };
const u5 = unwrapBridge(bare);
check('unwrapBridge(bare).health exists', u5 && Array.isArray(u5.health));

// Case 6: null response — unwrapBridge returns null (no crash).
console.log('\nCase 6: null response → no crash');
check('unwrapBridge(null) === null', unwrapBridge(null) === null);
check('unwrapBridge(undefined) === null', unwrapBridge(undefined) === null);

console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`}`);
process.exit(failures === 0 ? 0 : 1);

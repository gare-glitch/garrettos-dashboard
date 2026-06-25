/**
 * Verify the middleware matcher excludes /api/garrettos/* routes.
 *
 * Run: node scripts/verify-garrettos-matcher.mjs
 *
 * Exits 0 if the matcher correctly bypasses GarrettOS API routes and still
 * protects dashboard pages; exits 1 otherwise.
 */

// Mirror the matcher from middleware.ts. Keep them in sync.
// Next.js anchors the matcher pattern to the START of the pathname, so we
// anchor with ^ here too. Without ^, test() would match at a later "/" and
// give a false positive.
const matcherRegex = new RegExp(
  '^/((?!api/garrettos|_next/static|_next/image|favicon.ico|icon.svg|manifest.webmanifest).*)',
);

function matches(pathname) {
  // Next.js matcher semantics: the regex is anchored against the pathname.
  // A path "matches" if the regex test() returns true, meaning middleware runs.
  return matcherRegex.test(pathname);
}

const garrettosRoutes = [
  '/api/garrettos/health',
  '/api/garrettos/agents',
  '/api/garrettos/tasks',
  '/api/garrettos/memory',
  '/api/garrettos/integrations',
  '/api/garrettos/events',
  '/api/garrettos/models',
];

const protectedRoutes = ['/', '/system', '/openclaw', '/memory', '/settings', '/api/vps/metrics', '/api/openclaw/status'];

let failures = 0;

console.log('GarrettOS API routes (must NOT match → no middleware → no auth):');
for (const r of garrettosRoutes) {
  const m = matches(r);
  const ok = !m;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${r} → matches=${m}`);
  if (!ok) failures++;
}

console.log('\nDashboard + private API routes (must match → middleware → auth):');
for (const r of protectedRoutes) {
  const m = matches(r);
  const ok = m;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${r} → matches=${m}`);
  if (!ok) failures++;
}

console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`}`);
process.exit(failures === 0 ? 0 : 1);

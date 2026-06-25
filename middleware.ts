import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { authBypassEnabled } from '@/lib/auth-bypass';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });
  const pathname = request.nextUrl.pathname;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/auth/callback');
  const isDashboardRoute = !pathname.startsWith('/api');

  // Read-only GarrettOS provider routes are public: they only return status
  // data from the bridge using server-side env vars and never expose secrets.
  // Bypass auth here so the dashboard can fetch them without a session, while
  // dashboard pages and all other API routes stay protected. (Safety net — the
  // matcher below already excludes /api/garrettos/* so this line should never
  // run for those paths, but we keep it defensive in case the matcher changes.)
  if (pathname.startsWith('/api/garrettos/')) return response;

  if ((authBypassEnabled && isDashboardRoute) || !url || !anon || isAuthRoute) return response;

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookies) => cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options)),
    },
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/login', request.url));
  return response;
}

// The matcher EXCLUDES /api/garrettos/:path* entirely so the auth middleware
// never runs for the read-only GarrettOS provider routes. It also excludes
// Next internals and static files. Everything else (dashboard pages, private
// API routes) is protected.
//
// The negative lookahead lists full first-segment prefixes (no leading slash,
// because the lookahead starts right after the matched "/"). Order does not
// matter; the "|" alternatives are tried at the same position.
export const config = {
  matcher: [
    '/((?!api/garrettos|_next/static|_next/image|favicon.ico|icon.svg|manifest.webmanifest).*)',
  ],
};

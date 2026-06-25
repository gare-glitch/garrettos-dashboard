import { NextResponse } from 'next/server';
import { getProvider } from '@/lib/garrettos/get-provider';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/garrettos/logs?scope=litellm|bridge|tmux|all — scoped, sanitized
 * log lines. Read-only. Calls the VPS bridge /logs when server mode is on;
 * falls back to a synthetic mock set otherwise.
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const raw = (url.searchParams.get('scope') ?? 'bridge').toLowerCase();
    const scope: 'litellm' | 'bridge' | 'tmux' | 'all' =
      raw === 'litellm' || raw === 'tmux' || raw === 'all' ? raw : 'bridge';
    const provider = getProvider();
    const result = await provider.getLogs(scope);
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { data: { scope: 'bridge', lines: [] }, source: 'mock', warning: 'logs route failed', error: err instanceof Error ? err.message : 'unknown' },
      { status: 200 },
    );
  }
}

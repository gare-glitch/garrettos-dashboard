import { NextResponse } from 'next/server';
import { getProvider } from '@/lib/garrettos/get-provider';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/garrettos/agents — agent sessions, fleet, graph, approvals.
 * Read-only. Uses mock by default; calls VPS bridge when server mode is on.
 */
export async function GET() {
  try {
    const provider = getProvider();
    const result = await provider.getAgents();
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { data: null, source: 'mock', warning: 'agents route failed', error: err instanceof Error ? err.message : 'unknown' },
      { status: 200 },
    );
  }
}

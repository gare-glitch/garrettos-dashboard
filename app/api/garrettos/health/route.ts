import { NextResponse } from 'next/server';
import { getProvider } from '@/lib/garrettos/get-provider';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/garrettos/health — system health + telemetry.
 * Read-only. Uses mock provider by default; calls VPS bridge when
 * GARRETTOS_DATA_MODE=server and OPENCLAW_VPS_BRIDGE_URL is set.
 */
export async function GET() {
  try {
    const provider = getProvider();
    const result = await provider.getHealth();
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { data: null, source: 'mock', warning: 'health route failed', error: err instanceof Error ? err.message : 'unknown' },
      { status: 200 },
    );
  }
}

import { NextResponse } from 'next/server';
import { getProvider } from '@/lib/garrettos/get-provider';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/garrettos/integrations — integration readiness rows derived from
 * env presence. Read-only. Never exposes raw secrets (only maskedKey previews).
 */
export async function GET() {
  try {
    const provider = getProvider();
    const result = await provider.getIntegrations();
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { data: null, source: 'mock', warning: 'integrations route failed', error: err instanceof Error ? err.message : 'unknown' },
      { status: 200 },
    );
  }
}

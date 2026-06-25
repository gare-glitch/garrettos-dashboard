import { NextResponse } from 'next/server';
import { getProvider } from '@/lib/garrettos/get-provider';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/garrettos/models — model routing rows + per-service API usage.
 * Read-only. Calls LiteLLM gateway when LITELLM_BASE_URL is configured.
 */
export async function GET() {
  try {
    const provider = getProvider();
    const result = await provider.getModels();
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { data: null, source: 'mock', warning: 'models route failed', error: err instanceof Error ? err.message : 'unknown' },
      { status: 200 },
    );
  }
}

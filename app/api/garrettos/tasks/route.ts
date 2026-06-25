import { NextResponse } from 'next/server';
import { getProvider } from '@/lib/garrettos/get-provider';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/garrettos/tasks — OpenClaw task queue.
 * Read-only.
 */
export async function GET() {
  try {
    const provider = getProvider();
    const result = await provider.getTasks();
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { data: null, source: 'mock', warning: 'tasks route failed', error: err instanceof Error ? err.message : 'unknown' },
      { status: 200 },
    );
  }
}

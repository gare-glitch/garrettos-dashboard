import { NextResponse, type NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const supportedExtensions = new Set(['csv', 'fit', 'tcx']);

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json() as { fileName?: string; storagePath?: string };
  const extension = body.fileName?.split('.').pop()?.toLowerCase();
  if (!extension || !supportedExtensions.has(extension)) {
    return NextResponse.json({ error: 'Unsupported Garmin file type' }, { status: 400 });
  }

  return NextResponse.json({ status: 'queued', integration: 'garmin', parser: 'placeholder', extension });
}

import { NextResponse, type NextRequest } from 'next/server';
import { detectGarminKind, createGarminImportEvent } from '@/lib/integrations/garmin/scaffold';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json() as { fileName?: string; storagePath?: string };
  const fileName = body.fileName ?? '';
  const kind = detectGarminKind(fileName);
  if (!kind) return NextResponse.json({ error: 'Unsupported Garmin file type' }, { status: 400 });

  const event = createGarminImportEvent({ userId: user.id, fileName, kind, storagePath: body.storagePath });
  await supabase.from('dashboard_events').insert({ user_id: user.id, ...event });
  return NextResponse.json({ status: 'queued', parser: 'scaffold', kind });
}

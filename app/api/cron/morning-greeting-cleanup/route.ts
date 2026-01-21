import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

const BUCKET = 'morning-greeting-proofs';
const RETENTION_DAYS = 3;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get('authorization');
  const isVercelCron = Boolean(request.headers.get('x-vercel-cron'));

  if ((!secret || auth !== `Bearer ${secret}`) && !isVercelCron) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const cutoffIso = cutoff.toISOString();

  const { data, error } = await supabaseAdmin
    .from('morning_greeting_attendance')
    .select('id, evidence_path, evidence_url')
    .or('evidence_path.not.is.null,evidence_url.not.is.null')
    .lt('evidence_uploaded_at', cutoffIso);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ success: true, deleted: 0 });
  }

  const paths = data.map((row) => row.evidence_path).filter(Boolean) as string[];
  if (paths.length > 0) {
    await supabaseAdmin.storage.from(BUCKET).remove(paths);
  }

  const ids = data.map((row) => row.id);
  const { error: updateError } = await supabaseAdmin
    .from('morning_greeting_attendance')
    .update({
      evidence_url: null,
      evidence_path: null,
      evidence_name: null,
      evidence_type: null,
      evidence_size: null,
      evidence_uploaded_at: null,
      updated_at: new Date().toISOString(),
    })
    .in('id', ids);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, deleted: paths.length, cutoff: cutoffIso });
}

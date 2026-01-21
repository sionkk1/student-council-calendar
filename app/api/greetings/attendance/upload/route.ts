import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

const BUCKET = 'morning-greeting-proofs';
const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']);

const KST_TIMEZONE = 'Asia/Seoul';
const ON_TIME_LIMIT = 7 * 60 + 40;
const LATE_LIMIT = 8 * 60 + 10;

const getKstParts = (date: Date) => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: KST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const pick = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  const year = pick('year');
  const month = pick('month');
  const day = pick('day');
  const hour = Number(pick('hour'));
  const minute = Number(pick('minute'));

  return {
    dateKey: `${year}-${month}-${day}`,
    hour,
    minute,
  };
};

const resolveStatus = (dateKey: string) => {
  const now = getKstParts(new Date());
  if (now.dateKey !== dateKey) return 'on_time';
  const totalMinutes = now.hour * 60 + now.minute;
  if (totalMinutes <= ON_TIME_LIMIT) return 'on_time';
  if (totalMinutes <= LATE_LIMIT) return 'late';
  return 'absent';
};

export async function POST(request: NextRequest) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY is missing' }, { status: 500 });
    }
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const date = formData.get('date') as string | null;
    const name = formData.get('name') as string | null;

    if (!file || !date || !name) {
      return NextResponse.json({ error: 'file, date, name is required' }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: '파일 크기는 10MB 이하여야 합니다.' }, { status: 400 });
    }

    if (file.type && !ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: '이미지 파일만 업로드할 수 있습니다.' }, { status: 400 });
    }

    const ext = file.name.split('.').pop() || 'jpg';
    const now = new Date();
    const filePath = `${date}/${now.getTime()}-${crypto.randomUUID()}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(filePath, arrayBuffer, { contentType: file.type });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: existing } = await supabaseAdmin
      .from('morning_greeting_attendance')
      .select('checked, status, checked_at, excused, excuse_reason, excused_at')
      .eq('date', date)
      .eq('name', name)
      .maybeSingle();

    const nowIso = now.toISOString();
    const checked = existing?.checked ?? true;
    const status = existing?.status ?? resolveStatus(date);
    const checkedAt = existing?.checked_at ?? nowIso;
    const excused = existing?.excused ?? false;
    const excuseReason = existing?.excuse_reason ?? null;
    const excusedAt = existing?.excused_at ?? null;

    const { data, error } = await supabaseAdmin
      .from('morning_greeting_attendance')
      .upsert(
        {
          date,
          name,
          checked,
          status,
          checked_at: checkedAt,
          excused,
          excuse_reason: excuseReason,
          excused_at: excusedAt,
          evidence_url: null,
          evidence_path: filePath,
          evidence_name: file.name,
          evidence_type: file.type,
          evidence_size: file.size,
          evidence_uploaded_at: nowIso,
          updated_at: nowIso,
        },
        { onConflict: 'date,name' }
      )
      .select(
        'name, checked, status, checked_at, excused, excuse_reason, excused_at, evidence_url, evidence_path, evidence_name, evidence_type, evidence_size, evidence_uploaded_at'
      )
      .single();

    if (error) {
      await supabaseAdmin.storage.from(BUCKET).remove([filePath]);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : '서버 오류';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

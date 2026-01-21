import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

const BUCKET = 'morning-greeting-proofs';
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

export async function PUT(request: NextRequest) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY is missing' }, { status: 500 });
    }
    const body = await request.json();
    const date = body?.date;
    const name = body?.name;
    const url = typeof body?.url === 'string' ? body.url.trim() : '';

    if (!date || !name || !url) {
      return NextResponse.json({ error: 'date, name, url is required' }, { status: 400 });
    }

    const { data: existing } = await supabaseAdmin
      .from('morning_greeting_attendance')
      .select('checked, status, checked_at, excused, excuse_reason, excused_at')
      .eq('date', date)
      .eq('name', name)
      .maybeSingle();

    const nowIso = new Date().toISOString();
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
          evidence_url: url,
          evidence_path: null,
          evidence_name: null,
          evidence_type: null,
          evidence_size: null,
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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data ?? {});
  } catch (err) {
    const message = err instanceof Error ? err.message : '서버 오류';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY is missing' }, { status: 500 });
    }
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const name = searchParams.get('name');

    if (!date || !name) {
      return NextResponse.json({ error: 'date and name is required' }, { status: 400 });
    }

    const { data: existing } = await supabaseAdmin
      .from('morning_greeting_attendance')
      .select('evidence_path')
      .eq('date', date)
      .eq('name', name)
      .maybeSingle();

    if (existing?.evidence_path) {
      await supabaseAdmin.storage.from(BUCKET).remove([existing.evidence_path]);
    }

    const { error } = await supabaseAdmin
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
      .eq('date', date)
      .eq('name', name);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : '서버 오류';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

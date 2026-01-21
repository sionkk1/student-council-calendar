import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { supabaseAdmin } from '@/lib/supabase/admin';

const KST_TIMEZONE = 'Asia/Seoul';
const ON_TIME_LIMIT = 7 * 60 + 40;
const LATE_LIMIT = 8 * 60 + 10;
const ALLOWED_STATUS = new Set(['on_time', 'late', 'absent']);

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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');

  if (!date) {
    return NextResponse.json({ error: 'date is required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('morning_greeting_attendance')
    .select('name, checked, status, checked_at, excused, excuse_reason, excused_at')
    .eq('date', date)
    .order('name', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function PUT(request: NextRequest) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY is missing' }, { status: 500 });
    }
    const body = await request.json();
    const rows = Array.isArray(body) ? body : [body];
    const nowIso = new Date().toISOString();

    const payload = rows
      .filter((row) => row?.date && row?.name)
      .map((row) => {
        const checked = Boolean(row.checked);
        const incomingStatus = ALLOWED_STATUS.has(row?.status) ? row.status : null;
        const status = checked ? incomingStatus ?? resolveStatus(row.date) : null;
        const excused = checked ? Boolean(row.excused) : false;
        const excuseReason =
          checked && typeof row?.excuse_reason === 'string' && row.excuse_reason.trim().length > 0
            ? row.excuse_reason.trim()
            : null;
        return {
          date: row.date,
          name: row.name,
          checked,
          status,
          excused,
          excuse_reason: excused ? excuseReason : null,
          excused_at: excused ? nowIso : null,
          checked_at: checked ? nowIso : null,
          updated_at: nowIso,
        };
      });

    if (payload.length === 0) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('morning_greeting_attendance')
      .upsert(payload, { onConflict: 'date,name' })
      .select('name, checked, status, checked_at, excused, excuse_reason, excused_at, date');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

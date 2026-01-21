import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');

  if (!date) {
    return NextResponse.json({ error: 'date is required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('morning_greeting_attendance')
    .select('name, checked')
    .eq('date', date)
    .order('name', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const rows = Array.isArray(body) ? body : [body];

    const payload = rows
      .filter((row) => row?.date && row?.name)
      .map((row) => ({
        date: row.date,
        name: row.name,
        checked: Boolean(row.checked),
        updated_at: new Date().toISOString(),
      }));

    if (payload.length === 0) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('morning_greeting_attendance')
      .upsert(payload, { onConflict: 'date,name' });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

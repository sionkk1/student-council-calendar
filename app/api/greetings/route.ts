import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  const { data, error } = await supabase
    .from('morning_greetings')
    .select('weekday, members')
    .order('weekday', { ascending: true });

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
    if (!Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const payload = body.map((row) => ({
      weekday: row.weekday,
      members: row.members ?? [],
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabaseAdmin
      .from('morning_greetings')
      .upsert(payload, { onConflict: 'weekday' });

    if (error) {
      console.error('Failed to upsert morning_greetings:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

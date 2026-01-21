import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const start = searchParams.get('start');
  const end = searchParams.get('end');
  const date = searchParams.get('date');

  let query = supabase.from('morning_greeting_skips').select('date, reason');

  if (start && end) {
    query = query.gte('date', start).lte('date', end);
  } else if (date) {
    query = query.eq('date', date);
  }

  const { data, error } = await query.order('date', { ascending: true });

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
    const date = body?.date;
    const reason = body?.reason ?? '생략';

    if (!date) {
      return NextResponse.json({ error: 'date is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('morning_greeting_skips')
      .upsert({ date, reason, updated_at: new Date().toISOString() }, { onConflict: 'date' });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY is missing' }, { status: 500 });
    }
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json({ error: 'date is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('morning_greeting_skips')
      .delete()
      .eq('date', date);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

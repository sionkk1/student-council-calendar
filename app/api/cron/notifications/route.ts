import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sendToSubscriptions, type StoredSubscription } from '@/lib/push';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get('authorization');

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const windowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const { data: events, error } = await supabaseAdmin
    .from('events')
    .select('*')
    .gte('start_time', now.toISOString())
    .lte('start_time', windowEnd.toISOString())
    .order('start_time', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: subs, error: subsError } = await supabaseAdmin
    .from('push_subscriptions')
    .select('endpoint, subscription');

  if (subsError) {
    return NextResponse.json({ error: subsError.message }, { status: 500 });
  }

  if (!subs || subs.length === 0) {
    return NextResponse.json({ success: true, sent: 0 });
  }

  let sent = 0;

  for (const event of events || []) {
    const scheduledFor = event.start_time?.split('T')[0];
    if (!scheduledFor) continue;
    const { data: existing } = await supabaseAdmin
      .from('notification_log')
      .select('id')
      .eq('type', 'event')
      .eq('event_id', event.id)
      .eq('scheduled_for', scheduledFor)
      .maybeSingle();

    if (existing) continue;

    const payload = {
      title: '다가오는 일정',
      body: `${event.title} - ${new Date(event.start_time).toLocaleString('ko-KR')}`,
      url: '/',
    };

    try {
      const { expiredEndpoints } = await sendToSubscriptions(subs as StoredSubscription[], payload);
      if (expiredEndpoints.length > 0) {
        await supabaseAdmin.from('push_subscriptions').delete().in('endpoint', expiredEndpoints);
      }

      await supabaseAdmin.from('notification_log').upsert({
        type: 'event',
        event_id: event.id,
        scheduled_for: scheduledFor,
      });

      sent += 1;
    } catch (err) {
      console.error('Push send failed:', err);
    }
  }

  return NextResponse.json({ success: true, sent, total: events?.length ?? 0 });
}

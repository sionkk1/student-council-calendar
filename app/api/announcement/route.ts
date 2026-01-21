import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sendToSubscriptions, type StoredSubscription } from '@/lib/push';

export const runtime = 'nodejs';

export async function GET() {
    const { data } = await supabaseAdmin
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
    const { content } = await request.json();

    // 기존 공지 삭제
    await supabaseAdmin.from('announcements').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // 새 공지 추가
    const { data, error } = await supabaseAdmin
        .from('announcements')
        .insert({ content })
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    
    if (data) {
        const { data: subs } = await supabaseAdmin
            .from('push_subscriptions')
            .select('endpoint, subscription');

        if (subs && subs.length > 0) {
            try {
                const payload = {
                    title: 'New Announcement',
                    body: content,
                    url: '/',
                };
                const { expiredEndpoints } = await sendToSubscriptions(subs as StoredSubscription[], payload);
                if (expiredEndpoints.length > 0) {
                    await supabaseAdmin.from('push_subscriptions').delete().in('endpoint', expiredEndpoints);
                }
                await supabaseAdmin.from('notification_log').upsert({
                    type: 'announcement',
                    announcement_id: data.id,
                });
            } catch (err) {
                console.error('Push send failed:', err);
            }
        }
    }

    return NextResponse.json(data);
}

export async function DELETE() {
    await supabaseAdmin.from('announcements').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    return NextResponse.json({ success: true });
}

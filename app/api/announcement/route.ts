import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

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
    return NextResponse.json(data);
}

export async function DELETE() {
    await supabaseAdmin.from('announcements').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    return NextResponse.json({ success: true });
}
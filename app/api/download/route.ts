import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');
    const name = searchParams.get('name');

    if (!path) return NextResponse.json({ error: '경로가 필요합니다.' }, { status: 400 });

    const { data, error } = await supabaseAdmin.storage.from('meeting-minutes').download(path);
    if (error) return NextResponse.json({ error: '다운로드 실패' }, { status: 500 });

    return new NextResponse(data, {
        headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': `attachment; filename="${encodeURIComponent(name || 'file')}"`,
        },
    });
}
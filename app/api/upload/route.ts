import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const eventId = formData.get('eventId') as string;

        if (!file || !eventId) {
            return NextResponse.json({ error: '파일과 이벤트 ID가 필요합니다.' }, { status: 400 });
        }

        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json({ error: '파일 크기는 10MB 이하여야 합니다.' }, { status: 400 });
        }

        const date = new Date();
        const filePath = `${date.getFullYear()}/${date.getMonth() + 1}/${eventId}/${Date.now()}_${file.name}`;

        const arrayBuffer = await file.arrayBuffer();
        const { error: uploadError } = await supabaseAdmin.storage
            .from('meeting-minutes')
            .upload(filePath, arrayBuffer, { contentType: file.type });

        if (uploadError) {
            return NextResponse.json({ error: '파일 업로드에 실패했습니다.' }, { status: 500 });
        }

        const { data, error } = await supabaseAdmin
            .from('meeting_minutes')
            .insert({ event_id: eventId, file_path: filePath, file_name: file.name, file_size: file.size })
            .select()
            .single();

        if (error) {
            await supabaseAdmin.storage.from('meeting-minutes').remove([filePath]);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: '서버 오류' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) return NextResponse.json({ error: '이벤트 ID가 필요합니다.' }, { status: 400 });

    const { data, error } = await supabaseAdmin
        .from('meeting_minutes')
        .select('*')
        .eq('event_id', eventId)
        .order('uploaded_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID가 필요합니다.' }, { status: 400 });

    const { data: minute } = await supabaseAdmin.from('meeting_minutes').select('file_path').eq('id', id).single();
    if (minute) await supabaseAdmin.storage.from('meeting-minutes').remove([minute.file_path]);

    const { error } = await supabaseAdmin.from('meeting_minutes').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
}
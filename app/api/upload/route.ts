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
        // 파일명을 영문+숫자+확장자만 남기고 UUID로 대체
        const ext = file.name.split('.').pop() || 'file';
        const filePath = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${eventId}/${Date.now()}.${ext}`;

        const arrayBuffer = await file.arrayBuffer();
        const { error: uploadError } = await supabaseAdmin.storage
            .from('meeting-minutes')
            .upload(filePath, arrayBuffer, { contentType: file.type });

        if (uploadError) {
            console.error('Storage upload error:', uploadError);
            return NextResponse.json({ error: `업로드 실패: ${uploadError.message}` }, { status: 500 });
        }

        const { data, error } = await supabaseAdmin
            .from('meeting_minutes')
            .insert({ event_id: eventId, file_path: filePath, file_name: file.name, file_size: file.size })
            .select()
            .single();

        if (error) {
            console.error('DB insert error:', error);
            await supabaseAdmin.storage.from('meeting-minutes').remove([filePath]);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data, { status: 201 });
    } catch (error) {
        console.error('Upload API error:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : '서버 오류' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const eventId = searchParams.get('eventId');

        if (!eventId) return NextResponse.json({ error: '이벤트 ID가 필요합니다.' }, { status: 400 });

        const { data, error } = await supabaseAdmin
            .from('meeting_minutes')
            .select('*')
            .eq('event_id', eventId)
            .order('uploaded_at', { ascending: false });

        if (error) {
            console.error('GET meeting_minutes error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json(data || []);
    } catch (error) {
        console.error('GET API error:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : '서버 오류' }, { status: 500 });
    }
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
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { fetchNeisSchedule, convertNeisToEvent } from '@/lib/neis';

export async function POST(request: NextRequest) {
    try {
        // 1. 관리자 권한 확인 (보안 검증)
        const adminSession = request.cookies.get('admin-session');
        if (adminSession?.value !== 'verified') {
            return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 401 });
        }

        const { targetYear } = await request.json();
        if (!targetYear) {
            return NextResponse.json({ error: '대상 연도(targetYear)가 필요합니다.' }, { status: 400 });
        }

        // 2. 나이스 API에서 데이터 가져오기
        // 학사일정은 '학년도' 기준이라 보통 3월부터 다음해 2월까지입니다. 따라서 연도 값만 넘기면 해당 연도의 데이터들을 수집합니다.
        const rawEvents = await fetchNeisSchedule(targetYear.toString());

        if (!rawEvents || rawEvents.length === 0) {
            return NextResponse.json({ message: '가져올 학사일정 데이터가 없습니다.', count: 0 });
        }

        // 3. Supabase 형식으로 변환
        const newEvents = rawEvents.map(convertNeisToEvent);

        let insertedCount = 0;

        // 4. Supabase 연동 로직 (단순 구현: 학교 일정을 싹 다 지우고 다시 넣거나, 중복 검사하며 넣기)
        // 기존에 직접 넣은 일반 '학교' 카테고리 행사와 충돌하지 않게 `is_school_event: true` 이면서 
        // 나이스에서 끌고온 것들을 어떻게 처리할지 정해야 하는데, 여기서는 무식하지만 확실하게 
        // "해당 연도에 포함되는 자동 연동 일정(description에 '나이스 자동 동기화'가 포함된 경우)"을 싹 지우고 새로 Insert합니다.
        // ※ 주의: 실제 운영에선 description 보단 NEIS ID 같은 별도 컬럼을 두는게 가장 깔끔하나 현재 스키마를 유지하기 위해 description을 활용함.

        const startDate = `${targetYear}-01-01T00:00:00+09:00`;
        const endDate = `${parseInt(targetYear) + 1}-03-01T00:00:00+09:00`;

        // 기존 동기화 데이터 삭제 (해당 기간 내)
        const { error: deleteError } = await supabaseAdmin
            .from('events')
            .delete()
            .eq('is_school_event', true)
            .like('description', '%나이스 자동 동기화%')
            .gte('start_time', startDate)
            .lte('start_time', endDate);

        if (deleteError) {
            console.error("Delete Error:", deleteError);
            return NextResponse.json({ error: '기존 동기화 일정 삭제 중 오류가 발생했습니다.' }, { status: 500 });
        }

        // Bulk Insert
        const { data: insertedData, error: insertError } = await supabaseAdmin
            .from('events')
            .insert(newEvents)
            .select();

        if (insertError) {
            console.error("Insert Error:", insertError);
            return NextResponse.json({ error: '새 일정 추가 중 오류가 발생했습니다.' }, { status: 500 });
        }

        insertedCount = insertedData?.length || 0;

        return NextResponse.json({
            success: true,
            message: `나이스 학사일정 동기화 완료! (${insertedCount}개 일정 업데이트됨)`,
            count: insertedCount
        });

    } catch (error: unknown) {
        console.error('NEIS Sync Error:', error);
        if (error instanceof Error) {
            return NextResponse.json({ error: error.message || '서버 오류' }, { status: 500 });
        }
        return NextResponse.json({ error: '서버 오류' }, { status: 500 });
    }
}

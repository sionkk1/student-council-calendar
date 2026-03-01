export interface NeisScheduleRow {
    ATPT_OFCDC_SC_CODE: string; // 시도교육청코드
    ATPT_OFCDC_SC_NM: string;   // 시도교육청명
    SD_SCHUL_CODE: string;      // 표준학교코드
    SCHUL_NM: string;           // 학교명
    AY: string;                 // 학년도
    AA_YMD: string;             // 학사일자 (YYYYMMDD)
    EVENT_NM: string;           // 행사명
    EVENT_CNTNT: string | null; // 행사내용
    ONE_GRADE_EVENT_YN: string; // 1학년행사여부 (Y/N/*)
    TW_GRADE_EVENT_YN: string;  // 2학년행사여부 (Y/N/*)
    THREE_GRADE_EVENT_YN: string; // 3학년행사여부 (Y/N/*)
    FR_GRADE_EVENT_YN: string;  // 4학년행사여부 (Y/N/*)
    FIV_GRADE_EVENT_YN: string; // 5학년행사여부 (Y/N/*)
    SIX_GRADE_EVENT_YN: string; // 6학년행사여부 (Y/N/*)
    SBTR_DD_SC_NM: string;      // 수업공제일명 (ex: 휴업일, 공휴일)
}

export interface NeisScheduleResponse {
    SchoolSchedule?: [
        {
            head: [
                { list_total_count: number },
                { RESULT: { CODE: string; MESSAGE: string } }
            ]
        },
        {
            row: NeisScheduleRow[]
        }
    ];
    RESULT?: {
        CODE: string;
        MESSAGE: string;
    };
}

/**
 * 나이스(NEIS) 학사일정 API를 호출하여 지정된 연월의 일정을 가져옵니다.
 * @param yyyymm 조회할 연월 (예: '202603') - 생략시 해당 연도 전체
 */
export async function fetchNeisSchedule(yyyymm?: string): Promise<NeisScheduleRow[]> {
    const apiKey = process.env.NEXT_PUBLIC_NEIS_API_KEY;
    const atptCode = process.env.NEXT_PUBLIC_NEIS_ATPT_OFCDC_SC_CODE || 'Q10'; // 전남교육청 (문태고등학교)
    const schulCode = process.env.NEXT_PUBLIC_NEIS_SD_SCHUL_CODE || '8490088'; // 학교코드

    if (!apiKey) {
        throw new Error('NEIS API Key is not configured.');
    }

    const url = new URL('https://open.neis.go.kr/hub/SchoolSchedule');
    url.searchParams.append('KEY', apiKey);
    url.searchParams.append('Type', 'json');
    url.searchParams.append('pIndex', '1');
    url.searchParams.append('pSize', '1000');
    url.searchParams.append('ATPT_OFCDC_SC_CODE', atptCode);
    url.searchParams.append('SD_SCHUL_CODE', schulCode);

    if (yyyymm) {
        if (yyyymm.length === 4) {
            // 연도만 주어질 경우 (예: 2026), 해당 학년도 (2026.03.01 ~ 2027.02.28) 범위로 조회
            url.searchParams.append('AA_FROM_YMD', `${yyyymm}0301`);
            url.searchParams.append('AA_TO_YMD', `${parseInt(yyyymm) + 1}0228`);
        } else {
            url.searchParams.append('AA_YMD', yyyymm); // YYYYMMDD 또는 YYYYMM 도 가능
        }
    } else {
        // 기본값: 당해년도 학사일정
        const currentYear = new Date().getFullYear();
        url.searchParams.append('AA_FROM_YMD', `${currentYear}0301`);
        url.searchParams.append('AA_TO_YMD', `${currentYear + 1}0228`);
    }

    try {
        console.log('[NEIS FETCH] URL:', url.toString());
        const response = await fetch(url.toString(), {
            method: 'GET',
            cache: 'no-store'
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error('[NEIS ERROR] Status:', response.status, 'Body:', errText);
            throw new Error(`NEIS API HTTP error! status: ${response.status}, text: ${errText}`);
        }

        const data = await response.json() as NeisScheduleResponse;

        if (data.RESULT && data.RESULT.CODE !== 'INFO-000') {
            // 데이터가 없는 경우 (INFO-200) 에러처리하지 않고 빈 배열 반환
            if (data.RESULT.CODE === 'INFO-200') {
                return [];
            }
            throw new Error(`NEIS API Error: ${data.RESULT.MESSAGE} (${data.RESULT.CODE})`);
        }

        if (data.SchoolSchedule && data.SchoolSchedule[1].row) {
            return data.SchoolSchedule[1].row;
        }

        return [];
    } catch (error) {
        console.error('Failed to fetch NEIS schedule:', error);
        throw error;
    }
}

/**
 * NEIS 학사일정 데이터를 Supabase 이벤트 형식으로 변환합니다.
 */
export function convertNeisToEvent(row: NeisScheduleRow) {
    // YYYYMMDD 형식의 문자열을 ISO 문자열로 변환 (한국 시간 기준)
    const year = row.AA_YMD.substring(0, 4);
    const month = row.AA_YMD.substring(4, 6);
    const day = row.AA_YMD.substring(6, 8);

    // start_time 만들기
    const startTime = `${year}-${month}-${day}T00:00:00+09:00`;

    // 색상 태그 결정 (휴업일/공휴일 등은 빨간색, 그 외는 초록색 등으로 기본 매핑)
    let colorTag = '#10b981'; // 기본 초록색(학교일정)
    if (row.SBTR_DD_SC_NM === '휴업일' || row.SBTR_DD_SC_NM === '공휴일' || row.EVENT_NM.includes('방학') || row.EVENT_NM.includes('휴업')) {
        colorTag = '#ef4444'; // 빨간색
    } else if (row.EVENT_NM.includes('고사') || row.EVENT_NM.includes('평가') || row.EVENT_NM.includes('시험')) {
        colorTag = '#eab308'; // 노란색
    } else if (row.EVENT_NM.includes('입학') || row.EVENT_NM.includes('졸업') || row.EVENT_NM.includes('축제') || row.EVENT_NM.includes('체육대회')) {
        colorTag = '#3b82f6'; // 파란색
    }

    // 대상 학년 텍스트화 (선택적)
    let targetGrades = '';
    const grades = [];
    if (row.ONE_GRADE_EVENT_YN === 'Y') grades.push('1학년');
    if (row.TW_GRADE_EVENT_YN === 'Y') grades.push('2학년');
    if (row.THREE_GRADE_EVENT_YN === 'Y') grades.push('3학년');

    if (grades.length > 0 && grades.length < 3) {
        targetGrades = ` (${grades.join(', ')})`;
    }

    const title = `${row.EVENT_NM}${targetGrades}`;

    return {
        title: title,
        description: row.EVENT_CNTNT || `나이스 자동 동기화 행사`,
        start_time: startTime,
        end_time: null, // 하루 종일 이벤트이므로 1일짜리는 end_time 생략
        is_all_day: true,
        category: '학교',
        color_tag: colorTag,
        is_school_event: true,
    };
}

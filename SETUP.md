# 학생회 일정 캘린더

학생회 자치기획실 일정 관리 웹 애플리케이션

## 🚀 시작하기

### 1. 환경변수 설정

`.env.example` 파일을 복사하여 `.env.local` 파일을 생성하고 실제 값을 입력하세요:

```bash
cp .env.example .env.local
```

### 2. API 폴더 생성 (필수!)

Next.js API 라우트를 사용하려면 다음 폴더와 파일을 생성해야 합니다:

```bash
# 폴더 구조 생성
mkdir -p app/api/auth
mkdir -p app/api/events
mkdir -p app/api/upload
mkdir -p app/api/download
```

### 3. API 파일 생성

#### `app/api/auth/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyWithEmergency, getMidnightExpiry } from '@/lib/enigma';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();
    
    if (!code) {
      return NextResponse.json({ error: '코드를 입력해주세요.' }, { status: 400 });
    }
    
    if (!verifyWithEmergency(code)) {
      return NextResponse.json({ error: '잘못된 코드입니다.' }, { status: 401 });
    }
    
    const response = NextResponse.json({ success: true });
    response.cookies.set('admin-session', 'verified', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: getMidnightExpiry(),
      path: '/',
    });
    
    return response;
  } catch (error) {
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('admin-session');
  return response;
}

export async function GET(request: NextRequest) {
  const adminSession = request.cookies.get('admin-session');
  return NextResponse.json({ isAdmin: adminSession?.value === 'verified' });
}
```

#### `app/api/events/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('start');
  const endDate = searchParams.get('end');
  
  let query = supabase.from('events').select('*').order('start_time', { ascending: true });
  if (startDate) query = query.gte('start_time', startDate);
  if (endDate) query = query.lte('start_time', endDate);
  
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { data, error } = await supabaseAdmin.from('events').insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, ...updateData } = body;
  const { data, error } = await supabaseAdmin.from('events').update(updateData).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const { error } = await supabaseAdmin.from('events').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
```

#### `app/api/upload/route.ts` (회의록 업로드)

```typescript
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
```

#### `app/api/download/route.ts` (회의록 다운로드)

```typescript
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
```

#### `app/api/ical/route.ts` (iCal 구독)

```typescript
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET() {
  const { data: events } = await supabase.from('events').select('*').order('start_time');
  
  const formatDate = (date: Date, allDay: boolean) => {
    if (allDay) return date.toISOString().split('T')[0].replace(/-/g, '');
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const icalEvents = (events || []).map((event) => {
    const start = new Date(event.start_time);
    const end = event.end_time ? new Date(event.end_time) : new Date(start.getTime() + 3600000);
    
    return `BEGIN:VEVENT
UID:${event.id}@calendar
DTSTART${event.is_all_day ? ';VALUE=DATE' : ''}:${formatDate(start, event.is_all_day)}
DTEND${event.is_all_day ? ';VALUE=DATE' : ''}:${formatDate(end, event.is_all_day)}
SUMMARY:${event.title}
DESCRIPTION:${(event.description || '').replace(/\n/g, '\\n')}
END:VEVENT`;
  }).join('\n');

  return new NextResponse(`BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Student Council//KO
X-WR-CALNAME:학생자치회 일정
${icalEvents}
END:VCALENDAR`, {
    headers: { 'Content-Type': 'text/calendar; charset=utf-8' },
  });
}
```

### 4. Supabase 설정

Supabase 대시보드에서 SQL Editor를 열고 다음 쿼리를 실행하세요:

```sql
-- events 테이블 생성
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  is_all_day BOOLEAN DEFAULT false,
  category TEXT,
  color_tag TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- meeting_minutes 테이블 생성
CREATE TABLE IF NOT EXISTS meeting_minutes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time);

-- RLS 활성화
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_minutes ENABLE ROW LEVEL SECURITY;

-- 모든 작업 허용 정책
CREATE POLICY "Allow all on events" ON events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on meeting_minutes" ON meeting_minutes FOR ALL USING (true) WITH CHECK (true);

-- 실시간 동기화를 위한 Publication 설정
ALTER PUBLICATION supabase_realtime ADD TABLE events;
```

### 5. Supabase Storage 설정

1. Supabase 대시보드 → **Storage** 메뉴
2. **New Bucket** 클릭
3. 이름: `meeting-minutes`
4. Public: **OFF** (비공개)
5. **Create bucket** 클릭

### 6. 실행

```bash
npm run dev
```

## 📁 프로젝트 구조

```
student-council-calendar/
├── app/
│   ├── api/           # API 라우트 (직접 생성 필요)
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── admin/         # 관리자 컴포넌트
│   ├── calendar/      # 캘린더 컴포넌트
│   └── modals/        # 모달 컴포넌트
├── hooks/             # 커스텀 훅
├── lib/               # 유틸리티, Supabase 클라이언트
├── types/             # TypeScript 타입
└── middleware.ts      # API 보호 미들웨어
```

## 🔐 관리자 인증

- 화면 우측 하단의 잠금 아이콘을 클릭하여 관리자 코드 입력
- 코드는 매일 자정에 변경됨 (SHA256 해시 기반)
- 오늘의 코드 확인: `node -e "require('./lib/enigma').generateDailyCode()"`

## 📱 기능

- ✅ 반응형 캘린더 (데스크탑/모바일)
- ✅ 일정 조회
- ✅ 관리자 인증 (Enigma 코드)
- ✅ 일정 추가/수정/삭제 (관리자)
- ✅ 실시간 동기화 (Supabase Realtime)
- ✅ 회의록 업로드/다운로드 (관리자)

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

### 4. Supabase 설정

Supabase 대시보드에서 SQL Editor를 열고 다음 쿼리를 실행하세요:

```sql
-- events 테이블 생성
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- 인덱스 생성
CREATE INDEX idx_events_start_time ON events(start_time);

-- RLS 활성화
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- 읽기 정책 (누구나 조회 가능)
CREATE POLICY "Anyone can view events" ON events FOR SELECT USING (true);
```

### 5. 실행

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
- ✅ 스와이프 제스처 (모바일)

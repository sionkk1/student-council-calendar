import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

const BUCKET = 'morning-greeting-proofs';
const SAFE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path');
  const type = searchParams.get('type') || 'image/jpeg';

  if (!path) {
    return NextResponse.json({ error: '경로가 필요합니다.' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin.storage.from(BUCKET).download(path);
  if (error) {
    return NextResponse.json({ error: '다운로드 실패' }, { status: 500 });
  }

  const contentType = SAFE_TYPES.has(type) ? type : 'image/jpeg';

  return new NextResponse(data, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': 'inline',
    },
  });
}

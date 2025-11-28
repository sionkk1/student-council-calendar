import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;
  
  // 관리자 전용 API 경로 보호 (GET 제외)
  const protectedPaths = ['/api/events', '/api/upload'];
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));
  
  if (isProtectedPath && method !== 'GET') {
    const adminSession = request.cookies.get('admin-session');
    
    if (!adminSession || adminSession.value !== 'verified') {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      );
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/events/:path*',
    '/api/upload/:path*',
  ],
};

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
    } catch {
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
import { NextRequest, NextResponse } from 'next/server';
import { sendToSubscriptions, type StoredSubscription } from '@/lib/push';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { subscription, payload } = await request.json();

    if (!subscription?.endpoint) {
      return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
    }

    const basePayload = {
      title: '테스트 알림',
      body: '푸시 알림 테스트입니다.',
      url: '/',
    };

    const mergedPayload = payload && typeof payload === 'object'
      ? { ...basePayload, ...payload }
      : basePayload;

    const subscriptions: StoredSubscription[] = [
      { endpoint: subscription.endpoint, subscription },
    ];

    const { expiredEndpoints } = await sendToSubscriptions(subscriptions, mergedPayload);
    return NextResponse.json({ success: true, expiredEndpoints });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

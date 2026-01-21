'use client';

import { Bell, BellOff } from 'lucide-react';
import { useEffect, useState } from 'react';

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export default function NotificationToggle() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkSupport = async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setIsSupported(false);
        return;
      }
      setIsSupported(true);
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        const activeRegistration = registration ?? await navigator.serviceWorker.register('/sw.js');
        const subscription = await activeRegistration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      } catch {
        setIsSubscribed(false);
      }
    };

    void checkSupport();
  }, []);

  const subscribe = async () => {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) {
      alert('VAPID public key가 설정되지 않았습니다.');
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      alert('알림 권한이 필요합니다.');
      return;
    }

    const registration = await navigator.serviceWorker.getRegistration();
    const activeRegistration = registration ?? await navigator.serviceWorker.register('/sw.js');
    const subscription = await activeRegistration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    const res = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription, userAgent: navigator.userAgent }),
    });

    if (!res.ok) {
      await subscription.unsubscribe();
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || '구독 저장에 실패했습니다.');
    }

    setIsSubscribed(true);
    alert('알림이 설정되었습니다.');
  };

  const unsubscribe = async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = await registration?.pushManager.getSubscription();

    if (subscription) {
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });
      await subscription.unsubscribe();
    }

    setIsSubscribed(false);
    alert('알림이 해제되었습니다.');
  };

  const toggleSubscription = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      if (!isSubscribed) {
        await subscribe();
      } else {
        await unsubscribe();
      }
    } catch (err) {
      console.error('[NotificationToggle] toggle error:', err);
      alert(err instanceof Error ? err.message : '알림 처리 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) return null;

  return (
    <button
      onClick={toggleSubscription}
      className="p-2 rounded-xl text-foreground/80 hover:bg-muted/50 transition-colors disabled:opacity-50"
      aria-label="알림 설정"
      disabled={isLoading}
    >
      {isSubscribed ? <Bell size={20} className="text-primary" /> : <BellOff size={20} />}
    </button>
  );
}

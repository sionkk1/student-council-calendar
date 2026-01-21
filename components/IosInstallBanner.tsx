'use client';

import { useEffect, useState } from 'react';

const DISMISS_KEY = 'ios_install_banner_dismissed_v1';

const isIosDevice = (ua: string) => /iP(ad|hone|od)/.test(ua);

const isSafariBrowser = (ua: string) => {
  const isWebkit = /Safari/.test(ua);
  const isOther = /(CriOS|FxiOS|EdgiOS|OPiOS|Chrome)/.test(ua);
  return isWebkit && !isOther;
};

export default function IosInstallBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(DISMISS_KEY) === '1') return;

    const ua = navigator.userAgent;
    const ios = isIosDevice(ua);
    const safari = isSafariBrowser(ua);
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (navigator as Navigator & { standalone?: boolean }).standalone === true;

    if (ios && safari && !standalone) {
      setVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="mx-auto mt-3 max-w-5xl px-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900 shadow-sm dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-100">
        <div className="flex items-start justify-between gap-3">
          <p className="font-semibold">아이폰 알림 받는 방법</p>
          <button
            onClick={handleDismiss}
            className="text-xs font-semibold text-sky-700 hover:text-sky-900 dark:text-sky-200 dark:hover:text-white"
            aria-label="안내 닫기"
          >
            닫기
          </button>
        </div>
        <ol className="list-decimal space-y-1 pl-5 text-xs text-sky-800 dark:text-sky-100/90">
          <li>Safari로 사이트 열기</li>
          <li>공유 버튼 → “홈 화면에 추가”</li>
          <li>홈 화면 앱에서 알림 허용</li>
        </ol>
        <p className="text-[11px] text-sky-700 dark:text-sky-200/80">
          iOS 16.4 이상에서만 푸시 알림이 지원됩니다.
        </p>
      </div>
    </div>
  );
}

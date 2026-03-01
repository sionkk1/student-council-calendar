'use client';

import { LogOut, Shield, Calendar, RefreshCw } from 'lucide-react';
import { useState } from 'react';

interface AdminBarProps {
  onLogout: () => void;
}

export default function AdminBar({ onLogout }: AdminBarProps) {
  const [showIcalInfo, setShowIcalInfo] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleShare = async () => {
    const icalUrl = `${window.location.origin}/api/ical`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: '학생자치회 일정 구독',
          text: '캘린더 앱에서 이 URL을 구독하세요',
          url: icalUrl,
        });
      } catch {
        setShowIcalInfo(true);
      }
    } else {
      setShowIcalInfo(true);
    }
  };

  const handleNeisSync = async () => {
    const currentYear = new Date().getFullYear();
    if (!confirm(`${currentYear}학년도 나이스 학사일정을 동기화하시겠습니까?\n(기존 자동 동기화 데이터는 덮어씌워집니다)`)) return;

    setIsSyncing(true);
    try {
      const res = await fetch('/api/admin/neis-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetYear: currentYear })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '동기화 실패');

      alert(data.message);
      // Reload the page to reflect the new events
      window.location.reload();
    } catch (error: unknown) {
      if (error instanceof Error) {
        alert(`오류 발생: ${error.message}`);
      } else {
        alert('알 수 없는 오류가 발생했습니다.');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const copyIcalUrl = () => {
    const icalUrl = `${window.location.origin}/api/ical`;
    navigator.clipboard.writeText(icalUrl);
    alert('iCal URL이 복사되었습니다!');
    setShowIcalInfo(false);
  };

  return (
    <>
      <div className="bg-blue-600 text-white py-2">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Shield size={16} />
            <span>관리자 모드</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="flex items-center gap-1 text-sm hover:text-blue-200 transition-colors min-h-[44px] px-2"
              title="캘린더 구독 공유"
            >
              <Calendar size={16} />
              <span className="hidden sm:inline">구독</span>
            </button>
            <button
              onClick={handleNeisSync}
              disabled={isSyncing}
              className={`flex items-center gap-1 text-sm hover:text-blue-200 transition-colors min-h-[44px] px-2 ${isSyncing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">{isSyncing ? '동기화 중...' : '나이스 동기화'}</span>
            </button>
            <button
              onClick={onLogout}
              className="flex items-center gap-1 text-sm hover:text-blue-200 transition-colors min-h-[44px] px-2"
            >
              <LogOut size={16} />
              <span>로그아웃</span>
            </button>
          </div>
        </div>
      </div>

      {/* iCal 구독 안내 모달 */}
      {showIcalInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-background text-foreground rounded-xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-lg font-bold">캘린더 구독</h3>
            <p className="text-sm text-muted-foreground">
              아래 URL을 복사해서 Google 캘린더, Apple 캘린더 등에서 &quot;URL로 구독 추가&quot; 하세요.
            </p>
            <div className="bg-secondary text-secondary-foreground p-3 rounded-lg text-xs break-all font-mono">
              {typeof window !== 'undefined' && `${window.location.origin}/api/ical`}
            </div>
            <div className="flex gap-2">
              <button
                onClick={copyIcalUrl}
                className="flex-1 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600"
              >
                URL 복사
              </button>
              <button
                onClick={() => setShowIcalInfo(false)}
                className="flex-1 py-2 border border-border rounded-lg font-medium hover:bg-muted"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

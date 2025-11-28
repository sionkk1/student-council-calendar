'use client';

import { LogOut, Shield, Calendar, Share2 } from 'lucide-react';
import { useState } from 'react';

interface AdminBarProps {
  onLogout: () => void;
}

export default function AdminBar({ onLogout }: AdminBarProps) {
  const [showIcalInfo, setShowIcalInfo] = useState(false);

  const handleShare = async () => {
    const icalUrl = `${window.location.origin}/api/ical`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: '학생자치회 일정 구독',
          text: '캘린더 앱에서 이 URL을 구독하세요',
          url: icalUrl,
        });
      } catch (err) {
        setShowIcalInfo(true);
      }
    } else {
      setShowIcalInfo(true);
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
      <div className="bg-blue-600 text-white px-4 py-2">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
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
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-lg font-bold">캘린더 구독</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              아래 URL을 복사해서 Google 캘린더, Apple 캘린더 등에서 "URL로 구독 추가" 하세요.
            </p>
            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg text-xs break-all font-mono">
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
                className="flex-1 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
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

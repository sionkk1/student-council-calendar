'use client';

import { LogOut, Shield } from 'lucide-react';

interface AdminBarProps {
  onLogout: () => void;
}

export default function AdminBar({ onLogout }: AdminBarProps) {
  return (
    <div className="bg-blue-600 text-white px-4 py-2">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <Shield size={16} />
          <span>관리자 모드</span>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-1 text-sm hover:text-blue-200 transition-colors min-h-[44px] px-2"
        >
          <LogOut size={16} />
          <span>로그아웃</span>
        </button>
      </div>
    </div>
  );
}

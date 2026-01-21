'use client';

import { useState, useEffect } from 'react';
import { X, Megaphone, Edit } from 'lucide-react';

interface Announcement {
  id: string;
  content: string;
  created_at: string;
}

interface AnnouncementBannerProps {
  isAdmin?: boolean;
}

export default function AnnouncementBanner({ isAdmin }: AnnouncementBannerProps) {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetchAnnouncement();
  }, []);

  const fetchAnnouncement = async () => {
    try {
      const res = await fetch('/api/announcement');
      if (res.ok) {
        const data = await res.json();
        setAnnouncement(data);
        setEditContent(data?.content || '');
      }
    } catch (error) {
      console.error('Failed to fetch announcement:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editContent.trim()) {
      await handleDelete();
      return;
    }

    try {
      const res = await fetch('/api/announcement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setAnnouncement(data);
        setIsEditing(false);
        setDismissed(false);
      }
    } catch {
      alert('저장에 실패했습니다.');
    }
  };

  const handleDelete = async () => {
    try {
      await fetch('/api/announcement', { method: 'DELETE' });
      setAnnouncement(null);
      setEditContent('');
      setIsEditing(false);
    } catch {
      alert('삭제에 실패했습니다.');
    }
  };

  if (isLoading) return null;

  if (isEditing && isAdmin) {
    return (
      <div className="bg-yellow-50 border-b border-yellow-200 p-4 dark:bg-yellow-900/30 dark:border-yellow-800">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-2 text-yellow-800 dark:text-yellow-100">
            <Megaphone size={18} />
            <span className="font-medium">공지 작성</span>
          </div>
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            placeholder="공지 내용을 입력하세요.."
            className="w-full p-3 border border-yellow-300 rounded-lg resize-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none bg-white text-gray-900 dark:bg-yellow-950/40 dark:border-yellow-800 dark:text-yellow-50"
            rows={2}
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600"
            >
              저장
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setEditContent(announcement?.content || '');
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:border-yellow-700 dark:text-yellow-100 dark:hover:bg-yellow-900/40"
            >
              취소
            </button>
            {announcement && (
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg font-medium ml-auto dark:hover:bg-red-500/10"
              >
                삭제
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!announcement && isAdmin) {
    return (
      <div className="bg-white border-b border-gray-200 p-2 dark:bg-slate-950/30 dark:border-white/10">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 px-2 py-1 dark:text-slate-300 dark:hover:text-white"
          >
            <Megaphone size={16} />
            <span>공지 작성하기</span>
          </button>
        </div>
      </div>
    );
  }

  if (!announcement) return null;

  if (dismissed) {
    return (
      <div className="bg-yellow-50 border-b border-yellow-200 py-2 px-4 dark:bg-yellow-900/30 dark:border-yellow-800">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <span className="text-xs text-yellow-800 dark:text-yellow-100">
            공지가 숨겨졌습니다.
          </span>
          <button
            onClick={() => setDismissed(false)}
            className="text-xs font-semibold px-2 py-1 rounded-full bg-yellow-100/80 text-yellow-900 hover:bg-yellow-200 dark:bg-yellow-800/50 dark:text-yellow-100 dark:hover:bg-yellow-700/60"
          >
            공지 다시 보기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-yellow-50 border-b border-yellow-200 py-3 px-4 dark:bg-yellow-900/30 dark:border-yellow-800">
      <div className="max-w-4xl mx-auto flex items-start gap-3">
        <Megaphone size={18} className="text-yellow-600 mt-0.5 flex-shrink-0 dark:text-yellow-300" />
        <p className="flex-1 text-sm text-yellow-800 whitespace-pre-wrap dark:text-yellow-100">
          {announcement.content}
        </p>
        <div className="flex items-center gap-1 flex-shrink-0">
          {isAdmin && (
            <button
              onClick={() => setIsEditing(true)}
              className="p-1.5 hover:bg-yellow-100 rounded-full text-yellow-600 dark:text-yellow-200 dark:hover:bg-yellow-800/50"
              title="수정"
            >
              <Edit size={16} />
            </button>
          )}
          <button
            onClick={() => setDismissed(true)}
            className="p-1.5 hover:bg-yellow-100 rounded-full text-yellow-600 dark:text-yellow-200 dark:hover:bg-yellow-800/50"
            title="닫기"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

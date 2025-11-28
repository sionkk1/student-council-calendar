'use client';

import { useState, useEffect } from 'react';
import { X, Megaphone, Edit, Trash2 } from 'lucide-react';

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
      // 빈 내용이면 삭제
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
    } catch (error) {
      alert('저장에 실패했습니다.');
    }
  };

  const handleDelete = async () => {
    try {
      await fetch('/api/announcement', { method: 'DELETE' });
      setAnnouncement(null);
      setEditContent('');
      setIsEditing(false);
    } catch (error) {
      alert('삭제에 실패했습니다.');
    }
  };

  if (isLoading) return null;

  // 관리자 편집 모드
  if (isEditing && isAdmin) {
    return (
      <div className="bg-yellow-50 border-b border-yellow-200 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <Megaphone size={18} className="text-yellow-600" />
            <span className="font-medium text-yellow-800">공지 작성</span>
          </div>
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            placeholder="공지 내용을 입력하세요..."
            className="w-full p-3 border border-yellow-300 rounded-lg resize-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none"
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
              className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
            >
              취소
            </button>
            {announcement && (
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg font-medium ml-auto"
              >
                삭제
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 공지가 없고 관리자인 경우 - 작성 버튼 표시
  if (!announcement && isAdmin) {
    return (
      <div className="bg-gray-50 border-b border-gray-200 p-2">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 px-2 py-1"
          >
            <Megaphone size={16} />
            <span>공지 작성하기</span>
          </button>
        </div>
      </div>
    );
  }

  // 공지가 없으면 표시 안함
  if (!announcement || dismissed) return null;

  // 공지 표시
  return (
    <div className="bg-yellow-50 border-b border-yellow-200 py-3 px-4">
      <div className="max-w-4xl mx-auto flex items-start gap-3">
        <Megaphone size={18} className="text-yellow-600 mt-0.5 flex-shrink-0" />
        <p className="flex-1 text-sm text-yellow-800 whitespace-pre-wrap">
          {announcement.content}
        </p>
        <div className="flex items-center gap-1 flex-shrink-0">
          {isAdmin && (
            <button
              onClick={() => setIsEditing(true)}
              className="p-1.5 hover:bg-yellow-100 rounded-full text-yellow-600"
              title="수정"
            >
              <Edit size={16} />
            </button>
          )}
          <button
            onClick={() => setDismissed(true)}
            className="p-1.5 hover:bg-yellow-100 rounded-full text-yellow-600"
            title="닫기"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

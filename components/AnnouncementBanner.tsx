'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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

  // 드래그: ref 기반 직접 DOM 조작 (React 상태 의존성 제거)
  const fabRef = useRef<HTMLButtonElement>(null);
  const posRef = useRef({ x: -1, y: 80, startX: 0, startY: 0, moved: 0, dragging: false });
  const [isDragging, setIsDragging] = useState(false);

  // 초기 위치 + 리사이즈 시 화면 안에 유지
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const clampToViewport = () => {
      const maxX = window.innerWidth - 52;
      const maxY = window.innerHeight - 52;
      if (posRef.current.x === -1) {
        // 초기 위치: 오른쪽에서 16px 여백
        posRef.current.x = Math.max(8, window.innerWidth - 60);
      } else {
        // 리사이즈 시 화면 밖이면 안쪽으로
        posRef.current.x = Math.max(0, Math.min(posRef.current.x, maxX));
        posRef.current.y = Math.max(0, Math.min(posRef.current.y, maxY));
      }
      if (fabRef.current) {
        fabRef.current.style.transform = `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0)`;
      }
    };

    clampToViewport();
    window.addEventListener('resize', clampToViewport);
    return () => window.removeEventListener('resize', clampToViewport);
  }, [dismissed]);

  const updateFabTransform = useCallback(() => {
    if (fabRef.current) {
      fabRef.current.style.transform = `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0)`;
    }
  }, []);

  // 마우스 이벤트
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const p = posRef.current;
    p.startX = e.clientX - p.x;
    p.startY = e.clientY - p.y;
    p.moved = 0;
    p.dragging = true;
    setIsDragging(true);

    const onMove = (ev: MouseEvent) => {
      if (!posRef.current.dragging) return;
      const nx = Math.max(0, Math.min(ev.clientX - posRef.current.startX, window.innerWidth - 52));
      const ny = Math.max(0, Math.min(ev.clientY - posRef.current.startY, window.innerHeight - 52));
      posRef.current.moved += Math.abs(nx - posRef.current.x) + Math.abs(ny - posRef.current.y);
      posRef.current.x = nx;
      posRef.current.y = ny;
      updateFabTransform();
    };
    const onUp = () => {
      posRef.current.dragging = false;
      setIsDragging(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [updateFabTransform]);

  // 터치 이벤트
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    const p = posRef.current;
    p.startX = t.clientX - p.x;
    p.startY = t.clientY - p.y;
    p.moved = 0;
    p.dragging = true;
    setIsDragging(true);

    const onMove = (ev: TouchEvent) => {
      ev.preventDefault();
      if (!posRef.current.dragging) return;
      const nx = Math.max(0, Math.min(ev.touches[0].clientX - posRef.current.startX, window.innerWidth - 52));
      const ny = Math.max(0, Math.min(ev.touches[0].clientY - posRef.current.startY, window.innerHeight - 52));
      posRef.current.moved += Math.abs(nx - posRef.current.x) + Math.abs(ny - posRef.current.y);
      posRef.current.x = nx;
      posRef.current.y = ny;
      updateFabTransform();
    };
    const onUp = () => {
      posRef.current.dragging = false;
      setIsDragging(false);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
  }, [updateFabTransform]);

  // 클릭 (드래그 아닐 때만)
  const handleFabClick = useCallback(() => {
    if (posRef.current.moved <= 5) {
      setDismissed(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

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
      <div className="bg-yellow-50 border-b border-yellow-200 py-4 dark:bg-yellow-900/30 dark:border-yellow-800">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center gap-2 mb-2 text-yellow-800 dark:text-yellow-100">
            <Megaphone size={30} />
            <span className="font-medium">공지 작성</span>
          </div>
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            placeholder="공지 내용을 입력하세요.."
            className="w-full p-3 border border-yellow-300 rounded-lg resize-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none bg-background text-foreground dark:bg-yellow-950/40 dark:border-yellow-800 dark:text-yellow-50"
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
              className="px-4 py-2 border border-border rounded-lg font-medium hover:bg-muted dark:border-yellow-700 dark:text-yellow-100 dark:hover:bg-yellow-900/40"
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
      <div className="bg-background border-b border-border py-2 dark:bg-slate-950/30 dark:border-white/10">
        <div className="max-w-5xl mx-auto px-4">
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground py-1 dark:text-slate-300 dark:hover:text-white"
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
      <button
        ref={fabRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onClick={handleFabClick}
        className={`fixed z-40 p-3 bg-amber-500 text-white rounded-full shadow-lg cursor-grab active:cursor-grabbing ${isDragging ? '' : 'hover:brightness-110 transition-[filter] duration-200'}`}
        style={{ left: 0, top: 0, transform: `translate3d(${typeof window !== 'undefined' ? (posRef.current.x === -1 ? window.innerWidth - 64 : posRef.current.x) : 0}px, ${posRef.current.y}px, 0)`, touchAction: 'none', willChange: isDragging ? 'transform' : 'auto' }}
        title="공지 다시 보기 (드래그로 이동 가능)"
      >
        <div className="relative">
          <Megaphone size={22} />
          <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-red-500 rounded-full animate-pulse border-2 border-amber-500" />
        </div>
      </button>
    );
  }

  return (
    <div className="sticky top-[93px] z-10 relative overflow-hidden animate-in slide-in-from-top-2 duration-500 ease-out">
      {/* 그라데이션 배경 + 왼쪽 강조 보더 */}
      <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 border-b border-amber-200 border-l-4 border-l-amber-500 py-3.5 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-yellow-950/30 dark:border-amber-700 dark:border-l-amber-400">
        <div className="max-w-5xl mx-auto px-4 flex items-start gap-3">
          {/* 아이콘 + 펄스 점 */}
          <div className="relative flex-shrink-0 mt-0.5">
            <Megaphone size={20} className="text-amber-600 dark:text-amber-300" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
          </div>
          {/* 공지 내용 */}
          <div className="flex-1 min-w-0">
            <span className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">공지사항</span>
            <p className="text-base text-amber-900 whitespace-pre-wrap mt-0.5 leading-relaxed font-medium dark:text-amber-50">
              {announcement.content}
            </p>
          </div>
          {/* 액션 버튼 */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {isAdmin && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-1.5 hover:bg-amber-200/60 rounded-full text-amber-600 transition-colors dark:text-amber-200 dark:hover:bg-amber-800/50"
                title="수정"
              >
                <Edit size={16} />
              </button>
            )}
            <button
              onClick={() => setDismissed(true)}
              className="p-1.5 hover:bg-amber-200/60 rounded-full text-amber-600 transition-colors dark:text-amber-200 dark:hover:bg-amber-800/50"
              title="닫기"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

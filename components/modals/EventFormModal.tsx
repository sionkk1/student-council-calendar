'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Event } from '@/types';
import { format } from 'date-fns';

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event | null; // null = 새 일정 생성
  selectedDate: Date;
  onSubmit: (eventData: Omit<Event, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
}

const CATEGORIES = ['회의', '행사', '공지', '학교', '기타'];
const COLORS = [
  { name: '파랑', value: '#3b82f6' },
  { name: '빨강', value: '#ef4444' },
  { name: '초록', value: '#22c55e' },
  { name: '노랑', value: '#eab308' },
  { name: '보라', value: '#a855f7' },
];

export default function EventFormModal({
  isOpen,
  onClose,
  event,
  selectedDate,
  onSubmit,
}: EventFormModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isAllDay, setIsAllDay] = useState(false);
  const [category, setCategory] = useState('');
  const [colorTag, setColorTag] = useState('#3b82f6');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 폼 초기화
  useEffect(() => {
    if (isOpen) {
      if (event) {
        // 수정 모드
        setTitle(event.title);
        setDescription(event.description || '');
        setStartDate(format(new Date(event.start_time), 'yyyy-MM-dd'));
        setStartTime(format(new Date(event.start_time), 'HH:mm'));
        setEndTime(event.end_time ? format(new Date(event.end_time), 'HH:mm') : '');
        setIsAllDay(event.is_all_day);
        setCategory(event.category || '');
        setColorTag(event.color_tag || '#3b82f6');
      } else {
        // 생성 모드
        setTitle('');
        setDescription('');
        setStartDate(format(selectedDate, 'yyyy-MM-dd'));
        setStartTime('09:00');
        setEndTime('10:00');
        setIsAllDay(false);
        setCategory('');
        setColorTag('#3b82f6');
      }
    }
  }, [isOpen, event, selectedDate]);

  // 모달 열릴 때 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      const startDateTime = isAllDay
        ? new Date(`${startDate}T00:00:00`)
        : new Date(`${startDate}T${startTime}`);
      
      const endDateTime = endTime && !isAllDay
        ? new Date(`${startDate}T${endTime}`)
        : undefined;

      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime?.toISOString(),
        is_all_day: isAllDay,
        category: category || undefined,
        color_tag: colorTag,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      {/* 모바일: 전체 화면 */}
      <div className="md:hidden fixed inset-0 bg-white z-50 overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-4 py-3 flex justify-between items-center">
          <button onClick={onClose} className="p-2 -ml-2">
            <X size={24} />
          </button>
          <h2 className="text-lg font-semibold">
            {event ? '일정 수정' : '새 일정'}
          </h2>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !title.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '저장 중...' : '저장'}
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-6">
          <FormContent
            title={title}
            setTitle={setTitle}
            description={description}
            setDescription={setDescription}
            startDate={startDate}
            setStartDate={setStartDate}
            startTime={startTime}
            setStartTime={setStartTime}
            endTime={endTime}
            setEndTime={setEndTime}
            isAllDay={isAllDay}
            setIsAllDay={setIsAllDay}
            category={category}
            setCategory={setCategory}
            colorTag={colorTag}
            setColorTag={setColorTag}
          />
        </form>
      </div>

      {/* 데스크탑: 중앙 모달 */}
      <div className="hidden md:block bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto z-50">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            {event ? '일정 수정' : '새 일정'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <FormContent
            title={title}
            setTitle={setTitle}
            description={description}
            setDescription={setDescription}
            startDate={startDate}
            setStartDate={setStartDate}
            startTime={startTime}
            setStartTime={setStartTime}
            endTime={endTime}
            setEndTime={setEndTime}
            isAllDay={isAllDay}
            setIsAllDay={setIsAllDay}
            category={category}
            setCategory={setCategory}
            colorTag={colorTag}
            setColorTag={setColorTag}
          />
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="flex-1 py-3 bg-blue-500 text-white rounded-lg font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
            >
              {isSubmitting ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface FormContentProps {
  title: string;
  setTitle: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  startDate: string;
  setStartDate: (v: string) => void;
  startTime: string;
  setStartTime: (v: string) => void;
  endTime: string;
  setEndTime: (v: string) => void;
  isAllDay: boolean;
  setIsAllDay: (v: boolean) => void;
  category: string;
  setCategory: (v: string) => void;
  colorTag: string;
  setColorTag: (v: string) => void;
}

function FormContent({
  title, setTitle,
  description, setDescription,
  startDate, setStartDate,
  startTime, setStartTime,
  endTime, setEndTime,
  isAllDay, setIsAllDay,
  category, setCategory,
  colorTag, setColorTag,
}: FormContentProps) {
  return (
    <>
      {/* 제목 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          제목 *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="일정 제목을 입력하세요"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          required
        />
      </div>

      {/* 날짜 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          날짜
        </label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      </div>

      {/* 종일 일정 */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="isAllDay"
          checked={isAllDay}
          onChange={(e) => setIsAllDay(e.target.checked)}
          className="w-5 h-5 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
        />
        <label htmlFor="isAllDay" className="text-sm font-medium text-gray-700">
          종일 일정
        </label>
      </div>

      {/* 시간 */}
      {!isAllDay && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              시작 시간
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              종료 시간
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
        </div>
      )}

      {/* 카테고리 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          카테고리
        </label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat === category ? '' : cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors min-h-[44px] ${
                category === cat
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 색상 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          색상
        </label>
        <div className="flex gap-3">
          {COLORS.map((color) => (
            <button
              key={color.value}
              type="button"
              onClick={() => setColorTag(color.value)}
              className={`w-10 h-10 rounded-full border-2 transition-transform ${
                colorTag === color.value
                  ? 'border-gray-800 scale-110'
                  : 'border-transparent hover:scale-105'
              }`}
              style={{ backgroundColor: color.value }}
              title={color.name}
            />
          ))}
        </div>
      </div>

      {/* 설명 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          설명
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="일정에 대한 설명을 입력하세요"
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
        />
      </div>
    </>
  );
}

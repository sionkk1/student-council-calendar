'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Event } from '@/types';
import { CATEGORIES, DEPARTMENTS, DEFAULT_EVENT_COLOR, EVENT_COLORS } from '@/constants';
import { addDays, addMonths, addWeeks, format, isBefore, isEqual } from 'date-fns';
import type { DateRange } from 'react-day-picker';

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event | null; // null = 새 일정 생성
  selectedDate: Date;
  selectedRange?: DateRange | null;
  onSubmit: (eventData: Omit<Event, 'id' | 'created_at' | 'updated_at'> | Omit<Event, 'id' | 'created_at' | 'updated_at'>[]) => Promise<void>;
}


type RepeatMode = 'none' | 'daily' | 'weekly' | 'monthly';

export default function EventFormModal({
  isOpen,
  onClose,
  event,
  selectedDate,
  selectedRange,
  onSubmit,
}: EventFormModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isAllDay, setIsAllDay] = useState(false);
  const [category, setCategory] = useState('');
  const [departments, setDepartments] = useState<string[]>([]);
  const [colorTag, setColorTag] = useState<string>(DEFAULT_EVENT_COLOR);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('none');
  const [repeatUntil, setRepeatUntil] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (event) {
      const start = new Date(event.start_time);
      const end = event.end_time ? new Date(event.end_time) : null;
      setTitle(event.title);
      setDescription(event.description || '');
      setStartDate(format(start, 'yyyy-MM-dd'));
      setStartTime(format(start, 'HH:mm'));
      setIsAllDay(event.is_all_day);
      if (end) {
        const endDateValue = event.is_all_day ? addDays(end, -1) : end;
        setEndDate(format(endDateValue, 'yyyy-MM-dd'));
        setEndTime(format(end, 'HH:mm'));
      } else {
        setEndDate(format(start, 'yyyy-MM-dd'));
        setEndTime('');
      }
      setCategory(event.category || '');
      setDepartments(event.departments || []);
      setColorTag(event.color_tag || DEFAULT_EVENT_COLOR);
      setRepeatMode('none');
      setRepeatUntil('');
    } else {
      const baseDate = selectedRange?.from ?? selectedDate;
      const baseEnd = selectedRange?.to ?? selectedDate;
      setTitle('');
      setDescription('');
      setStartDate(format(baseDate, 'yyyy-MM-dd'));
      setEndDate(format(baseEnd, 'yyyy-MM-dd'));
      setStartTime('09:00');
      setEndTime('10:00');
      setIsAllDay(Boolean(selectedRange));
      setCategory('');
      setDepartments([]);
      setColorTag(DEFAULT_EVENT_COLOR);
      setRepeatMode('none');
      setRepeatUntil(format(baseDate, 'yyyy-MM-dd'));
    }
  }, [isOpen, event, selectedDate, selectedRange]);

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

    const rawEndDate = endDate || startDate;
    const safeEndDate = (isBefore(new Date(rawEndDate), new Date(startDate)) || isEqual(new Date(rawEndDate), new Date(startDate)))
      ? startDate
      : rawEndDate;

    const startDateTime = isAllDay
      ? new Date(`${startDate}T00:00:00`)
      : new Date(`${startDate}T${startTime}`);

    let endDateTime: Date | undefined;
    if (isAllDay) {
      if (safeEndDate && safeEndDate !== startDate) {
        endDateTime = addDays(new Date(`${safeEndDate}T00:00:00`), 1);
      }
    } else if (endTime) {
      const endDateValue = safeEndDate || startDate;
      endDateTime = new Date(`${endDateValue}T${endTime}`);
    }

    const baseEvent: Omit<Event, 'id' | 'created_at' | 'updated_at'> = {
      title: title.trim(),
      description: description.trim() || undefined,
      start_time: startDateTime.toISOString(),
      end_time: endDateTime?.toISOString(),
      is_all_day: isAllDay,
      category: category || undefined,
      departments: departments.length > 0 ? departments : undefined,
      color_tag: colorTag,
    };

    setIsSubmitting(true);
    try {
      if (!event && repeatMode !== 'none' && repeatUntil) {
        const repeatEnd = new Date(`${repeatUntil}T23:59:59`);
        const occurrences: Omit<Event, 'id' | 'created_at' | 'updated_at'>[] = [];
        const durationMs = endDateTime ? endDateTime.getTime() - startDateTime.getTime() : null;

        let cursor = startDateTime;
        while (cursor <= repeatEnd) {
          const nextEnd = durationMs ? new Date(cursor.getTime() + durationMs) : undefined;
          occurrences.push({
            ...baseEvent,
            start_time: cursor.toISOString(),
            end_time: nextEnd?.toISOString(),
          });

          if (repeatMode === 'daily') {
            cursor = addDays(cursor, 1);
          } else if (repeatMode === 'weekly') {
            cursor = addWeeks(cursor, 1);
          } else {
            cursor = addMonths(cursor, 1);
          }
        }

        await onSubmit(occurrences);
      } else {
        await onSubmit(baseEvent);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      <div className="md:hidden fixed inset-0 bg-white dark:bg-gray-900 z-50 overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-4 py-3 flex justify-between items-center">
          <button onClick={onClose} className="p-2 -ml-2 dark:text-white">
            <X size={24} />
          </button>
          <h2 className="text-lg font-semibold dark:text-white">{event ? '일정 수정' : '새 일정'}</h2>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !title.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
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
            endDate={endDate}
            setEndDate={setEndDate}
            startTime={startTime}
            setStartTime={setStartTime}
            endTime={endTime}
            setEndTime={setEndTime}
            isAllDay={isAllDay}
            setIsAllDay={setIsAllDay}
            category={category}
            setCategory={setCategory}
            departments={departments}
            setDepartments={setDepartments}
            colorTag={colorTag}
            setColorTag={setColorTag}
            repeatMode={repeatMode}
            setRepeatMode={setRepeatMode}
            repeatUntil={repeatUntil}
            setRepeatUntil={setRepeatUntil}
            disableRepeat={Boolean(event)}
          />
        </form>
      </div>

      <div className="hidden md:block bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto z-50">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold dark:text-white">{event ? '일정 수정' : '새 일정'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full dark:text-white">
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
            endDate={endDate}
            setEndDate={setEndDate}
            startTime={startTime}
            setStartTime={setStartTime}
            endTime={endTime}
            setEndTime={setEndTime}
            isAllDay={isAllDay}
            setIsAllDay={setIsAllDay}
            category={category}
            setCategory={setCategory}
            departments={departments}
            setDepartments={setDepartments}
            colorTag={colorTag}
            setColorTag={setColorTag}
            repeatMode={repeatMode}
            setRepeatMode={setRepeatMode}
            repeatUntil={repeatUntil}
            setRepeatUntil={setRepeatUntil}
            disableRepeat={Boolean(event)}
          />
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-gray-300 dark:border-gray-600 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors dark:text-white"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="flex-1 py-3 bg-blue-500 text-white rounded-lg font-medium disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
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
  endDate: string;
  setEndDate: (v: string) => void;
  startTime: string;
  setStartTime: (v: string) => void;
  endTime: string;
  setEndTime: (v: string) => void;
  isAllDay: boolean;
  setIsAllDay: (v: boolean) => void;
  category: string;
  setCategory: (v: string) => void;
  departments: string[];
  setDepartments: (v: string[]) => void;
  colorTag: string;
  setColorTag: (v: string) => void;
  repeatMode: RepeatMode;
  setRepeatMode: (v: RepeatMode) => void;
  repeatUntil: string;
  setRepeatUntil: (v: string) => void;
  disableRepeat?: boolean;
}

function FormContent({
  title, setTitle,
  description, setDescription,
  startDate, setStartDate,
  endDate, setEndDate,
  startTime, setStartTime,
  endTime, setEndTime,
  isAllDay, setIsAllDay,
  category, setCategory,
  departments, setDepartments,
  colorTag, setColorTag,
  repeatMode, setRepeatMode,
  repeatUntil, setRepeatUntil,
  disableRepeat,
}: FormContentProps) {
  const toggleDepartment = (dept: string) => {
    if (departments.includes(dept)) {
      setDepartments(departments.filter(d => d !== dept));
    } else {
      setDepartments([...departments, dept]);
    }
  };

  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">제목 *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="일정 제목을 입력하세요"
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-700 dark:text-white"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">시작 날짜</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">종료 날짜</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="isAllDay"
          checked={isAllDay}
          onChange={(e) => setIsAllDay(e.target.checked)}
          className="w-5 h-5 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
        />
        <label htmlFor="isAllDay" className="text-sm font-medium text-gray-700 dark:text-gray-300">종일 일정</label>
      </div>

      {!isAllDay && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">시작 시간</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">종료 시간</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">반복</label>
        <div className="grid grid-cols-2 gap-3">
          <select
            value={repeatMode}
            onChange={(e) => setRepeatMode(e.target.value as RepeatMode)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white"
            disabled={disableRepeat}
          >
            <option value="none">반복 없음</option>
            <option value="daily">매일</option>
            <option value="weekly">매주</option>
            <option value="monthly">매월</option>
          </select>
          <input
            type="date"
            value={repeatUntil}
            onChange={(e) => setRepeatUntil(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white"
            disabled={disableRepeat || repeatMode === 'none'}
          />
        </div>
        {disableRepeat && (
          <p className="text-xs text-muted-foreground mt-2">수정 모드에서는 반복 일정을 변경할 수 없습니다.</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">카테고리</label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat === category ? '' : cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors min-h-[44px] ${category === cat
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">부서 (복수 선택)</label>
        <div className="flex flex-wrap gap-2">
          {DEPARTMENTS.map((dept) => (
            <button
              key={dept}
              type="button"
              onClick={() => toggleDepartment(dept)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors min-h-[36px] ${departments.includes(dept)
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                }`}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">색상</label>
        <div className="flex gap-3">
          {EVENT_COLORS.map((color) => (
            <button
              key={color.value}
              type="button"
              onClick={() => setColorTag(color.value)}
              className={`w-10 h-10 rounded-full border-2 transition-transform ${colorTag === color.value
                  ? 'border-gray-800 dark:border-white scale-110'
                  : 'border-transparent hover:scale-105'
                }`}
              style={{ backgroundColor: color.value }}
              title={color.name}
            />
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">설명</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="일정 설명을 입력하세요"
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none bg-white dark:bg-gray-700 dark:text-white"
        />
      </div>
    </>
  );
}

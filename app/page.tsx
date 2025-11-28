'use client';

import { useState, useMemo } from 'react';
import CalendarGrid from '@/components/calendar/CalendarGrid';
import EventModal from '@/components/modals/EventModal';
import EventFormModal from '@/components/modals/EventFormModal';
import EnigmaInput from '@/components/admin/EnigmaInput';
import AdminBar from '@/components/admin/AdminBar';
import EventCard from '@/components/calendar/EventCard';
import { MultiSelectFilter } from '@/components/calendar/CategoryFilter';
import AnnouncementBanner from '@/components/AnnouncementBanner';
import { useAdmin } from '@/hooks/useAdmin';
import { useEvents } from '@/hooks/useEvents';
import { Event } from '@/types';
import { Plus } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

// 카테고리 목록 (전체 제외)
const CATEGORIES = ['회의', '행사', '공지', '학교', '기타'];
const DEPARTMENTS = ['회장단', '자치기획실', '문화체육부', '창의진로부', '언론정보부', '소통홍보부', '환경복지부', '생활인권부'];

// 인라인 스켈레톤 컴포넌트
function EventSkeleton() {
  return (
    <div className="animate-pulse bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-start gap-3">
        <div className="w-1 h-12 bg-gray-200 dark:bg-gray-600 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4" />
          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2" />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);

  const { isAdmin, isLoading: isAdminLoading, login, logout } = useAdmin();
  const { events, isLoading: isEventsLoading, createEvent, updateEvent, deleteEvent } = useEvents(currentMonth);

  const toggleCategory = (cat: string) => {
    if (selectedCategories.includes(cat)) {
      setSelectedCategories(selectedCategories.filter(c => c !== cat));
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  const toggleDepartment = (dept: string) => {
    if (selectedDepartments.includes(dept)) {
      setSelectedDepartments(selectedDepartments.filter(d => d !== dept));
    } else {
      setSelectedDepartments([...selectedDepartments, dept]);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setIsViewModalOpen(true);
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setIsViewModalOpen(false);
    setIsFormModalOpen(true);
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (confirm('정말 이 일정을 삭제하시겠습니까?')) {
      const result = await deleteEvent(eventId);
      if (result.success) {
        setIsViewModalOpen(false);
        setSelectedEvent(null);
      } else {
        alert(result.error || '삭제에 실패했습니다.');
      }
    }
  };

  const handleCreateEvent = () => {
    setEditingEvent(null);
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = async (eventData: Omit<Event, 'id' | 'created_at' | 'updated_at'>) => {
    if (editingEvent) {
      const result = await updateEvent(editingEvent.id, eventData);
      if (result.success) {
        setIsFormModalOpen(false);
        setEditingEvent(null);
      } else {
        alert(result.error || '수정에 실패했습니다.');
      }
    } else {
      const result = await createEvent(eventData);
      if (result.success) {
        setIsFormModalOpen(false);
      } else {
        alert(result.error || '생성에 실패했습니다.');
      }
    }
  };

  const handleAdminVerify = async (code: string): Promise<boolean> => {
    const result = await login(code);
    return result.success;
  };

  // 선택된 날짜의 일정 필터링 (카테고리 + 부서 다중 선택)
  const selectedDateEvents = useMemo(() => {
    return events.filter(event => {
      const eventDate = new Date(event.start_time);
      const dateMatch = eventDate.toDateString() === selectedDate.toDateString();

      // 카테고리 필터: 선택된 것이 없으면 전체, 있으면 해당 카테고리만
      const categoryMatch = selectedCategories.length === 0 ||
        (event.category && selectedCategories.includes(event.category));

      // 부서 필터: 선택된 것이 없으면 전체, 있으면 교집합 확인
      const departmentMatch = selectedDepartments.length === 0 ||
        (event.departments && event.departments.some(d => selectedDepartments.includes(d)));

      return dateMatch && categoryMatch && departmentMatch;
    });
  }, [events, selectedDate, selectedCategories, selectedDepartments]);

  // 캘린더에 표시할 이벤트 (카테고리 + 부서 필터 적용)
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const categoryMatch = selectedCategories.length === 0 ||
        (event.category && selectedCategories.includes(event.category));
      const departmentMatch = selectedDepartments.length === 0 ||
        (event.departments && event.departments.some(d => selectedDepartments.includes(d)));
      return categoryMatch && departmentMatch;
    });
  }, [events, selectedCategories, selectedDepartments]);

  return (
    <main className="min-h-screen bg-white dark:bg-gray-900 pb-20">
      <header className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="w-10" /> {/* 균형을 위한 빈 공간 */}
          <h1 className="text-lg font-bold text-center flex-1 dark:text-white">학생자치회 일정</h1>
          <ThemeToggle />
        </div>
      </header>

      {/* 관리자 상태 바 */}
      {isAdmin && <AdminBar onLogout={logout} />}

      {/* 공지 배너 */}
      <AnnouncementBanner isAdmin={isAdmin} />

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <CalendarGrid
          events={filteredEvents}
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
          onMonthChange={setCurrentMonth}
        />

        {/* 카테고리 필터 (다중 선택) */}
        <MultiSelectFilter
          label="카테고리"
          options={CATEGORIES}
          selected={selectedCategories}
          onToggle={toggleCategory}
          onClear={() => setSelectedCategories([])}
        />

        {/* 부서 필터 (다중 선택) */}
        <MultiSelectFilter
          label="부서"
          options={DEPARTMENTS}
          selected={selectedDepartments}
          onToggle={toggleDepartment}
          onClear={() => setSelectedDepartments([])}
        />

        {/* 선택된 날짜의 일정 목록 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-lg font-semibold dark:text-white">
              {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일 일정
            </h2>
            {isAdmin && (
              <button
                onClick={handleCreateEvent}
                className="flex items-center gap-1 px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors min-h-[44px]"
              >
                <Plus size={16} />
                일정 추가
              </button>
            )}
          </div>

          {isEventsLoading ? (
            <div className="space-y-3">
              <EventSkeleton />
              <EventSkeleton />
            </div>
          ) : selectedDateEvents.length > 0 ? (
            <div className="grid gap-3">
              {selectedDateEvents.map(event => (
                <EventCard
                  key={event.id}
                  event={event}
                  onClick={() => handleEventClick(event)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-400 bg-white dark:bg-gray-800 rounded-xl border border-dashed dark:border-gray-700">
              일정이 없습니다.
            </div>
          )}
        </div>
      </div>

      {/* 일정 상세 모달 */}
      <EventModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        event={selectedEvent}
        isAdmin={isAdmin}
        onEdit={handleEditEvent}
        onDelete={handleDeleteEvent}
      />

      {/* 일정 생성/수정 폼 모달 */}
      <EventFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingEvent(null);
        }}
        event={editingEvent}
        selectedDate={selectedDate}
        onSubmit={handleFormSubmit}
      />

      {/* Enigma 입력 (항상 표시 - isAdmin이 false이고 로딩이 완료됐을 때) */}
      {!isAdmin && !isAdminLoading && <EnigmaInput onVerify={handleAdminVerify} />}
    </main>
  );
}

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
import { eventOccursOnDate, shiftEventToDate } from '@/lib/events';
import { Event } from '@/types';
import { Plus, Calendar as CalendarIcon, Filter } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import NotificationToggle from '@/components/notifications/NotificationToggle';
import { CATEGORIES, DEPARTMENTS } from '@/constants';

function EventSkeleton() {
  return (
    <div className="animate-pulse glass p-4 rounded-xl shadow-sm">
      <div className="flex items-start gap-3">
        <div className="w-1 h-12 bg-muted rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-3 bg-muted rounded w-1/2" />
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
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState<{ from: Date; to: Date } | null>(null);

  const { isAdmin, isLoading: isAdminLoading, login, logout } = useAdmin();
  const { events, isLoading: isEventsLoading, createEvent, createEvents, updateEvent, deleteEvent } = useEvents(currentMonth);

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
    setSelectedRange(null);
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
    setSelectedRange(null);
    setIsFormModalOpen(true);
  };

  const handleEventDrop = async (eventId: string, date: Date) => {
    if (!isAdmin) return;
    const targetEvent = events.find(e => e.id === eventId);
    if (!targetEvent || targetEvent.is_school_event) return;

    const updateData = shiftEventToDate(targetEvent, date);
    const result = await updateEvent(targetEvent.id, updateData);
    if (!result.success) {
      alert(result.error || '일정 이동에 실패했습니다.');
    } else {
      setSelectedDate(date);
    }
  };

  const handleRangeSelect = (range: { from: Date; to: Date }) => {
    if (!isAdmin) return;
    setEditingEvent(null);
    setSelectedRange(range);
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = async (eventData: Omit<Event, 'id' | 'created_at' | 'updated_at'> | Omit<Event, 'id' | 'created_at' | 'updated_at'>[]) => {
    if (Array.isArray(eventData)) {
      const result = await createEvents(eventData);
      if (result.success) {
        setIsFormModalOpen(false);
        setSelectedRange(null);
      } else {
        alert(result.error || '생성에 실패했습니다.');
      }
      return;
    }

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

  const selectedDateEvents = useMemo(() => {
    return events.filter(event => {
      const dateMatch = eventOccursOnDate(event, selectedDate);
      const categoryMatch = selectedCategories.length === 0 || (event.category && selectedCategories.includes(event.category));
      const departmentMatch = selectedDepartments.length === 0 || (event.departments && event.departments.some(d => selectedDepartments.includes(d)));
      return dateMatch && categoryMatch && departmentMatch;
    });
  }, [events, selectedDate, selectedCategories, selectedDepartments]);

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const categoryMatch = selectedCategories.length === 0 || (event.category && selectedCategories.includes(event.category));
      const departmentMatch = selectedDepartments.length === 0 || (event.departments && event.departments.some(d => selectedDepartments.includes(d)));
      return categoryMatch && departmentMatch;
    });
  }, [events, selectedCategories, selectedDepartments]);

  return (
    <main className="flex-1 pb-20">
      <header className="sticky top-0 z-20 glass border-b border-white/10 px-4 py-4 backdrop-blur-md transition-all duration-300">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-xl text-primary">
              <CalendarIcon size={20} />
            </div>
            <h1 className="text-xl font-bold text-foreground">학생자치 일정</h1>
          </div>
          <div className="flex items-center gap-2">
            <NotificationToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {isAdmin && <AdminBar onLogout={logout} />}

      <div className="max-w-5xl mx-auto px-4 mt-4">
        <AnnouncementBanner isAdmin={isAdmin} />
      </div>

      <div className="max-w-5xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
        <div className="lg:col-span-8 space-y-6">
          <div className="glass rounded-3xl p-6 shadow-lg border border-white/20">
            <CalendarGrid
              events={filteredEvents}
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
              onMonthChange={setCurrentMonth}
              isAdmin={isAdmin}
              onEventDrop={handleEventDrop}
              onRangeSelect={handleRangeSelect}
            />
          </div>

          <div className="lg:hidden">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="w-full flex items-center justify-center gap-2 p-3 glass rounded-xl font-medium text-foreground hover:bg-white/10 transition-colors"
            >
              <Filter size={18} />
              필터 {isFilterOpen ? '닫기' : '열기'}
            </button>
          </div>

          <div className={`space-y-6 transition-all duration-300 ${isFilterOpen ? 'block' : 'hidden lg:block'}`}>
            <div className="glass rounded-2xl p-5 space-y-4">
              <MultiSelectFilter
                label="카테고리"
                options={CATEGORIES}
                selected={selectedCategories}
                onToggle={toggleCategory}
                onClear={() => setSelectedCategories([])}
              />
              <div className="h-px bg-border/50" />
              <MultiSelectFilter
                label="부서"
                options={DEPARTMENTS}
                selected={selectedDepartments}
                onToggle={toggleDepartment}
                onClear={() => setSelectedDepartments([])}
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <span className="text-primary">{selectedDate.getDate()}일</span>
              <span className="text-muted-foreground text-base font-medium">
                {selectedDate.toLocaleString('ko-KR', { weekday: 'long' })}
              </span>
            </h2>
            {isAdmin && (
              <button
                onClick={handleCreateEvent}
                className="flex items-center gap-1 px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:opacity-90 transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-95"
              >
                <Plus size={16} />
                일정 추가
              </button>
            )}
          </div>

          <div className="space-y-3 min-h-[300px]">
            {isEventsLoading ? (
              <>
                <EventSkeleton />
                <EventSkeleton />
              </>
            ) : selectedDateEvents.length > 0 ? (
              <div className="grid gap-3">
                {selectedDateEvents.map((event, index) => (
                  <div
                    key={event.id}
                    className="animate-slide-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <EventCard
                      event={event}
                      onClick={() => handleEventClick(event)}
                      isDraggable={isAdmin && !event.is_school_event}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 glass rounded-2xl border border-dashed border-muted-foreground/30 text-muted-foreground">
                <CalendarIcon size={48} className="mb-4 opacity-20" />
                <p>등록된 일정이 없습니다.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <EventModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        event={selectedEvent}
        isAdmin={isAdmin}
        onEdit={handleEditEvent}
        onDelete={handleDeleteEvent}
      />

      <EventFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingEvent(null);
          setSelectedRange(null);
        }}
        event={editingEvent}
        selectedDate={selectedDate}
        selectedRange={selectedRange}
        onSubmit={handleFormSubmit}
      />

      {!isAdmin && !isAdminLoading && (
        <div className="fixed bottom-4 right-4 z-50">
          <EnigmaInput onVerify={handleAdminVerify} />
        </div>
      )}
    </main>
  );
}

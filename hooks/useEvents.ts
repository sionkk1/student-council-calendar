'use client';

import { useState, useEffect, useCallback } from 'react';
import { Event } from '@/types';
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';

interface UseEventsReturn {
  events: Event[];
  isLoading: boolean;
  error: string | null;
  createEvent: (event: Omit<Event, 'id' | 'created_at' | 'updated_at'>) => Promise<{ success: boolean; data?: Event; error?: string }>;
  updateEvent: (id: string, event: Partial<Event>) => Promise<{ success: boolean; data?: Event; error?: string }>;
  deleteEvent: (id: string) => Promise<{ success: boolean; error?: string }>;
  refetch: () => Promise<void>;
}

export function useEvents(month: Date = new Date()): UseEventsReturn {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // 이전 달, 현재 달, 다음 달 모두 가져오기 (주간 뷰 경계 문제 해결)
      const prevMonth = subMonths(month, 1);
      const nextMonth = addMonths(month, 1);
      const startDate = format(startOfMonth(prevMonth), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(nextMonth), 'yyyy-MM-dd');
      
      const res = await fetch(`/api/events?start=${startDate}&end=${endDate}`);
      
      if (!res.ok) {
        throw new Error('Failed to fetch events');
      }
      
      const data = await res.json();
      setEvents(data);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [month]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const createEvent = async (eventData: Omit<Event, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // 낙관적 업데이트
      const tempEvent: Event = {
        ...eventData,
        id: `temp-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setEvents(prev => [...prev, tempEvent]);

      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      });

      if (!res.ok) {
        // 롤백
        setEvents(prev => prev.filter(e => e.id !== tempEvent.id));
        const error = await res.json();
        return { success: false, error: error.error };
      }

      const newEvent = await res.json();
      // 임시 이벤트를 실제 이벤트로 교체
      setEvents(prev => prev.map(e => e.id === tempEvent.id ? newEvent : e));
      return { success: true, data: newEvent };
    } catch (error) {
      await fetchEvents(); // 롤백
      return { success: false, error: '이벤트 생성에 실패했습니다.' };
    }
  };

  const updateEvent = async (id: string, eventData: Partial<Event>) => {
    try {
      // 낙관적 업데이트
      const originalEvents = [...events];
      setEvents(prev => prev.map(e => e.id === id ? { ...e, ...eventData } : e));

      const res = await fetch('/api/events', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...eventData }),
      });

      if (!res.ok) {
        setEvents(originalEvents); // 롤백
        const error = await res.json();
        return { success: false, error: error.error };
      }

      const updatedEvent = await res.json();
      setEvents(prev => prev.map(e => e.id === id ? updatedEvent : e));
      return { success: true, data: updatedEvent };
    } catch (error) {
      await fetchEvents(); // 롤백
      return { success: false, error: '이벤트 수정에 실패했습니다.' };
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      // 낙관적 업데이트
      const originalEvents = [...events];
      setEvents(prev => prev.filter(e => e.id !== id));

      const res = await fetch(`/api/events?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        setEvents(originalEvents); // 롤백
        const error = await res.json();
        return { success: false, error: error.error };
      }

      return { success: true };
    } catch (error) {
      await fetchEvents(); // 롤백
      return { success: false, error: '이벤트 삭제에 실패했습니다.' };
    }
  };

  return {
    events,
    isLoading,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
    refetch: fetchEvents,
  };
}

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Event } from '@/types';
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';
import { supabase } from '@/lib/supabase/client';

interface UseEventsReturn {
  events: Event[];
  isLoading: boolean;
  error: string | null;
  createEvent: (event: Omit<Event, 'id' | 'created_at' | 'updated_at'>) => Promise<{ success: boolean; data?: Event; error?: string }>;
  createEvents: (events: Omit<Event, 'id' | 'created_at' | 'updated_at'>[]) => Promise<{ success: boolean; data?: Event[]; error?: string }>;
  updateEvent: (id: string, event: Partial<Event>) => Promise<{ success: boolean; data?: Event; error?: string }>;
  deleteEvent: (id: string) => Promise<{ success: boolean; error?: string }>;
  refetch: () => Promise<void>;
}

export function useEvents(month: Date = new Date()): UseEventsReturn {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const dedupeEvents = (items: Event[]) => {
    const map = new Map<string, Event>();
    items.forEach((item) => map.set(item.id, item));
    return Array.from(map.values());
  };

  const setEventsSafe = (updater: Event[] | ((prev: Event[]) => Event[])) => {
    setEvents((prev) => {
      const next = typeof updater === 'function' ? (updater as (value: Event[]) => Event[])(prev) : updater;
      return dedupeEvents(next);
    });
  };

  const fetchEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const prevMonth = subMonths(month, 1);
      const nextMonth = addMonths(month, 1);
      const startDate = format(startOfMonth(prevMonth), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(nextMonth), 'yyyy-MM-dd');

      const res = await fetch(`/api/events?start=${startDate}&end=${endDate}`);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch events: ${res.status}`);
      }

      const data = await res.json();
      setEventsSafe(data);
    } catch (err) {
      console.error('[useEvents] Error fetching events:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [month]);

  useEffect(() => {
    fetchEvents();

    const channel = supabase
      .channel('events-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'events' },
        (payload) => {
          setEventsSafe((prev) => [...prev, payload.new as Event]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'events' },
        (payload) => {
          setEventsSafe((prev) => prev.map((event) => event.id === payload.new.id ? payload.new as Event : event));
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'events' },
        (payload) => {
          setEventsSafe((prev) => prev.filter((event) => event.id !== payload.old.id));
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [fetchEvents]);

  const createEvent = async (eventData: Omit<Event, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const tempEvent: Event = {
        ...eventData,
        id: `temp-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setEventsSafe((prev) => [...prev, tempEvent]);

      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      });

      if (!res.ok) {
        setEventsSafe((prev) => prev.filter((event) => event.id !== tempEvent.id));
        const errorData = await res.json();
        return { success: false, error: errorData.error };
      }

      const newEvent = await res.json();
      setEventsSafe((prev) => prev.map((event) => event.id === tempEvent.id ? newEvent : event));
      return { success: true, data: newEvent };
    } catch {
      await fetchEvents();
      return { success: false, error: '이벤트 생성에 실패했습니다.' };
    }
  };

  const createEvents = async (eventsData: Omit<Event, 'id' | 'created_at' | 'updated_at'>[]) => {
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventsData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        return { success: false, error: errorData.error };
      }

      const newEvents = await res.json();
      const newEventsArray = Array.isArray(newEvents) ? newEvents : [newEvents];
      setEventsSafe((prev) => {
        const map = new Map(prev.map((event) => [event.id, event]));
        newEventsArray.forEach((event) => map.set(event.id, event));
        return Array.from(map.values());
      });
      return { success: true, data: newEventsArray };
    } catch {
      await fetchEvents();
      return { success: false, error: '이벤트 생성에 실패했습니다.' };
    }
  };

  const updateEvent = async (id: string, eventData: Partial<Event>) => {
    try {
      const originalEvents = [...events];
      setEventsSafe((prev) => prev.map((event) => event.id === id ? { ...event, ...eventData } : event));

      const res = await fetch('/api/events', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...eventData }),
      });

      if (!res.ok) {
        setEventsSafe(originalEvents);
        const errorData = await res.json();
        return { success: false, error: errorData.error };
      }

      const updatedEvent = await res.json();
      setEventsSafe((prev) => prev.map((event) => event.id === id ? updatedEvent : event));
      return { success: true, data: updatedEvent };
    } catch {
      await fetchEvents();
      return { success: false, error: '이벤트 수정에 실패했습니다.' };
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      const originalEvents = [...events];
      setEventsSafe((prev) => prev.filter((event) => event.id !== id));

      const res = await fetch(`/api/events?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        setEventsSafe(originalEvents);
        const errorData = await res.json();
        return { success: false, error: errorData.error };
      }

      return { success: true };
    } catch {
      await fetchEvents();
      return { success: false, error: '이벤트 삭제에 실패했습니다.' };
    }
  };

  return {
    events,
    isLoading,
    error,
    createEvent,
    createEvents,
    updateEvent,
    deleteEvent,
    refetch: fetchEvents,
  };
}

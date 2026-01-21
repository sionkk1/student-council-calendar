import { addDays, differenceInCalendarDays, endOfDay, startOfDay } from 'date-fns';
import { Event } from '@/types';

export function getEventStart(event: Event): Date {
  return new Date(event.start_time);
}

export function getEventEnd(event: Event): Date | null {
  return event.end_time ? new Date(event.end_time) : null;
}

export function getAllDayEndDate(event: Event): Date | null {
  if (!event.is_all_day) return null;
  if (!event.end_time) return new Date(event.start_time);
  const end = new Date(event.end_time);
  return addDays(end, -1);
}

export function eventOccursOnDate(event: Event, date: Date): boolean {
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);
  const eventStart = new Date(event.start_time);
  const eventEnd = event.end_time ? new Date(event.end_time) : null;

  if (!eventEnd) {
    return eventStart >= dayStart && eventStart <= dayEnd;
  }

  // Treat end as exclusive to avoid double-counting across days.
  return eventStart <= dayEnd && eventEnd > dayStart;
}

export function shiftEventToDate(event: Event, targetDate: Date): { start_time: string; end_time?: string } {
  const currentStart = startOfDay(new Date(event.start_time));
  const targetStart = startOfDay(targetDate);
  const diffDays = differenceInCalendarDays(targetStart, currentStart);

  if (diffDays === 0) {
    return { start_time: event.start_time, end_time: event.end_time };
  }

  const newStart = addDays(new Date(event.start_time), diffDays);
  const newEnd = event.end_time ? addDays(new Date(event.end_time), diffDays) : undefined;

  return {
    start_time: newStart.toISOString(),
    end_time: newEnd?.toISOString(),
  };
}

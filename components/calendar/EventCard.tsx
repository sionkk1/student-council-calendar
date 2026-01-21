'use client';

import { Event } from '@/types';
import { format, isSameDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Clock } from 'lucide-react';
import { getAllDayEndDate } from '@/lib/events';
import { CATEGORY_COLOR_CLASSES } from '@/constants';

interface EventCardProps {
  event: Event;
  onClick: () => void;
  isDraggable?: boolean;
  isSelected?: boolean;
}

export default function EventCard({ event, onClick, isDraggable, isSelected }: EventCardProps) {
  const categoryColor = CATEGORY_COLOR_CLASSES[event.category ?? ''] || CATEGORY_COLOR_CLASSES['기타'];
  const start = new Date(event.start_time);
  const end = event.end_time ? new Date(event.end_time) : null;
  const allDayEnd = getAllDayEndDate(event);
  const logDnd = (...args: unknown[]) => {
    if (typeof window === 'undefined') return;
    const enabled = process.env.NODE_ENV === 'development'
      || process.env.NEXT_PUBLIC_DND_DEBUG === '1'
      || window.location.search.includes('dndDebug=1');
    if (enabled) {
      console.log(...args);
      window.dispatchEvent(new CustomEvent('dnd-debug', { detail: args }));
    }
  };

  let timeLabel = '';
  if (event.is_all_day) {
    if (allDayEnd && !isSameDay(start, allDayEnd)) {
      timeLabel = `${format(start, 'M/d', { locale: ko })} - ${format(allDayEnd, 'M/d', { locale: ko })}`;
    } else {
      timeLabel = '종일';
    }
  } else {
    if (end && !isSameDay(start, end)) {
      timeLabel = `${format(start, 'M/d a h:mm', { locale: ko })} - ${format(end, 'M/d a h:mm', { locale: ko })}`;
    } else {
      timeLabel = format(start, 'a h:mm', { locale: ko });
      if (end) {
        timeLabel += ` - ${format(end, 'a h:mm', { locale: ko })}`;
      }
    }
  }

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    if (!isDraggable) return;
    e.dataTransfer.setData('application/x-event-id', event.id);
    e.dataTransfer.setData('text/plain', event.id);
    e.dataTransfer.effectAllowed = 'move';
    logDnd('[DND] dragstart', {
      id: event.id,
      title: event.title,
      start: event.start_time,
      end: event.end_time,
    });
  };

  return (
    <div
      onClick={onClick}
      onDragStart={handleDragStart}
      draggable={isDraggable}
      className={`group relative overflow-hidden glass p-4 rounded-2xl border border-white/20 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer ${isDraggable ? 'cursor-grab active:cursor-grabbing' : ''} ${isSelected ? 'ring-2 ring-primary/70' : ''}`}
    >
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-primary/50 opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex items-start justify-between mb-2">
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${categoryColor}`}>
          {event.category || '기타'}
        </span>
        {event.departments && event.departments.length > 0 && (
          <span className="text-xs text-muted-foreground truncate max-w-[100px]">
            {event.departments[0]}
            {event.departments.length > 1 && ` 외 ${event.departments.length - 1}`}
          </span>
        )}
      </div>

      <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-1">
        {event.title}
      </h3>

      <div className="space-y-1.5">
        <div className="flex items-center text-sm text-muted-foreground">
          <Clock size={14} className="mr-1.5" />
          <span>{timeLabel}</span>
        </div>
      </div>
    </div>
  );
}

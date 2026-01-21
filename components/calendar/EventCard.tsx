'use client';

import { Event } from '@/types';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Clock } from 'lucide-react';

interface EventCardProps {
  event: Event;
  onClick: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  '회의': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  '행사': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  '공지': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  '학교': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  '기타': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

export default function EventCard({ event, onClick }: EventCardProps) {
  const categoryColor = CATEGORY_COLORS[event.category ?? ''] || CATEGORY_COLORS['기타'];

  return (
    <div
      onClick={onClick}
      className="group relative overflow-hidden glass p-4 rounded-2xl border border-white/20 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer"
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
          <span>
            {format(new Date(event.start_time), 'a h:mm', { locale: ko })}
            {event.end_time && (
              <>
                {' - '}
                {format(new Date(event.end_time), 'a h:mm', { locale: ko })}
              </>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

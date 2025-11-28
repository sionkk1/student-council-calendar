'use client';

import { Event } from '@/types';

interface EventCardProps {
  event: Event;
  onClick: () => void;
}

export default function EventCard({ event, onClick }: EventCardProps) {
  return (
    <button
      onClick={onClick}
      className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 text-left hover:shadow-md transition-shadow flex items-start gap-3 w-full min-h-[60px]"
    >
      <div
        className="w-1 h-full min-h-[40px] rounded-full flex-shrink-0"
        style={{ backgroundColor: event.color_tag || '#3b82f6' }}
      />
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 dark:text-white truncate">{event.title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {event.is_all_day ? '종일' : (
            <>
              {new Date(event.start_time).toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' })}
              {event.end_time && ` - ${new Date(event.end_time).toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' })}`}
            </>
          )}
        </p>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {event.category && (
            <span
              className="inline-block px-2 py-0.5 rounded text-xs font-medium"
              style={{
                backgroundColor: event.color_tag ? `${event.color_tag}20` : '#f3f4f6',
                color: event.color_tag || '#374151'
              }}
            >
              {event.category}
            </span>
          )}
          {event.departments && event.departments.map(dept => (
            <span
              key={dept}
              className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
            >
              {dept}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
}

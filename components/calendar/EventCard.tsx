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
      className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-left hover:shadow-md transition-shadow flex items-start gap-3 w-full min-h-[60px]"
    >
      <div
        className="w-1 h-full min-h-[40px] rounded-full flex-shrink-0"
        style={{ backgroundColor: event.color_tag || '#3b82f6' }}
      />
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 truncate">{event.title}</h3>
        <p className="text-sm text-gray-500 mt-1">
          {event.is_all_day ? '종일' : (
            <>
              {new Date(event.start_time).toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' })}
              {event.end_time && ` - ${new Date(event.end_time).toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' })}`}
            </>
          )}
        </p>
        {event.category && (
          <span
            className="inline-block mt-2 px-2 py-0.5 rounded text-xs font-medium"
            style={{
              backgroundColor: event.color_tag ? `${event.color_tag}20` : '#f3f4f6',
              color: event.color_tag || '#374151'
            }}
          >
            {event.category}
          </span>
        )}
      </div>
    </button>
  );
}

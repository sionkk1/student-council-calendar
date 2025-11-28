'use client';

import { DayPicker } from 'react-day-picker';
import { ko } from 'date-fns/locale';
import 'react-day-picker/dist/style.css';
import { Event } from '@/types';
import MobileWeekView from './MobileWeekView';

interface CalendarGridProps {
    events: Event[];
    selectedDate: Date | undefined;
    onDateSelect: (date: Date | undefined) => void;
    onMonthChange?: (date: Date) => void;
}

export default function CalendarGrid({ events, selectedDate, onDateSelect, onMonthChange }: CalendarGridProps) {
    // Events for the selected month/view
    const eventDates = events.map(e => new Date(e.start_time));

    return (
        <div className="w-full">
            {/* Desktop: Full Calendar */}
            <div className="hidden md:block p-4 bg-white rounded-lg shadow calendar-weekend">
                <DayPicker
                    mode="single"
                    selected={selectedDate}
                    onSelect={onDateSelect}
                    onMonthChange={onMonthChange}
                    locale={ko}
                    modifiers={{ hasEvent: eventDates }}
                    modifiersClassNames={{
                        hasEvent: 'bg-blue-100 font-bold text-blue-600',
                        selected: 'bg-blue-500 text-white hover:bg-blue-600',
                    }}
                    className="mx-auto"
                    styles={{
                        head_cell: { width: '60px' },
                        cell: { width: '60px', height: '60px' },
                        day: { width: '60px', height: '60px' }
                    }}
                />
            </div>

            {/* Mobile: Simplified Week View */}
            <div className="md:hidden">
                <MobileWeekView
                    selectedDate={selectedDate || new Date()}
                    events={events}
                    onDateSelect={(date) => onDateSelect(date)}
                    onMonthChange={onMonthChange}
                />
            </div>
        </div>
    );
}

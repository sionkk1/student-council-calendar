'use client';

import { DayPicker } from 'react-day-picker';
import { ko } from 'date-fns/locale';
import 'react-day-picker/dist/style.css';
import { Event } from '@/types';

import MobileWeekView from './MobileWeekView';

interface CalendarGridProps {
    events: Event[];
    selectedDate: Date;
    onDateSelect: (date: Date | undefined) => void;
    onMonthChange: (month: Date) => void;
}

export default function CalendarGrid({ events, selectedDate, onDateSelect, onMonthChange }: CalendarGridProps) {
    // 날짜별 이벤트 유무 확인을 위한 맵
    const eventDays = events.reduce((acc, event) => {
        const dateStr = new Date(event.start_time).toDateString();
        acc[dateStr] = (acc[dateStr] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return (
        <div className="w-full calendar-weekend">
            {/* 데스크탑: 전체 달력 */}
            <div className="hidden md:block">
                <DayPicker
                    mode="single"
                    selected={selectedDate}
                    onSelect={onDateSelect}
                    onMonthChange={onMonthChange}
                    locale={ko}
                    showOutsideDays
                    className="p-0"
                    modifiers={{
                        hasEvent: (date) => !!eventDays[date.toDateString()],
                    }}
                    modifiersClassNames={{
                        hasEvent: 'font-bold relative after:content-[""] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:bg-accent after:rounded-full after:animate-pulse'
                    }}
                    styles={{
                        head_cell: {
                            width: '100%',
                            height: '40px',
                            fontSize: '0.9rem',
                            color: 'var(--muted-foreground)',
                            fontWeight: 500,
                        },
                        table: { width: '100%', maxWidth: 'none' },
                        day: { margin: 0, width: '100%', height: '50px' },
                        caption: { color: 'var(--primary)', fontWeight: 'bold', marginBottom: '1rem' },
                        nav_button: { color: 'var(--primary)' }
                    }}
                />
            </div>

            {/* 모바일: 주간 뷰 */}
            <div className="md:hidden">
                <MobileWeekView
                    selectedDate={selectedDate}
                    events={events}
                    onDateSelect={(date) => onDateSelect(date)}
                    onMonthChange={onMonthChange}
                />
            </div>
        </div>
    );
}

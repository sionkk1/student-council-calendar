'use client';

import { DayPicker } from 'react-day-picker';
import { ko } from 'date-fns/locale';
import 'react-day-picker/dist/style.css';
import { Event } from '@/types';

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
                modifiersStyles={{
                    hasEvent: {
                        fontWeight: 'bold',
                        position: 'relative',
                    }
                }}
                components={{
                    DayContent: (props) => {
                        const { date, activeModifiers } = props;
                        const hasEvent = activeModifiers.hasEvent;

                        return (
                            <div className="relative w-full h-full flex items-center justify-center">
                                <span>{date.getDate()}</span>
                                {hasEvent && (
                                    <div className="absolute bottom-1 w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
                                )}
                            </div>
                        );
                    }
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
    );
}

'use client';

import { useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { ko } from 'date-fns/locale';
import 'react-day-picker/dist/style.css';
import { Event } from '@/types';
import { cn } from '@/lib/utils';

import MobileWeekView from './MobileWeekView';

interface CalendarGridProps {
    events: Event[];
    selectedDate: Date;
    onDateSelect: (date: Date | undefined) => void;
    onMonthChange: (month: Date) => void;
}

export default function CalendarGrid({ events, selectedDate, onDateSelect, onMonthChange }: CalendarGridProps) {
    const [viewMode, setViewMode] = useState<'week' | 'month'>('week');

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

            {/* 모바일: 주간/월간 뷰 */}
            <div className="md:hidden">
                <div className="flex justify-end px-2 mb-2">
                    <div className="bg-secondary/50 p-1 rounded-lg flex gap-1">
                        <button
                            onClick={() => setViewMode('week')}
                            className={cn(
                                "text-xs px-3 py-1.5 rounded-md transition-all font-medium",
                                viewMode === 'week'
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            주간
                        </button>
                        <button
                            onClick={() => setViewMode('month')}
                            className={cn(
                                "text-xs px-3 py-1.5 rounded-md transition-all font-medium",
                                viewMode === 'month'
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            월간
                        </button>
                    </div>
                </div>

                {viewMode === 'week' ? (
                    <MobileWeekView
                        selectedDate={selectedDate}
                        events={events}
                        onDateSelect={(date) => onDateSelect(date)}
                        onMonthChange={onMonthChange}
                    />
                ) : (
                    <div className="w-full glass rounded-2xl p-4 shadow-sm">
                        <DayPicker
                            mode="single"
                            selected={selectedDate}
                            onSelect={onDateSelect}
                            onMonthChange={onMonthChange}
                            locale={ko}
                            showOutsideDays
                            className="p-0 w-full"
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
                                day: { margin: 0, width: '100%', height: '40px' },
                                caption: { color: 'var(--primary)', fontWeight: 'bold', marginBottom: '1rem' },
                                nav_button: { color: 'var(--primary)' },
                                months: { width: '100%' },
                                month: { width: '100%' },
                                caption_label: { fontSize: '1.2rem' }
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

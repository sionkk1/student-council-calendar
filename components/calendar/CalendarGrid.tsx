'use client';

import { useEffect, useRef, useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { ko } from 'date-fns/locale';
import 'react-day-picker/dist/style.css';
import { Event } from '@/types';
import { cn } from '@/lib/utils';
import { eventOccursOnDate } from '@/lib/events';

import MobileWeekView from './MobileWeekView';

interface CalendarGridProps {
    events: Event[];
    selectedDate: Date;
    onDateSelect: (date: Date | undefined) => void;
    onMonthChange: (month: Date) => void;
    isAdmin?: boolean;
    onEventDrop?: (eventId: string, date: Date) => void;
    onRangeSelect?: (range: { from: Date; to: Date }) => void;
}

export default function CalendarGrid({
    events,
    selectedDate,
    onDateSelect,
    onMonthChange,
    isAdmin,
    onEventDrop,
    onRangeSelect,
}: CalendarGridProps) {
    const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
    const [rangeMode, setRangeMode] = useState(false);
    const [selectedRange, setSelectedRange] = useState<{ from?: Date; to?: Date }>();
    const [dragOverDate, setDragOverDate] = useState<Date | null>(null);

    const handleRangeSelect = (range: { from?: Date; to?: Date } | undefined) => {
        setSelectedRange(range);
        if (range?.from) {
            onDateSelect(range.from);
        }
        if (range?.from && range?.to) {
            onRangeSelect?.({ from: range.from, to: range.to });
            setSelectedRange(undefined);
            setRangeMode(false);
        }
    };

    const DayButton = (props: React.ButtonHTMLAttributes<HTMLButtonElement> & { day: { date: Date }; modifiers?: { focused?: boolean } }) => {
        const { day, modifiers, ...buttonProps } = props;
        const ref = useRef<HTMLButtonElement | null>(null);

        useEffect(() => {
            if (modifiers?.focused) {
                ref.current?.focus();
            }
        }, [modifiers?.focused]);

        return (
            <button
                ref={ref}
                {...buttonProps}
                onDragOver={(e) => {
                    if (onEventDrop) {
                        e.preventDefault();
                        setDragOverDate(day.date);
                    }
                    buttonProps.onDragOver?.(e);
                }}
                onDragLeave={(e) => {
                    setDragOverDate(null);
                    buttonProps.onDragLeave?.(e);
                }}
                onDrop={(e) => {
                    if (!onEventDrop) return;
                    e.preventDefault();
                    const eventId = e.dataTransfer.getData('application/x-event-id') || e.dataTransfer.getData('text/plain');
                    if (eventId) {
                        onEventDrop(eventId, day.date);
                    }
                    setDragOverDate(null);
                    buttonProps.onDrop?.(e);
                }}
            />
        );
    };

    return (
        <div className="w-full calendar-weekend">
            {rangeMode && (
                <div className="mb-3 rounded-lg bg-primary/10 px-3 py-2 text-xs text-primary">
                    Drag or click to select a date range.
                </div>
            )}
            <div className="hidden md:block">
                {isAdmin && (
                    <div className="flex items-center justify-end gap-2 mb-2">
                        <button
                            type="button"
                            onClick={() => setRangeMode((prev) => !prev)}
                            className={cn(
                                'text-xs px-3 py-1.5 rounded-md transition-all font-medium',
                                rangeMode ? 'bg-primary text-primary-foreground' : 'bg-secondary/50 text-muted-foreground hover:text-foreground'
                            )}
                        >
                            {rangeMode ? 'Range: On' : 'Range: Off'}
                        </button>
                    </div>
                )}
                <DayPicker
                    mode={rangeMode ? 'range' : 'single'}
                    selected={rangeMode ? selectedRange : selectedDate}
                    onSelect={rangeMode ? handleRangeSelect : onDateSelect}
                    onMonthChange={onMonthChange}
                    locale={ko}
                    showOutsideDays
                    className="p-0"
                    components={{ DayButton }}
                    modifiers={{
                        hasEvent: (date) => events.some((event) => eventOccursOnDate(event, date)),
                        dropTarget: (date) => !!dragOverDate && date.toDateString() === dragOverDate.toDateString(),
                    }}
                    modifiersClassNames={{
                        hasEvent: 'font-bold relative after:content-[""] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:bg-accent after:rounded-full after:animate-pulse',
                        dropTarget: 'bg-primary/15 ring-2 ring-primary/40',
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
                        nav_button: { color: 'var(--primary)' },
                    }}
                />
            </div>

            <div className="md:hidden">
                <div className="flex justify-end px-2 mb-2">
                    <div className="bg-secondary/50 p-1 rounded-lg flex gap-1">
                        <button
                            onClick={() => setViewMode('week')}
                            className={cn(
                                'text-xs px-3 py-1.5 rounded-md transition-all font-medium',
                                viewMode === 'week'
                                    ? 'bg-background text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            �ְ�
                        </button>
                        <button
                            onClick={() => setViewMode('month')}
                            className={cn(
                                'text-xs px-3 py-1.5 rounded-md transition-all font-medium',
                                viewMode === 'month'
                                    ? 'bg-background text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            ����
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
                            mode={rangeMode ? 'range' : 'single'}
                            selected={rangeMode ? selectedRange : selectedDate}
                            onSelect={rangeMode ? handleRangeSelect : onDateSelect}
                            onMonthChange={onMonthChange}
                            locale={ko}
                            showOutsideDays
                            className="p-0 w-full"
                            components={{ DayButton }}
                            modifiers={{
                                hasEvent: (date) => events.some((event) => eventOccursOnDate(event, date)),
                                dropTarget: (date) => !!dragOverDate && date.toDateString() === dragOverDate.toDateString(),
                            }}
                            modifiersClassNames={{
                                hasEvent: 'font-bold relative after:content-[""] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:bg-accent after:rounded-full after:animate-pulse',
                                dropTarget: 'bg-primary/15 ring-2 ring-primary/40',
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
                                caption_label: { fontSize: '1.2rem' },
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

'use client';

import { useState } from 'react';
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
    onEventDrop?: (eventId: string, date: Date) => void;
}

export default function CalendarGrid({
    events,
    selectedDate,
    onDateSelect,
    onMonthChange,
    onEventDrop,
}: CalendarGridProps) {
    const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
    const [dragOverDate, setDragOverDate] = useState<Date | null>(null);

    const handleDragOver = (e: React.DragEvent) => {
        if (!onEventDrop) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        const target = e.target as HTMLElement;
        const button = target.closest('button[data-day]');
        if (button) {
            const dateStr = button.getAttribute('data-day');
            if (dateStr) {
                const date = new Date(dateStr);
                if (!dragOverDate || date.getTime() !== dragOverDate.getTime()) {
                    setDragOverDate(date);
                }
            }
        } else {
            setDragOverDate(null);
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        const relatedTarget = e.relatedTarget as HTMLElement;
        if (!relatedTarget || !relatedTarget.closest('button[data-day]')) {
            setDragOverDate(null);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        if (!onEventDrop) return;
        e.preventDefault();
        setDragOverDate(null);

        const target = e.target as HTMLElement;
        const button = target.closest('button[data-day]');

        if (button) {
            const dateStr = button.getAttribute('data-day');
            if (dateStr) {
                const date = new Date(dateStr);
                const eventId = e.dataTransfer.getData('application/x-event-id') || e.dataTransfer.getData('text/plain');
                if (eventId) {
                    onEventDrop(eventId, date);
                }
            }
        }
    };

    return (
        <div
            className="w-full calendar-weekend"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <div className="hidden md:block">
                <DayPicker
                    mode="single"
                    selected={selectedDate}
                    onSelect={onDateSelect}
                    onMonthChange={onMonthChange}
                    locale={ko}
                    showOutsideDays
                    className="p-0 w-full"
                    modifiers={{
                        hasEvent: (date) => events.some((event) => eventOccursOnDate(event, date)),
                        dropTarget: (date) => !!dragOverDate && date.toDateString() === dragOverDate.toDateString(),
                    }}
                    modifiersClassNames={{
                        hasEvent: 'font-bold relative after:content-[""] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:bg-accent after:rounded-full after:animate-pulse',
                        dropTarget: 'bg-primary/15 ring-2 ring-primary/40',
                    }}
                    components={{
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        DayButton: (props: any) => {
                            // eslint-disable-next-line @typescript-eslint/no-unused-vars
                            const { day, modifiers, ...buttonProps } = props;
                            return <button {...buttonProps} data-day={day.date.toISOString()} />;
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
                        nav_button: { color: 'var(--primary)' },
                        months: { width: '100%' },
                        month: { width: '100%' },
                        caption_label: { fontSize: '1.2rem' },
                    }}
                />
            </div>

            <div className="md:hidden">
                <div className="flex items-center justify-end gap-2 px-2 mb-2">
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
                            주간
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
                                hasEvent: (date) => events.some((event) => eventOccursOnDate(event, date)),
                                dropTarget: (date) => !!dragOverDate && date.toDateString() === dragOverDate.toDateString(),
                            }}
                            modifiersClassNames={{
                                hasEvent: 'font-bold relative after:content-[""] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:bg-accent after:rounded-full after:animate-pulse',
                                dropTarget: 'bg-primary/15 ring-2 ring-primary/40',
                            }}
                            components={{
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                DayButton: (props: any) => {
                                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                    const { day, modifiers, ...buttonProps } = props;
                                    return <button {...buttonProps} data-day={day.date.toISOString()} />;
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

'use client';

import { useState } from 'react';
import { format, addDays, startOfWeek, isSameDay, addWeeks, subWeeks } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Event } from '@/types';
import { cn } from '@/lib/utils';

interface MobileWeekViewProps {
    selectedDate: Date;
    events: Event[];
    onDateSelect: (date: Date) => void;
    onMonthChange?: (date: Date) => void;
}

export default function MobileWeekView({ selectedDate, events, onDateSelect, onMonthChange }: MobileWeekViewProps) {
    const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(selectedDate, { weekStartsOn: 0 }));

    const handleWeekChange = (newWeekStart: Date) => {
        setCurrentWeekStart(newWeekStart);
        onMonthChange?.(newWeekStart);
    };

    const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(currentWeekStart, i));

    return (
        <div className="w-full bg-white shadow-sm rounded-b-xl pb-2">
            <div className="flex items-center justify-between p-4">
                <h2 className="text-lg font-bold">
                    {format(currentWeekStart, 'yyyy년 M월', { locale: ko })}
                </h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => handleWeekChange(subWeeks(currentWeekStart, 1))}
                        className="p-2 hover:bg-gray-100 rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        onClick={() => handleWeekChange(addWeeks(currentWeekStart, 1))}
                        className="p-2 hover:bg-gray-100 rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            <div
                className="grid grid-cols-7 gap-1 px-2"
            >
                {weekDays.map((date) => {
                    const isSelected = isSameDay(date, selectedDate);
                    const hasEvent = events.some(e => isSameDay(new Date(e.start_time), date));

                    return (
                        <button
                            key={date.toISOString()}
                            onClick={() => onDateSelect(date)}
                            className={cn(
                                "flex flex-col items-center justify-center p-2 rounded-lg min-h-[60px] transition-colors",
                                isSelected ? "bg-blue-500 text-white" : "hover:bg-gray-50",
                                hasEvent && !isSelected && "bg-blue-50"
                            )}
                        >
                            <span className="text-xs opacity-70 mb-1">
                                {format(date, 'E', { locale: ko })}
                            </span>
                            <span className={cn(
                                "text-sm font-medium w-8 h-8 flex items-center justify-center rounded-full",
                                isSameDay(date, new Date()) && !isSelected && "bg-gray-100"
                            )}>
                                {format(date, 'd')}
                            </span>
                            {hasEvent && (
                                <div className={cn(
                                    "w-1.5 h-1.5 rounded-full mt-1",
                                    isSelected ? "bg-white" : "bg-blue-500"
                                )} />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

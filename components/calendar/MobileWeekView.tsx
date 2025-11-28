'use client';

import { useState, useEffect, useCallback } from 'react';
import { format, addDays, startOfWeek, isSameDay, addWeeks, subWeeks, getDay } from 'date-fns';
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
    const [currentWeekStart, setCurrentWeekStart] = useState(() =>
        startOfWeek(selectedDate, { weekStartsOn: 0 })
    );

    const goToPrevWeek = useCallback(() => {
        const newWeekStart = subWeeks(currentWeekStart, 1);
        setCurrentWeekStart(newWeekStart);
        const midWeek = addDays(newWeekStart, 3);
        onMonthChange?.(midWeek);
    }, [currentWeekStart, onMonthChange]);

    const goToNextWeek = useCallback(() => {
        const newWeekStart = addWeeks(currentWeekStart, 1);
        setCurrentWeekStart(newWeekStart);
        const midWeek = addDays(newWeekStart, 3);
        onMonthChange?.(midWeek);
    }, [currentWeekStart, onMonthChange]);

    // 선택된 날짜가 바뀌면 해당 주로 이동
    useEffect(() => {
        const newWeekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
        if (newWeekStart.getTime() !== currentWeekStart.getTime()) {
            setCurrentWeekStart(newWeekStart);
        }
    }, [selectedDate]);

    const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(currentWeekStart, i));

    // 주의 중간(수요일)을 기준으로 월 표시
    const displayMonth = addDays(currentWeekStart, 3);

    // 요일별 색상 (0=일요일, 6=토요일)
    const getDayColor = (date: Date, isSelected: boolean) => {
        if (isSelected) return 'text-white';
        const day = getDay(date);
        if (day === 0) return 'text-red-500'; // 일요일
        if (day === 6) return 'text-blue-500'; // 토요일
        return 'dark:text-gray-200';
    };

    return (
        <div className="w-full bg-white dark:bg-gray-800 shadow-sm rounded-b-xl pb-2">
            <div className="flex items-center justify-between p-4">
                <h2 className="text-lg font-bold dark:text-white">
                    {format(displayMonth, 'yyyy년 M월', { locale: ko })}
                </h2>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            goToPrevWeek();
                        }}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center dark:text-white"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            goToNextWeek();
                        }}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center dark:text-white"
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
                    const dayColor = getDayColor(date, isSelected);

                    return (
                        <button
                            key={date.toISOString()}
                            onClick={() => onDateSelect(date)}
                            className={cn(
                                "flex flex-col items-center justify-center p-2 rounded-lg min-h-[60px] transition-colors",
                                isSelected ? "bg-blue-500" : "hover:bg-gray-50 dark:hover:bg-gray-700",
                                hasEvent && !isSelected && "bg-blue-50 dark:bg-blue-900/30"
                            )}
                        >
                            <span className={cn(
                                "text-xs opacity-70 mb-1",
                                isSelected ? "text-white" : dayColor
                            )}>
                                {format(date, 'E', { locale: ko })}
                            </span>
                            <span className={cn(
                                "text-sm font-medium w-8 h-8 flex items-center justify-center rounded-full",
                                isSameDay(date, new Date()) && !isSelected && "bg-gray-100 dark:bg-gray-600",
                                isSelected ? "text-white" : dayColor
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

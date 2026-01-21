'use client';

import { useState, useEffect, useCallback } from 'react';
import { format, addDays, startOfWeek, isSameDay, addWeeks, subWeeks, getDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Event } from '@/types';
import { eventOccursOnDate } from '@/lib/events';
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
    }, [selectedDate, currentWeekStart]);


    const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(currentWeekStart, i));

    // 주의 중간(수요일)을 기준으로 월 표시
    const displayMonth = addDays(currentWeekStart, 3);

    // 요일별 색상 (0=일요일, 6=토요일)
    const getDayColor = (date: Date, isSelected: boolean) => {
        if (isSelected) return 'text-primary-foreground';
        const day = getDay(date);
        if (day === 0) return 'text-red-500'; // 일요일
        if (day === 6) return 'text-blue-500'; // 토요일
        return 'text-foreground';
    };

    return (
        <div className="w-full glass rounded-2xl p-2 shadow-sm">
            <div className="flex items-center justify-between p-2 mb-2">
                <h2 className="text-lg font-bold text-foreground pl-2">
                    {format(displayMonth, 'yyyy년 M월', { locale: ko })}
                </h2>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={goToPrevWeek}
                        className="p-2 hover:bg-white/20 rounded-full transition-colors text-foreground active:scale-95"
                        aria-label="Previous week"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        type="button"
                        onClick={goToNextWeek}
                        className="p-2 hover:bg-white/20 rounded-full transition-colors text-foreground active:scale-95"
                        aria-label="Next week"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            <div
                className="grid grid-cols-7 gap-1"
            >
                {weekDays.map((date) => {
                    const isSelected = isSameDay(date, selectedDate);
                    const hasEvent = events.some(e => eventOccursOnDate(e, date));
                    const dayColor = getDayColor(date, isSelected);

                    return (
                        <button
                            key={date.toISOString()}
                            onClick={() => onDateSelect(date)}
                            className={cn(
                                "flex flex-col items-center justify-center p-1 rounded-xl min-h-[64px] transition-all duration-300",
                                isSelected ? "bg-primary shadow-md scale-105" : "hover:bg-white/10",
                                hasEvent && !isSelected && "bg-white/5"
                            )}
                        >
                            <span className={cn(
                                "text-xs font-medium mb-1 opacity-80",
                                isSelected ? "text-primary-foreground" : dayColor
                            )}>
                                {format(date, 'E', { locale: ko })}
                            </span>
                            <span className={cn(
                                "text-sm font-bold w-8 h-8 flex items-center justify-center rounded-full transition-all",
                                isSameDay(date, new Date()) && !isSelected && "bg-accent/20 text-accent-foreground",
                                isSelected ? "text-primary-foreground" : dayColor
                            )}>
                                {format(date, 'd')}
                            </span>
                            {hasEvent && (
                                <div className={cn(
                                    "w-1.5 h-1.5 rounded-full mt-1 animate-pulse",
                                    isSelected ? "bg-accent" : "bg-primary"
                                )} />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

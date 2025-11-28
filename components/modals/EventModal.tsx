'use client';

import { X, Calendar, AlignLeft, Edit, Trash2 } from 'lucide-react';
import { useEffect } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Event } from '@/types';
import { cn } from '@/lib/utils';

interface EventModalProps {
    isOpen: boolean;
    onClose: () => void;
    event: Event | null;
    isAdmin?: boolean;
    onEdit?: (event: Event) => void;
    onDelete?: (eventId: string) => void;
}

export default function EventModal({ isOpen, onClose, event, isAdmin, onEdit, onDelete }: EventModalProps) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen || !event) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
            <div
                className="fixed inset-0 bg-black/50 transition-opacity"
                onClick={onClose}
            />

            {/* Mobile: Bottom Sheet style */}
            <div className="md:hidden fixed inset-x-0 bottom-0 bg-white rounded-t-2xl max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-300 z-50">
                <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
                    <h2 className="text-lg font-semibold truncate pr-4">{event.title}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full flex-shrink-0"
                    >
                        <X size={24} />
                    </button>
                </div>
                <div className="p-5 space-y-6 pb-10">
                    <EventContent event={event} />
                    {isAdmin && (
                        <AdminActions
                            event={event}
                            onEdit={onEdit}
                            onDelete={onDelete}
                        />
                    )}
                </div>
            </div>

            {/* Desktop: Centered Modal */}
            <div className="hidden md:block bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto z-50 animate-in fade-in zoom-in-95 duration-200">
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                    <h2 className="text-xl font-semibold">{event.title}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6 space-y-6">
                    <EventContent event={event} />
                    {isAdmin && (
                        <AdminActions
                            event={event}
                            onEdit={onEdit}
                            onDelete={onDelete}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

function AdminActions({
    event,
    onEdit,
    onDelete,
}: {
    event: Event;
    onEdit?: (event: Event) => void;
    onDelete?: (eventId: string) => void;
}) {
    return (
        <div className="flex gap-3 pt-4 border-t">
            <button
                onClick={() => onEdit?.(event)}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors min-h-[44px]"
            >
                <Edit size={18} />
                수정
            </button>
            <button
                onClick={() => onDelete?.(event.id)}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors min-h-[44px]"
            >
                <Trash2 size={18} />
                삭제
            </button>
        </div>
    );
}

function EventContent({ event }: { event: Event }) {
    return (
        <>
            <div className="flex gap-4">
                <div className="mt-1 text-gray-400">
                    <Calendar size={20} />
                </div>
                <div>
                    <p className="font-medium text-gray-900">
                        {format(new Date(event.start_time), 'yyyy년 M월 d일 (E)', { locale: ko })}
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {event.is_all_day ? '종일' : (
                            <>
                                {format(new Date(event.start_time), 'a h:mm', { locale: ko })}
                                {event.end_time && ` - ${format(new Date(event.end_time), 'a h:mm', { locale: ko })}`}
                            </>
                        )}
                    </p>
                </div>
            </div>

            {event.description && (
                <div className="flex gap-4">
                    <div className="mt-1 text-gray-400">
                        <AlignLeft size={20} />
                    </div>
                    <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {event.description}
                    </div>
                </div>
            )}

            {event.category && (
                <div className="flex gap-2 mt-4">
                    <span className={cn(
                        "px-3 py-1 rounded-full text-sm font-medium",
                        event.color_tag ? `bg-[${event.color_tag}]/10 text-[${event.color_tag}]` : "bg-gray-100 text-gray-700"
                    )} style={event.color_tag ? { backgroundColor: `${event.color_tag}20`, color: event.color_tag } : {}}>
                        {event.category}
                    </span>
                </div>
            )}
        </>
    );
}

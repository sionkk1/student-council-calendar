'use client';

import { X, Calendar, AlignLeft, Edit, Trash2, FileText, Upload, Download } from 'lucide-react';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Event, MeetingMinutes } from '@/types';
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
    const [minutes, setMinutes] = useState<MeetingMinutes[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            if (event) {
                fetchMinutes(event.id);
            }
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, event]);

    const fetchMinutes = async (eventId: string) => {
        try {
            const res = await fetch(`/api/upload?eventId=${eventId}`);
            if (res.ok) {
                const data = await res.json();
                setMinutes(data);
            }
        } catch (error) {
            console.error('Failed to fetch minutes:', error);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !event) return;

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('eventId', event.id);

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                setMinutes(prev => [data, ...prev]);
                alert('회의록이 업로드되었습니다.');
            } else {
                const error = await res.json();
                alert(error.error || '업로드에 실패했습니다.');
            }
        } catch (error) {
            alert('업로드 중 오류가 발생했습니다.');
        } finally {
            setIsUploading(false);
            e.target.value = '';
        }
    };

    const handleDeleteMinute = async (minuteId: string) => {
        if (!confirm('이 회의록을 삭제하시겠습니까?')) return;

        try {
            const res = await fetch(`/api/upload?id=${minuteId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                setMinutes(prev => prev.filter(m => m.id !== minuteId));
            } else {
                alert('삭제에 실패했습니다.');
            }
        } catch (error) {
            alert('삭제 중 오류가 발생했습니다.');
        }
    };

    const handleDownload = async (minute: MeetingMinutes) => {
        try {
            const res = await fetch(`/api/download?path=${encodeURIComponent(minute.file_path)}&name=${encodeURIComponent(minute.file_name)}`);
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = minute.file_name;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                a.remove();
            }
        } catch (error) {
            alert('다운로드에 실패했습니다.');
        }
    };

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
                    <MeetingMinutesSection
                        minutes={minutes}
                        isAdmin={isAdmin}
                        isUploading={isUploading}
                        onUpload={handleFileUpload}
                        onDownload={handleDownload}
                        onDelete={handleDeleteMinute}
                    />
                    {isAdmin && !event.is_school_event && (
                        <AdminActions
                            event={event}
                            onEdit={onEdit}
                            onDelete={onDelete}
                        />
                    )}
                    {event.is_school_event && (
                        <div className="text-center text-sm text-gray-400 pt-4 border-t">
                            🏫 학교 공식 일정 (수정 불가)
                        </div>
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
                    <MeetingMinutesSection
                        minutes={minutes}
                        isAdmin={isAdmin}
                        isUploading={isUploading}
                        onUpload={handleFileUpload}
                        onDownload={handleDownload}
                        onDelete={handleDeleteMinute}
                    />
                    {isAdmin && !event.is_school_event && (
                        <AdminActions
                            event={event}
                            onEdit={onEdit}
                            onDelete={onDelete}
                        />
                    )}
                    {event.is_school_event && (
                        <div className="text-center text-sm text-gray-400 pt-4 border-t">
                            🏫 학교 공식 일정 (수정 불가)
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function MeetingMinutesSection({
    minutes,
    isAdmin,
    isUploading,
    onUpload,
    onDownload,
    onDelete,
}: {
    minutes: MeetingMinutes[];
    isAdmin?: boolean;
    isUploading: boolean;
    onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onDownload: (minute: MeetingMinutes) => void;
    onDelete: (id: string) => void;
}) {
    return (
        <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900 flex items-center gap-2">
                    <FileText size={18} />
                    회의록
                </h3>
                {isAdmin && (
                    <label className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm cursor-pointer hover:bg-gray-200 transition-colors">
                        <Upload size={14} />
                        {isUploading ? '업로드 중...' : '업로드'}
                        <input
                            type="file"
                            accept=".pdf,.docx,.xlsx,.hwp,.hwpx"
                            onChange={onUpload}
                            disabled={isUploading}
                            className="hidden"
                        />
                    </label>
                )}
            </div>

            {minutes.length > 0 ? (
                <div className="space-y-2">
                    {minutes.map((minute) => (
                        <div
                            key={minute.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                            <div className="flex items-center gap-2 min-w-0">
                                <FileText size={16} className="text-blue-500 flex-shrink-0" />
                                <span className="text-sm truncate">{minute.file_name}</span>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                                <button
                                    onClick={() => onDownload(minute)}
                                    className="p-2 hover:bg-gray-200 rounded-full"
                                    title="다운로드"
                                >
                                    <Download size={16} />
                                </button>
                                {isAdmin && (
                                    <button
                                        onClick={() => onDelete(minute.id)}
                                        className="p-2 hover:bg-red-100 text-red-500 rounded-full"
                                        title="삭제"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-gray-400 text-center py-4">
                    등록된 회의록이 없습니다.
                </p>
            )}
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

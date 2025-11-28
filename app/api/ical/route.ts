import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET() {
    const { data: events } = await supabase.from('events').select('*').order('start_time');

    const formatDate = (date: Date, allDay: boolean) => {
        if (allDay) return date.toISOString().split('T')[0].replace(/-/g, '');
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const icalEvents = (events || []).map((event) => {
        const start = new Date(event.start_time);
        let end: Date;
        
        if (event.is_all_day) {
            // 종일 일정: 종료일은 시작일 + 1일
            end = new Date(start);
            end.setDate(end.getDate() + 1);
        } else {
            end = event.end_time ? new Date(event.end_time) : new Date(start.getTime() + 3600000);
        }

        return `BEGIN:VEVENT
UID:${event.id}@calendar
DTSTART${event.is_all_day ? ';VALUE=DATE' : ''}:${formatDate(start, event.is_all_day)}
DTEND${event.is_all_day ? ';VALUE=DATE' : ''}:${formatDate(end, event.is_all_day)}
SUMMARY:${event.title}
DESCRIPTION:${(event.description || '').replace(/\n/g, '\\n')}
END:VEVENT`;
    }).join('\n');

    return new NextResponse(`BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Student Council//KO
X-WR-CALNAME:학생자치회 일정
${icalEvents}
END:VCALENDAR`, {
        headers: { 'Content-Type': 'text/calendar; charset=utf-8' },
    });
}
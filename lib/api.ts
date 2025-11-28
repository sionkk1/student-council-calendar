import { supabase } from './supabase/client';
import { Event } from '@/types';

export async function getEvents(startDate?: Date, endDate?: Date) {
    let query = supabase
        .from('events')
        .select('*')
        .order('start_time', { ascending: true });

    if (startDate) {
        query = query.gte('start_time', startDate.toISOString());
    }
    if (endDate) {
        query = query.lte('start_time', endDate.toISOString());
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching events:', error);
        throw error;
    }

    return data as Event[];
}

export async function createEvent(event: Omit<Event, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
        .from('events')
        .insert(event)
        .select()
        .single();

    if (error) {
        console.error('Error creating event:', error);
        throw error;
    }

    return data as Event;
}

export async function verifyAdminCode(code: string): Promise<boolean> {
    try {
        const response = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code }),
        });

        if (!response.ok) return false;
        const data = await response.json();
        return data.success;
    } catch (error) {
        console.error('Error verifying code:', error);
        return false;
    }
}

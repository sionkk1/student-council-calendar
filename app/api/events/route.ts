import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');

    console.log(`[API] GET /events request: start=${startDate}, end=${endDate}`);

    let query = supabase.from('events').select('*').order('start_time', { ascending: true });
    
    if (startDate) query = query.gte('start_time', startDate);
    if (endDate) query = query.lte('start_time', endDate);

    const { data, error } = await query;
    
    if (error) {
        console.error('[API] GET /events error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    console.log(`[API] GET /events success: found ${data?.length} events`);
    return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        console.log('[API] POST /events request:', body);

        const { data, error } = await supabaseAdmin.from('events').insert(body).select().single();
        
        if (error) {
            console.error('[API] POST /events error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        
        console.log('[API] POST /events success:', data);
        return NextResponse.json(data, { status: 201 });
    } catch (e) {
        console.error('[API] POST /events unexpected error:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, ...updateData } = body;
        
        console.log(`[API] PUT /events request: id=${id}`, updateData);

        const { data, error } = await supabaseAdmin.from('events').update(updateData).eq('id', id).select().single();
        
        if (error) {
            console.error('[API] PUT /events error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        
        console.log('[API] PUT /events success:', data);
        return NextResponse.json(data);
    } catch (e) {
        console.error('[API] PUT /events unexpected error:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        
        console.log(`[API] DELETE /events request: id=${id}`);

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        const { error } = await supabaseAdmin.from('events').delete().eq('id', id);
        
        if (error) {
            console.error('[API] DELETE /events error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        
        console.log('[API] DELETE /events success');
        return NextResponse.json({ success: true });
    } catch (e) {
        console.error('[API] DELETE /events unexpected error:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { userId, roomCode } = await req.json();

    const { data: room, error: roomError } = await supabaseAdmin
      .from('rooms')
      .select('*')
      .eq('room_code', roomCode.toUpperCase())
      .eq('is_active', true)
      .single();

    if (roomError || !room) {
      return NextResponse.json({ error: 'Room not found or is no longer active' }, { status: 404 });
    }

    // Check if already in room
    const { data: existing } = await supabaseAdmin
      .from('room_participants')
      .select('id')
      .eq('room_id', room.id)
      .eq('user_id', userId)
      .single();

    if (!existing) {
      const { error: joinError } = await supabaseAdmin
        .from('room_participants')
        .insert({
          room_id: room.id,
          user_id: userId,
        });

      if (joinError) {
        console.error('Join error:', joinError);
        return NextResponse.json({ error: 'Failed to join room' }, { status: 500 });
      }
    }

    return NextResponse.json({ room });
  } catch (error) {
    console.error('Join room error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

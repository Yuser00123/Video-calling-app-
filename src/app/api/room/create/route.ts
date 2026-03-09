import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    // Verify admin
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('is_admin')
      .eq('id', userId)
      .single();

    if (!user?.is_admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Deactivate any existing active rooms by this admin
    await supabaseAdmin
      .from('rooms')
      .update({ is_active: false })
      .eq('created_by', userId)
      .eq('is_active', true);

    const roomCode = uuidv4().substring(0, 8).toUpperCase();

    const { data: room, error } = await supabaseAdmin
      .from('rooms')
      .insert({
        room_code: roomCode,
        created_by: userId,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Create room error:', error);
      return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
    }

    // Add admin as participant
    await supabaseAdmin.from('room_participants').insert({
      room_id: room.id,
      user_id: userId,
    });

    return NextResponse.json({ room });
  } catch (error) {
    console.error('Create room error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

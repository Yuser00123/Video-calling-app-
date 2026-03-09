import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { roomId, fromUser, toUser, signalType, signalData } = await req.json();

    const { error } = await supabaseAdmin
      .from('signals')
      .insert({
        room_id: roomId,
        from_user: fromUser,
        to_user: toUser,
        signal_type: signalType,
        signal_data: signalData,
      });

    if (error) {
      console.error('Signal error:', error);
      return NextResponse.json({ error: 'Failed to send signal' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Signal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

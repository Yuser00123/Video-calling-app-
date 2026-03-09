import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { userId, roomId } = await req.json();

    // Verify admin
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('is_admin')
      .eq('id', userId)
      .single();

    if (!user?.is_admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Remove all participants
    await supabaseAdmin
      .from('room_participants')
      .delete()
      .eq('room_id', roomId);

    // Deactivate room
    await supabaseAdmin
      .from('rooms')
      .update({ is_active: false })
      .eq('id', roomId);

    // Delete signals
    await supabaseAdmin
      .from('signals')
      .delete()
      .eq('room_id', roomId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('End room error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

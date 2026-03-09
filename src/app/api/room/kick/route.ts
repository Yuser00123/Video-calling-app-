import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { adminId, targetUserId, roomId } = await req.json();

    // Verify admin
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('is_admin')
      .eq('id', adminId)
      .single();

    if (!user?.is_admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await supabaseAdmin
      .from('room_participants')
      .delete()
      .eq('room_id', roomId)
      .eq('user_id', targetUserId);

    // Clean up signals
    await supabaseAdmin
      .from('signals')
      .delete()
      .eq('room_id', roomId)
      .or(`from_user.eq.${targetUserId},to_user.eq.${targetUserId}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Kick error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { adminId, targetUserId, roomId } = await req.json();

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
      .update({ is_muted_by_admin: true })
      .eq('room_id', roomId)
      .eq('user_id', targetUserId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Mute error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

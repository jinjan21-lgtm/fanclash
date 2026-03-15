import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { invite_code } = await req.json();
  if (!invite_code) return NextResponse.json({ error: 'Missing invite code' }, { status: 400 });

  // Find battle
  const { data: battle } = await supabase
    .from('collab_battles')
    .select('*')
    .eq('invite_code', invite_code)
    .eq('status', 'pending')
    .single();

  if (!battle) return NextResponse.json({ error: '유효하지 않은 초대 코드입니다' }, { status: 404 });
  if (battle.host_id === user.id) return NextResponse.json({ error: '자신의 배틀에 참가할 수 없습니다' }, { status: 400 });

  // Join as guest
  const { error } = await supabase
    .from('collab_battles')
    .update({ guest_id: user.id, status: 'active', started_at: new Date().toISOString() })
    .eq('id', battle.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, battle_id: battle.id });
}

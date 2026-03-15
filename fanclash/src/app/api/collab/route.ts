import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET: list my collab battles
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data } = await supabase
    .from('collab_battles')
    .select('*, host:streamers!collab_battles_host_id_fkey(display_name), guest:streamers!collab_battles_guest_id_fkey(display_name)')
    .or(`host_id.eq.${user.id},guest_id.eq.${user.id}`)
    .order('created_at', { ascending: false })
    .limit(10);

  return NextResponse.json(data || []);
}

// POST: create collab battle
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: streamer } = await supabase.from('streamers').select('plan').eq('id', user.id).single();
  if (streamer?.plan !== 'pro') {
    return NextResponse.json({ error: 'Pro only' }, { status: 403 });
  }

  const { title, duration_minutes } = await req.json();

  const { data: battle, error } = await supabase
    .from('collab_battles')
    .insert({
      title: title || '콜라보 배틀',
      host_id: user.id,
      duration_minutes: duration_minutes || 30,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(battle);
}

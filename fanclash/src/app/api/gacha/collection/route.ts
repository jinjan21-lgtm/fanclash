import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET: fetch fan's collection for a streamer
export async function GET(req: NextRequest) {
  const supabase = await createClient();

  const streamerId = req.nextUrl.searchParams.get('streamer_id');
  const fanNickname = req.nextUrl.searchParams.get('fan_nickname');

  if (!streamerId) {
    return NextResponse.json({ error: 'streamer_id required' }, { status: 400 });
  }

  let query = supabase
    .from('gacha_collections')
    .select('*')
    .eq('streamer_id', streamerId);

  if (fanNickname) {
    query = query.eq('fan_nickname', fanNickname);
  }

  const { data, error } = await query.order('grade');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}

// POST: upsert collection entry (increment count)
export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const { streamer_id, fan_nickname, grade } = await req.json();

  if (!streamer_id || !fan_nickname || !grade) {
    return NextResponse.json({ error: 'streamer_id, fan_nickname, grade required' }, { status: 400 });
  }

  const validGrades = ['N', 'R', 'SR', 'SSR', 'UR'];
  if (!validGrades.includes(grade)) {
    return NextResponse.json({ error: 'Invalid grade' }, { status: 400 });
  }

  // Try upsert: increment count if exists, insert if not
  const { data: existing } = await supabase
    .from('gacha_collections')
    .select('id, count')
    .eq('streamer_id', streamer_id)
    .eq('fan_nickname', fan_nickname)
    .eq('grade', grade)
    .single();

  let result;
  if (existing) {
    result = await supabase
      .from('gacha_collections')
      .update({ count: (existing.count || 0) + 1, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single();
  } else {
    result = await supabase
      .from('gacha_collections')
      .insert({ streamer_id, fan_nickname, grade, count: 1 })
      .select()
      .single();
  }

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  return NextResponse.json(result.data);
}

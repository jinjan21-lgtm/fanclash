import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getAchievementById } from '@/lib/achievements';

// GET: list achievements for a fan
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const streamerId = request.nextUrl.searchParams.get('streamer_id');
  const nickname = request.nextUrl.searchParams.get('fan_nickname');

  if (!streamerId || !nickname) {
    return NextResponse.json({ error: 'Missing streamer_id or fan_nickname' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('fan_achievements')
    .select('*')
    .eq('streamer_id', streamerId)
    .eq('fan_nickname', nickname)
    .order('unlocked_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Enrich with achievement definitions
  const achievements = (data || []).map(a => ({
    ...a,
    definition: getAchievementById(a.achievement_id),
  }));

  return NextResponse.json({ achievements });
}

// POST: unlock achievement
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const body = await request.json();
  const { streamer_id, fan_nickname, achievement_id } = body;

  if (!streamer_id || !fan_nickname || !achievement_id) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Verify achievement exists
  const achievement = getAchievementById(achievement_id);
  if (!achievement) {
    return NextResponse.json({ error: 'Unknown achievement_id' }, { status: 400 });
  }

  // Upsert (ignore if already unlocked)
  const { data, error } = await supabase
    .from('fan_achievements')
    .upsert(
      { streamer_id, fan_nickname, achievement_id },
      { onConflict: 'streamer_id,fan_nickname,achievement_id' }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ achievement: { ...data, definition: achievement } });
}

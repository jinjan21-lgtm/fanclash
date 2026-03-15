import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

const RPG_TITLES: { level: number; title: string }[] = [
  { level: 1, title: '초보 모험가' },
  { level: 5, title: '숙련 전사' },
  { level: 10, title: '엘리트 기사' },
  { level: 15, title: '영웅' },
  { level: 20, title: '전설' },
  { level: 25, title: '신화' },
];

function getTitle(level: number): string {
  let title = '초보 모험가';
  for (const t of RPG_TITLES) {
    if (level >= t.level) title = t.title;
  }
  return title;
}

function getEquipment(level: number) {
  if (level >= 21) return { weapon: 'legendary_sword', armor: 'legendary', pet: 'dragon' };
  if (level >= 11) return { weapon: 'steel_sword', armor: 'steel', pet: 'wolf' };
  if (level >= 6) return { weapon: 'iron_sword', armor: 'iron', pet: 'cat' };
  return { weapon: 'wooden_sword', armor: 'cloth', pet: 'none' };
}

// GET: fetch character
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const streamerId = request.nextUrl.searchParams.get('streamer_id');
  const nickname = request.nextUrl.searchParams.get('nickname');

  if (!streamerId || !nickname) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  }

  const { data } = await supabase
    .from('fan_rpg_characters')
    .select('*')
    .eq('streamer_id', streamerId)
    .eq('fan_nickname', nickname)
    .single();

  return NextResponse.json({ character: data || null });
}

// POST: update XP / upsert character
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const body = await request.json();
  const { streamer_id, fan_nickname, xp_gained } = body;

  if (!streamer_id || !fan_nickname || typeof xp_gained !== 'number') {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  }

  // Fetch existing character
  const { data: existing } = await supabase
    .from('fan_rpg_characters')
    .select('*')
    .eq('streamer_id', streamer_id)
    .eq('fan_nickname', fan_nickname)
    .single();

  let level = existing?.level || 1;
  let xp = (existing?.xp || 0) + xp_gained;
  let xpToNext = existing?.xp_to_next || level * 100;
  let leveledUp = false;

  // Check level ups
  while (xp >= xpToNext) {
    xp -= xpToNext;
    level += 1;
    xpToNext = level * 100;
    leveledUp = true;
  }

  const title = getTitle(level);
  const equipment = getEquipment(level);

  const record = {
    streamer_id,
    fan_nickname,
    level,
    xp,
    xp_to_next: xpToNext,
    equipment,
    title,
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    await supabase
      .from('fan_rpg_characters')
      .update(record)
      .eq('id', existing.id);
  } else {
    await supabase
      .from('fan_rpg_characters')
      .insert(record);
  }

  return NextResponse.json({ character: { ...existing, ...record }, leveled_up: leveledUp });
}

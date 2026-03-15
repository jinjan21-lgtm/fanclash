import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET: list seasons for current streamer
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: seasons } = await supabase
    .from('seasons')
    .select('*')
    .eq('streamer_id', user.id)
    .order('created_at', { ascending: false });

  return NextResponse.json(seasons || []);
}

// POST: create new season (ends current active season first)
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Check Pro
  const { data: streamer } = await supabase.from('streamers').select('plan').eq('id', user.id).single();
  if (streamer?.plan !== 'pro') {
    return NextResponse.json({ error: 'Pro only' }, { status: 403 });
  }

  const { name } = await req.json();

  // End current active season
  const { data: activeSeason } = await supabase
    .from('seasons')
    .select('id')
    .eq('streamer_id', user.id)
    .eq('status', 'active')
    .single();

  if (activeSeason) {
    // Snapshot current rankings
    const { data: seasonData } = await supabase
      .from('seasons')
      .select('start_date')
      .eq('id', activeSeason.id)
      .single();

    const { data: donations } = await supabase
      .from('donations')
      .select('fan_nickname, amount')
      .eq('streamer_id', user.id)
      .gte('created_at', seasonData?.start_date || '');

    // Aggregate fan totals
    const fanTotals: Record<string, number> = {};
    donations?.forEach(d => {
      fanTotals[d.fan_nickname] = (fanTotals[d.fan_nickname] || 0) + d.amount;
    });

    const ranked = Object.entries(fanTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 50)
      .map(([nickname, total], i) => ({
        season_id: activeSeason.id,
        streamer_id: user.id,
        fan_nickname: nickname,
        total_donated: total,
        rank: i + 1,
      }));

    if (ranked.length > 0) {
      await supabase.from('season_rankings').insert(ranked);
    }

    // End the season
    await supabase.from('seasons').update({
      status: 'ended',
      end_date: new Date().toISOString(),
    }).eq('id', activeSeason.id);
  }

  // Create new season
  const { data: newSeason } = await supabase
    .from('seasons')
    .insert({
      streamer_id: user.id,
      name: name || `시즌 ${(activeSeason ? 2 : 1)}`,
    })
    .select()
    .single();

  return NextResponse.json(newSeason);
}

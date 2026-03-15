import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import LiveSpectator from '@/components/live/LiveSpectator';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ streamerId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { streamerId } = await params;
  const supabase = await createClient();
  const { data: streamer } = await supabase
    .from('streamers')
    .select('display_name')
    .eq('id', streamerId)
    .single();

  const name = streamer?.display_name || '스트리머';

  return {
    title: `${name}의 실시간 방송 - FanClash`,
    description: '실시간 후원 랭킹, 배틀, RPG를 구경하세요!',
    openGraph: {
      title: `${name}의 실시간 방송 - FanClash`,
      description: '실시간 후원 랭킹, 배틀, RPG를 구경하세요!',
      type: 'website',
      locale: 'ko_KR',
      siteName: 'FanClash',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${name}의 실시간 방송 - FanClash`,
      description: '실시간 후원 랭킹, 배틀, RPG를 구경하세요!',
    },
  };
}

export default async function LivePage({ params }: PageProps) {
  const { streamerId } = await params;
  const supabase = await createClient();

  // Fetch streamer info
  const { data: streamer } = await supabase
    .from('streamers')
    .select('id, display_name')
    .eq('id', streamerId)
    .single();

  if (!streamer) {
    notFound();
  }

  // Fetch enabled widgets for this streamer
  const { data: widgets } = await supabase
    .from('widgets')
    .select('type, enabled')
    .eq('streamer_id', streamerId)
    .eq('enabled', true);

  const enabledTypes = (widgets || []).map(w => w.type as string);

  // Fetch recent donations (last 10)
  const { data: recentDonations } = await supabase
    .from('donations')
    .select('id, fan_nickname, amount, message, created_at')
    .eq('streamer_id', streamerId)
    .order('created_at', { ascending: false })
    .limit(10);

  // Fetch top 5 fans by total donated
  const { data: topFans } = await supabase
    .from('fan_profiles')
    .select('nickname, total_donated, affinity_level, title')
    .eq('streamer_id', streamerId)
    .order('total_donated', { ascending: false })
    .limit(5);

  // Fetch active battle (if any)
  const { data: activeBattle } = await supabase
    .from('battles')
    .select('id, status, benefit, min_amount, time_limit, winner_nickname, started_at')
    .eq('streamer_id', streamerId)
    .in('status', ['recruiting', 'active'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let battleParticipants: { nickname: string; amount: number }[] = [];
  if (activeBattle) {
    const { data: participants } = await supabase
      .from('battle_participants')
      .select('nickname, amount')
      .eq('battle_id', activeBattle.id)
      .order('amount', { ascending: false });
    battleParticipants = participants || [];
  }

  // Fetch active team battle (if any)
  const { data: activeTeamBattle } = await supabase
    .from('team_battles')
    .select('id, status, team_count, team_names, time_limit, winning_team')
    .eq('streamer_id', streamerId)
    .in('status', ['recruiting', 'active'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Fetch RPG characters top 5 by level (if RPG widget exists)
  let rpgCharacters: { nickname: string; level: number; exp: number; class_name: string }[] = [];
  if (enabledTypes.includes('rpg')) {
    const { data: chars } = await supabase
      .from('rpg_characters')
      .select('nickname, level, exp, class_name')
      .eq('streamer_id', streamerId)
      .order('level', { ascending: false })
      .limit(5);
    rpgCharacters = chars || [];
  }

  return (
    <LiveSpectator
      streamerId={streamer.id}
      streamerName={streamer.display_name}
      enabledWidgets={enabledTypes}
      initialDonations={recentDonations || []}
      initialRankings={topFans || []}
      initialBattle={activeBattle}
      battleParticipants={battleParticipants}
      initialTeamBattle={activeTeamBattle}
      rpgCharacters={rpgCharacters}
    />
  );
}

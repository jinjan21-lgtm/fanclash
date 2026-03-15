import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import FanProfileClient from '@/components/fan/FanProfileClient';

interface Props {
  params: Promise<{ streamerId: string; nickname: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { streamerId, nickname } = await params;
  const decodedNickname = decodeURIComponent(nickname);
  const supabase = await createClient();

  const { data: streamer } = await supabase
    .from('streamers')
    .select('display_name')
    .eq('id', streamerId)
    .single();

  const title = streamer
    ? `${decodedNickname} - ${streamer.display_name} 팬 프로필 | FanClash`
    : `${decodedNickname} 팬 프로필 | FanClash`;

  return {
    title,
    description: `${decodedNickname}님의 팬 활동 프로필 - 후원 통계, RPG 캐릭터, 수집 현황`,
    openGraph: {
      title,
      description: `${decodedNickname}님의 팬 활동 프로필을 확인하세요!`,
      type: 'profile',
    },
  };
}

export default async function FanProfilePage({ params }: Props) {
  const { streamerId, nickname } = await params;
  const decodedNickname = decodeURIComponent(nickname);
  const supabase = await createClient();

  // Verify streamer exists
  const { data: streamer } = await supabase
    .from('streamers')
    .select('id, display_name')
    .eq('id', streamerId)
    .single();

  if (!streamer) return notFound();

  // Fan profile (donation stats)
  const { data: fanProfile } = await supabase
    .from('fan_profiles')
    .select('*')
    .eq('streamer_id', streamerId)
    .eq('nickname', decodedNickname)
    .single();

  // Donation count
  const { count: donationCount } = await supabase
    .from('donations')
    .select('*', { count: 'exact', head: true })
    .eq('streamer_id', streamerId)
    .eq('fan_nickname', decodedNickname);

  // Rank among fans
  const { data: allFans } = await supabase
    .from('fan_profiles')
    .select('nickname, total_donated')
    .eq('streamer_id', streamerId)
    .order('total_donated', { ascending: false });

  const rank = allFans ? allFans.findIndex(f => f.nickname === decodedNickname) + 1 : 0;
  const totalFans = allFans?.length || 0;

  // RPG character
  const { data: rpgCharacter } = await supabase
    .from('fan_rpg_characters')
    .select('*')
    .eq('streamer_id', streamerId)
    .eq('fan_nickname', decodedNickname)
    .single();

  // Gacha collection
  const { data: gachaCollection } = await supabase
    .from('gacha_collections')
    .select('grade, count')
    .eq('streamer_id', streamerId)
    .eq('fan_nickname', decodedNickname);

  // Fan achievements
  const { data: achievements } = await supabase
    .from('fan_achievements')
    .select('achievement_id, unlocked_at')
    .eq('streamer_id', streamerId)
    .eq('fan_nickname', decodedNickname)
    .order('unlocked_at', { ascending: false });

  // Battle wins/losses
  const { data: battleParticipations } = await supabase
    .from('battle_participants')
    .select('battle_id, amount')
    .eq('nickname', decodedNickname);

  let battleWins = 0;
  let battleLosses = 0;

  if (battleParticipations && battleParticipations.length > 0) {
    const battleIds = battleParticipations.map(bp => bp.battle_id);
    const { data: battles } = await supabase
      .from('battles')
      .select('id, winner_nickname, status')
      .in('id', battleIds)
      .eq('status', 'finished');

    if (battles) {
      for (const battle of battles) {
        if (battle.winner_nickname === decodedNickname) {
          battleWins++;
        } else {
          battleLosses++;
        }
      }
    }
  }

  return (
    <FanProfileClient
      streamer={streamer}
      nickname={decodedNickname}
      fanProfile={fanProfile}
      donationCount={donationCount || 0}
      rank={rank}
      totalFans={totalFans}
      rpgCharacter={rpgCharacter}
      gachaCollection={gachaCollection || []}
      battleWins={battleWins}
      battleLosses={battleLosses}
      achievements={achievements || []}
    />
  );
}

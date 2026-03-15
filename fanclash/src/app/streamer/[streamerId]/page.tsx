import { createClient } from '@/lib/supabase/server';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';

interface Props {
  params: Promise<{ streamerId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { streamerId } = await params;
  const supabase = await createClient();
  const { data: streamer } = await supabase
    .from('streamers')
    .select('display_name')
    .eq('id', streamerId)
    .single();

  const name = streamer?.display_name || '스트리머';
  return {
    title: `${name}의 FanClash 프로필`,
    description: `${name}의 방송 위젯, 팬 랭킹, RPG 리더보드를 확인하세요.`,
    openGraph: {
      title: `${name}의 FanClash 프로필`,
      description: `${name}의 방송 위젯, 팬 랭킹, RPG 리더보드를 확인하세요.`,
      type: 'profile',
    },
  };
}

export default async function StreamerProfilePage({ params }: Props) {
  const { streamerId } = await params;
  const supabase = await createClient();

  // Fetch streamer info
  const { data: streamer } = await supabase
    .from('streamers')
    .select('*')
    .eq('id', streamerId)
    .single();

  if (!streamer) notFound();

  // Fetch active widgets
  const { data: widgets } = await supabase
    .from('widgets')
    .select('type, enabled')
    .eq('streamer_id', streamerId)
    .eq('enabled', true);

  // Fetch fan stats
  const { data: fans } = await supabase
    .from('fan_profiles')
    .select('nickname, total_donated')
    .eq('streamer_id', streamerId)
    .order('total_donated', { ascending: false });

  // Fetch donations aggregate
  const { data: donations } = await supabase
    .from('donations')
    .select('amount')
    .eq('streamer_id', streamerId);

  const totalDonations = donations?.reduce((sum, d) => sum + (d.amount || 0), 0) || 0;
  const totalFans = fans?.length || 0;
  const topFans = (fans || []).slice(0, 5);

  // Fetch RPG leaderboard
  const { data: rpgCharacters } = await supabase
    .from('fan_rpg_characters')
    .select('nickname, level, title')
    .eq('streamer_id', streamerId)
    .order('level', { ascending: false })
    .limit(5);

  // Fetch battles count
  const { count: battleCount } = await supabase
    .from('battles')
    .select('id', { count: 'exact', head: true })
    .eq('streamer_id', streamerId);

  // Fetch gacha pulls count
  const { count: gachaCount } = await supabase
    .from('gacha_collections')
    .select('id', { count: 'exact', head: true })
    .eq('streamer_id', streamerId);

  const activeWidgets = widgets || [];
  const createdAt = new Date(streamer.created_at).toLocaleDateString('ko-KR');
  const initial = (streamer.display_name || '?')[0].toUpperCase();

  const WIDGET_LABELS: Record<string, { label: string; color: string }> = {
    alert: { label: '알림', color: 'bg-blue-600' },
    ranking: { label: '랭킹', color: 'bg-yellow-600' },
    throne: { label: '왕좌', color: 'bg-amber-600' },
    goal: { label: '목표', color: 'bg-green-600' },
    affinity: { label: '호감도', color: 'bg-pink-600' },
    battle: { label: '배틀', color: 'bg-red-600' },
    team_battle: { label: '팀배틀', color: 'bg-orange-600' },
    timer: { label: '타이머', color: 'bg-cyan-600' },
    messages: { label: '메시지', color: 'bg-indigo-600' },
    roulette: { label: '룰렛', color: 'bg-purple-600' },
    music: { label: '뮤직', color: 'bg-violet-600' },
    gacha: { label: '가챠', color: 'bg-fuchsia-600' },
    physics: { label: '폭격', color: 'bg-rose-600' },
    territory: { label: '영토', color: 'bg-teal-600' },
    weather: { label: '날씨', color: 'bg-sky-600' },
    train: { label: '트레인', color: 'bg-lime-600' },
    slots: { label: '슬롯', color: 'bg-emerald-600' },
    meter: { label: '미터', color: 'bg-orange-500' },
    quiz: { label: '퀴즈', color: 'bg-blue-500' },
    rpg: { label: 'RPG', color: 'bg-purple-500' },
  };

  function formatAmount(amount: number): string {
    if (amount >= 10000) return `${(amount / 10000).toFixed(1)}만원`;
    return `${amount.toLocaleString()}원`;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Profile Header */}
        <div className="text-center mb-10">
          <div className="w-24 h-24 rounded-full bg-purple-600 flex items-center justify-center text-4xl font-bold mx-auto mb-4">
            {initial}
          </div>
          <h1 className="text-3xl font-bold mb-1">{streamer.display_name}</h1>
          <p className="text-purple-400 text-sm mb-1">FanClash 스트리머</p>
          <p className="text-gray-500 text-xs">가입일: {createdAt}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: '활성 위젯', value: activeWidgets.length },
            { label: '총 팬 수', value: totalFans },
            { label: '총 후원', value: formatAmount(totalDonations) },
            { label: '배틀 횟수', value: battleCount || 0 },
          ].map((stat) => (
            <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-purple-400">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Active Widgets */}
        {activeWidgets.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-bold mb-4">활성 위젯</h2>
            <div className="flex flex-wrap gap-2">
              {activeWidgets.map((w, i) => {
                const info = WIDGET_LABELS[w.type] || { label: w.type, color: 'bg-gray-600' };
                return (
                  <span key={i} className={`${info.color} px-3 py-1 rounded-full text-xs font-medium`}>
                    {info.label}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* RPG Leaderboard */}
        {rpgCharacters && rpgCharacters.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-bold mb-4">RPG 랭킹 TOP 5</h2>
            <div className="space-y-2">
              {rpgCharacters.map((char, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      i === 0 ? 'bg-yellow-500 text-black' : 'bg-gray-700'
                    }`}>
                      {i + 1}
                    </span>
                    <span className="font-medium">{char.nickname}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-purple-400">Lv.{char.level}</span>
                    <span className="text-gray-500">{char.title}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Fans */}
        {topFans.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-bold mb-4">탑 서포터</h2>
            <div className="space-y-2">
              {topFans.map((fan, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      i === 0 ? 'bg-yellow-500 text-black' : i === 1 ? 'bg-gray-400 text-black' : i === 2 ? 'bg-amber-700' : 'bg-gray-700'
                    }`}>
                      {i + 1}
                    </span>
                    <span className="font-medium">{fan.nickname}</span>
                  </div>
                  <span className="text-purple-400 text-sm font-medium">{formatAmount(fan.total_donated)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gacha Stats */}
        {(gachaCount ?? 0) > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-bold mb-2">가챠 컬렉션</h2>
            <p className="text-gray-400 text-sm">총 <span className="text-purple-400 font-bold">{gachaCount}</span>회 뽑기 진행</p>
          </div>
        )}

        {/* Share & CTA */}
        <div className="text-center mt-10 space-y-4">
          <div className="flex justify-center gap-3">
            <CopyUrlButton />
            <Link
              href={`/live/${streamerId}`}
              className="px-6 py-3 bg-gray-800 border border-gray-700 rounded-xl font-medium hover:bg-gray-700 transition text-sm"
            >
              실시간 방송 보기
            </Link>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-800">
            <p className="text-gray-500 text-sm mb-3">FanClash에서 나만의 방송을 만들어보세요</p>
            <Link
              href="/signup"
              className="inline-block px-8 py-3 bg-purple-600 rounded-xl font-medium hover:bg-purple-700 transition"
            >
              무료로 시작하기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function CopyUrlButton() {
  return (
    <button
      id="copy-url-btn"
      className="px-6 py-3 bg-purple-600 rounded-xl font-medium hover:bg-purple-700 transition text-sm"
      onClick={undefined}
    >
      <CopyUrlScript />
      URL 복사
    </button>
  );
}

function CopyUrlScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          document.addEventListener('DOMContentLoaded', function() {
            var btn = document.getElementById('copy-url-btn');
            if (btn) {
              btn.addEventListener('click', function() {
                navigator.clipboard.writeText(window.location.href).then(function() {
                  btn.textContent = '복사됨!';
                  setTimeout(function() { btn.textContent = 'URL 복사'; }, 2000);
                });
              });
            }
          });
        `,
      }}
    />
  );
}

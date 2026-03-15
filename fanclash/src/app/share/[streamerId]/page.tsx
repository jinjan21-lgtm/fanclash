import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export async function generateMetadata({ params }: { params: Promise<{ streamerId: string }> }): Promise<Metadata> {
  const { streamerId } = await params;
  const supabase = await createClient();
  const { data: streamer } = await supabase.from('streamers').select('display_name').eq('id', streamerId).single();
  const name = streamer?.display_name || '스트리머';

  return {
    title: `${name}의 팬 랭킹`,
    description: `${name}님의 FanClash 팬 랭킹을 확인하세요!`,
    openGraph: {
      title: `${name}의 팬 랭킹 | FanClash`,
      description: `${name}님의 팬 랭킹 TOP 5`,
      images: [`/api/share/ranking?id=${streamerId}`],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${name}의 팬 랭킹 | FanClash`,
      images: [`/api/share/ranking?id=${streamerId}`],
    },
  };
}

export default async function SharePage({ params }: { params: Promise<{ streamerId: string }> }) {
  const { streamerId } = await params;
  const supabase = await createClient();
  const { data: streamer } = await supabase.from('streamers').select('display_name').eq('id', streamerId).single();
  const { data: fans } = await supabase
    .from('fan_profiles')
    .select('nickname, total_donated, title, affinity_level')
    .eq('streamer_id', streamerId)
    .order('total_donated', { ascending: false })
    .limit(10);

  const medals = ['\u{1F947}', '\u{1F948}', '\u{1F949}'];
  const name = streamer?.display_name || '스트리머';

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-black text-white">
      <div className="max-w-lg mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">{name}</h1>
          <p className="text-purple-400 mt-2">팬 랭킹</p>
        </div>

        <div className="space-y-3 mb-8">
          {fans?.map((fan, i) => (
            <div key={fan.nickname} className={`flex items-center gap-4 p-4 rounded-xl ${
              i === 0 ? 'bg-purple-900/20 border border-purple-700/30' : 'bg-gray-900/50 border border-gray-800/50'
            }`}>
              <span className="text-2xl w-10 text-center">{medals[i] || `${i + 1}`}</span>
              <div className="flex-1">
                <p className="font-bold">{fan.nickname}</p>
                <p className="text-xs text-gray-500">{fan.title}</p>
              </div>
              <span className="font-bold text-purple-400">{fan.total_donated.toLocaleString()}원</span>
            </div>
          ))}
          {(!fans || fans.length === 0) && (
            <p className="text-center text-gray-500 py-8">아직 후원 기록이 없습니다</p>
          )}
        </div>

        <div className="text-center">
          <Link href="/signup" className="inline-block px-8 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl font-bold transition-colors">
            FanClash 시작하기
          </Link>
          <p className="text-gray-600 text-xs mt-4">Powered by FanClash</p>
        </div>
      </div>
    </div>
  );
}

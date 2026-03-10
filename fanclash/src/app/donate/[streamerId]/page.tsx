import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import DonateForm from '@/components/fan/DonateForm';

export default async function DonatePage({ params }: { params: Promise<{ streamerId: string }> }) {
  const { streamerId } = await params;
  const supabase = await createClient();

  const { data: streamer } = await supabase
    .from('streamers')
    .select('id, display_name, channel_url')
    .eq('id', streamerId)
    .single();

  if (!streamer) return notFound();

  // Get recent top fans for social proof
  const { data: topFans } = await supabase
    .from('fan_profiles')
    .select('nickname, total_donated, title')
    .eq('streamer_id', streamerId)
    .order('total_donated', { ascending: false })
    .limit(3);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-md mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-purple-600 flex items-center justify-center text-2xl mx-auto mb-3">
            {streamer.display_name?.charAt(0) || '?'}
          </div>
          <h1 className="text-2xl font-bold">{streamer.display_name}</h1>
          <p className="text-gray-400 text-sm mt-1">에게 후원하기</p>
        </div>

        {/* Top fans badge */}
        {topFans && topFans.length > 0 && (
          <div className="bg-gray-900 rounded-xl p-4 mb-6 border border-gray-800">
            <p className="text-xs text-gray-500 mb-2">TOP 팬</p>
            <div className="flex gap-3">
              {topFans.map((fan, i) => (
                <div key={fan.nickname} className="flex items-center gap-1.5">
                  <span className="text-sm">{['👑', '🥈', '🥉'][i]}</span>
                  <span className="text-xs text-gray-400">{fan.nickname}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <DonateForm streamerId={streamer.id} streamerName={streamer.display_name} />

        <div className="mt-8 text-center space-y-2">
          <a href={`/fan/${streamer.id}`} className="text-purple-400 text-sm hover:underline block">
            팬 리더보드 보기
          </a>
          <p className="text-gray-700 text-xs">Powered by FanClash</p>
        </div>
      </div>
    </div>
  );
}

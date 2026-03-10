import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import FanLeaderboard from '@/components/fan/FanLeaderboard';

export default async function FanPage({ params }: { params: Promise<{ streamerId: string }> }) {
  const { streamerId } = await params;
  const supabase = await createClient();

  const { data: streamer } = await supabase
    .from('streamers')
    .select('id, display_name, channel_url')
    .eq('id', streamerId)
    .single();

  if (!streamer) return notFound();

  const { data: fans } = await supabase
    .from('fan_profiles')
    .select('nickname, total_donated, affinity_level, title')
    .eq('streamer_id', streamerId)
    .order('total_donated', { ascending: false })
    .limit(50);

  const { data: todayDonations } = await supabase
    .from('donations')
    .select('amount')
    .eq('streamer_id', streamerId)
    .gte('created_at', new Date().toISOString().split('T')[0]);

  const totalToday = todayDonations?.reduce((sum, d) => sum + d.amount, 0) || 0;
  const totalFans = fans?.length || 0;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">{streamer.display_name}</h1>
          <p className="text-gray-400 mt-1">팬 리더보드</p>
          <div className="flex justify-center gap-6 mt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-400">{totalFans}</p>
              <p className="text-xs text-gray-500">총 팬</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-400">{totalToday.toLocaleString()}원</p>
              <p className="text-xs text-gray-500">오늘 후원</p>
            </div>
          </div>
        </div>

        <FanLeaderboard fans={fans || []} />

        <div className="mt-8 text-center">
          <p className="text-gray-600 text-sm">Powered by FanClash</p>
        </div>
      </div>
    </div>
  );
}

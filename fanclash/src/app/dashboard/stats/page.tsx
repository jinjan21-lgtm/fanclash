import { createClient } from '@/lib/supabase/server';
import StatsCharts from '@/components/dashboard/StatsCharts';

export default async function StatsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Last 7 days donations
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: donations } = await supabase
    .from('donations')
    .select('amount, fan_nickname, created_at')
    .eq('streamer_id', user!.id)
    .gte('created_at', sevenDaysAgo.toISOString())
    .order('created_at', { ascending: true });

  // Top fans all time
  const { data: topFans } = await supabase
    .from('fan_profiles')
    .select('nickname, total_donated, affinity_level, title')
    .eq('streamer_id', user!.id)
    .order('total_donated', { ascending: false })
    .limit(10);

  // Aggregate daily
  const dailyMap = new Map<string, number>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dailyMap.set(d.toISOString().split('T')[0], 0);
  }
  donations?.forEach(d => {
    const day = d.created_at.split('T')[0];
    dailyMap.set(day, (dailyMap.get(day) || 0) + d.amount);
  });

  const dailyData = Array.from(dailyMap.entries()).map(([date, amount]) => ({
    date: date.slice(5), // MM-DD
    amount,
  }));

  const totalWeek = donations?.reduce((sum, d) => sum + d.amount, 0) || 0;
  const totalCount = donations?.length || 0;
  const avgAmount = totalCount > 0 ? Math.round(totalWeek / totalCount) : 0;
  const uniqueFans = new Set(donations?.map(d => d.fan_nickname)).size;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">후원 통계</h2>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900 rounded-xl p-5">
          <p className="text-gray-400 text-sm">7일 총 후원</p>
          <p className="text-2xl font-bold text-purple-400 mt-1">{totalWeek.toLocaleString()}원</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-5">
          <p className="text-gray-400 text-sm">후원 횟수</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{totalCount}회</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-5">
          <p className="text-gray-400 text-sm">평균 금액</p>
          <p className="text-2xl font-bold text-yellow-400 mt-1">{avgAmount.toLocaleString()}원</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-5">
          <p className="text-gray-400 text-sm">참여 팬 수</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{uniqueFans}명</p>
        </div>
      </div>

      <StatsCharts dailyData={dailyData} topFans={topFans || []} />
    </div>
  );
}

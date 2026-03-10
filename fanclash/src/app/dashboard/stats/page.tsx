import { createClient } from '@/lib/supabase/server';
import StatsCharts from '@/components/dashboard/StatsCharts';
import StatsFilter from '@/components/dashboard/StatsFilter';

export default async function StatsPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const params = await searchParams;

  const period = params.period || '7d';
  const daysMap: Record<string, number> = { '1d': 1, '7d': 7, '30d': 30, '90d': 90 };
  const days = daysMap[period] || 7;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data: donations } = await supabase
    .from('donations')
    .select('amount, fan_nickname, message, created_at')
    .eq('streamer_id', user!.id)
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: false });

  // Top fans all time
  const { data: topFans } = await supabase
    .from('fan_profiles')
    .select('nickname, total_donated, affinity_level, title')
    .eq('streamer_id', user!.id)
    .order('total_donated', { ascending: false })
    .limit(10);

  // Aggregate daily
  const dailyMap = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dailyMap.set(d.toISOString().split('T')[0], 0);
  }
  donations?.forEach(d => {
    const day = d.created_at.split('T')[0];
    dailyMap.set(day, (dailyMap.get(day) || 0) + d.amount);
  });

  // For charts, limit to last 30 bars max
  const allEntries = Array.from(dailyMap.entries());
  const chartEntries = allEntries.slice(-30);
  const dailyData = chartEntries.map(([date, amount]) => ({
    date: date.slice(5), // MM-DD
    amount,
  }));

  const totalPeriod = donations?.reduce((sum, d) => sum + d.amount, 0) || 0;
  const totalCount = donations?.length || 0;
  const avgAmount = totalCount > 0 ? Math.round(totalPeriod / totalCount) : 0;
  const uniqueFans = new Set(donations?.map(d => d.fan_nickname)).size;

  const periodLabels: Record<string, string> = { '1d': '오늘', '7d': '7일', '30d': '30일', '90d': '90일' };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">후원 통계</h2>
        <StatsFilter current={period} />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900 rounded-xl p-5">
          <p className="text-gray-400 text-sm">{periodLabels[period] || '7일'} 총 후원</p>
          <p className="text-2xl font-bold text-purple-400 mt-1">{totalPeriod.toLocaleString()}원</p>
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

      <StatsCharts
        dailyData={dailyData}
        topFans={topFans || []}
        donations={donations?.map(d => ({
          fan_nickname: d.fan_nickname,
          amount: d.amount,
          message: d.message || '',
          created_at: d.created_at,
        }))}
      />
    </div>
  );
}

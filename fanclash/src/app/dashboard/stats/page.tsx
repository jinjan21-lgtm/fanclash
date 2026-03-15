import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import StatsCharts from '@/components/dashboard/StatsCharts';
import StatsFilter from '@/components/dashboard/StatsFilter';
import SeasonManager from '@/components/dashboard/SeasonManager';
import DonationInsights from '@/components/dashboard/DonationInsights';
import { isProFeature } from '@/lib/plan';

interface InsightCard {
  emoji: string;
  title: string;
  description: string;
  color: string;
}

function generateInsights(
  allDonations: { amount: number; fan_nickname: string; created_at: string }[]
): InsightCard[] {
  const insights: InsightCard[] = [];
  if (!allDonations || allDonations.length < 3) return insights;

  // 1. Peak hour
  const hourCounts = new Array(24).fill(0);
  allDonations.forEach(d => {
    const hour = new Date(d.created_at).getHours();
    hourCounts[hour] += d.amount;
  });
  const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
  const peakLabel = peakHour < 12
    ? `오전 ${peakHour === 0 ? 12 : peakHour}시`
    : `오후 ${peakHour === 12 ? 12 : peakHour - 12}시`;
  insights.push({
    emoji: '🕐',
    title: '최고 시간대',
    description: `${peakLabel}에 후원이 가장 활발합니다`,
    color: 'text-blue-400',
  });

  // 2. Fan loyalty
  const fanCountMap = new Map<string, number>();
  allDonations.forEach(d => {
    fanCountMap.set(d.fan_nickname, (fanCountMap.get(d.fan_nickname) || 0) + 1);
  });
  const totalUniqueFans = fanCountMap.size;
  const returningFans = Array.from(fanCountMap.values()).filter(c => c >= 2).length;
  if (totalUniqueFans > 0) {
    const loyaltyPercent = Math.round((returningFans / totalUniqueFans) * 100);
    insights.push({
      emoji: '💜',
      title: '팬 충성도',
      description: `전체 팬의 ${loyaltyPercent}%가 2회 이상 후원했습니다`,
      color: 'text-purple-400',
    });
  }

  // 3. Trend: this week vs last week
  const now = new Date();
  const thisWeekStart = new Date(now);
  thisWeekStart.setDate(thisWeekStart.getDate() - 7);
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);

  const thisWeekTotal = allDonations
    .filter(d => new Date(d.created_at) >= thisWeekStart)
    .reduce((sum, d) => sum + d.amount, 0);
  const lastWeekTotal = allDonations
    .filter(d => {
      const dt = new Date(d.created_at);
      return dt >= lastWeekStart && dt < thisWeekStart;
    })
    .reduce((sum, d) => sum + d.amount, 0);

  if (lastWeekTotal > 0) {
    const changePercent = Math.round(((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100);
    const direction = changePercent >= 0 ? '증가' : '감소';
    insights.push({
      emoji: changePercent >= 0 ? '📈' : '📉',
      title: '주간 트렌드',
      description: `지난주 대비 후원이 ${Math.abs(changePercent)}% ${direction}했습니다`,
      color: changePercent >= 0 ? 'text-green-400' : 'text-red-400',
    });
  } else if (thisWeekTotal > 0) {
    insights.push({
      emoji: '🆕',
      title: '주간 트렌드',
      description: '이번 주 첫 후원이 들어왔습니다!',
      color: 'text-green-400',
    });
  }

  // 4. Top supporter insight
  if (totalUniqueFans > 0) {
    const sortedFans = Array.from(fanCountMap.entries()).sort((a, b) => b[1] - a[1]);
    const topFan = sortedFans[0];
    if (topFan[1] >= 3) {
      insights.push({
        emoji: '👑',
        title: '최고 서포터',
        description: `${topFan[0]}님이 ${topFan[1]}회 후원으로 가장 많이 참여했습니다`,
        color: 'text-yellow-400',
      });
    }
  }

  return insights;
}

export default async function StatsPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: streamer } = await supabase.from('streamers').select('plan').eq('id', user!.id).single();
  const userPlan = streamer?.plan || 'free';
  const params = await searchParams;

  if (isProFeature('stats', userPlan)) {
    // Free users: show basic stats without charts/filters
    const { data: allDonations } = await supabase
      .from('donations')
      .select('amount, fan_nickname, created_at')
      .eq('streamer_id', user!.id);

    const today = new Date().toISOString().split('T')[0];
    const totalAll = allDonations?.reduce((sum, d) => sum + d.amount, 0) || 0;
    const totalCount = allDonations?.length || 0;
    const uniqueFans = new Set(allDonations?.map(d => d.fan_nickname)).size;
    const todayCount = allDonations?.filter(d => d.created_at.startsWith(today)).length || 0;

    return (
      <div>
        <h2 className="text-2xl font-bold mb-6">후원 통계</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900 rounded-xl p-5">
            <p className="text-gray-400 text-sm">총 후원</p>
            <p className="text-2xl font-bold text-purple-400 mt-1">{totalAll.toLocaleString()}원</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-5">
            <p className="text-gray-400 text-sm">후원 횟수</p>
            <p className="text-2xl font-bold text-green-400 mt-1">{totalCount}회</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-5">
            <p className="text-gray-400 text-sm">참여 팬 수</p>
            <p className="text-2xl font-bold text-blue-400 mt-1">{uniqueFans}명</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-5">
            <p className="text-gray-400 text-sm">오늘 후원</p>
            <p className="text-2xl font-bold text-yellow-400 mt-1">{todayCount}건</p>
          </div>
        </div>
        <div className="bg-gray-900 rounded-xl p-8 border border-gray-800 text-center">
          <p className="text-gray-400 mb-4">기간별 차트, 시즌 시스템, CSV 내보내기 등은 Pro에서 이용 가능합니다.</p>
          <Link href="/dashboard/pricing" className="inline-block px-6 py-2 bg-purple-600 rounded-lg hover:bg-purple-700 text-sm">
            Pro 업그레이드
          </Link>
        </div>
      </div>
    );
  }

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

  // All donations for insights (last 30 days)
  const insightsStart = new Date();
  insightsStart.setDate(insightsStart.getDate() - 30);
  const { data: allDonationsForInsights } = await supabase
    .from('donations')
    .select('amount, fan_nickname, created_at')
    .eq('streamer_id', user!.id)
    .gte('created_at', insightsStart.toISOString());

  // Seasons
  const { data: seasons } = await supabase
    .from('seasons')
    .select('*')
    .eq('streamer_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(5);

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

      {/* Donation Insights - Pro only */}
      {allDonationsForInsights && allDonationsForInsights.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-bold mb-4">후원 인사이트</h3>
          <DonationInsights insights={generateInsights(allDonationsForInsights)} />
        </div>
      )}

      {/* Season system - Pro only */}
      {!isProFeature('stats', userPlan) && (
        <SeasonManager seasons={seasons || []} />
      )}
    </div>
  );
}

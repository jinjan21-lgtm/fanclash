import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import ConnectionStatus from '@/components/dashboard/ConnectionStatus';
import OnboardingGuide from '@/components/dashboard/OnboardingGuide';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: streamer } = await supabase.from('streamers').select().eq('id', user!.id).single();

  // Fetch real stats
  const today = new Date().toISOString().split('T')[0];
  const { data: widgets } = await supabase.from('widgets').select('id, type, enabled').eq('streamer_id', user!.id);
  const { data: todayDonations } = await supabase
    .from('donations').select('amount, fan_nickname, created_at')
    .eq('streamer_id', user!.id)
    .gte('created_at', today)
    .order('created_at', { ascending: false })
    .limit(5);
  const { data: activeBattles } = await supabase
    .from('battles').select('id')
    .eq('streamer_id', user!.id)
    .in('status', ['recruiting', 'active']);
  const { data: integrations } = await supabase
    .from('integrations').select('id, connected')
    .eq('streamer_id', user!.id);

  // Top fans this week
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: topFans } = await supabase
    .from('donations')
    .select('fan_nickname, amount')
    .eq('streamer_id', user!.id)
    .gte('created_at', weekAgo);

  // Aggregate top fans
  const fanTotals: Record<string, number> = {};
  topFans?.forEach(d => {
    fanTotals[d.fan_nickname] = (fanTotals[d.fan_nickname] || 0) + d.amount;
  });
  const topFanList = Object.entries(fanTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([name, total]) => ({ name, total }));

  const totalToday = todayDonations?.reduce((sum, d) => sum + d.amount, 0) || 0;
  const activeWidgets = widgets?.filter(w => w.enabled).length || 0;
  const connectedIntegrations = integrations?.filter(i => i.connected).length || 0;
  const plan = streamer?.plan || 'free';

  // Onboarding steps
  const steps = [
    { done: (widgets?.length || 0) > 0, label: '위젯 만들기', desc: '랭킹, 목표, 배틀 등 위젯을 추가하세요', href: '/dashboard/widgets', cta: '위젯 추가' },
    { done: connectedIntegrations > 0, label: '후원 연동', desc: '투네이션, 틱톡 등 후원 플랫폼을 연결하세요', href: '/dashboard/integrations', cta: '연동 설정' },
    { done: activeWidgets > 0, label: 'OBS에 위젯 연결', desc: '위젯 관리에서 OBS URL을 복사해서 브라우저 소스로 추가하세요', href: '/dashboard/widgets', cta: 'URL 복사하기' },
    { done: totalToday > 0, label: '첫 후원 받기', desc: '방송을 켜고 연동된 플랫폼에서 첫 후원을 받아보세요!', href: '/dashboard/integrations', cta: '연동 확인' },
  ];

  const completedSteps = steps.filter(s => s.done).length;
  const allDone = completedSteps === steps.length;

  const WIDGET_LABELS: Record<string, string> = {
    alert: '후원 알림', ranking: '랭킹 보드', throne: '왕좌 쟁탈전',
    goal: '도네 목표', affinity: '호감도', battle: '후원 배틀',
    team_battle: '팬 투표', timer: '이벤트 타이머', messages: '메시지 보드', roulette: '후원 룰렛', music: '도네이션 뮤직', gacha: '도네이션 가챠',
    physics: '도네이션 폭격', territory: '영토 전쟁', weather: '방송 날씨',
  };

  return (
    <div>
      {/* Compact header with inline stats */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
        <div className="flex-1">
          <h2 className="text-2xl font-bold">안녕하세요, {streamer?.display_name || '스트리머'}님!</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-900 rounded-lg px-3 py-2">
            <span className="text-purple-400 font-bold text-sm">{totalToday.toLocaleString()}원</span>
            <span className="text-gray-600 text-xs">오늘</span>
          </div>
          <div className="flex items-center gap-2 bg-gray-900 rounded-lg px-3 py-2">
            <span className="text-green-400 font-bold text-sm">{activeWidgets}</span>
            <span className="text-gray-600 text-xs">위젯</span>
          </div>
          <div className="flex items-center gap-2 bg-gray-900 rounded-lg px-3 py-2">
            <span className="text-blue-400 font-bold text-sm">{connectedIntegrations}</span>
            <span className="text-gray-600 text-xs">연동</span>
          </div>
          <ConnectionStatus />
        </div>
      </div>

      {/* Onboarding guide (collapsible client component) */}
      <OnboardingGuide steps={steps} completedSteps={completedSteps} allDone={allDone} />

      {/* Recent donations + Top fans + Widget status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Recent donations feed */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">최근 후원</h3>
            <Link href="/dashboard/stats" className="text-xs text-purple-400 hover:text-purple-300">전체 보기</Link>
          </div>
          {(!todayDonations || todayDonations.length === 0) ? (
            <p className="text-gray-500 text-sm py-4 text-center">오늘 아직 후원이 없습니다</p>
          ) : (
            <div className="space-y-3">
              {todayDonations.map((d, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-purple-600/20 flex items-center justify-center text-sm font-bold text-purple-400">
                      {d.fan_nickname?.charAt(0) || '?'}
                    </span>
                    <span className="text-sm font-medium">{d.fan_nickname}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-purple-400">{d.amount.toLocaleString()}원</span>
                    <p className="text-[10px] text-gray-600">
                      {new Date(d.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column: Top fans + Widget status */}
        <div className="flex flex-col gap-4">
          {/* Top fans this week */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">이번 주 TOP 팬</h3>
              <Link href={`/fan/${user!.id}`} target="_blank" className="text-xs text-purple-400 hover:text-purple-300">리더보드</Link>
            </div>
            {topFanList.length === 0 ? (
              <p className="text-gray-500 text-sm py-4 text-center">이번 주 후원 기록이 없습니다</p>
            ) : (
              <div className="space-y-3">
                {topFanList.map((fan, i) => {
                  const medals = ['🥇', '🥈', '🥉'];
                  return (
                    <div key={fan.name} className="flex items-center gap-3 py-2 border-b border-gray-800 last:border-0">
                      <span className="text-xl w-8 text-center">{medals[i]}</span>
                      <span className="flex-1 font-medium text-sm">{fan.name}</span>
                      <span className="text-sm font-bold text-yellow-400">{fan.total.toLocaleString()}원</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Widget status (compact) */}
          {widgets && widgets.length > 0 && (
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm">위젯 상태</h3>
                <Link href="/dashboard/widgets" className="text-xs text-purple-400 hover:text-purple-300">관리</Link>
              </div>
              <div className="flex flex-wrap gap-2">
                {widgets.map(w => (
                  <span key={w.id} className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs ${
                    w.enabled ? 'bg-green-900/20 text-green-400' : 'bg-gray-800 text-gray-500'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${w.enabled ? 'bg-green-400' : 'bg-gray-600'}`} />
                    {WIDGET_LABELS[w.type] || w.type}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pro upgrade banner (subtle, at bottom) */}
      {plan === 'free' && (
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 flex items-center justify-between">
          <p className="text-sm text-gray-400">
            <span className="text-purple-400 font-medium">Pro</span>로 업그레이드하면 모든 위젯과 상세 통계를 이용할 수 있습니다
          </p>
          <Link href="/dashboard/pricing"
            className="px-4 py-2 bg-purple-600/80 hover:bg-purple-600 rounded-lg text-xs font-medium whitespace-nowrap transition-colors">
            업그레이드
          </Link>
        </div>
      )}
    </div>
  );
}

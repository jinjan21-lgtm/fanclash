import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: streamer } = await supabase.from('streamers').select().eq('id', user!.id).single();

  // Fetch real stats
  const today = new Date().toISOString().split('T')[0];
  const { data: widgets } = await supabase.from('widgets').select('id, type, enabled').eq('streamer_id', user!.id);
  const { data: todayDonations } = await supabase
    .from('donations').select('amount')
    .eq('streamer_id', user!.id)
    .gte('created_at', today);
  const { data: activeBattles } = await supabase
    .from('battles').select('id')
    .eq('streamer_id', user!.id)
    .in('status', ['recruiting', 'active']);
  const { data: integrations } = await supabase
    .from('integrations').select('id, connected')
    .eq('streamer_id', user!.id);

  const totalToday = todayDonations?.reduce((sum, d) => sum + d.amount, 0) || 0;
  const activeWidgets = widgets?.filter(w => w.enabled).length || 0;
  const battleCount = activeBattles?.length || 0;
  const connectedIntegrations = integrations?.filter(i => i.connected).length || 0;

  // Onboarding steps
  const steps = [
    { done: (widgets?.length || 0) > 0, label: '위젯 만들기', desc: '랭킹, 목표, 배틀 등 위젯을 추가하세요', href: '/dashboard/widgets', cta: '위젯 추가' },
    { done: connectedIntegrations > 0, label: '후원 연동', desc: '투네이션, 틱톡 등 후원 플랫폼을 연결하세요', href: '/dashboard/integrations', cta: '연동 설정' },
    { done: activeWidgets > 0, label: 'OBS에 위젯 연결', desc: '위젯 관리에서 OBS URL을 복사해서 브라우저 소스로 추가하세요', href: '/dashboard/widgets', cta: 'URL 복사하기' },
    { done: totalToday > 0, label: '첫 후원 받기', desc: '방송을 켜고 연동된 플랫폼에서 첫 후원을 받아보세요!', href: '/dashboard/integrations', cta: '연동 확인' },
  ];

  const completedSteps = steps.filter(s => s.done).length;
  const allDone = completedSteps === steps.length;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">안녕하세요, {streamer?.display_name || '스트리머'}님!</h2>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900 rounded-xl p-5">
          <p className="text-gray-400 text-sm">오늘 총 후원</p>
          <p className="text-2xl font-bold text-purple-400 mt-1">{totalToday.toLocaleString()}원</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-5">
          <p className="text-gray-400 text-sm">활성 위젯</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{activeWidgets}개</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-5">
          <p className="text-gray-400 text-sm">진행 중 배틀</p>
          <p className="text-2xl font-bold text-red-400 mt-1">{battleCount > 0 ? `${battleCount}개` : '없음'}</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-5">
          <p className="text-gray-400 text-sm">연동 플랫폼</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{connectedIntegrations}개</p>
        </div>
      </div>

      {/* Onboarding guide */}
      {!allDone && (
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">시작 가이드</h3>
            <span className="text-sm text-gray-400">{completedSteps}/{steps.length} 완료</span>
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-gray-800 rounded-full mb-5 overflow-hidden">
            <div
              className="h-full bg-purple-600 rounded-full transition-all duration-500"
              style={{ width: `${(completedSteps / steps.length) * 100}%` }}
            />
          </div>

          <div className="space-y-3">
            {steps.map((step, i) => (
              <div key={i} className={`flex items-center gap-4 p-3 rounded-lg ${step.done ? 'bg-green-900/20' : 'bg-gray-800/50'}`}>
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                  step.done ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400'
                }`}>
                  {step.done ? '✓' : i + 1}
                </span>
                <div className="flex-1">
                  <p className={`font-medium ${step.done ? 'text-green-400 line-through' : 'text-white'}`}>{step.label}</p>
                  <p className="text-xs text-gray-500">{step.desc}</p>
                </div>
                {!step.done && (
                  <Link href={step.href}
                    className="px-4 py-1.5 bg-purple-600 rounded-lg text-sm hover:bg-purple-700 whitespace-nowrap">
                    {step.cta}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fan pages */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h3 className="font-bold text-lg">팬 리더보드</h3>
          <p className="text-gray-400 text-sm mt-1">시청자에게 공유하면 자기 순위를 확인할 수 있습니다</p>
          <Link href={`/fan/${user!.id}`} target="_blank"
            className="inline-block mt-3 px-4 py-2 bg-purple-600 rounded-lg text-sm hover:bg-purple-700">
            공유 페이지 열기
          </Link>
        </div>
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h3 className="font-bold text-lg">플랫폼 연동</h3>
          <p className="text-gray-400 text-sm mt-1">투네이션, 틱톡, 치지직 등 후원 플랫폼을 연결하세요</p>
          <Link href="/dashboard/integrations"
            className="inline-block mt-3 px-4 py-2 bg-blue-600 rounded-lg text-sm hover:bg-blue-700">
            연동 설정
          </Link>
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <h3 className="font-bold text-lg mb-4">빠른 실행</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link href="/dashboard/widgets" className="p-4 bg-gray-800 rounded-xl text-center hover:bg-gray-700 transition-colors">
            <span className="text-2xl block mb-1">🎮</span>
            <span className="text-sm">위젯 관리</span>
          </Link>
          <Link href="/dashboard/stats" className="p-4 bg-gray-800 rounded-xl text-center hover:bg-gray-700 transition-colors">
            <span className="text-2xl block mb-1">📈</span>
            <span className="text-sm">후원 통계</span>
          </Link>
          <Link href="/dashboard/integrations" className="p-4 bg-gray-800 rounded-xl text-center hover:bg-gray-700 transition-colors">
            <span className="text-2xl block mb-1">🔗</span>
            <span className="text-sm">연동 설정</span>
          </Link>
          <Link href="/dashboard/settings" className="p-4 bg-gray-800 rounded-xl text-center hover:bg-gray-700 transition-colors">
            <span className="text-2xl block mb-1">⚙️</span>
            <span className="text-sm">프로필 설정</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

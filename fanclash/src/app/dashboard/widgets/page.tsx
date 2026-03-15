'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import WidgetCard from '@/components/dashboard/WidgetCard';
import CollabBattleManager from '@/components/dashboard/CollabBattleManager';
import EventChainManager from '@/components/dashboard/EventChainManager';
import type { Widget, WidgetType } from '@/types';

const ALL_WIDGET_TYPES: WidgetType[] = ['alert', 'ranking', 'throne', 'goal', 'affinity', 'battle', 'team_battle', 'timer', 'messages', 'roulette', 'music', 'gacha', 'physics', 'territory', 'weather', 'train', 'slots', 'meter', 'quiz', 'rpg', 'mission'];

const WIDGET_LABELS: Record<WidgetType, { name: string; desc: string }> = {
  alert: { name: '후원 알림', desc: '후원 시 풀스크린 알림 + TTS' },
  ranking: { name: '후원 랭킹 보드', desc: 'TOP 5 실시간 순위' },
  throne: { name: '왕좌 쟁탈전', desc: '1등 변경 시 풀스크린 알림' },
  goal: { name: '도네 목표 게이지', desc: '단계별 목표 프로그레스바' },
  affinity: { name: '호감도/칭호', desc: '팬 레벨업 팝업 알림' },
  battle: { name: '후원 배틀', desc: '1:1 후원 대결 화면' },
  team_battle: { name: '팬 투표', desc: '팀별 투표 대결' },
  timer: { name: '이벤트 타이머', desc: '카운트다운 + 벌칙/미션' },
  messages: { name: '메시지 보드', desc: '후원 메시지 실시간 표시' },
  roulette: { name: '후원 룰렛', desc: '후원 시 룰렛 돌리기 이벤트' },
  music: { name: '도네이션 뮤직', desc: '후원 금액별 음이 연주되는 인터랙티브 음악' },
  gacha: { name: '도네이션 가챠', desc: '후원 시 등급 뽑기 (N/R/SR/SSR/UR)' },
  physics: { name: '도네이션 폭격', desc: '후원하면 물체가 떨어지고 쌓이는 물리엔진' },
  territory: { name: '영토 전쟁', desc: '후원으로 격자 칸을 점령하는 r/place 스타일' },
  weather: { name: '방송 날씨', desc: '후원량에 따라 맑음→비→폭풍→블리자드' },
  train: { name: '도네이션 트레인', desc: '연속 후원 콤보 카운터' },
  slots: { name: '슬롯머신', desc: '후원 시 슬롯머신 돌리기' },
  meter: { name: '핫/콜드 미터', desc: '실시간 후원 온도 게이지' },
  quiz: { name: '팬 퀴즈', desc: '도네이션 메시지로 퀴즈 맞추기' },
  rpg: { name: '팬 RPG', desc: '후원으로 캐릭터 레벨업 + 장비 성장' },
  mission: { name: '팬 미션', desc: '팬들이 함께 달성하는 공동 미션' },
};

export default function WidgetsPage() {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [plan, setPlan] = useState<string>('free');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<string | null>(null);
  const supabase = createClient();

  const fetchWidgets = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('widgets').select('*').eq('streamer_id', user.id);
    setWidgets(data || []);
    const { data: streamer } = await supabase.from('streamers').select('plan').eq('id', user.id).single();
    setPlan(streamer?.plan || 'free');
    setLoading(false);
  };

  useEffect(() => { fetchWidgets(); }, []);

  const isPro = plan === 'pro';
  const existingTypes = widgets.map(w => w.type);
  const missingTypes = ALL_WIDGET_TYPES.filter(t => !existingTypes.includes(t));

  const [error, setError] = useState<string | null>(null);

  const addWidget = async (type: WidgetType) => {
    setAdding(type);
    setError(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setAdding(null); return; }
    const { error: insertError } = await supabase.from('widgets').insert({ streamer_id: user.id, type, enabled: true });
    if (insertError) {
      setError(`위젯 추가 실패: ${insertError.message}`);
      setAdding(null);
      return;
    }
    await fetchWidgets();
    setAdding(null);
  };

  if (loading) return (
    <div className="animate-pulse">
      <div className="h-8 w-48 bg-gray-800 rounded-lg mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-gray-900 rounded-xl p-5 border border-gray-800 h-56" />
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">위젯 관리</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg text-sm text-red-400 flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-300">&times;</button>
        </div>
      )}

      {/* Active widgets */}
      {widgets.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {widgets.map(w => (
            <WidgetCard key={w.id} widget={w} plan={plan} onUpdate={fetchWidgets} />
          ))}
        </div>
      )}

      {/* Add widgets */}
      {missingTypes.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-bold mb-3">위젯 추가</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {missingTypes.map(type => {
              const label = WIDGET_LABELS[type];
              const isAdding = adding === type;
              return (
                <button
                  key={type}
                  onClick={() => addWidget(type)}
                  disabled={isAdding}
                  className="flex items-center gap-3 p-4 bg-gray-900 border border-gray-800 rounded-xl hover:border-purple-600 hover:bg-gray-800/50 transition-all text-left disabled:opacity-50"
                >
                  <span className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center text-lg shrink-0">+</span>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{label.name}</p>
                    <p className="text-xs text-gray-500 truncate">{label.desc}</p>
                  </div>
                  {isAdding && <span className="text-xs text-purple-400 shrink-0">추가 중...</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {isPro && <EventChainManager />}
      {isPro && <CollabBattleManager />}
    </div>
  );
}

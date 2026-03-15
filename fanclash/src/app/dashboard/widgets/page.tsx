'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import WidgetCard from '@/components/dashboard/WidgetCard';
import { isWidgetLocked, FREE_ALLOWED_WIDGETS } from '@/lib/plan';
import CollabBattleManager from '@/components/dashboard/CollabBattleManager';
import EventChainManager from '@/components/dashboard/EventChainManager';
import { getRecommendations, type BroadcastStyle } from '@/lib/widget-recommendations';
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

// Popular widget types (fallback when no broadcast_style)
const POPULAR_WIDGETS: WidgetType[] = ['alert', 'ranking', 'battle', 'roulette', 'goal'];

export default function WidgetsPage() {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [plan, setPlan] = useState<string>('free');
  const [broadcastStyle, setBroadcastStyle] = useState<BroadcastStyle | null>(null);
  const [previewType, setPreviewType] = useState<WidgetType | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAllWidgets, setShowAllWidgets] = useState(true);
  const supabase = createClient();

  const fetchWidgets = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('widgets').select('*').eq('streamer_id', user.id);
    setWidgets(data || []);
    const { data: streamer } = await supabase.from('streamers').select('plan, broadcast_style').eq('id', user.id).single();
    setPlan(streamer?.plan || 'free');
    if (streamer?.broadcast_style) {
      setBroadcastStyle(streamer.broadcast_style as BroadcastStyle);
    }

    // Free: auto-create allowed widgets
    if ((!streamer?.plan || streamer.plan === 'free') && data) {
      const existingTypes = data.map(w => w.type);
      const missingFree = FREE_ALLOWED_WIDGETS.filter(t => !existingTypes.includes(t));
      if (missingFree.length > 0) {
        await Promise.all(missingFree.map(type =>
          supabase.from('widgets').insert({ streamer_id: user.id, type })
        ));
        const { data: refreshed } = await supabase.from('widgets').select('*').eq('streamer_id', user.id);
        setWidgets(refreshed || []);
      }
    }
    setLoading(false);
  };

  useEffect(() => { fetchWidgets(); }, []);

  const isPro = plan === 'pro';

  // Determine recommended widget types
  const recommendedTypes: WidgetType[] = broadcastStyle
    ? getRecommendations(broadcastStyle).map(r => r.type)
    : POPULAR_WIDGETS;

  // Split widgets into recommended vs rest
  const recommendedWidgets = widgets.filter(w => recommendedTypes.includes(w.type));
  const otherWidgets = widgets.filter(w => !recommendedTypes.includes(w.type));
  const lockedTypes = ALL_WIDGET_TYPES.filter(t => !FREE_ALLOWED_WIDGETS.includes(t) && !widgets.some(w => w.type === t));

  if (loading) return (
    <div className="animate-pulse">
      <div className="h-8 w-48 bg-gray-800 rounded-lg mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-gray-900 rounded-xl p-5 border border-gray-800 h-56" />
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">위젯 관리</h2>

      {/* Recommended widgets section */}
      {recommendedWidgets.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-bold">
              {broadcastStyle ? '추천 위젯' : '인기 위젯'}
            </h3>
            {broadcastStyle && (
              <span className="px-2 py-0.5 bg-purple-600/20 border border-purple-500/30 rounded-full text-xs text-purple-400">
                {broadcastStyle === 'game' && '게임 방송'}
                {broadcastStyle === 'talk' && '토크·잡담'}
                {broadcastStyle === 'food' && '먹방'}
                {broadcastStyle === 'music' && '음악·노래'}
                {broadcastStyle === 'art' && '그림·창작'}
                {broadcastStyle === 'other' && '기타'}
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendedWidgets.map(w => (
              <WidgetCard key={w.id} widget={w} plan={plan} onUpdate={fetchWidgets} />
            ))}
          </div>
        </div>
      )}

      {/* Other active widgets */}
      {otherWidgets.length > 0 && (
        <div className="mb-8">
          <button
            onClick={() => setShowAllWidgets(!showAllWidgets)}
            className="flex items-center gap-2 mb-4 text-gray-400 hover:text-white transition-colors"
          >
            <h3 className="text-lg font-bold">전체 위젯</h3>
            <span className="text-xs bg-gray-800 px-2 py-0.5 rounded-full">{otherWidgets.length}</span>
            <svg
              className={`w-4 h-4 transition-transform ${showAllWidgets ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showAllWidgets && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in slide-in-from-top-2 fade-in duration-200">
              {otherWidgets.map(w => (
                <WidgetCard key={w.id} widget={w} plan={plan} onUpdate={fetchWidgets} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* If no recommended section rendered, show all widgets flat */}
      {recommendedWidgets.length === 0 && otherWidgets.length === 0 && widgets.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {widgets.map(w => (
            <WidgetCard key={w.id} widget={w} plan={plan} onUpdate={fetchWidgets} />
          ))}
        </div>
      )}

      {/* Add missing widgets — available for all users */}
      {(() => {
        const existingTypes = widgets.map(w => w.type);
        const missingTypes = ALL_WIDGET_TYPES.filter(t => !existingTypes.includes(t));
        if (missingTypes.length === 0) return null;
        return (
          <div className="mb-8">
            <h3 className="text-lg font-bold mb-3">위젯 추가</h3>
            <div className="flex flex-wrap gap-2">
              {missingTypes.map(type => {
                const label = WIDGET_LABELS[type];
                const locked = !isPro && !FREE_ALLOWED_WIDGETS.includes(type);
                return (
                  <button key={type} onClick={async () => {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) return;
                    await supabase.from('widgets').insert({ streamer_id: user.id, type, enabled: !locked });
                    fetchWidgets();
                  }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      locked
                        ? 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700'
                        : 'bg-purple-600 hover:bg-purple-700 text-white'
                    }`}>
                    + {label.name}
                    {locked && <span className="ml-1 text-xs text-purple-400">Pro</span>}
                  </button>
                );
              })}
            </div>
            {!isPro && (
              <p className="text-xs text-gray-600 mt-2">
                Pro 위젯도 추가할 수 있지만, 활성화하려면 Pro 플랜이 필요합니다.
                <a href="/dashboard/pricing" className="text-purple-400 ml-1 hover:underline">업그레이드</a>
              </p>
            )}
          </div>
        );
      })()}

      {isPro && <EventChainManager />}
      {isPro && <CollabBattleManager />}

      {/* Locked widget preview */}
      {previewType && (
        <LockedWidgetPreview type={previewType} onClose={() => setPreviewType(null)} />
      )}
    </div>
  );
}

const PREVIEW_SIZES: Record<WidgetType, { w: number; h: number }> = {
  alert: { w: 600, h: 400 },
  ranking: { w: 420, h: 380 },
  throne: { w: 600, h: 400 },
  goal: { w: 450, h: 350 },
  affinity: { w: 400, h: 250 },
  battle: { w: 500, h: 400 },
  team_battle: { w: 500, h: 400 },
  timer: { w: 400, h: 300 },
  messages: { w: 400, h: 400 },
  roulette: { w: 500, h: 500 },
  music: { w: 600, h: 400 },
  gacha: { w: 500, h: 500 },
  physics: { w: 600, h: 500 },
  territory: { w: 600, h: 450 },
  weather: { w: 600, h: 400 },
  train: { w: 500, h: 400 },
  slots: { w: 500, h: 400 },
  meter: { w: 400, h: 500 },
  quiz: { w: 500, h: 400 },
  rpg: { w: 400, h: 500 },
  mission: { w: 500, h: 400 },
};

function LockedWidgetPreview({ type, onClose }: { type: WidgetType; onClose: () => void }) {
  const [scale, setScale] = useState(1);
  const size = PREVIEW_SIZES[type];
  const demoUrl = typeof window !== 'undefined' ? `${window.location.origin}/overlay/demo/${type}` : '';

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div className="flex flex-col items-center gap-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-4 bg-gray-900 rounded-xl px-5 py-3 border border-gray-700">
          <span className="text-sm text-gray-400">미리보기 (데모)</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setScale(s => Math.max(0.5, s - 0.25))}
              className="w-7 h-7 rounded bg-gray-700 hover:bg-gray-600 text-sm font-bold">-</button>
            <span className="text-sm text-white w-12 text-center">{(scale * 100).toFixed(0)}%</span>
            <button onClick={() => setScale(s => Math.min(2, s + 0.25))}
              className="w-7 h-7 rounded bg-gray-700 hover:bg-gray-600 text-sm font-bold">+</button>
          </div>
          <div className="w-px h-5 bg-gray-700" />
          <span className="text-xs text-gray-500">{size.w} x {size.h}</span>
          <div className="w-px h-5 bg-gray-700" />
          <button onClick={onClose} className="text-gray-400 hover:text-white text-lg">&times;</button>
        </div>
        <div
          className="rounded-xl overflow-hidden border-2 border-dashed border-gray-600 bg-[#18181b]"
          style={{ width: size.w * scale, height: size.h * scale }}
        >
          <iframe
            src={demoUrl}
            className="border-0"
            style={{
              width: size.w,
              height: size.h,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
            }}
            title="위젯 데모 미리보기"
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">데모 데이터로 표시됩니다</span>
          <a href="/dashboard/pricing"
            className="px-4 py-1.5 bg-purple-600 rounded-lg text-xs hover:bg-purple-700 font-medium">
            Pro 업그레이드
          </a>
        </div>
      </div>
    </div>
  );
}

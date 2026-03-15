'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DEFAULT_CHAINS, type EventChain } from '@/lib/widget-chains';

const TRIGGER_ICONS: Record<string, string> = {
  'battle:finished': '⚔️',
  'rpg:levelup': '🗡️',
  'train:combo': '🚂',
  'meter:max': '🌡️',
  'quiz:correct': '❓',
  'gacha:pull': '🎰',
  'slots:jackpot': '🎰',
  'goal:complete': '🎯',
};

const ACTION_ICONS: Record<string, string> = {
  'roulette:spin': '🎡',
  'gacha:pull': '🃏',
  'slots:spin': '🎰',
  'weather:blizzard': '🌨️',
  'train:celebrate': '🎉',
  'alert:special': '🔔',
};

export default function EventChainManager() {
  const [chains, setChains] = useState<EventChain[]>(DEFAULT_CHAINS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const supabase = createClient();

  // Load saved chains from streamer record
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: streamer } = await supabase
        .from('streamers')
        .select('event_chains')
        .eq('id', user.id)
        .single();

      if (streamer?.event_chains && Array.isArray(streamer.event_chains)) {
        // Merge saved state with defaults (in case new chains were added)
        const savedMap = new Map<string, boolean>();
        for (const c of streamer.event_chains as EventChain[]) {
          savedMap.set(c.id, c.enabled);
        }
        setChains(DEFAULT_CHAINS.map(c => ({
          ...c,
          enabled: savedMap.get(c.id) ?? c.enabled,
        })));
      }
    })();
  }, []);

  const toggleChain = (chainId: string) => {
    setChains(prev =>
      prev.map(c => c.id === chainId ? { ...c, enabled: !c.enabled } : c),
    );
    setSaved(false);
  };

  const saveChains = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const payload = chains.map(c => ({ id: c.id, enabled: c.enabled }));
    await supabase
      .from('streamers')
      .update({ event_chains: payload })
      .eq('id', user.id);

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const enabledCount = chains.filter(c => c.enabled).length;

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold text-white">이벤트 체이닝</h3>
          <span className="px-2 py-0.5 bg-purple-600/20 border border-purple-500/30 rounded-full text-xs font-bold text-purple-400">
            Pro
          </span>
          {enabledCount > 0 && (
            <span className="text-xs text-gray-400">
              {enabledCount}개 활성
            </span>
          )}
        </div>
        <button
          onClick={saveChains}
          disabled={saving}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            saved
              ? 'bg-green-600 text-white'
              : 'bg-purple-600 hover:bg-purple-700 text-white'
          } disabled:opacity-50`}
        >
          {saving ? '저장 중...' : saved ? '저장 완료' : '저장'}
        </button>
      </div>

      <p className="text-gray-500 text-sm mb-4">
        위젯 이벤트를 연결해서 자동으로 다른 위젯을 트리거합니다. 배틀 종료 시 룰렛 자동 회전, 레벨업 시 가챠 무료 뽑기 등을 설정하세요.
      </p>

      <div className="space-y-2">
        {chains.map(chain => (
          <div
            key={chain.id}
            className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
              chain.enabled
                ? 'bg-purple-900/20 border-purple-500/30'
                : 'bg-gray-900 border-gray-800'
            }`}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Trigger */}
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xl">{TRIGGER_ICONS[chain.trigger] || '⚡'}</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white truncate">
                      {chain.name.split('→')[0].trim()}
                    </span>
                    <span className="text-gray-500">→</span>
                    <span className="text-xl">{ACTION_ICONS[chain.action] || '⚡'}</span>
                    <span className="text-sm font-bold text-white truncate">
                      {chain.name.split('→')[1]?.trim() || chain.action}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">
                    {chain.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Toggle */}
            <button
              onClick={() => toggleChain(chain.id)}
              className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ml-3 ${
                chain.enabled ? 'bg-purple-600' : 'bg-gray-700'
              }`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  chain.enabled ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import type { PlatformType, WidgetType } from '@/types';

const PLATFORMS: { id: PlatformType; name: string; icon: string; keyLabel: string; keyPlaceholder: string; keyField: string }[] = [
  { id: 'toonation', name: '투네이션', icon: '💰', keyLabel: 'Alertbox Key', keyPlaceholder: 'alertbox_key 입력', keyField: 'alertbox_key' },
  { id: 'tiktok', name: '틱톡', icon: '🎵', keyLabel: '유저네임', keyPlaceholder: '@username', keyField: 'username' },
  { id: 'streamlabs', name: '스트림랩스', icon: '🎬', keyLabel: 'Socket Token', keyPlaceholder: 'socket_token 입력', keyField: 'socket_token' },
  { id: 'chzzk', name: '치지직', icon: '📺', keyLabel: 'DJ ID', keyPlaceholder: 'DJ_ID 입력', keyField: 'dj_id' },
  { id: 'soop', name: '숲', icon: '🌲', keyLabel: 'BJ ID', keyPlaceholder: 'BJ_ID 입력', keyField: 'bj_id' },
];

const RECOMMENDED_WIDGETS: { type: WidgetType; name: string; desc: string; icon: string }[] = [
  { type: 'alert', name: '후원 알림', desc: '후원 시 풀스크린 알림', icon: '🔔' },
  { type: 'ranking', name: '랭킹 보드', desc: 'TOP 5 실시간 순위', icon: '🏆' },
  { type: 'battle', name: '후원 배틀', desc: '1:1 후원 대결', icon: '⚔️' },
  { type: 'slots', name: '슬롯머신', desc: '후원 시 슬롯 돌리기', icon: '🎰' },
  { type: 'gacha', name: '가챠', desc: '등급 뽑기 이벤트', icon: '🎴' },
  { type: 'rpg', name: 'RPG', desc: '팬 레벨업 시스템', icon: '⚔️' },
];

const WIDGET_SIZES: Partial<Record<WidgetType, { w: number; h: number }>> = {
  alert: { w: 800, h: 600 },
  ranking: { w: 400, h: 600 },
  battle: { w: 800, h: 500 },
  slots: { w: 500, h: 400 },
  gacha: { w: 500, h: 600 },
  rpg: { w: 400, h: 500 },
};

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [userId, setUserId] = useState<string | null>(null);

  // Step 1 state
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformType | null>(null);
  const [platformKeys, setPlatformKeys] = useState<Record<string, string>>({});
  const [connectedPlatforms, setConnectedPlatforms] = useState<PlatformType[]>([]);
  const [connecting, setConnecting] = useState(false);

  // Step 2 state
  const [selectedWidgets, setSelectedWidgets] = useState<WidgetType[]>([]);
  const [creatingWidgets, setCreatingWidgets] = useState(false);
  const [createdWidgetIds, setCreatedWidgetIds] = useState<Record<string, string>>({});

  // Step 3 state
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setUserId(user.id);

      // Check if already has integrations
      const { data: integrations } = await supabase.from('integrations').select('platform').eq('streamer_id', user.id).eq('connected', true);
      if (integrations && integrations.length > 0) {
        setConnectedPlatforms(integrations.map(i => i.platform as PlatformType));
      }
    })();
  }, []);

  const handleConnectPlatform = async () => {
    if (!selectedPlatform || !userId) return;
    const keyField = PLATFORMS.find(p => p.id === selectedPlatform)!.keyField;
    const keyValue = platformKeys[selectedPlatform];
    if (!keyValue) { toast('키/토큰을 입력해주세요', 'error'); return; }

    setConnecting(true);
    try {
      // Check existing
      const { data: existing } = await supabase.from('integrations')
        .select('id').eq('streamer_id', userId).eq('platform', selectedPlatform).single();

      if (existing) {
        await supabase.from('integrations').update({
          config: { [keyField]: keyValue },
          enabled: true,
          connected: true,
        }).eq('id', existing.id);
      } else {
        await supabase.from('integrations').insert({
          streamer_id: userId,
          platform: selectedPlatform,
          config: { [keyField]: keyValue },
          enabled: true,
          connected: true,
        });
      }
      setConnectedPlatforms(prev => [...prev.filter(p => p !== selectedPlatform), selectedPlatform]);
      toast(`${PLATFORMS.find(p => p.id === selectedPlatform)!.name} 연동 완료!`);
      setSelectedPlatform(null);
    } catch {
      toast('연동에 실패했습니다', 'error');
    }
    setConnecting(false);
  };

  const handleCreateWidgets = async () => {
    if (!userId || selectedWidgets.length === 0) return;
    setCreatingWidgets(true);
    const ids: Record<string, string> = {};
    for (const type of selectedWidgets) {
      const { data } = await supabase.from('widgets').insert({
        streamer_id: userId,
        type,
        enabled: true,
        config: {},
        theme: 'modern',
      }).select('id').single();
      if (data) ids[type] = data.id;
    }
    setCreatedWidgetIds(ids);
    setCreatingWidgets(false);
    toast(`${selectedWidgets.length}개 위젯이 생성되었습니다!`);
    setStep(3);
  };

  const toggleWidget = (type: WidgetType) => {
    setSelectedWidgets(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const selectAllWidgets = () => {
    setSelectedWidgets(RECOMMENDED_WIDGETS.map(w => w.type));
  };

  const handleCopyUrl = (url: string, type: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(type);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const handleComplete = () => {
    localStorage.setItem('fanclash_onboarding_complete', 'true');
    router.push('/dashboard');
  };

  const getOverlayUrl = (widgetId: string) => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/overlay/${widgetId}`;
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      {/* Step indicator */}
      <div className="flex items-center justify-center mb-10">
        {[1, 2, 3].map((s, i) => (
          <div key={s} className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
              step >= s ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-500'
            }`}>
              {step > s ? '✓' : s}
            </div>
            {i < 2 && (
              <div className={`w-16 md:w-24 h-0.5 mx-2 transition-all ${
                step > s ? 'bg-purple-600' : 'bg-gray-800'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Platform Integration */}
      {step === 1 && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">어떤 플랫폼에서 후원을 받고 계신가요?</h2>
            <p className="text-gray-400">후원 플랫폼을 연결하면 실시간 위젯이 작동합니다</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {PLATFORMS.map(p => {
              const isConnected = connectedPlatforms.includes(p.id);
              return (
                <button key={p.id}
                  onClick={() => setSelectedPlatform(selectedPlatform === p.id ? null : p.id)}
                  className={`relative p-4 rounded-xl border-2 transition-all text-center ${
                    isConnected
                      ? 'border-green-500 bg-green-900/20'
                      : selectedPlatform === p.id
                        ? 'border-purple-500 bg-purple-900/20'
                        : 'border-gray-800 bg-gray-900 hover:border-gray-600'
                  }`}>
                  {isConnected && (
                    <span className="absolute top-2 right-2 text-green-400 text-xs font-bold">연동됨</span>
                  )}
                  <span className="text-3xl block mb-2">{p.icon}</span>
                  <span className="font-medium text-sm">{p.name}</span>
                </button>
              );
            })}
          </div>

          {/* Key input form */}
          {selectedPlatform && (
            <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 space-y-3 animate-in slide-in-from-top duration-200">
              <label className="block text-sm text-gray-400">
                {PLATFORMS.find(p => p.id === selectedPlatform)!.keyLabel}
              </label>
              <input
                type="text"
                placeholder={PLATFORMS.find(p => p.id === selectedPlatform)!.keyPlaceholder}
                value={platformKeys[selectedPlatform] || ''}
                onChange={e => setPlatformKeys(prev => ({ ...prev, [selectedPlatform]: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
              />
              <button
                onClick={handleConnectPlatform}
                disabled={connecting}
                className="w-full py-2.5 bg-purple-600 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 text-sm"
              >
                {connecting ? '연동 중...' : '연동하기'}
              </button>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            <button
              onClick={() => { setStep(2); }}
              className="px-6 py-2.5 text-gray-400 hover:text-white text-sm"
            >
              건너뛰기
            </button>
            <button
              onClick={() => setStep(2)}
              disabled={connectedPlatforms.length === 0}
              className="px-6 py-2.5 bg-purple-600 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-30 disabled:cursor-not-allowed text-sm"
            >
              다음
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Widget Selection */}
      {step === 2 && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">어떤 위젯을 사용하시겠어요?</h2>
            <p className="text-gray-400">인기 위젯을 선택하면 자동으로 생성됩니다</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {RECOMMENDED_WIDGETS.map(w => (
              <button key={w.type}
                onClick={() => toggleWidget(w.type)}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  selectedWidgets.includes(w.type)
                    ? 'border-purple-500 bg-purple-900/20'
                    : 'border-gray-800 bg-gray-900 hover:border-gray-600'
                }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{w.icon}</span>
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                    selectedWidgets.includes(w.type)
                      ? 'border-purple-500 bg-purple-600'
                      : 'border-gray-600'
                  }`}>
                    {selectedWidgets.includes(w.type) && <span className="text-xs">✓</span>}
                  </div>
                </div>
                <h4 className="font-medium text-sm">{w.name}</h4>
                <p className="text-xs text-gray-500 mt-1">{w.desc}</p>
              </button>
            ))}
          </div>

          <button
            onClick={selectAllWidgets}
            className="w-full py-2 text-sm text-purple-400 hover:text-purple-300 border border-purple-800/50 rounded-lg hover:bg-purple-900/20"
          >
            전부 추가
          </button>

          <div className="flex justify-between pt-4">
            <button onClick={() => setStep(1)} className="px-6 py-2.5 text-gray-400 hover:text-white text-sm">
              이전
            </button>
            <button
              onClick={handleCreateWidgets}
              disabled={selectedWidgets.length === 0 || creatingWidgets}
              className="px-6 py-2.5 bg-purple-600 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-30 disabled:cursor-not-allowed text-sm"
            >
              {creatingWidgets ? '생성 중...' : `${selectedWidgets.length}개 위젯 생성`}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: OBS Setup */}
      {step === 3 && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">위젯을 OBS에 연결하세요</h2>
            <p className="text-gray-400">아래 URL을 OBS 브라우저 소스에 추가하면 끝!</p>
          </div>

          {/* OBS Guide */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 space-y-4">
            <h3 className="font-bold text-lg">OBS 설정 가이드</h3>
            <div className="space-y-3 text-sm text-gray-300">
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center text-xs font-bold">1</span>
                <span>OBS에서 <strong className="text-white">&quot;소스 추가&quot;</strong> → <strong className="text-white">&quot;브라우저&quot;</strong>를 클릭합니다</span>
              </div>
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center text-xs font-bold">2</span>
                <span>URL에 아래 위젯 주소를 입력합니다</span>
              </div>
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center text-xs font-bold">3</span>
                <span>너비/높이를 추천 크기로 설정합니다</span>
              </div>
            </div>
          </div>

          {/* Widget URLs */}
          <div className="space-y-3">
            {Object.entries(createdWidgetIds).map(([type, id]) => {
              const widget = RECOMMENDED_WIDGETS.find(w => w.type === type);
              const size = WIDGET_SIZES[type as WidgetType] || { w: 800, h: 600 };
              const url = getOverlayUrl(id);
              return (
                <div key={type} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span>{widget?.icon}</span>
                      <span className="font-medium text-sm">{widget?.name}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      추천: {size.w} x {size.h}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={url}
                      className="flex-1 bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-300 font-mono"
                    />
                    <button
                      onClick={() => handleCopyUrl(url, type)}
                      className="px-3 py-2 bg-purple-600 rounded-lg text-xs hover:bg-purple-700 whitespace-nowrap"
                    >
                      {copiedUrl === type ? '복사됨!' : '복사'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {Object.keys(createdWidgetIds).length === 0 && (
            <p className="text-center text-gray-500 text-sm py-8">
              위젯을 먼저 생성해주세요. 위젯 관리에서 URL을 확인할 수 있습니다.
            </p>
          )}

          <div className="flex justify-between pt-4">
            <button onClick={() => setStep(2)} className="px-6 py-2.5 text-gray-400 hover:text-white text-sm">
              이전
            </button>
            <button
              onClick={handleComplete}
              className="px-8 py-2.5 bg-purple-600 rounded-lg font-medium hover:bg-purple-700 text-sm"
            >
              완료! 대시보드로 이동
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

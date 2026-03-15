'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import type { WidgetType } from '@/types';
import {
  type BroadcastStyle,
  type BroadcastPlatform,
  type WidgetRecommendation,
  type DonationPlatformInfo,
  getRecommendations,
  BROADCAST_PLATFORMS,
  BROADCAST_STYLES,
  PLATFORM_DONATION_MAP,
  WIDGET_SIZES,
} from '@/lib/widget-recommendations';

const STEP_LABELS = ['방송 플랫폼', '방송 스타일', '후원 연동', '위젯 추천'];

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');

  // Step 1: Broadcast platforms (multi-select)
  const [selectedPlatforms, setSelectedPlatforms] = useState<BroadcastPlatform[]>([]);

  // Step 2: Broadcast style (single select)
  const [selectedStyle, setSelectedStyle] = useState<BroadcastStyle | null>(null);

  // Step 3: Donation platform integration
  const [platformKeys, setPlatformKeys] = useState<Record<string, string>>({});
  const [connecting, setConnecting] = useState<string | null>(null);
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);
  const [expandedHelp, setExpandedHelp] = useState<string | null>(null);

  // Step 4: Widget recommendations
  const [selectedWidgets, setSelectedWidgets] = useState<WidgetType[]>([]);
  const [creatingWidgets, setCreatingWidgets] = useState(false);
  const [createdWidgetIds, setCreatedWidgetIds] = useState<Record<string, string>>({});
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [widgetsCreated, setWidgetsCreated] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setUserId(user.id);

      const { data: streamer } = await supabase.from('streamers').select('display_name').eq('id', user.id).single();
      if (streamer) setDisplayName(streamer.display_name || '');

      // Check existing integrations
      const { data: integrations } = await supabase.from('integrations').select('platform').eq('streamer_id', user.id).eq('connected', true);
      if (integrations && integrations.length > 0) {
        setConnectedPlatforms(integrations.map(i => i.platform));
      }
    })();
  }, []);

  const goToStep = useCallback((target: number) => {
    setDirection(target > step ? 'forward' : 'backward');
    setStep(target);
  }, [step]);

  // Step 1: Toggle broadcast platform
  const togglePlatform = (id: BroadcastPlatform) => {
    setSelectedPlatforms(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  // Step 3: Get donation platforms based on selected broadcast platforms
  const getDonationPlatforms = useCallback((): (DonationPlatformInfo & { broadcastPlatform: string })[] => {
    const seen = new Set<string>();
    const result: (DonationPlatformInfo & { broadcastPlatform: string })[] = [];
    for (const bp of selectedPlatforms) {
      const donations = PLATFORM_DONATION_MAP[bp] || [];
      for (const d of donations) {
        const key = `${d.platform}-${d.field}`;
        if (!seen.has(key)) {
          seen.add(key);
          result.push({ ...d, broadcastPlatform: bp });
        }
      }
    }
    return result;
  }, [selectedPlatforms]);

  // Step 3: Connect donation platform
  const handleConnectPlatform = async (info: DonationPlatformInfo) => {
    if (!userId) return;
    const keyValue = platformKeys[`${info.platform}-${info.field}`];
    if (!keyValue) { toast('키/토큰을 입력해주세요', 'error'); return; }

    setConnecting(info.platform);
    try {
      const { data: existing } = await supabase.from('integrations')
        .select('id').eq('streamer_id', userId).eq('platform', info.platform).single();

      if (existing) {
        await supabase.from('integrations').update({
          config: { [info.field]: keyValue },
          enabled: true,
          connected: true,
        }).eq('id', existing.id);
      } else {
        await supabase.from('integrations').insert({
          streamer_id: userId,
          platform: info.platform,
          config: { [info.field]: keyValue },
          enabled: true,
          connected: true,
        });
      }
      setConnectedPlatforms(prev => [...prev.filter(p => p !== info.platform), info.platform]);
      toast(`${info.label} 연동 완료!`);
    } catch {
      toast('연동에 실패했습니다', 'error');
    }
    setConnecting(null);
  };

  // Step 4: Initialize recommendations based on style
  useEffect(() => {
    if (step === 4 && selectedStyle && !widgetsCreated) {
      const recs = getRecommendations(selectedStyle);
      setSelectedWidgets(recs.map(r => r.type));
    }
  }, [step, selectedStyle, widgetsCreated]);

  const toggleWidget = (type: WidgetType) => {
    setSelectedWidgets(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  // Step 4: Create widgets
  const handleCreateWidgets = async () => {
    if (!userId || selectedWidgets.length === 0) return;
    setCreatingWidgets(true);
    const ids: Record<string, string> = {};

    // Check existing widgets to avoid duplicates
    const { data: existingWidgets } = await supabase.from('widgets').select('type').eq('streamer_id', userId);
    const existingTypes = new Set((existingWidgets || []).map(w => w.type));

    for (const type of selectedWidgets) {
      if (existingTypes.has(type)) continue;
      const { data } = await supabase.from('widgets').insert({
        streamer_id: userId,
        type,
        enabled: true,
        config: {},
        theme: 'modern',
      }).select('id').single();
      if (data) ids[type] = data.id;
    }

    // Also get IDs of existing widgets that were selected
    if (existingWidgets) {
      for (const w of existingWidgets) {
        if (selectedWidgets.includes(w.type as WidgetType)) {
          const { data } = await supabase.from('widgets').select('id').eq('streamer_id', userId).eq('type', w.type).single();
          if (data) ids[w.type] = data.id;
        }
      }
    }

    setCreatedWidgetIds(ids);
    setWidgetsCreated(true);
    setCreatingWidgets(false);
    toast(`${Object.keys(ids).length}개 위젯이 준비되었습니다!`);
  };

  // Save profile and complete
  const handleComplete = async () => {
    if (userId && selectedStyle) {
      await supabase.from('streamers').update({
        broadcast_style: selectedStyle,
        broadcast_platforms: selectedPlatforms,
      }).eq('id', userId);
    }
    localStorage.setItem('fanclash_onboarding_complete', 'true');
    router.push('/dashboard');
  };

  const handleCopyUrl = (url: string, type: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(type);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const handleCopyAllUrls = () => {
    const urls = Object.entries(createdWidgetIds).map(([type, id]) => {
      const rec = selectedStyle ? getRecommendations(selectedStyle).find(r => r.type === type) : null;
      return `${rec?.name || type}: ${getOverlayUrl(id)}`;
    }).join('\n');
    navigator.clipboard.writeText(urls);
    toast('모든 URL이 복사되었습니다!');
  };

  const getOverlayUrl = (widgetId: string) => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/overlay/${widgetId}`;
  };

  const recommendations = selectedStyle ? getRecommendations(selectedStyle) : [];

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Progress bar */}
      <div className="flex items-center justify-center mb-10">
        {STEP_LABELS.map((label, i) => {
          const s = i + 1;
          return (
            <div key={s} className="flex items-center">
              <div className="flex flex-col items-center gap-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                  step > s ? 'bg-purple-600 text-white scale-90' :
                  step === s ? 'bg-purple-600 text-white ring-4 ring-purple-600/30' :
                  'bg-gray-800 text-gray-500'
                }`}>
                  {step > s ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : s}
                </div>
                <span className={`text-[10px] md:text-xs whitespace-nowrap transition-colors ${
                  step >= s ? 'text-purple-300' : 'text-gray-600'
                }`}>{label}</span>
              </div>
              {i < STEP_LABELS.length - 1 && (
                <div className={`w-8 md:w-16 h-0.5 mx-1 md:mx-2 mb-5 transition-all duration-500 ${
                  step > s ? 'bg-purple-600' : 'bg-gray-800'
                }`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step 1: Broadcast Platforms */}
      {step === 1 && (
        <div className={`space-y-6 animate-in ${direction === 'forward' ? 'slide-in-from-right-4' : 'slide-in-from-left-4'} fade-in duration-300`}>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">어떤 플랫폼에서 방송하세요?</h2>
            <p className="text-gray-400">복수 선택 가능합니다</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {BROADCAST_PLATFORMS.map(p => {
              const isSelected = selectedPlatforms.includes(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => togglePlatform(p.id)}
                  className={`relative p-5 rounded-xl border-2 transition-all duration-200 text-center group ${
                    isSelected
                      ? 'border-purple-500 bg-purple-900/20 shadow-lg shadow-purple-900/20'
                      : 'border-gray-800 bg-gray-900 hover:border-gray-600 hover:bg-gray-800/50'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  <span className="text-3xl block mb-2">{p.icon}</span>
                  <span className="font-medium text-sm">{p.name}</span>
                </button>
              );
            })}
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={() => goToStep(2)}
              disabled={selectedPlatforms.length === 0}
              className="px-8 py-2.5 bg-purple-600 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-30 disabled:cursor-not-allowed text-sm transition-all"
            >
              다음
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Broadcast Style */}
      {step === 2 && (
        <div className={`space-y-6 animate-in ${direction === 'forward' ? 'slide-in-from-right-4' : 'slide-in-from-left-4'} fade-in duration-300`}>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">방송 스타일이 어떻게 되세요?</h2>
            <p className="text-gray-400">맞춤 위젯을 추천해드립니다</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {BROADCAST_STYLES.map(s => {
              const isSelected = selectedStyle === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedStyle(s.id)}
                  className={`relative p-5 rounded-xl border-2 transition-all duration-200 text-left group ${
                    isSelected
                      ? 'border-purple-500 bg-purple-900/20 shadow-lg shadow-purple-900/20'
                      : 'border-gray-800 bg-gray-900 hover:border-gray-600 hover:bg-gray-800/50'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{s.emoji}</span>
                    <div>
                      <h4 className="font-medium">{s.name}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex justify-between pt-4">
            <button onClick={() => goToStep(1)} className="px-6 py-2.5 text-gray-400 hover:text-white text-sm transition-colors">
              이전
            </button>
            <button
              onClick={() => goToStep(3)}
              disabled={!selectedStyle}
              className="px-8 py-2.5 bg-purple-600 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-30 disabled:cursor-not-allowed text-sm transition-all"
            >
              다음
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Donation Platform Integration */}
      {step === 3 && (
        <div className={`space-y-6 animate-in ${direction === 'forward' ? 'slide-in-from-right-4' : 'slide-in-from-left-4'} fade-in duration-300`}>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">후원 플랫폼을 연결해주세요</h2>
            <p className="text-gray-400">위젯이 후원 알림을 받으려면 연동이 필요합니다</p>
          </div>

          <div className="space-y-4">
            {getDonationPlatforms().map(info => {
              const fieldKey = `${info.platform}-${info.field}`;
              const isConnected = connectedPlatforms.includes(info.platform);
              const isExpanded = expandedHelp === fieldKey;
              const isConnecting = connecting === info.platform;

              return (
                <div key={fieldKey} className={`rounded-xl border-2 transition-all ${
                  isConnected ? 'border-green-600/50 bg-green-900/10' : 'border-gray-800 bg-gray-900'
                }`}>
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">{info.label}</span>
                        {isConnected && (
                          <span className="px-2 py-0.5 bg-green-600/20 border border-green-500/30 rounded-full text-xs text-green-400 font-medium">
                            연동됨
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {BROADCAST_PLATFORMS.find(bp => bp.id === info.broadcastPlatform)?.name} 추천
                      </span>
                    </div>

                    {!isConnected && (
                      <>
                        <p className="text-sm text-gray-400 mb-3">
                          {info.label === '투네이션' && '투네이션 알림박스 키를 입력하세요'}
                          {info.label === '틱톡 라이브' && '틱톡 사용자명을 입력하세요'}
                          {info.label === '스트림랩스' && '스트림랩스 Socket API Token을 입력하세요'}
                        </p>

                        <div className="flex gap-2 mb-2">
                          <input
                            type="text"
                            placeholder={info.placeholder}
                            value={platformKeys[fieldKey] || ''}
                            onChange={e => setPlatformKeys(prev => ({ ...prev, [fieldKey]: e.target.value }))}
                            className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2.5 text-sm focus:border-purple-500 focus:outline-none transition-colors"
                          />
                          <button
                            onClick={() => handleConnectPlatform(info)}
                            disabled={isConnecting || !platformKeys[fieldKey]}
                            className="px-5 py-2.5 bg-purple-600 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 text-sm whitespace-nowrap transition-all"
                          >
                            {isConnecting ? '연동 중...' : '연동'}
                          </button>
                        </div>

                        <button
                          onClick={() => setExpandedHelp(isExpanded ? null : fieldKey)}
                          className="text-xs text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
                        >
                          <svg className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                          어떻게 찾나요?
                        </button>

                        {isExpanded && (
                          <div className="mt-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700 animate-in slide-in-from-top-2 duration-200">
                            <div className="space-y-2">
                              {info.helpSteps.map((helpStep, i) => (
                                <div key={i} className="flex items-start gap-2 text-sm">
                                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-600/30 flex items-center justify-center text-[10px] font-bold text-purple-300 mt-0.5">
                                    {i + 1}
                                  </span>
                                  <span className="text-gray-300">{helpStep}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Chzzk cheese note */}
                  {info.broadcastPlatform === 'chzzk' && !isConnected && (
                    <div className="px-5 pb-4">
                      <p className="text-xs text-gray-500 bg-gray-800/50 rounded-lg p-2.5">
                        * 치지직 치즈 후원은 직접 연동이 불가하여, 투네이션을 통해 연결합니다.
                      </p>
                    </div>
                  )}
                </div>
              );
            })}

            {getDonationPlatforms().length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>선택한 방송 플랫폼에 맞는 후원 연동 옵션이 없습니다.</p>
                <p className="text-sm mt-1">이전 단계로 돌아가서 플랫폼을 선택해주세요.</p>
              </div>
            )}
          </div>

          <div className="flex justify-between pt-4">
            <button onClick={() => goToStep(2)} className="px-6 py-2.5 text-gray-400 hover:text-white text-sm transition-colors">
              이전
            </button>
            <div className="flex gap-3">
              <button
                onClick={() => goToStep(4)}
                className="px-6 py-2.5 text-gray-400 hover:text-white text-sm transition-colors"
              >
                나중에 설정
              </button>
              <button
                onClick={() => goToStep(4)}
                className="px-8 py-2.5 bg-purple-600 rounded-lg font-medium hover:bg-purple-700 text-sm transition-all"
              >
                다음
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Widget Recommendations */}
      {step === 4 && (
        <div className={`space-y-6 animate-in ${direction === 'forward' ? 'slide-in-from-right-4' : 'slide-in-from-left-4'} fade-in duration-300`}>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">
              {displayName ? `${displayName}님에게 딱 맞는 위젯이에요!` : '맞춤 위젯 추천!'}
            </h2>
            <p className="text-gray-400">
              {selectedStyle && BROADCAST_STYLES.find(s => s.id === selectedStyle)?.name} 방송에 최적화된 위젯입니다
            </p>
          </div>

          {!widgetsCreated ? (
            <>
              {/* Essential widgets */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">필수 위젯</h3>
                {recommendations.filter(r => r.priority === 'essential').map(rec => (
                  <WidgetRecommendationCard
                    key={rec.type}
                    rec={rec}
                    selected={selectedWidgets.includes(rec.type)}
                    onToggle={() => toggleWidget(rec.type)}
                  />
                ))}
              </div>

              {/* Recommended widgets */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">추천 위젯</h3>
                {recommendations.filter(r => r.priority === 'recommended').map(rec => (
                  <WidgetRecommendationCard
                    key={rec.type}
                    rec={rec}
                    selected={selectedWidgets.includes(rec.type)}
                    onToggle={() => toggleWidget(rec.type)}
                  />
                ))}
              </div>

              <div className="flex justify-between pt-4">
                <button onClick={() => goToStep(3)} className="px-6 py-2.5 text-gray-400 hover:text-white text-sm transition-colors">
                  이전
                </button>
                <button
                  onClick={handleCreateWidgets}
                  disabled={selectedWidgets.length === 0 || creatingWidgets}
                  className="px-8 py-3 bg-purple-600 rounded-lg font-bold hover:bg-purple-700 disabled:opacity-30 disabled:cursor-not-allowed text-sm transition-all"
                >
                  {creatingWidgets ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      생성 중...
                    </span>
                  ) : (
                    `추천 위젯 한번에 추가 (${selectedWidgets.length}개)`
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Success: show created widgets with OBS URLs */}
              <div className="bg-green-900/20 border border-green-600/30 rounded-xl p-5 text-center">
                <div className="text-3xl mb-2">🎉</div>
                <h3 className="font-bold text-lg text-green-300">위젯이 생성되었습니다!</h3>
                <p className="text-sm text-gray-400 mt-1">아래 URL을 OBS 브라우저 소스에 추가하세요</p>
              </div>

              <div className="space-y-3">
                {Object.entries(createdWidgetIds).map(([type, id]) => {
                  const rec = recommendations.find(r => r.type === type);
                  const size = WIDGET_SIZES[type as WidgetType];
                  const url = getOverlayUrl(id);
                  return (
                    <div key={type} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span>{rec?.emoji}</span>
                          <span className="font-medium text-sm">{rec?.name || type}</span>
                        </div>
                        {size && (
                          <span className="text-xs text-gray-500">
                            추천: {size.w} x {size.h}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <input
                          readOnly
                          value={url}
                          className="flex-1 bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-300 font-mono"
                        />
                        <button
                          onClick={() => handleCopyUrl(url, type)}
                          className="px-3 py-2 bg-purple-600 rounded-lg text-xs hover:bg-purple-700 whitespace-nowrap transition-colors"
                        >
                          {copiedUrl === type ? '복사됨!' : '복사'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {Object.keys(createdWidgetIds).length > 1 && (
                <button
                  onClick={handleCopyAllUrls}
                  className="w-full py-2.5 text-sm text-purple-400 hover:text-purple-300 border border-purple-800/50 rounded-lg hover:bg-purple-900/20 transition-all"
                >
                  모든 URL 복사
                </button>
              )}

              <div className="pt-4">
                <button
                  onClick={handleComplete}
                  className="w-full px-8 py-3 bg-purple-600 rounded-lg font-bold hover:bg-purple-700 text-sm transition-all"
                >
                  대시보드로 가기
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function WidgetRecommendationCard({
  rec,
  selected,
  onToggle,
}: {
  rec: WidgetRecommendation;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left flex items-center gap-4 ${
        selected
          ? 'border-purple-500 bg-purple-900/20'
          : 'border-gray-800 bg-gray-900 hover:border-gray-600'
      }`}
    >
      <span className="text-2xl flex-shrink-0">{rec.emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-sm">{rec.name}</h4>
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
            rec.priority === 'essential'
              ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-500/30'
              : 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
          }`}>
            {rec.reason}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-0.5">{rec.description}</p>
      </div>
      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
        selected
          ? 'border-purple-500 bg-purple-600'
          : 'border-gray-600'
      }`}>
        {selected && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
    </button>
  );
}

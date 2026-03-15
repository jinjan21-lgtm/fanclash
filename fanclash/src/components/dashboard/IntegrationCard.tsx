'use client';
import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import { isLiveRequired, getKoreanError } from '@/lib/integration-errors';
import type { Integration, PlatformType } from '@/types';

interface PlatformGuide {
  steps: string[];
  warning: string;
  faq: string;
}

const PLATFORM_INFO: Record<PlatformType, {
  label: string;
  icon: string;
  fields: { key: string; label: string; placeholder: string; type?: string }[];
  guide: PlatformGuide;
  liveRequired: boolean;
}> = {
  toonation: {
    label: '투네이션',
    icon: '🎵',
    liveRequired: false,
    fields: [
      { key: 'alertbox_key', label: 'Alert Box 키', placeholder: 'toonation alertbox URL의 키 값', type: 'password' },
    ],
    guide: {
      steps: [
        '투네이션(toonation.com)에 로그인합니다.',
        '우측 상단 프로필 아이콘 클릭 → "마이페이지"로 이동합니다.',
        '"위젯/알림" 메뉴에서 "Alert Box"를 선택합니다.',
        'Alert Box URL을 확인합니다. URL에서 key= 뒤의 값이 Alert Box 키입니다.',
        '예: https://toon.at/widget/alertbox/ABCDEF... → "ABCDEF..." 부분을 복사합니다.',
        '위 입력란에 붙여넣고 "저장" 버튼을 누릅니다.',
      ],
      warning: 'Alert Box 키는 절대 타인에게 공유하지 마세요. 키가 노출되면 투네이션에서 재발급하세요.',
      faq: '투네이션 후원이 들어오면 자동으로 FanClash 위젯에 반영됩니다. 기존 투네이션 알림과 동시에 사용 가능합니다.',
    },
  },
  tiktok: {
    label: '틱톡 라이브',
    icon: '🎵',
    liveRequired: true,
    fields: [
      { key: 'username', label: '틱톡 유저네임', placeholder: '@없이 유저네임 입력 (예: myuser.name)' },
    ],
    guide: {
      steps: [
        '틱톡 프로필에서 사용자 이름(유저네임)을 확인합니다.',
        '@ 기호 없이 유저네임만 입력합니다. 예: myusername',
        '"저장" 후 "연결" 버튼을 누릅니다.',
        '라이브 방송을 시작한 후 연결하세요.',
      ],
      warning: '틱톡 라이브가 켜져 있을 때만 연동됩니다. 방송 종료 시 연결이 끊기며, 다음 방송 시 다시 연결해주세요.',
      faq: '틱톡 선물(Gift)이 FanClash에 자동 반영됩니다. 다이아몬드는 한국 원화로 자동 환산됩니다 (1다이아 ≈ 7원).',
    },
  },
  streamlabs: {
    label: 'Streamlabs',
    icon: '🔴',
    liveRequired: false,
    fields: [
      { key: 'socket_token', label: 'Socket API Token', placeholder: 'Streamlabs API Settings에서 복사', type: 'password' },
    ],
    guide: {
      steps: [
        'Streamlabs(streamlabs.com)에 로그인합니다.',
        '좌측 메뉴에서 "Settings" → "API Settings"로 이동합니다.',
        '"API Tokens" 섹션에서 "Socket API Token"을 찾습니다.',
        '"Copy" 버튼을 눌러 토큰을 복사합니다.',
        '위 입력란에 붙여넣고 "저장" 버튼을 누릅니다.',
      ],
      warning: 'Socket API Token은 절대 타인에게 공유하지 마세요.',
      faq: 'Streamlabs를 통한 모든 후원이 자동 반영됩니다. USD, EUR 등 외화는 자동으로 원화 환산됩니다.',
    },
  },
  chzzk: {
    label: '치지직',
    icon: '🟢',
    liveRequired: true,
    fields: [
      { key: 'channel_id', label: '채널 ID', placeholder: '치지직 채널 ID' },
    ],
    guide: {
      steps: [
        '치지직(chzzk.naver.com)에서 내 채널로 이동합니다.',
        '채널 URL을 확인합니다.',
        '예: https://chzzk.naver.com/channel/abc123def... → "abc123def..." 부분이 채널 ID입니다.',
        '채널 ID를 위 입력란에 붙여넣고 "저장" 버튼을 누릅니다.',
        '"연결"을 누르면 라이브 방송 시 치즈 후원이 자동으로 감지됩니다.',
      ],
      warning: '라이브 방송 중일 때만 연동됩니다. 방송 시작 전 미리 연결해두세요.',
      faq: '치지직 치즈 후원이 실시간으로 FanClash 위젯에 반영됩니다.',
    },
  },
  soop: {
    label: '숲 (아프리카TV)',
    icon: '🌳',
    liveRequired: true,
    fields: [
      { key: 'bj_id', label: 'BJ 아이디', placeholder: '숲 BJ 아이디 입력' },
    ],
    guide: {
      steps: [
        '숲(sooplive.co.kr)에 로그인합니다.',
        '내 방송국으로 이동합니다.',
        '방송국 URL에서 BJ 아이디를 확인합니다.',
        '예: https://bj.sooplive.co.kr/mybjid → "mybjid" 부분이 BJ 아이디입니다.',
        'BJ 아이디를 위 입력란에 붙여넣고 "저장" 버튼을 누릅니다.',
        '"연결"을 누르면 라이브 방송 시 별풍선이 자동으로 감지됩니다.',
      ],
      warning: '라이브 방송 중일 때만 연동됩니다. 별풍선 1개 = 100원으로 환산됩니다.',
      faq: '숲 별풍선과 애드벌룬이 실시간으로 FanClash 위젯에 반영됩니다.',
    },
  },
};

interface Props {
  platform: PlatformType;
  integration: Integration | null;
  streamerId: string;
  onUpdate: () => void;
  onToggleConnection: (integration: Integration, connect: boolean) => void;
  error: string | null;
}

export default function IntegrationCard({ platform, integration, streamerId, onUpdate, onToggleConnection, error }: Props) {
  const info = PLATFORM_INFO[platform];
  const supabase = createClient();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [config, setConfig] = useState<Record<string, string>>(integration?.config || {});
  const [saving, setSaving] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [prevConnected, setPrevConnected] = useState(integration?.connected ?? false);
  const [timeoutError, setTimeoutError] = useState<string | null>(null);
  const connectTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [retryCount, setRetryCount] = useState(0);
  const [retrying, setRetrying] = useState(false);
  const MAX_RETRIES = 5;
  const RETRY_INTERVAL = 30000;
  const retryTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const retryCountRef = useRef(0);

  // 연결 상태 변경 감지 → 토스트 알림
  useEffect(() => {
    if (!integration) return;
    const curr = integration.connected;
    if (prevConnected && !curr && !connecting) {
      toast(`${info.label} 연결이 끊어졌습니다`, 'error');
    } else if (!prevConnected && curr) {
      toast(`${info.label} 연결되었습니다`, 'success');
    }
    setPrevConnected(curr);
  }, [integration?.connected]);

  // config 동기화
  useEffect(() => {
    if (integration?.config) setConfig(integration.config);
  }, [integration?.config]);

  const handleSave = async () => {
    setSaving(true);
    if (integration) {
      await supabase.from('integrations').update({ config, enabled: true }).eq('id', integration.id);
    } else {
      await supabase.from('integrations').insert({ streamer_id: streamerId, platform, config, enabled: true });
    }
    setSaving(false);
    setEditing(false);
    toast(`${info.label} 설정이 저장되었습니다`);
    onUpdate();
  };

  const handleDelete = async () => {
    if (!integration) return;
    if (integration.connected) {
      onToggleConnection(integration, false);
    }
    await supabase.from('integrations').delete().eq('id', integration.id);
    setConfig({});
    onUpdate();
  };

  const handleToggle = async () => {
    if (!integration) return;
    setTimeoutError(null);
    setRetryCount(0);
    retryCountRef.current = 0;
    setRetrying(false);
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    if (!integration.connected) {
      // Connecting: start 15s timeout
      setConnecting(true);
      onToggleConnection(integration, true);
      connectTimeoutRef.current = setTimeout(() => {
        setConnecting(false);
        setTimeoutError('플랫폼 서버가 응답하지 않습니다. 잠시 후 다시 시도해주세요.');
        startRetry();
      }, 15000);
    } else {
      // Disconnecting
      setConnecting(true);
      onToggleConnection(integration, false);
      setTimeout(() => setConnecting(false), 3000);
    }
  };

  // Auto-retry logic
  const startRetry = () => {
    if (!integration || retryCountRef.current >= MAX_RETRIES) {
      setRetrying(false);
      return;
    }
    setRetrying(true);
    retryTimerRef.current = setTimeout(() => {
      retryCountRef.current += 1;
      setRetryCount(retryCountRef.current);
      setTimeoutError(null);
      setConnecting(true);
      onToggleConnection(integration!, true);
      connectTimeoutRef.current = setTimeout(() => {
        setConnecting(false);
        setTimeoutError('플랫폼 서버가 응답하지 않습니다. 잠시 후 다시 시도해주세요.');
        // Chain next retry attempt
        startRetry();
      }, 15000);
    }, RETRY_INTERVAL);
  };

  // Clear timeout on successful connection & reset retry
  useEffect(() => {
    if (integration?.connected) {
      setConnecting(false);
      setTimeoutError(null);
      setRetryCount(0);
      retryCountRef.current = 0;
      setRetrying(false);
      if (connectTimeoutRef.current) clearTimeout(connectTimeoutRef.current);
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    }
  }, [integration?.connected]);

  // Clear timeout on error from parent & trigger retry
  useEffect(() => {
    if (error) {
      setConnecting(false);
      if (connectTimeoutRef.current) clearTimeout(connectTimeoutRef.current);
      startRetry();
    }
  }, [error]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (connectTimeoutRef.current) clearTimeout(connectTimeoutRef.current);
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, []);

  const isConfigured = info.fields.every(f => config[f.key]?.trim());

  // 상태별 배지 렌더링
  const renderStatus = () => {
    if (error || timeoutError) {
      return (
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
          </span>
          <span className="text-xs text-red-400">연결 실패</span>
        </div>
      );
    }
    if (connecting) {
      return (
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-yellow-500" />
          </span>
          <span className="text-xs text-yellow-400">연결 중...</span>
        </div>
      );
    }
    if (integration?.connected) {
      return (
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
          </span>
          <span className="text-xs text-green-400">연결됨</span>
        </div>
      );
    }
    if (integration) {
      return (
        <div className="flex items-center gap-1.5">
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-gray-500" />
          <span className="text-xs text-gray-400">미연결</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5">
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-gray-600" />
        <span className="text-xs text-gray-500">미설정</span>
      </div>
    );
  };

  return (
    <div className={`bg-gray-800 rounded-xl p-5 border transition-colors ${
      (error || timeoutError) ? 'border-red-700/50' :
      integration?.connected ? 'border-green-700/50' :
      'border-gray-700'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{info.icon}</span>
          <div>
            <h3 className="font-bold text-lg">
              {info.label}
              {isLiveRequired(platform) && (
                <span className="ml-2 px-1.5 py-0.5 bg-red-600/20 text-red-400 text-[10px] font-bold rounded">
                  LIVE 필수
                </span>
              )}
            </h3>
            {renderStatus()}
          </div>
        </div>
        {integration && !editing && (
          <div className="flex gap-2">
            <button
              onClick={handleToggle}
              disabled={connecting || !isConfigured}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                integration.connected
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              } disabled:opacity-50`}
            >
              {connecting ? '연결 중...' : integration.connected ? '연결 해제' : '연결'}
            </button>
          </div>
        )}
      </div>

      {/* 에러 메시지 표시 */}
      {(error || timeoutError) && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-700/50 rounded-lg">
          <p className="text-sm text-red-300 font-medium mb-1">연결 오류</p>
          <p className="text-xs text-red-400">
            {timeoutError || getKoreanError(platform, error!)}
          </p>
          {info.liveRequired && (
            <p className="text-xs text-red-400/70 mt-1">
              라이브 방송 중인지 확인 후 다시 연결해주세요.
            </p>
          )}
          {retrying && (
            <p className="text-xs text-yellow-400 mt-1">
              재연결 중... ({retryCount}/{MAX_RETRIES})
            </p>
          )}
          {!retrying && retryCount >= MAX_RETRIES && (
            <p className="text-xs text-red-400 mt-1">
              자동 재연결 실패. 수동으로 다시 시도해주세요.
            </p>
          )}
        </div>
      )}

      {/* 라이브 필요 플랫폼 안내 */}
      {integration && !integration.connected && !error && !timeoutError && !editing && info.liveRequired && (
        <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-700/30 rounded-lg">
          <p className="text-xs text-yellow-300/80">
            라이브 방송을 시작한 후 "연결" 버튼을 눌러주세요. 방송 종료 시 자동으로 연결이 해제됩니다.
          </p>
        </div>
      )}

      {editing ? (
        <div className="space-y-3">
          {info.fields.map(field => (
            <div key={field.key}>
              <label className="block text-sm text-gray-400 mb-1">{field.label}</label>
              <input
                type={field.type || 'text'}
                value={config[field.key] || ''}
                onChange={e => setConfig({ ...config, [field.key]: e.target.value })}
                placeholder={field.placeholder}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
              />
            </div>
          ))}
          <div className="flex gap-2 pt-2">
            <button onClick={handleSave} disabled={saving || !isConfigured}
              className="px-4 py-2 bg-purple-600 rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50">
              {saving ? '저장 중...' : '저장'}
            </button>
            <button onClick={() => { setEditing(false); setConfig(integration?.config || {}); }}
              className="px-4 py-2 bg-gray-700 rounded-lg text-sm hover:bg-gray-600">
              취소
            </button>
            {integration && (
              <button onClick={handleDelete}
                className="px-4 py-2 bg-red-900 rounded-lg text-sm hover:bg-red-800 ml-auto">
                삭제
              </button>
            )}
          </div>
        </div>
      ) : (
        <div>
          {integration ? (
            <div className="space-y-1 text-sm text-gray-400">
              {info.fields.map(field => (
                <div key={field.key}>
                  {field.label}: {field.type === 'password' ? '••••••••' : config[field.key] || '-'}
                </div>
              ))}
              <button onClick={() => setEditing(true)}
                className="mt-3 text-purple-400 hover:text-purple-300 text-sm">
                설정 변경
              </button>
            </div>
          ) : (
            <button onClick={() => { setEditing(true); setShowGuide(true); }}
              className="w-full py-3 border-2 border-dashed border-gray-600 rounded-lg text-gray-400 hover:border-purple-500 hover:text-purple-400 transition-colors">
              + 연동 설정하기
            </button>
          )}
        </div>
      )}

      {/* Guide section */}
      <div className="mt-4 border-t border-gray-700 pt-3">
        <button
          onClick={() => setShowGuide(!showGuide)}
          className="text-sm text-gray-400 hover:text-gray-300 flex items-center gap-1"
        >
          <span className={`transition-transform ${showGuide ? 'rotate-90' : ''}`}>▸</span>
          연동 가이드
        </button>
        {showGuide && (
          <div className="mt-3 space-y-3 text-sm">
            <ol className="space-y-2 text-gray-300">
              {info.guide.steps.map((step, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-purple-400 font-bold shrink-0">{i + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <div className="p-2 bg-yellow-900/30 border border-yellow-700/50 rounded text-yellow-300 text-xs">
              ⚠️ {info.guide.warning}
            </div>
            <div className="p-2 bg-blue-900/30 border border-blue-700/50 rounded text-blue-300 text-xs">
              💡 {info.guide.faq}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

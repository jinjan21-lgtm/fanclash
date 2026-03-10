'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import type { Integration, PlatformType } from '@/types';

const PLATFORM_INFO: Record<PlatformType, { label: string; icon: string; fields: { key: string; label: string; placeholder: string; type?: string }[] }> = {
  toonation: {
    label: '투네이션',
    icon: '🎵',
    fields: [
      { key: 'alertbox_key', label: 'Alert Box 키', placeholder: 'toonation alertbox URL의 키 값', type: 'password' },
    ],
  },
  tiktok: {
    label: '틱톡 라이브',
    icon: '🎵',
    fields: [
      { key: 'username', label: '틱톡 유저네임', placeholder: '@없이 유저네임 입력' },
    ],
  },
  streamlabs: {
    label: 'Streamlabs',
    icon: '🔴',
    fields: [
      { key: 'socket_token', label: 'Socket API Token', placeholder: 'Streamlabs API Settings에서 복사', type: 'password' },
    ],
  },
  chzzk: {
    label: '치지직',
    icon: '🟢',
    fields: [
      { key: 'channel_id', label: '채널 ID', placeholder: '치지직 채널 ID' },
    ],
  },
};

interface Props {
  platform: PlatformType;
  integration: Integration | null;
  streamerId: string;
  onUpdate: () => void;
  onToggleConnection: (integration: Integration, connect: boolean) => void;
}

export default function IntegrationCard({ platform, integration, streamerId, onUpdate, onToggleConnection }: Props) {
  const info = PLATFORM_INFO[platform];
  const supabase = createClient();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [config, setConfig] = useState<Record<string, string>>(integration?.config || {});
  const [saving, setSaving] = useState(false);
  const [connecting, setConnecting] = useState(false);

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
    setConnecting(true);
    onToggleConnection(integration, !integration.connected);
    setTimeout(() => setConnecting(false), 1500);
  };

  const isConfigured = info.fields.every(f => config[f.key]?.trim());

  return (
    <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{info.icon}</span>
          <div>
            <h3 className="font-bold text-lg">{info.label}</h3>
            {integration?.connected ? (
              <span className="text-xs text-green-400">● 연결됨</span>
            ) : integration ? (
              <span className="text-xs text-yellow-400">● 설정됨 (미연결)</span>
            ) : (
              <span className="text-xs text-gray-500">● 미설정</span>
            )}
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
              {connecting ? '...' : integration.connected ? '연결 해제' : '연결'}
            </button>
          </div>
        )}
      </div>

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
            <button onClick={() => setEditing(true)}
              className="w-full py-3 border-2 border-dashed border-gray-600 rounded-lg text-gray-400 hover:border-purple-500 hover:text-purple-400 transition-colors">
              + 연동 설정하기
            </button>
          )}
        </div>
      )}
    </div>
  );
}

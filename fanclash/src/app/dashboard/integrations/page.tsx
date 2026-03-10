'use client';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { io, Socket } from 'socket.io-client';
import IntegrationCard from '@/components/dashboard/IntegrationCard';
import type { Integration, PlatformType } from '@/types';

const PLATFORMS: PlatformType[] = ['toonation', 'tiktok', 'streamlabs', 'chzzk'];

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [streamerId, setStreamerId] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const s = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001');
    setSocket(s);
    return () => { s.disconnect(); };
  }, []);

  const fetchIntegrations = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setStreamerId(user.id);
    const { data } = await supabase.from('integrations').select('*').eq('streamer_id', user.id);
    setIntegrations(data || []);
  }, [supabase]);

  useEffect(() => { fetchIntegrations(); }, [fetchIntegrations]);

  const handleToggleConnection = (integration: Integration, connect: boolean) => {
    if (!socket) return;
    if (connect) {
      socket.emit('integration:start', {
        integration_id: integration.id,
        streamer_id: integration.streamer_id,
        platform: integration.platform,
        config: integration.config,
      });
      supabase.from('integrations').update({ connected: true }).eq('id', integration.id).then(() => fetchIntegrations());
    } else {
      socket.emit('integration:stop', { integration_id: integration.id });
      supabase.from('integrations').update({ connected: false }).eq('id', integration.id).then(() => fetchIntegrations());
    }
  };

  if (!streamerId) return <div className="text-gray-400">로딩 중...</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">연동 설정</h2>
      <p className="text-gray-400 mb-6">
        외부 후원 플랫폼을 연동하면 도네이션이 자동으로 수집됩니다.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PLATFORMS.map(platform => (
          <IntegrationCard
            key={platform}
            platform={platform}
            integration={integrations.find(i => i.platform === platform) || null}
            streamerId={streamerId}
            onUpdate={fetchIntegrations}
            onToggleConnection={handleToggleConnection}
          />
        ))}
      </div>
      <div className="mt-8 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
        <h3 className="font-bold mb-2 text-sm">연동 가이드</h3>
        <ul className="text-sm text-gray-400 space-y-1">
          <li>• <strong>투네이션</strong>: 투네이션 &gt; 알림설정 &gt; Alert Box URL에서 키 값을 복사하세요</li>
          <li>• <strong>틱톡 라이브</strong>: 틱톡 유저네임을 입력하세요 (라이브 중일 때만 연동됩니다)</li>
          <li>• <strong>Streamlabs</strong>: Streamlabs &gt; API Settings &gt; Socket API Token을 복사하세요</li>
          <li>• <strong>치지직</strong>: 준비 중입니다 (곧 지원 예정)</li>
        </ul>
      </div>
    </div>
  );
}

'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { io, Socket } from 'socket.io-client';
import IntegrationCard from '@/components/dashboard/IntegrationCard';
import type { Integration, PlatformType } from '@/types';

const PLATFORMS: PlatformType[] = ['toonation', 'tiktok', 'streamlabs', 'chzzk', 'soop'];
const POLL_INTERVAL = 5000; // 5초마다 상태 갱신

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [streamerId, setStreamerId] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [integrationErrors, setIntegrationErrors] = useState<Record<string, string>>({});
  const supabase = createClient();
  const pollRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
    if (!socketUrl) return;
    const s = io(socketUrl, {
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });
    setSocket(s);

    s.on('integration:error', (data: { integration_id: string; platform: string; message: string }) => {
      setIntegrationErrors(prev => ({ ...prev, [data.platform]: data.message }));
    });

    // 서버에서 연결 상태 변경 시 즉시 반영
    s.on('integration:status', (data: { integration_id: string; platform: string; connected: boolean }) => {
      setIntegrations(prev => prev.map(i =>
        i.id === data.integration_id ? { ...i, connected: data.connected } : i
      ));
      if (data.connected) {
        setIntegrationErrors(prev => {
          const next = { ...prev };
          delete next[data.platform];
          return next;
        });
      }
    });

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

  // 주기적으로 연결 상태 폴링
  useEffect(() => {
    if (!streamerId) return;
    pollRef.current = setInterval(async () => {
      const { data } = await supabase.from('integrations').select('*').eq('streamer_id', streamerId);
      if (data) setIntegrations(data);
    }, POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, [streamerId, supabase]);

  const handleToggleConnection = (integration: Integration, connect: boolean) => {
    if (!socket) return;
    if (connect) {
      setIntegrationErrors(prev => {
        const next = { ...prev };
        delete next[integration.platform];
        return next;
      });
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
            onUpdate={() => {
              fetchIntegrations();
              setIntegrationErrors(prev => {
                const next = { ...prev };
                delete next[platform];
                return next;
              });
            }}
            onToggleConnection={handleToggleConnection}
            error={integrationErrors[platform] || null}
          />
        ))}
      </div>
    </div>
  );
}

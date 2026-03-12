'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const PLATFORM_LABELS: Record<string, string> = {
  toonation: '투네이션',
  tiktok: '틱톡',
  streamlabs: '스트림랩스',
  chzzk: '치지직',
  soop: '숲',
};

type IntegrationStatus = { platform: string; connected: boolean };

export default function ConnectionStatus() {
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('integrations')
      .select('platform, connected')
      .eq('streamer_id', user.id);
    setIntegrations(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return null;

  const configured = integrations.length;
  const connected = integrations.filter(i => i.connected).length;

  if (configured === 0) {
    return (
      <div className="flex items-center gap-2 bg-gray-900 rounded-xl px-4 py-2 border border-gray-700 text-xs text-gray-500">
        연동된 플랫폼 없음
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 bg-gray-900 rounded-xl px-4 py-2 border border-gray-800">
      <div className="flex items-center gap-2">
        {integrations.map(i => (
          <div key={i.platform} className="flex items-center gap-1.5" title={`${PLATFORM_LABELS[i.platform] || i.platform}: ${i.connected ? '연결됨' : '끊김'}`}>
            <span className={`inline-block w-2 h-2 rounded-full ${i.connected ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className={`text-xs ${i.connected ? 'text-green-400' : 'text-gray-500'}`}>
              {PLATFORM_LABELS[i.platform] || i.platform}
            </span>
          </div>
        ))}
      </div>
      <span className="text-xs text-gray-600 border-l border-gray-700 pl-3">
        {connected}/{configured}
      </span>
    </div>
  );
}

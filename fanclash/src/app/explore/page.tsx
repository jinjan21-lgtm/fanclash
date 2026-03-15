import { createClient } from '@/lib/supabase/server';
import type { Metadata } from 'next';
import ExploreGrid from '@/components/explore/ExploreGrid';

export const metadata: Metadata = {
  title: 'FanClash 크리에이터 둘러보기',
  description: '인기 스트리머들의 위젯을 구경하세요. FanClash를 사용하는 크리에이터들을 만나보세요.',
  openGraph: {
    title: 'FanClash 크리에이터 둘러보기',
    description: '인기 스트리머들의 위젯을 구경하세요.',
    type: 'website',
  },
};

export interface StreamerCard {
  id: string;
  display_name: string;
  widget_count: number;
  widget_types: string[];
  fan_count: number;
  donation_count: number;
  last_activity: string | null;
}

export default async function ExplorePage() {
  const supabase = await createClient();

  // Fetch all streamers
  const { data: streamers } = await supabase
    .from('streamers')
    .select('id, display_name, created_at');

  if (!streamers || streamers.length === 0) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <div className="max-w-6xl mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl font-black mb-4">FanClash 크리에이터 둘러보기</h1>
          <p className="text-gray-400 text-lg">아직 등록된 크리에이터가 없습니다.</p>
          <a href="/signup" className="inline-block mt-8 px-8 py-3 bg-purple-600 rounded-xl font-bold hover:bg-purple-700">
            나도 FanClash 시작하기
          </a>
        </div>
      </div>
    );
  }

  // Fetch widgets for all streamers
  const { data: widgets } = await supabase
    .from('widgets')
    .select('streamer_id, type, enabled');

  // Fetch fan counts
  const { data: fanProfiles } = await supabase
    .from('fan_profiles')
    .select('streamer_id, nickname');

  // Fetch donation counts
  const { data: donations } = await supabase
    .from('donations')
    .select('streamer_id, created_at');

  // Build streamer cards
  const streamerCards: StreamerCard[] = streamers
    .map(s => {
      const sWidgets = (widgets || []).filter(w => w.streamer_id === s.id && w.enabled);
      const sFans = (fanProfiles || []).filter(f => f.streamer_id === s.id);
      const uniqueFans = new Set(sFans.map(f => f.nickname));
      const sDonations = (donations || []).filter(d => d.streamer_id === s.id);
      const lastDonation = sDonations.length > 0
        ? sDonations.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
        : null;
      const widgetTypes = [...new Set(sWidgets.map(w => w.type))];

      return {
        id: s.id,
        display_name: s.display_name,
        widget_count: sWidgets.length,
        widget_types: widgetTypes,
        fan_count: uniqueFans.size,
        donation_count: sDonations.length,
        last_activity: lastDonation,
      };
    })
    .filter(s => s.widget_count > 0) // only show streamers with at least 1 enabled widget
    .sort((a, b) => {
      // Sort by last activity (most recent first)
      if (!a.last_activity && !b.last_activity) return 0;
      if (!a.last_activity) return 1;
      if (!b.last_activity) return -1;
      return new Date(b.last_activity).getTime() - new Date(a.last_activity).getTime();
    });

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Hero */}
      <header className="bg-gradient-to-b from-purple-900/30 to-gray-950 border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl md:text-5xl font-black mb-4">
            FanClash 크리에이터 둘러보기
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            인기 스트리머들의 위젯을 구경하세요
          </p>
        </div>
      </header>

      {/* Grid */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <ExploreGrid streamers={streamerCards} />
      </main>

      {/* Footer CTA */}
      <footer className="border-t border-gray-800 bg-gray-900/50">
        <div className="max-w-6xl mx-auto px-4 py-12 text-center">
          <h2 className="text-2xl font-bold mb-3">나도 FanClash 시작하기</h2>
          <p className="text-gray-400 mb-6">무료로 시작하고, 팬들과 인터랙티브한 경험을 만들어보세요.</p>
          <a href="/signup"
            className="inline-block px-8 py-3 bg-purple-600 rounded-xl font-bold hover:bg-purple-700 transition-colors">
            무료로 시작하기
          </a>
        </div>
      </footer>

      {/* Back to home */}
      <div className="text-center py-4">
        <a href="/" className="text-gray-600 text-sm hover:text-gray-400 transition-colors">
          FanClash 홈으로
        </a>
      </div>
    </div>
  );
}

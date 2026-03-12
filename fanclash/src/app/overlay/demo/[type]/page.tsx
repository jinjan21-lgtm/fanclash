'use client';
import { use } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import RankingBoard from '@/components/overlay/RankingBoard';
import ThroneAlert from '@/components/overlay/ThroneAlert';
import DonationGoal from '@/components/overlay/DonationGoal';
import AffinityBadge from '@/components/overlay/AffinityBadge';
import BattleArena from '@/components/overlay/BattleArena';
import TeamBattle from '@/components/overlay/TeamBattle';
import EventTimer from '@/components/overlay/EventTimer';
import MessageBoard from '@/components/overlay/MessageBoard';
import DonationAlert from '@/components/overlay/DonationAlert';
import DonationRoulette from '@/components/overlay/DonationRoulette';
import type { Widget, WidgetType } from '@/types';

const DEMO_WIDGET: Omit<Widget, 'type'> = {
  id: 'demo',
  streamer_id: 'demo',
  enabled: true,
  config: {},
  theme: 'modern',
  created_at: new Date().toISOString(),
};

export default function DemoOverlayPage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = use(params);
  const widgetType = type as WidgetType;
  const widget = { ...DEMO_WIDGET, type: widgetType } as Widget;
  const props = { widget, preview: true };

  const WidgetComponent = () => {
    switch (widgetType) {
      case 'ranking': return <RankingBoard {...props} />;
      case 'throne': return <ThroneAlert {...props} />;
      case 'goal': return <DonationGoal {...props} />;
      case 'affinity': return <AffinityBadge {...props} />;
      case 'battle': return <BattleArena {...props} />;
      case 'team_battle': return <TeamBattle {...props} />;
      case 'timer': return <EventTimer {...props} />;
      case 'messages': return <MessageBoard {...props} />;
      case 'alert': return <DonationAlert {...props} />;
      case 'roulette': return <DonationRoulette {...props} />;
      default: return null;
    }
  };

  return (
    <ErrorBoundary fallback={<div className="bg-transparent" />}>
      <div className="widget-container">
        <WidgetComponent />
      </div>
    </ErrorBoundary>
  );
}

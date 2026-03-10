'use client';
import { use } from 'react';
import { useWidget } from '@/hooks/useWidget';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import RankingBoard from '@/components/overlay/RankingBoard';
import ThroneAlert from '@/components/overlay/ThroneAlert';
import DonationGoal from '@/components/overlay/DonationGoal';
import AffinityBadge from '@/components/overlay/AffinityBadge';
import BattleArena from '@/components/overlay/BattleArena';
import TeamBattle from '@/components/overlay/TeamBattle';
import EventTimer from '@/components/overlay/EventTimer';
import MessageBoard from '@/components/overlay/MessageBoard';

export default function OverlayPage({ params }: { params: Promise<{ widgetId: string }> }) {
  const { widgetId } = use(params);
  const widget = useWidget(widgetId);

  if (!widget) return <div className="bg-transparent" />;

  const props = { widget };

  const WidgetComponent = () => {
    switch (widget.type) {
      case 'ranking': return <RankingBoard {...props} />;
      case 'throne': return <ThroneAlert {...props} />;
      case 'goal': return <DonationGoal {...props} />;
      case 'affinity': return <AffinityBadge {...props} />;
      case 'battle': return <BattleArena {...props} />;
      case 'team_battle': return <TeamBattle {...props} />;
      case 'timer': return <EventTimer {...props} />;
      case 'messages': return <MessageBoard {...props} />;
      default: return null;
    }
  };

  return (
    <ErrorBoundary fallback={<div className="bg-transparent" />}>
      <WidgetComponent />
    </ErrorBoundary>
  );
}

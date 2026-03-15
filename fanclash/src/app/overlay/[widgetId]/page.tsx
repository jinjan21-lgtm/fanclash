'use client';
import { use, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
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
import DonationAlert from '@/components/overlay/DonationAlert';
import DonationRoulette from '@/components/overlay/DonationRoulette';
import DonationMusic from '@/components/overlay/DonationMusic';
import DonationGacha from '@/components/overlay/DonationGacha';
import DonationPhysics from '@/components/overlay/DonationPhysics';
import DonationTerritory from '@/components/overlay/DonationTerritory';
import DonationWeather from '@/components/overlay/DonationWeather';
import DonationTrain from '@/components/overlay/DonationTrain';
import DonationSlots from '@/components/overlay/DonationSlots';
import DonationMeter from '@/components/overlay/DonationMeter';
import DonationQuiz from '@/components/overlay/DonationQuiz';
import DonationRPG from '@/components/overlay/DonationRPG';
import { sanitizeCSS } from '@/lib/sanitize-css';

export default function OverlayPage({ params }: { params: Promise<{ widgetId: string }> }) {
  const { widgetId } = use(params);
  const searchParams = useSearchParams();
  const preview = searchParams.get('preview') === 'true';
  const widget = useWidget(widgetId);

  if (!widget) return <div className="bg-transparent" />;

  const props = { widget, preview };

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
      case 'alert': return <DonationAlert {...props} />;
      case 'roulette': return <DonationRoulette {...props} />;
      case 'music': return <DonationMusic widgetId={widgetId} config={widget.config as Record<string, unknown>} />;
      case 'gacha': return <DonationGacha widgetId={widgetId} config={widget.config as Record<string, unknown>} />;
      case 'physics': return <DonationPhysics widgetId={widgetId} config={widget.config as Record<string, unknown>} />;
      case 'territory': return <DonationTerritory widgetId={widgetId} config={widget.config as Record<string, unknown>} />;
      case 'weather': return <DonationWeather widgetId={widgetId} config={widget.config as Record<string, unknown>} />;
      case 'train': return <DonationTrain widgetId={widgetId} config={widget.config as Record<string, unknown>} />;
      case 'slots': return <DonationSlots widgetId={widgetId} config={widget.config as Record<string, unknown>} />;
      case 'meter': return <DonationMeter widgetId={widgetId} config={widget.config as Record<string, unknown>} />;
      case 'quiz': return <DonationQuiz widgetId={widgetId} config={widget.config as Record<string, unknown>} />;
      case 'rpg': return <DonationRPG widgetId={widgetId} config={widget.config as Record<string, unknown>} />;
      default: return null;
    }
  };

  const customCss = sanitizeCSS(
    (widget.config as Record<string, unknown>)?.customCss as string ?? ''
  );

  // Inject custom CSS via DOM API instead of dangerouslySetInnerHTML
  useEffect(() => {
    if (!customCss) return;
    const style = document.createElement('style');
    style.textContent = customCss;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, [customCss]);

  return (
    <ErrorBoundary fallback={<div className="bg-transparent" />}>
      <div className="widget-container">
        <WidgetComponent />
      </div>
    </ErrorBoundary>
  );
}

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
import DonationMusic from '@/components/overlay/DonationMusic';
import DonationGacha from '@/components/overlay/DonationGacha';
import DonationPhysics from '@/components/overlay/DonationPhysics';
import DonationTerritory from '@/components/overlay/DonationTerritory';
import DonationWeather from '@/components/overlay/DonationWeather';
import DonationTrain from '@/components/overlay/DonationTrain';
import DonationSlots from '@/components/overlay/DonationSlots';
import DonationMeter from '@/components/overlay/DonationMeter';
import DonationQuiz from '@/components/overlay/DonationQuiz';
import { useEffect, useRef } from 'react';
import type { Widget, WidgetType } from '@/types';

// Demo component for DonationMusic — simulates random donations
function DonationMusicDemo() {
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const DEMO_NAMES = ['별빛팬', '후원왕', '새벽감성', '치킨러버', '고래밥', '불꽃소녀', '달빛기사'];
  const DEMO_AMOUNTS = [1000, 2000, 3000, 5000, 10000, 20000, 50000];

  useEffect(() => {
    // Auto-play demo donations every 2-4 seconds
    const play = () => {
      const music = (window as unknown as Record<string, { playDonation: (a: number, n: string) => void }>).__donationMusic;
      if (music?.playDonation) {
        const name = DEMO_NAMES[Math.floor(Math.random() * DEMO_NAMES.length)];
        const amount = DEMO_AMOUNTS[Math.floor(Math.random() * DEMO_AMOUNTS.length)];
        music.playDonation(amount, name);
      }
    };

    // First play after 1s
    const timeout = setTimeout(() => {
      play();
      intervalRef.current = setInterval(play, 2000 + Math.random() * 2000);
    }, 1000);

    return () => {
      clearTimeout(timeout);
      clearInterval(intervalRef.current);
    };
  }, []);

  return <DonationMusic config={{ volume: 70, showVisual: true }} />;
}

// Demo component for DonationGacha — simulates random gacha pulls
function DonationGachaDemo() {
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const DEMO_NAMES = ['별빛팬', '후원왕', '새벽감성', '치킨러버', '고래밥', '불꽃소녀', '달빛기사'];
  const DEMO_AMOUNTS = [1000, 2000, 3000, 5000, 10000, 20000, 50000];

  useEffect(() => {
    const pull = () => {
      const gacha = (window as unknown as Record<string, { triggerGacha: (a: number, n: string) => void }>).__donationGacha;
      if (gacha?.triggerGacha) {
        const name = DEMO_NAMES[Math.floor(Math.random() * DEMO_NAMES.length)];
        const amount = DEMO_AMOUNTS[Math.floor(Math.random() * DEMO_AMOUNTS.length)];
        gacha.triggerGacha(amount, name);
      }
    };

    const timeout = setTimeout(() => {
      pull();
      intervalRef.current = setInterval(pull, 3000 + Math.random() * 1000);
    }, 1000);

    return () => {
      clearTimeout(timeout);
      clearInterval(intervalRef.current);
    };
  }, []);

  return <DonationGacha config={{}} />;
}

// Demo component for DonationPhysics — simulates random drops
function DonationPhysicsDemo() {
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const DEMO_NAMES = ['별빛팬', '후원왕', '새벽감성', '치킨러버', '고래밥', '불꽃소녀', '달빛기사'];
  const DEMO_AMOUNTS = [1000, 2000, 3000, 5000, 10000, 20000, 50000];

  useEffect(() => {
    const drop = () => {
      const physics = (window as unknown as Record<string, { triggerDrop: (a: number, n: string) => void }>).__donationPhysics;
      if (physics?.triggerDrop) {
        const name = DEMO_NAMES[Math.floor(Math.random() * DEMO_NAMES.length)];
        const amount = DEMO_AMOUNTS[Math.floor(Math.random() * DEMO_AMOUNTS.length)];
        physics.triggerDrop(amount, name);
      }
    };

    const timeout = setTimeout(() => {
      drop();
      intervalRef.current = setInterval(drop, 2000 + Math.random() * 2000);
    }, 1000);

    return () => {
      clearTimeout(timeout);
      clearInterval(intervalRef.current);
    };
  }, []);

  return <DonationPhysics config={{}} />;
}

// Demo component for DonationTerritory — simulates random claims
function DonationTerritoryDemo() {
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const DEMO_NAMES = ['별빛팬', '후원왕', '새벽감성', '치킨러버', '고래밥', '불꽃소녀', '달빛기사'];
  const DEMO_AMOUNTS = [1000, 2000, 3000, 5000, 10000, 20000, 50000];

  useEffect(() => {
    const claim = () => {
      const territory = (window as unknown as Record<string, { triggerClaim: (a: number, n: string) => void }>).__donationTerritory;
      if (territory?.triggerClaim) {
        const name = DEMO_NAMES[Math.floor(Math.random() * DEMO_NAMES.length)];
        const amount = DEMO_AMOUNTS[Math.floor(Math.random() * DEMO_AMOUNTS.length)];
        territory.triggerClaim(amount, name);
      }
    };

    const timeout = setTimeout(() => {
      claim();
      intervalRef.current = setInterval(claim, 2000 + Math.random() * 2000);
    }, 1000);

    return () => {
      clearTimeout(timeout);
      clearInterval(intervalRef.current);
    };
  }, []);

  return <DonationTerritory config={{}} />;
}

// Demo component for DonationWeather — simulates random donations
function DonationWeatherDemo() {
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const DEMO_NAMES = ['별빛팬', '후원왕', '새벽감성', '치킨러버', '고래밥', '불꽃소녀', '달빛기사'];
  const DEMO_AMOUNTS = [1000, 2000, 3000, 5000, 10000, 20000, 50000];

  useEffect(() => {
    const donate = () => {
      const weather = (window as unknown as Record<string, { addDonation: (a: number, n: string) => void }>).__donationWeather;
      if (weather?.addDonation) {
        const name = DEMO_NAMES[Math.floor(Math.random() * DEMO_NAMES.length)];
        const amount = DEMO_AMOUNTS[Math.floor(Math.random() * DEMO_AMOUNTS.length)];
        weather.addDonation(amount, name);
      }
    };

    const timeout = setTimeout(() => {
      donate();
      intervalRef.current = setInterval(donate, 2000 + Math.random() * 2000);
    }, 1000);

    return () => {
      clearTimeout(timeout);
      clearInterval(intervalRef.current);
    };
  }, []);

  return <DonationWeather config={{}} />;
}

// Demo component for DonationTrain — simulates rapid consecutive donations
function DonationTrainDemo() {
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const DEMO_NAMES = ['별빛팬', '후원왕', '새벽감성', '치킨러버', '고래밥', '불꽃소녀', '달빛기사'];
  const DEMO_AMOUNTS = [1000, 2000, 3000, 5000, 10000];

  useEffect(() => {
    const trigger = () => {
      const train = (window as unknown as Record<string, { triggerDonation: (a: number, n: string) => void }>).__donationTrain;
      if (train?.triggerDonation) {
        const name = DEMO_NAMES[Math.floor(Math.random() * DEMO_NAMES.length)];
        const amount = DEMO_AMOUNTS[Math.floor(Math.random() * DEMO_AMOUNTS.length)];
        train.triggerDonation(amount, name);
      }
    };

    const timeout = setTimeout(() => {
      trigger();
      intervalRef.current = setInterval(trigger, 2000 + Math.random() * 2000);
    }, 1000);

    return () => {
      clearTimeout(timeout);
      clearInterval(intervalRef.current);
    };
  }, []);

  return <DonationTrain config={{}} />;
}

// Demo component for DonationSlots — simulates slot spins
function DonationSlotsDemo() {
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const DEMO_NAMES = ['별빛팬', '후원왕', '새벽감성', '치킨러버', '고래밥', '불꽃소녀', '달빛기사'];
  const DEMO_AMOUNTS = [1000, 5000, 10000, 20000, 50000];

  useEffect(() => {
    const trigger = () => {
      const slots = (window as unknown as Record<string, { triggerSpin: (a: number, n: string) => void }>).__donationSlots;
      if (slots?.triggerSpin) {
        const name = DEMO_NAMES[Math.floor(Math.random() * DEMO_NAMES.length)];
        const amount = DEMO_AMOUNTS[Math.floor(Math.random() * DEMO_AMOUNTS.length)];
        slots.triggerSpin(amount, name);
      }
    };

    const timeout = setTimeout(() => {
      trigger();
      intervalRef.current = setInterval(trigger, 4000 + Math.random() * 2000);
    }, 1000);

    return () => {
      clearTimeout(timeout);
      clearInterval(intervalRef.current);
    };
  }, []);

  return <DonationSlots config={{}} />;
}

// Demo component for DonationMeter — simulates donations building up
function DonationMeterDemo() {
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const DEMO_NAMES = ['별빛팬', '후원왕', '새벽감성', '치킨러버', '고래밥', '불꽃소녀', '달빛기사'];
  const DEMO_AMOUNTS = [1000, 2000, 3000, 5000, 10000, 20000];

  useEffect(() => {
    const trigger = () => {
      const meter = (window as unknown as Record<string, { addDonation: (a: number, n: string) => void }>).__donationMeter;
      if (meter?.addDonation) {
        const name = DEMO_NAMES[Math.floor(Math.random() * DEMO_NAMES.length)];
        const amount = DEMO_AMOUNTS[Math.floor(Math.random() * DEMO_AMOUNTS.length)];
        meter.addDonation(amount, name);
      }
    };

    const timeout = setTimeout(() => {
      trigger();
      intervalRef.current = setInterval(trigger, 2000 + Math.random() * 2000);
    }, 1000);

    return () => {
      clearTimeout(timeout);
      clearInterval(intervalRef.current);
    };
  }, []);

  return <DonationMeter config={{}} />;
}

// Demo component for DonationQuiz — simulates a quiz session
function DonationQuizDemo() {
  const DEMO_NAMES = ['별빛팬', '후원왕', '새벽감성', '치킨러버', '고래밥', '불꽃소녀', '달빛기사'];
  const DEMO_AMOUNTS = [1000, 2000, 3000, 5000, 10000];

  useEffect(() => {
    const timeout = setTimeout(() => {
      const quiz = (window as unknown as Record<string, { startQuiz: (q: string, a: string, t: number) => void; handleDonation: (n: string, a: number, m?: string) => void }>).__donationQuiz;
      if (quiz?.startQuiz) {
        quiz.startQuiz('스트리머가 좋아하는 음식은?', '치킨', 30);
        // Simulate donations with answers
        let count = 0;
        const interval = setInterval(() => {
          if (count >= 5) { clearInterval(interval); return; }
          const name = DEMO_NAMES[Math.floor(Math.random() * DEMO_NAMES.length)];
          const amount = DEMO_AMOUNTS[Math.floor(Math.random() * DEMO_AMOUNTS.length)];
          const answers = ['피자', '치킨', '햄버거', '치킨', '라면'];
          quiz.handleDonation(name, amount, answers[count]);
          count++;
        }, 3000);
      }
    }, 1000);
    return () => clearTimeout(timeout);
  }, []);

  return <DonationQuiz config={{}} />;
}

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
      case 'music': return <DonationMusicDemo />;
      case 'gacha': return <DonationGachaDemo />;
      case 'physics': return <DonationPhysicsDemo />;
      case 'territory': return <DonationTerritoryDemo />;
      case 'weather': return <DonationWeatherDemo />;
      case 'train': return <DonationTrainDemo />;
      case 'slots': return <DonationSlotsDemo />;
      case 'meter': return <DonationMeterDemo />;
      case 'quiz': return <DonationQuizDemo />;
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

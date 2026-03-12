'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import WidgetCard from '@/components/dashboard/WidgetCard';
import { canCreateWidget } from '@/lib/plan';
import type { Widget, WidgetType } from '@/types';

const ALL_WIDGET_TYPES: WidgetType[] = ['alert', 'ranking', 'throne', 'goal', 'affinity', 'battle', 'team_battle', 'timer', 'messages', 'roulette'];

export default function WidgetsPage() {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [plan, setPlan] = useState<string>('free');
  const supabase = createClient();

  const fetchWidgets = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('widgets').select('*').eq('streamer_id', user.id);
    setWidgets(data || []);
    const { data: streamer } = await supabase.from('streamers').select('plan').eq('id', user.id).single();
    setPlan(streamer?.plan || 'free');
  };

  const createWidget = async (type: WidgetType) => {
    if (!canCreateWidget(plan, widgets.length)) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('widgets').insert({ streamer_id: user.id, type });
    fetchWidgets();
  };

  useEffect(() => { fetchWidgets(); }, []);

  const existingTypes = widgets.map(w => w.type);
  const missingTypes = ALL_WIDGET_TYPES.filter(t => !existingTypes.includes(t));
  const canAdd = canCreateWidget(plan, widgets.length);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">위젯 관리</h2>
      {!canAdd && plan === 'free' && (
        <div className="mb-4 p-4 bg-yellow-900/30 border border-yellow-700 rounded-xl text-sm">
          무료 플랜은 위젯 최대 3개까지 가능합니다.{' '}
          <a href="/dashboard/pricing" className="text-purple-400 underline">Pro 업그레이드</a>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {widgets.map(w => <WidgetCard key={w.id} widget={w} plan={plan} onUpdate={fetchWidgets} />)}
      </div>
      {missingTypes.length > 0 && canAdd && (
        <div>
          <h3 className="text-lg font-bold mb-3 text-gray-400">위젯 추가</h3>
          <div className="flex flex-wrap gap-2">
            {missingTypes.map(type => (
              <button key={type} onClick={() => createWidget(type)}
                className="px-4 py-2 bg-purple-600 rounded-lg text-sm hover:bg-purple-700">
                + {type}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import WidgetCard from '@/components/dashboard/WidgetCard';
import type { Widget, WidgetType } from '@/types';

const ALL_WIDGET_TYPES: WidgetType[] = ['alert', 'ranking', 'throne', 'goal', 'affinity', 'battle', 'team_battle', 'timer', 'messages'];

export default function WidgetsPage() {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const supabase = createClient();

  const fetchWidgets = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('widgets').select('*').eq('streamer_id', user.id);
    setWidgets(data || []);
  };

  const createWidget = async (type: WidgetType) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('widgets').insert({ streamer_id: user.id, type });
    fetchWidgets();
  };

  useEffect(() => { fetchWidgets(); }, []);

  const existingTypes = widgets.map(w => w.type);
  const missingTypes = ALL_WIDGET_TYPES.filter(t => !existingTypes.includes(t));

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">위젯 관리</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {widgets.map(w => <WidgetCard key={w.id} widget={w} onUpdate={fetchWidgets} />)}
      </div>
      {missingTypes.length > 0 && (
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

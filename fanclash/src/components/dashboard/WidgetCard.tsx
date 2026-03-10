'use client';
import type { Widget, WidgetType } from '@/types';
import { createClient } from '@/lib/supabase/client';

const WIDGET_LABELS: Record<WidgetType, { name: string; desc: string }> = {
  ranking: { name: '후원 랭킹 보드', desc: 'TOP 5 실시간 순위' },
  throne: { name: '왕좌 쟁탈전', desc: '1등 변경 시 풀스크린 알림' },
  goal: { name: '도네 목표 게이지', desc: '단계별 목표 프로그레스바' },
  affinity: { name: '호감도/칭호', desc: '팬 레벨업 팝업 알림' },
  battle: { name: '후원 배틀', desc: '1:1 후원 대결 화면' },
  team_battle: { name: '팀 대결', desc: '팀별 후원 경쟁' },
};

export default function WidgetCard({ widget, onUpdate }: { widget: Widget; onUpdate: () => void }) {
  const supabase = createClient();
  const label = WIDGET_LABELS[widget.type];
  const overlayUrl = typeof window !== 'undefined' ? `${window.location.origin}/overlay/${widget.id}` : '';

  const toggleEnabled = async () => {
    await supabase.from('widgets').update({ enabled: !widget.enabled }).eq('id', widget.id);
    onUpdate();
  };

  const copyUrl = () => {
    if (overlayUrl) navigator.clipboard.writeText(overlayUrl);
  };

  return (
    <div className={`bg-gray-900 rounded-xl p-5 border ${widget.enabled ? 'border-purple-600' : 'border-gray-800'}`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-lg">{label.name}</h3>
          <p className="text-gray-400 text-sm">{label.desc}</p>
        </div>
        <button onClick={toggleEnabled}
          className={`px-3 py-1 rounded-full text-xs font-bold ${widget.enabled ? 'bg-green-600' : 'bg-gray-700'}`}>
          {widget.enabled ? 'ON' : 'OFF'}
        </button>
      </div>
      <div className="flex gap-2 mt-4">
        <button onClick={copyUrl}
          className="flex-1 py-2 bg-gray-800 rounded-lg text-sm hover:bg-gray-700">
          OBS URL 복사
        </button>
        <select value={widget.theme}
          onChange={async (e) => {
            await supabase.from('widgets').update({ theme: e.target.value }).eq('id', widget.id);
            onUpdate();
          }}
          className="bg-gray-800 rounded-lg px-3 text-sm">
          <option value="modern">모던</option>
          <option value="game">게임</option>
          <option value="girlcam">여캠</option>
        </select>
      </div>
    </div>
  );
}

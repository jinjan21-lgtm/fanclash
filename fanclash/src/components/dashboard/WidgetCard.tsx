'use client';
import { useState } from 'react';
import type { Widget, WidgetType } from '@/types';
import { createClient } from '@/lib/supabase/client';
import WidgetSettingsModal from './WidgetSettingsModal';
import WidgetPreviewModal from './WidgetPreviewModal';

const WIDGET_LABELS: Record<WidgetType, { name: string; desc: string }> = {
  ranking: { name: '후원 랭킹 보드', desc: 'TOP 5 실시간 순위' },
  throne: { name: '왕좌 쟁탈전', desc: '1등 변경 시 풀스크린 알림' },
  goal: { name: '도네 목표 게이지', desc: '단계별 목표 프로그레스바' },
  affinity: { name: '호감도/칭호', desc: '팬 레벨업 팝업 알림' },
  battle: { name: '후원 배틀', desc: '1:1 후원 대결 화면' },
  team_battle: { name: '팬 투표', desc: '팀별 투표 대결' },
  timer: { name: '이벤트 타이머', desc: '카운트다운 + 벌칙/미션' },
  messages: { name: '메시지 보드', desc: '후원 메시지 실시간 표시' },
};

export default function WidgetCard({ widget, onUpdate }: { widget: Widget; onUpdate: () => void }) {
  const supabase = createClient();
  const label = WIDGET_LABELS[widget.type];
  const overlayUrl = typeof window !== 'undefined' ? `${window.location.origin}/overlay/${widget.id}` : '';
  const [showSettings, setShowSettings] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [copied, setCopied] = useState(false);

  const toggleEnabled = async () => {
    await supabase.from('widgets').update({ enabled: !widget.enabled }).eq('id', widget.id);
    onUpdate();
  };

  const copyUrl = () => {
    if (overlayUrl) {
      navigator.clipboard.writeText(overlayUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const deleteWidget = async () => {
    await supabase.from('widgets').delete().eq('id', widget.id);
    onUpdate();
  };

  return (
    <>
      <div className={`bg-gray-900 rounded-xl p-5 border ${widget.enabled ? 'border-purple-600' : 'border-gray-800'}`}>
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-bold text-lg">{(widget.config as any)?.title || label.name}</h3>
            <p className="text-gray-400 text-sm">{label.desc}</p>
          </div>
          <button onClick={toggleEnabled}
            className={`px-3 py-1 rounded-full text-xs font-bold ${widget.enabled ? 'bg-green-600' : 'bg-gray-700'}`}>
            {widget.enabled ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Config summary */}
        <ConfigSummary widget={widget} />

        <div className="flex gap-2 mt-4">
          <button onClick={() => setShowSettings(true)}
            className="flex-1 py-2 bg-purple-600 rounded-lg text-sm hover:bg-purple-700 font-medium">
            설정
          </button>
          <button onClick={() => setShowPreview(true)}
            className="flex-1 py-2 bg-indigo-600 rounded-lg text-sm hover:bg-indigo-700 font-medium">
            미리보기
          </button>
          <button onClick={copyUrl}
            className="py-2 px-3 bg-gray-800 rounded-lg text-sm hover:bg-gray-700">
            {copied ? '복사됨!' : 'OBS URL'}
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
        <div className="mt-2">
          <button onClick={deleteWidget}
            className="w-full py-1.5 text-xs text-gray-500 hover:text-red-400 transition-colors">
            위젯 삭제
          </button>
        </div>
      </div>

      {showSettings && (
        <WidgetSettingsModal
          widget={widget}
          onClose={() => setShowSettings(false)}
          onUpdate={onUpdate}
        />
      )}
      {showPreview && (
        <WidgetPreviewModal
          widget={widget}
          onClose={() => setShowPreview(false)}
        />
      )}
    </>
  );
}

function ConfigSummary({ widget }: { widget: Widget }) {
  const config = widget.config as Record<string, unknown>;
  if (!config || Object.keys(config).length === 0) {
    return <p className="text-xs text-gray-600 mb-1">기본 설정 사용 중</p>;
  }

  const items: string[] = [];

  switch (widget.type) {
    case 'ranking':
      if (config.maxDisplay) items.push(`TOP ${config.maxDisplay}`);
      if (config.period) {
        const periodLabels: Record<string, string> = { daily: '오늘', weekly: '이번 주', monthly: '이번 달', all: '전체' };
        items.push(periodLabels[config.period as string] || '');
      }
      break;
    case 'goal': {
      const ms = config.milestones as { amount: number; mission: string }[];
      if (ms?.length) items.push(`마일스톤 ${ms.length}개`);
      break;
    }
    case 'throne':
      if (config.alertDuration) items.push(`${config.alertDuration}초`);
      break;
    case 'battle':
      if (config.defaultMinAmount) items.push(`최소 ${(config.defaultMinAmount as number).toLocaleString()}원`);
      if (config.defaultTimeLimit) items.push(`${(config.defaultTimeLimit as number) / 60}분`);
      break;
    case 'team_battle':
      if (config.defaultTeamCount) items.push(`${config.defaultTeamCount}팀`);
      break;
    case 'timer':
      if (config.duration) items.push(`${(config.duration as number) / 60}분`);
      if (config.penalty) items.push(config.penalty as string);
      break;
  }

  if (items.length === 0) return <p className="text-xs text-gray-600 mb-1">기본 설정 사용 중</p>;

  return <p className="text-xs text-purple-400 mb-1">{items.join(' · ')}</p>;
}

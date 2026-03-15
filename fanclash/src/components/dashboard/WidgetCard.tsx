'use client';
import { useState } from 'react';
import type { Widget, WidgetType } from '@/types';
import { createClient } from '@/lib/supabase/client';
import WidgetSettingsModal from './WidgetSettingsModal';
import WidgetPreviewModal from './WidgetPreviewModal';
import OBSGuideModal from './OBSGuideModal';
import BattleControl from './BattleControl';
import QuizControl from './QuizControl';
import ConfirmModal from '@/components/ui/ConfirmModal';

const WIDGET_LABELS: Record<WidgetType, { name: string; desc: string }> = {
  alert: { name: '후원 알림', desc: '후원 시 풀스크린 알림 + TTS' },
  ranking: { name: '후원 랭킹 보드', desc: 'TOP 5 실시간 순위' },
  throne: { name: '왕좌 쟁탈전', desc: '1등 변경 시 풀스크린 알림' },
  goal: { name: '도네 목표 게이지', desc: '단계별 목표 프로그레스바' },
  affinity: { name: '호감도/칭호', desc: '팬 레벨업 팝업 알림' },
  battle: { name: '후원 배틀', desc: '1:1 후원 대결 화면' },
  team_battle: { name: '팬 투표', desc: '팀별 투표 대결' },
  timer: { name: '이벤트 타이머', desc: '카운트다운 + 벌칙/미션' },
  messages: { name: '메시지 보드', desc: '후원 메시지 실시간 표시' },
  roulette: { name: '후원 룰렛', desc: '후원 시 룰렛 돌리기 이벤트' },
  music: { name: '도네이션 뮤직', desc: '후원 금액별 음이 연주되는 인터랙티브 음악' },
  gacha: { name: '도네이션 가챠', desc: '후원 시 등급 뽑기 (N/R/SR/SSR/UR)' },
  physics: { name: '도네이션 폭격', desc: '후원하면 물체가 떨어지고 쌓이는 물리엔진' },
  territory: { name: '영토 전쟁', desc: '후원으로 격자 칸을 점령하는 r/place 스타일' },
  weather: { name: '방송 날씨', desc: '후원량에 따라 맑음→비→폭풍→블리자드' },
  train: { name: '도네이션 트레인', desc: '연속 후원 콤보 카운터' },
  slots: { name: '슬롯머신', desc: '후원 시 슬롯머신 돌리기' },
  meter: { name: '핫/콜드 미터', desc: '실시간 후원 온도 게이지' },
  quiz: { name: '팬 퀴즈', desc: '도네이션 메시지로 퀴즈 맞추기' },
};

export default function WidgetCard({ widget, plan, onUpdate }: { widget: Widget; plan?: string; onUpdate: () => void }) {
  const supabase = createClient();
  const label = WIDGET_LABELS[widget.type];
  const overlayUrl = typeof window !== 'undefined' ? `${window.location.origin}/overlay/${widget.id}` : '';
  const [showSettings, setShowSettings] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showOBSGuide, setShowOBSGuide] = useState(false);
  const [showBattleControl, setShowBattleControl] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showQuizControl, setShowQuizControl] = useState(false);
  const isBattleType = widget.type === 'battle' || widget.type === 'team_battle';
  const isQuizType = widget.type === 'quiz';

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
            aria-label={`${label.name} ${widget.enabled ? '비활성화' : '활성화'}`}
            aria-pressed={widget.enabled}
            className={`px-3 py-1 rounded-full text-xs font-bold ${widget.enabled ? 'bg-green-600' : 'bg-gray-700'}`}>
            {widget.enabled ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Config summary */}
        <ConfigSummary widget={widget} />

        <div className="flex gap-2 mt-4 flex-wrap">
          {isBattleType ? (
            <button onClick={() => setShowBattleControl(true)}
              className="flex-1 py-2 bg-purple-600 rounded-lg text-sm hover:bg-purple-700 font-medium">
              배틀 관리
            </button>
          ) : isQuizType ? (
            <button onClick={() => setShowQuizControl(true)}
              className="flex-1 py-2 bg-purple-600 rounded-lg text-sm hover:bg-purple-700 font-medium">
              퀴즈 관리
            </button>
          ) : (
            <button onClick={() => setShowSettings(true)}
              className="flex-1 py-2 bg-purple-600 rounded-lg text-sm hover:bg-purple-700 font-medium">
              설정
            </button>
          )}
          <button onClick={() => setShowPreview(true)}
            className="flex-1 py-2 bg-indigo-600 rounded-lg text-sm hover:bg-indigo-700 font-medium">
            미리보기
          </button>
          <button onClick={() => setShowOBSGuide(true)}
            className="py-2 px-3 bg-gray-800 rounded-lg text-sm hover:bg-gray-700">
            OBS 연결
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
          <button onClick={() => setShowDeleteConfirm(true)}
            className="w-full py-1.5 text-xs text-gray-500 hover:text-red-400 transition-colors">
            위젯 삭제
          </button>
        </div>
      </div>

      {showSettings && (
        <WidgetSettingsModal
          widget={widget}
          plan={plan || 'free'}
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
      {showOBSGuide && (
        <OBSGuideModal
          overlayUrl={overlayUrl}
          onClose={() => setShowOBSGuide(false)}
        />
      )}
      {showDeleteConfirm && (
        <ConfirmModal
          title="위젯 삭제"
          message="이 위젯을 삭제하시겠습니까? 설정과 데이터가 모두 삭제됩니다."
          confirmText="삭제"
          variant="danger"
          onConfirm={() => { deleteWidget(); setShowDeleteConfirm(false); }}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
      {showBattleControl && isBattleType && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowBattleControl(false)}>
          <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto p-6"
            onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{label.name} 관리</h3>
              <button onClick={() => setShowBattleControl(false)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>
            <BattleControl widget={widget} onUpdate={onUpdate} />
          </div>
        </div>
      )}
      {showQuizControl && isQuizType && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowQuizControl(false)}>
          <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto p-6"
            onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">퀴즈 관리</h3>
              <button onClick={() => setShowQuizControl(false)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>
            <QuizControl widget={widget} onUpdate={onUpdate} />
          </div>
        </div>
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
    case 'alert':
      if (config.alertDuration) items.push(`${config.alertDuration}초`);
      if (config.minAmount) items.push(`${(config.minAmount as number).toLocaleString()}원 이상`);
      if (config.ttsEnabled) items.push('TTS');
      break;
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
    case 'roulette': {
      const segs = config.segments as string[];
      if (segs?.length) items.push(`${segs.length}칸`);
      if (config.minAmount) items.push(`${(config.minAmount as number).toLocaleString()}원 이상`);
      break;
    }
    case 'music':
      if (config.volume !== undefined) items.push(`볼륨 ${config.volume}%`);
      if (config.scaleType) {
        const scales: Record<string, string> = { pentatonic: '펜타토닉', major: '메이저', minor: '마이너' };
        items.push(scales[config.scaleType as string] || '');
      }
      break;
    case 'gacha':
      if (config.minAmount) items.push(`${(config.minAmount as number).toLocaleString()}원 이상`);
      if (config.maxHistory) items.push(`히스토리 ${config.maxHistory}개`);
      break;
    case 'physics':
      if (config.maxObjects) items.push(`최대 ${config.maxObjects}개`);
      if (config.gravity) {
        const gravities: Record<string, string> = { low: '약', medium: '중', high: '강' };
        items.push(`중력 ${gravities[config.gravity as string] || ''}`);
      }
      break;
    case 'territory':
      if (config.gridSize) items.push(config.gridSize as string);
      if (config.minAmount) items.push(`${(config.minAmount as number).toLocaleString()}원 이상`);
      break;
    case 'weather':
      if (config.weatherWindow) items.push(`${config.weatherWindow}분 기준`);
      break;
    case 'train':
      if (config.comboWindow) items.push(`${config.comboWindow}초 콤보`);
      if (config.minAmount) items.push(`${(config.minAmount as number).toLocaleString()}원 이상`);
      if (config.effectIntensity) {
        const intensities: Record<string, string> = { low: '약', medium: '중', high: '강' };
        items.push(`강도 ${intensities[config.effectIntensity as string] || ''}`);
      }
      break;
    case 'slots':
      if (config.minAmount) items.push(`${(config.minAmount as number).toLocaleString()}원 이상`);
      if (config.missions) items.push(`미션 ${(config.missions as string[]).length}개`);
      if (config.spinDuration) items.push(`${config.spinDuration}초 스핀`);
      break;
    case 'meter':
      if (config.windowMinutes) items.push(`${config.windowMinutes}분 기준`);
      if (config.maxAmount) items.push(`MAX ${(config.maxAmount as number).toLocaleString()}원`);
      break;
    case 'quiz':
      if (config.defaultTimeLimit) items.push(`${config.defaultTimeLimit}초`);
      if (config.minAmount) items.push(`${(config.minAmount as number).toLocaleString()}원 이상`);
      break;
  }

  if (items.length === 0) return <p className="text-xs text-gray-600 mb-1">기본 설정 사용 중</p>;

  return <p className="text-xs text-purple-400 mb-1">{items.join(' · ')}</p>;
}

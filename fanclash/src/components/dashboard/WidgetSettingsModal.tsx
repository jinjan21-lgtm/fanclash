'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import { isProFeature } from '@/lib/plan';
import type { Widget, WidgetType } from '@/types';

interface Props {
  widget: Widget;
  plan: string;
  onClose: () => void;
  onUpdate: () => void;
}

export default function WidgetSettingsModal({ widget, plan, onClose, onUpdate }: Props) {
  const supabase = createClient();
  const { toast } = useToast();
  const [config, setConfig] = useState<Record<string, unknown>>(widget.config || {});
  const [saving, setSaving] = useState(false);

  // Goal-specific state
  const [milestones, setMilestones] = useState<{ amount: number; mission: string }[]>(
    (config.milestones as { amount: number; mission: string }[]) || []
  );
  const [newAmount, setNewAmount] = useState('');
  const [newMission, setNewMission] = useState('');

  const handleSave = async () => {
    setSaving(true);
    const finalConfig = { ...config };
    if (widget.type === 'goal') {
      finalConfig.milestones = milestones;
    }
    await supabase.from('widgets').update({ config: finalConfig }).eq('id', widget.id);

    // If goal widget, also update donation_goals table
    if (widget.type === 'goal') {
      const { data: existing } = await supabase
        .from('donation_goals')
        .select('id')
        .eq('streamer_id', widget.streamer_id)
        .eq('active', true)
        .single();

      if (existing) {
        await supabase.from('donation_goals').update({ milestones }).eq('id', existing.id);
      } else {
        await supabase.from('donation_goals').insert({
          streamer_id: widget.streamer_id,
          milestones,
          active: true,
          current_amount: 0,
        });
      }
    }

    setSaving(false);
    toast('위젯 설정이 저장되었습니다');
    onUpdate();
    onClose();
  };

  const addMilestone = () => {
    const amount = parseInt(newAmount);
    if (!amount || !newMission.trim()) return;
    setMilestones(prev => [...prev, { amount, mission: newMission.trim() }].sort((a, b) => a.amount - b.amount));
    setNewAmount('');
    setNewMission('');
  };

  const removeMilestone = (index: number) => {
    setMilestones(prev => prev.filter((_, i) => i !== index));
  };

  const resetGoalAmount = async () => {
    await supabase
      .from('donation_goals')
      .update({ current_amount: 0 })
      .eq('streamer_id', widget.streamer_id)
      .eq('active', true);
    onUpdate();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">위젯 설정</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
          </div>

          {/* Common settings */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">위젯 제목</label>
              <input
                type="text"
                value={(config.title as string) || ''}
                onChange={e => setConfig({ ...config, title: e.target.value })}
                placeholder={getDefaultTitle(widget.type)}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
              />
            </div>

            {/* Type-specific settings */}
            {/* Sound setting for alert-type widgets (Pro only) */}
            {(['alert', 'throne', 'affinity', 'battle'] as const).includes(widget.type as any) && (
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  알림 사운드 URL (선택)
                  {isProFeature('customSound', plan) && (
                    <span className="ml-2 text-xs text-yellow-400 font-normal">Pro</span>
                  )}
                </label>
                {isProFeature('customSound', plan) ? (
                  <div className="p-3 bg-gray-800/50 border border-gray-700 rounded-lg text-sm text-gray-500">
                    커스텀 사운드는 Pro 플랜 전용입니다.{' '}
                    <a href="/dashboard/pricing" className="text-purple-400 underline">업그레이드</a>
                  </div>
                ) : (
                  <>
                    <input
                      type="url"
                      value={(config.soundUrl as string) || ''}
                      onChange={e => setConfig({ ...config, soundUrl: e.target.value })}
                      placeholder="https://example.com/sound.mp3"
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                    />
                    <p className="text-xs text-gray-600 mt-1">MP3/WAV 파일 직접 링크. 비워두면 기본 효과음 사용</p>
                  </>
                )}
              </div>
            )}

            {widget.type === 'alert' && (
              <AlertSettings config={config} onChange={setConfig} />
            )}
            {widget.type === 'ranking' && (
              <RankingSettings config={config} onChange={setConfig} />
            )}
            {widget.type === 'throne' && (
              <ThroneSettings config={config} onChange={setConfig} />
            )}
            {widget.type === 'goal' && (
              <GoalSettings
                milestones={milestones}
                newAmount={newAmount}
                newMission={newMission}
                onNewAmountChange={setNewAmount}
                onNewMissionChange={setNewMission}
                onAdd={addMilestone}
                onRemove={removeMilestone}
                onReset={resetGoalAmount}
              />
            )}
            {widget.type === 'affinity' && (
              <AffinitySettings config={config} onChange={setConfig} />
            )}
            {widget.type === 'battle' && (
              <BattleSettings config={config} onChange={setConfig} />
            )}
            {widget.type === 'team_battle' && (
              <TeamBattleSettings config={config} onChange={setConfig} />
            )}
            {widget.type === 'timer' && (
              <TimerSettings config={config} onChange={setConfig} />
            )}
            {widget.type === 'messages' && (
              <div>
                <label className="block text-sm text-gray-400 mb-1">표시 메시지 수</label>
                <select
                  value={(config.maxMessages as number) || 5}
                  onChange={e => setConfig({ ...config, maxMessages: parseInt(e.target.value) })}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm">
                  <option value={3}>3개</option>
                  <option value={5}>5개</option>
                  <option value={10}>10개</option>
                </select>
              </div>
            )}
            {widget.type === 'roulette' && (
              <RouletteSettings config={config} onChange={setConfig} />
            )}
          </div>

          {/* Custom CSS (Pro only) */}
          <div className="mt-4 pt-4 border-t border-gray-700">
            <label className="block text-sm text-gray-400 mb-1">
              커스텀 CSS
              {isProFeature('customCss', plan) && (
                <span className="ml-2 text-xs text-yellow-400 font-normal">Pro</span>
              )}
            </label>
            {isProFeature('customCss', plan) ? (
              <div className="p-3 bg-gray-800/50 border border-gray-700 rounded-lg text-sm text-gray-500">
                커스텀 CSS는 Pro 플랜 전용입니다.{' '}
                <a href="/dashboard/pricing" className="text-purple-400 underline">업그레이드</a>
              </div>
            ) : (
              <>
                <textarea
                  value={(config.customCss as string) || ''}
                  onChange={e => setConfig({ ...config, customCss: e.target.value })}
                  placeholder={`.widget-container {\n  background: rgba(0,0,0,0.5);\n  border-radius: 12px;\n}`}
                  rows={5}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm font-mono focus:border-purple-500 focus:outline-none resize-y"
                />
                <p className="text-xs text-gray-600 mt-1">OBS 오버레이에 적용될 CSS를 입력하세요. .widget-container를 루트로 사용합니다.</p>
              </>
            )}
          </div>

          <div className="flex gap-3 mt-6 pt-4 border-t border-gray-700">
            <button onClick={handleSave} disabled={saving}
              className="flex-1 py-2.5 bg-purple-600 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50">
              {saving ? '저장 중...' : '저장'}
            </button>
            <button onClick={onClose}
              className="px-6 py-2.5 bg-gray-700 rounded-lg hover:bg-gray-600">
              취소
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function getDefaultTitle(type: WidgetType): string {
  const defaults: Record<WidgetType, string> = {
    alert: '후원 알림',
    ranking: '후원 랭킹',
    throne: '왕좌 쟁탈전',
    goal: '도네 목표',
    affinity: '호감도',
    battle: '후원 배틀',
    team_battle: '팬 투표',
    timer: '이벤트 타이머',
    messages: '메시지 보드',
    roulette: '후원 룰렛',
  };
  return defaults[type];
}

function AlertSettings({ config, onChange }: { config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  return (
    <>
      <div>
        <label className="block text-sm text-gray-400 mb-1">알림 표시 시간 (초)</label>
        <input
          type="number"
          value={(config.alertDuration as number) || 5}
          onChange={e => onChange({ ...config, alertDuration: parseInt(e.target.value) })}
          min={2} max={15}
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">최소 표시 금액</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={(config.minAmount as number) || 0}
            onChange={e => onChange({ ...config, minAmount: parseInt(e.target.value) })}
            step={1000} min={0}
            className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
          />
          <span className="text-gray-400 text-sm">원</span>
        </div>
        <p className="text-xs text-gray-600 mt-1">이 금액 미만의 후원은 알림을 표시하지 않습니다</p>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm text-gray-400">메시지 표시</label>
          <p className="text-xs text-gray-600">후원 메시지를 알림에 표시</p>
        </div>
        <button
          onClick={() => onChange({ ...config, showMessage: !(config.showMessage ?? true) })}
          className={`px-3 py-1 rounded-full text-xs font-bold ${(config.showMessage ?? true) ? 'bg-green-600' : 'bg-gray-700'}`}>
          {(config.showMessage ?? true) ? 'ON' : 'OFF'}
        </button>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm text-gray-400">TTS (음성 읽기)</label>
          <p className="text-xs text-gray-600">후원 내용을 음성으로 읽어줍니다</p>
        </div>
        <button
          onClick={() => onChange({ ...config, ttsEnabled: !config.ttsEnabled })}
          className={`px-3 py-1 rounded-full text-xs font-bold ${config.ttsEnabled ? 'bg-green-600' : 'bg-gray-700'}`}>
          {config.ttsEnabled ? 'ON' : 'OFF'}
        </button>
      </div>
    </>
  );
}

function RankingSettings({ config, onChange }: { config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  return (
    <>
      <div>
        <label className="block text-sm text-gray-400 mb-1">표시 인원 수</label>
        <select
          value={(config.maxDisplay as number) || 5}
          onChange={e => onChange({ ...config, maxDisplay: parseInt(e.target.value) })}
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm">
          <option value={3}>TOP 3</option>
          <option value={5}>TOP 5</option>
          <option value={10}>TOP 10</option>
        </select>
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">집계 기간</label>
        <select
          value={(config.period as string) || 'daily'}
          onChange={e => onChange({ ...config, period: e.target.value })}
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm">
          <option value="daily">오늘</option>
          <option value="weekly">이번 주</option>
          <option value="monthly">이번 달</option>
          <option value="all">전체</option>
        </select>
      </div>
    </>
  );
}

function ThroneSettings({ config, onChange }: { config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  return (
    <>
      <div>
        <label className="block text-sm text-gray-400 mb-1">알림 표시 시간 (초)</label>
        <input
          type="number"
          value={(config.alertDuration as number) || 5}
          onChange={e => onChange({ ...config, alertDuration: parseInt(e.target.value) })}
          min={2}
          max={15}
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">알림 효과음</label>
        <select
          value={(config.sound as string) || 'default'}
          onChange={e => onChange({ ...config, sound: e.target.value })}
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm">
          <option value="default">기본</option>
          <option value="fanfare">팡파레</option>
          <option value="none">없음</option>
        </select>
      </div>
    </>
  );
}

function GoalSettings({
  milestones, newAmount, newMission, onNewAmountChange, onNewMissionChange, onAdd, onRemove, onReset,
}: {
  milestones: { amount: number; mission: string }[];
  newAmount: string;
  newMission: string;
  onNewAmountChange: (v: string) => void;
  onNewMissionChange: (v: string) => void;
  onAdd: () => void;
  onRemove: (i: number) => void;
  onReset: () => void;
}) {
  return (
    <>
      <div>
        <label className="block text-sm text-gray-400 mb-2">마일스톤 목록</label>
        {milestones.length === 0 && (
          <p className="text-gray-500 text-sm mb-2">아직 마일스톤이 없습니다. 아래에서 추가하세요.</p>
        )}
        <div className="space-y-2 mb-3">
          {milestones.map((m, i) => (
            <div key={i} className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2">
              <span className="text-purple-400 font-bold text-sm min-w-[80px]">
                {m.amount.toLocaleString()}원
              </span>
              <span className="flex-1 text-sm">{m.mission}</span>
              <button onClick={() => onRemove(i)} className="text-red-400 hover:text-red-300 text-lg">&times;</button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="number"
            value={newAmount}
            onChange={e => onNewAmountChange(e.target.value)}
            placeholder="금액"
            className="w-28 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
          />
          <input
            type="text"
            value={newMission}
            onChange={e => onNewMissionChange(e.target.value)}
            placeholder="미션 (예: 노래 한 곡)"
            className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
            onKeyDown={e => e.key === 'Enter' && onAdd()}
          />
          <button onClick={onAdd}
            className="px-4 py-2 bg-purple-600 rounded-lg text-sm hover:bg-purple-700 whitespace-nowrap">
            추가
          </button>
        </div>
      </div>
      <button onClick={onReset}
        className="w-full py-2 bg-red-900/50 border border-red-800 rounded-lg text-sm text-red-400 hover:bg-red-900">
        현재 목표 금액 초기화 (0원으로)
      </button>
    </>
  );
}

function AffinitySettings({ config, onChange }: { config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const levels = (config.levels as { title: string; minAmount: number }[]) || [
    { title: '지나가는 팬', minAmount: 0 },
    { title: '단골', minAmount: 10000 },
    { title: '열혈팬', minAmount: 50000 },
    { title: '첫사랑', minAmount: 200000 },
    { title: '소울메이트', minAmount: 500000 },
  ];

  const updateLevel = (index: number, field: 'title' | 'minAmount', value: string | number) => {
    const updated = levels.map((l, i) => i === index ? { ...l, [field]: value } : l);
    onChange({ ...config, levels: updated });
  };

  return (
    <div>
      <label className="block text-sm text-gray-400 mb-2">호감도 레벨 설정</label>
      <div className="space-y-2">
        {levels.map((level, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-gray-500 text-sm w-6">Lv{i}</span>
            <input
              type="text"
              value={level.title}
              onChange={e => updateLevel(i, 'title', e.target.value)}
              className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-1.5 text-sm focus:border-purple-500 focus:outline-none"
            />
            <input
              type="number"
              value={level.minAmount}
              onChange={e => updateLevel(i, 'minAmount', parseInt(e.target.value) || 0)}
              className="w-28 bg-gray-800 border border-gray-600 rounded-lg px-3 py-1.5 text-sm focus:border-purple-500 focus:outline-none"
              disabled={i === 0}
            />
            <span className="text-gray-500 text-xs">원</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BattleSettings({ config, onChange }: { config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  return (
    <>
      <div>
        <label className="block text-sm text-gray-400 mb-1">기본 최소 참가 금액</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={(config.defaultMinAmount as number) || 5000}
            onChange={e => onChange({ ...config, defaultMinAmount: parseInt(e.target.value) })}
            step={1000}
            min={1000}
            className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
          />
          <span className="text-gray-400 text-sm">원</span>
        </div>
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">기본 제한 시간</label>
        <select
          value={(config.defaultTimeLimit as number) || 180}
          onChange={e => onChange({ ...config, defaultTimeLimit: parseInt(e.target.value) })}
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm">
          <option value={60}>1분</option>
          <option value={120}>2분</option>
          <option value={180}>3분</option>
          <option value={300}>5분</option>
          <option value={600}>10분</option>
        </select>
      </div>
    </>
  );
}

function TimerSettings({ config, onChange }: { config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const donationMode = (config.donationMode as string) || 'none';

  return (
    <>
      <div>
        <label className="block text-sm text-gray-400 mb-1">이벤트 제목</label>
        <input
          type="text"
          value={(config.eventTitle as string) || ''}
          onChange={e => onChange({ ...config, eventTitle: e.target.value })}
          placeholder="예: 10분 안에 목표 달성!"
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">제한 시간</label>
        <select
          value={(config.duration as number) || 600}
          onChange={e => onChange({ ...config, duration: parseInt(e.target.value) })}
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm">
          <option value={60}>1분</option>
          <option value={180}>3분</option>
          <option value={300}>5분</option>
          <option value={600}>10분</option>
          <option value={900}>15분</option>
          <option value={1800}>30분</option>
        </select>
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">벌칙/미션 (선택)</label>
        <input
          type="text"
          value={(config.penalty as string) || ''}
          onChange={e => onChange({ ...config, penalty: e.target.value })}
          placeholder="예: 노래 3곡 연속!"
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
        />
      </div>

      {/* 도네이션 연동 */}
      <div className="pt-3 border-t border-gray-700">
        <label className="block text-sm text-gray-400 mb-1">후원 연동 모드</label>
        <select
          value={donationMode}
          onChange={e => onChange({ ...config, donationMode: e.target.value })}
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm">
          <option value="none">없음 (수동 타이머)</option>
          <option value="add">시간 추가 — 후원하면 시간이 늘어남</option>
          <option value="subtract">시간 차감 — 후원하면 시간이 줄어듦</option>
          <option value="auto_start">자동 시작 — 목표 금액 도달 시 타이머 시작</option>
        </select>
      </div>

      {(donationMode === 'add' || donationMode === 'subtract') && (
        <>
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              기준 금액 (이 금액당 시간 변동)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={(config.donationAmountPer as number) || 1000}
                onChange={e => onChange({ ...config, donationAmountPer: parseInt(e.target.value) })}
                step={500}
                min={500}
                className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
              />
              <span className="text-gray-400 text-sm">원당</span>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              {donationMode === 'add' ? '추가' : '차감'} 시간 (초)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={(config.donationTimeChange as number) || 30}
                onChange={e => onChange({ ...config, donationTimeChange: parseInt(e.target.value) })}
                step={5}
                min={1}
                max={300}
                className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
              />
              <span className="text-gray-400 text-sm">초</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              예: {((config.donationAmountPer as number) || 1000).toLocaleString()}원 후원 시 {(config.donationTimeChange as number) || 30}초 {donationMode === 'add' ? '추가' : '차감'}
            </p>
          </div>
        </>
      )}

      {donationMode === 'auto_start' && (
        <div>
          <label className="block text-sm text-gray-400 mb-1">자동 시작 목표 금액</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={(config.autoStartGoal as number) || 50000}
              onChange={e => onChange({ ...config, autoStartGoal: parseInt(e.target.value) })}
              step={10000}
              min={1000}
              className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
            />
            <span className="text-gray-400 text-sm">원</span>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            누적 후원이 이 금액에 도달하면 타이머가 자동으로 시작됩니다
          </p>
        </div>
      )}
    </>
  );
}

function TeamBattleSettings({ config, onChange }: { config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const teamNames = (config.defaultTeamNames as string[]) || ['A팀', 'B팀'];

  const updateTeamName = (index: number, value: string) => {
    const updated = [...teamNames];
    updated[index] = value;
    onChange({ ...config, defaultTeamNames: updated });
  };

  return (
    <>
      <div>
        <label className="block text-sm text-gray-400 mb-1">기본 팀 수</label>
        <select
          value={(config.defaultTeamCount as number) || 2}
          onChange={e => {
            const count = parseInt(e.target.value);
            const names = [...teamNames];
            while (names.length < count) names.push(`${String.fromCharCode(65 + names.length)}팀`);
            onChange({ ...config, defaultTeamCount: count, defaultTeamNames: names.slice(0, count) });
          }}
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm">
          <option value={2}>2팀</option>
          <option value={3}>3팀</option>
          <option value={4}>4팀</option>
        </select>
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-2">팀 이름</label>
        <div className="space-y-2">
          {teamNames.slice(0, (config.defaultTeamCount as number) || 2).map((name, i) => (
            <input
              key={i}
              type="text"
              value={name}
              onChange={e => updateTeamName(i, e.target.value)}
              placeholder={`${i + 1}번째 팀`}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
            />
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">기본 제한 시간</label>
        <select
          value={(config.defaultTimeLimit as number) || 300}
          onChange={e => onChange({ ...config, defaultTimeLimit: parseInt(e.target.value) })}
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm">
          <option value={120}>2분</option>
          <option value={180}>3분</option>
          <option value={300}>5분</option>
          <option value={600}>10분</option>
        </select>
      </div>
    </>
  );
}

function RouletteSettings({ config, onChange }: { config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const segments = (config.segments as string[]) || ['노래 한 곡', '스쿼트 10개', '광고 읽기', '팬 선택곡', '꽁치킨 약속', '2배속 게임'];
  const [newSegment, setNewSegment] = useState('');

  const addSegment = () => {
    if (!newSegment.trim() || segments.length >= 12) return;
    onChange({ ...config, segments: [...segments, newSegment.trim()] });
    setNewSegment('');
  };

  const removeSegment = (index: number) => {
    if (segments.length <= 2) return;
    onChange({ ...config, segments: segments.filter((_, i) => i !== index) });
  };

  return (
    <>
      <div>
        <label className="block text-sm text-gray-400 mb-2">룰렛 항목 ({segments.length}/12)</label>
        <div className="space-y-2 mb-3">
          {segments.map((seg, i) => (
            <div key={i} className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2">
              <span className="w-2 h-2 rounded-full" style={{
                background: ['#ef4444','#3b82f6','#22c55e','#eab308','#a855f7','#ec4899','#06b6d4','#f97316'][i % 8]
              }} />
              <span className="flex-1 text-sm">{seg}</span>
              <button onClick={() => removeSegment(i)} className="text-red-400 hover:text-red-300 text-lg"
                disabled={segments.length <= 2}>&times;</button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newSegment}
            onChange={e => setNewSegment(e.target.value)}
            placeholder="새 항목 (예: 노래 부르기)"
            maxLength={30}
            className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
            onKeyDown={e => e.key === 'Enter' && addSegment()}
          />
          <button onClick={addSegment} disabled={segments.length >= 12}
            className="px-4 py-2 bg-purple-600 rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50">
            추가
          </button>
        </div>
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">최소 후원 금액 (룰렛 작동)</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={(config.minAmount as number) || 5000}
            onChange={e => onChange({ ...config, minAmount: parseInt(e.target.value) })}
            step={1000}
            min={1000}
            className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
          />
          <span className="text-gray-400 text-sm">원</span>
        </div>
        <p className="text-xs text-gray-600 mt-1">이 금액 이상 후원 시 룰렛이 자동으로 돌아갑니다</p>
      </div>
    </>
  );
}

'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import { isProFeature } from '@/lib/plan';
import type { Widget, WidgetType } from '@/types';

import AlertSettings from './settings/AlertSettings';
import RankingSettings from './settings/RankingSettings';
import ThroneSettings from './settings/ThroneSettings';
import GoalSettings from './settings/GoalSettings';
import AffinitySettings from './settings/AffinitySettings';
import BattleSettings from './settings/BattleSettings';
import TimerSettings from './settings/TimerSettings';
import TeamBattleSettings from './settings/TeamBattleSettings';
import RouletteSettings from './settings/RouletteSettings';
import MessagesSettings from './settings/MessagesSettings';
import MusicSettings from './settings/MusicSettings';
import GachaSettings from './settings/GachaSettings';
import PhysicsSettings from './settings/PhysicsSettings';
import TerritorySettings from './settings/TerritorySettings';
import WeatherSettings from './settings/WeatherSettings';
import TrainSettings from './settings/TrainSettings';
import SlotsSettings from './settings/SlotsSettings';
import MeterSettings from './settings/MeterSettings';
import QuizSettings from './settings/QuizSettings';
import RPGSettings from './settings/RPGSettings';
import StylePresets from './settings/StylePresets';

interface Props {
  widget: Widget;
  plan: string;
  onClose: () => void;
  onUpdate: () => void;
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
    music: '도네이션 뮤직',
    gacha: '도네이션 가챠',
    physics: '도네이션 폭격',
    territory: '영토 전쟁',
    weather: '방송 날씨',
    train: '도네이션 트레인',
    slots: '슬롯머신',
    meter: '핫/콜드 미터',
    quiz: '팬 퀴즈',
    rpg: '팬 RPG',
  };
  return defaults[type];
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

            {/* Type-specific settings */}
            {widget.type === 'alert' && <AlertSettings config={config} onChange={setConfig} />}
            {widget.type === 'ranking' && <RankingSettings config={config} onChange={setConfig} />}
            {widget.type === 'throne' && <ThroneSettings config={config} onChange={setConfig} />}
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
            {widget.type === 'affinity' && <AffinitySettings config={config} onChange={setConfig} />}
            {/* battle settings are now in BattleControl */}
            {/* team_battle settings are now in BattleControl */}
            {widget.type === 'timer' && <TimerSettings config={config} onChange={setConfig} />}
            {widget.type === 'messages' && <MessagesSettings config={config} onChange={setConfig} />}
            {widget.type === 'roulette' && <RouletteSettings config={config} onChange={setConfig} />}
            {widget.type === 'music' && <MusicSettings config={config} onChange={setConfig} />}
            {widget.type === 'gacha' && <GachaSettings config={config} onChange={setConfig} />}
            {widget.type === 'physics' && <PhysicsSettings config={config} onChange={setConfig} />}
            {widget.type === 'territory' && <TerritorySettings config={config} onChange={setConfig} />}
            {widget.type === 'weather' && <WeatherSettings config={config} onChange={setConfig} />}
            {widget.type === 'train' && <TrainSettings config={config} onChange={setConfig} />}
            {widget.type === 'slots' && <SlotsSettings config={config} onChange={setConfig} />}
            {widget.type === 'meter' && <MeterSettings config={config} onChange={setConfig} />}
            {widget.type === 'quiz' && <QuizSettings config={config} onChange={setConfig} />}
            {widget.type === 'rpg' && <RPGSettings config={config} onChange={setConfig} />}
          </div>

          {/* Widget Style (Pro only) */}
          <div className="mt-4 pt-4 border-t border-gray-700">
            <label className="block text-sm text-gray-400 mb-2">
              위젯 스타일
              {isProFeature('customCss', plan) && (
                <span className="ml-2 text-xs text-yellow-400 font-normal">Pro</span>
              )}
            </label>
            {isProFeature('customCss', plan) ? (
              <div className="p-3 bg-gray-800/50 border border-gray-700 rounded-lg text-sm text-gray-500">
                위젯 스타일 변경은 Pro 플랜 전용입니다.{' '}
                <a href="/dashboard/pricing" className="text-purple-400 underline">업그레이드</a>
              </div>
            ) : (
              <StylePresets config={config} onChange={setConfig} />
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

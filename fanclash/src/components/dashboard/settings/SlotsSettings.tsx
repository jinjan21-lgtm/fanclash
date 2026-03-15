'use client';
import { useState } from 'react';

export default function SlotsSettings({ config, onChange }: {
  config: Record<string, unknown>;
  onChange: (c: Record<string, unknown>) => void;
}) {
  const missions = (config.missions as string[]) || ['노래 한 곡', '스쿼트 10개', '광고 읽기'];
  const [newMission, setNewMission] = useState('');

  const addMission = () => {
    if (!newMission.trim() || missions.length >= 20) return;
    onChange({ ...config, missions: [...missions, newMission.trim()] });
    setNewMission('');
  };

  const removeMission = (index: number) => {
    if (missions.length <= 1) return;
    onChange({ ...config, missions: missions.filter((_, i) => i !== index) });
  };

  return (
    <>
      <div>
        <label className="block text-sm text-gray-400 mb-1">최소 후원 금액</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={(config.minAmount as number) || 1000}
            onChange={e => onChange({ ...config, minAmount: parseInt(e.target.value) })}
            step={1000}
            min={1000}
            className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
          />
          <span className="text-gray-400 text-sm">원</span>
        </div>
        <p className="text-xs text-gray-600 mt-1">이 금액 이상 후원 시 슬롯이 돌아갑니다</p>
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-2">미션 목록 ({missions.length}/20)</label>
        <div className="space-y-2 mb-3">
          {missions.map((m, i) => (
            <div key={i} className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2">
              <span className="text-sm">🎰</span>
              <span className="flex-1 text-sm">{m}</span>
              <button onClick={() => removeMission(i)} className="text-red-400 hover:text-red-300 text-lg"
                disabled={missions.length <= 1}>&times;</button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newMission}
            onChange={e => setNewMission(e.target.value)}
            placeholder="새 미션 (예: 노래 부르기)"
            maxLength={50}
            className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
            onKeyDown={e => e.key === 'Enter' && addMission()}
          />
          <button onClick={addMission} disabled={missions.length >= 20}
            className="px-4 py-2 bg-purple-600 rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50">
            추가
          </button>
        </div>
        <p className="text-xs text-gray-600 mt-1">3개 일치(잭팟) 시 랜덤 미션이 표시됩니다</p>
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">스핀 시간</label>
        <select value={(config.spinDuration as number) || 2}
          onChange={e => onChange({ ...config, spinDuration: parseInt(e.target.value) })}
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm">
          <option value={1}>1초 (빠름)</option>
          <option value={2}>2초 (보통)</option>
          <option value={3}>3초 (느림)</option>
        </select>
      </div>
    </>
  );
}

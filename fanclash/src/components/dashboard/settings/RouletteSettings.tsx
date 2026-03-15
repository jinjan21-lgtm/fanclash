'use client';
import { useState } from 'react';

export default function RouletteSettings({ config, onChange }: { config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
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

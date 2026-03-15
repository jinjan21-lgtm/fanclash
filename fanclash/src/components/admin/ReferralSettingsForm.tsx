'use client';
import { useState } from 'react';
import type { ReferralSettings } from '@/types/admin';

export default function ReferralSettingsForm({ initialSettings }: { initialSettings: ReferralSettings }) {
  const [settings, setSettings] = useState<ReferralSettings>(initialSettings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'referral', value: settings }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
      <h2 className="text-lg font-bold mb-6">레퍼럴 프로그램</h2>

      <div className="space-y-5">
        {/* 활성화 토글 */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">레퍼럴 활성화</p>
            <p className="text-sm text-gray-500">추천 프로그램 사용 여부</p>
          </div>
          <button
            onClick={() => setSettings(s => ({ ...s, enabled: !s.enabled }))}
            className={`w-12 h-6 rounded-full transition-colors relative ${settings.enabled ? 'bg-purple-600' : 'bg-gray-700'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${settings.enabled ? 'left-6' : 'left-0.5'}`} />
          </button>
        </div>

        {/* 보상 타입 */}
        <div>
          <p className="font-medium mb-2">보상 타입</p>
          <select
            value={settings.reward_type}
            onChange={e => setSettings(s => ({ ...s, reward_type: e.target.value as ReferralSettings['reward_type'] }))}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm"
          >
            <option value="pro_days">Pro 무료 체험 (일수)</option>
            <option value="none">보상 없음</option>
          </select>
        </div>

        {/* 보상 일수 */}
        {settings.reward_type === 'pro_days' && (
          <div>
            <p className="font-medium mb-2">Pro 무료 일수</p>
            <input
              type="number"
              min={1}
              max={365}
              value={settings.reward_days}
              onChange={e => setSettings(s => ({ ...s, reward_days: parseInt(e.target.value) || 7 }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm"
            />
          </div>
        )}

        {/* 양쪽 보상 */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">양쪽 모두 보상</p>
            <p className="text-sm text-gray-500">추천인과 피추천인 모두에게 보상</p>
          </div>
          <button
            onClick={() => setSettings(s => ({ ...s, reward_both: !s.reward_both }))}
            className={`w-12 h-6 rounded-full transition-colors relative ${settings.reward_both ? 'bg-purple-600' : 'bg-gray-700'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${settings.reward_both ? 'left-6' : 'left-0.5'}`} />
          </button>
        </div>

        {/* 저장 */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 bg-purple-600 hover:bg-purple-700 rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
        >
          {saving ? '저장 중...' : saved ? '저장 완료!' : '설정 저장'}
        </button>
      </div>
    </div>
  );
}

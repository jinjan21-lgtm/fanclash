export default function TimerSettings({ config, onChange }: { config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
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

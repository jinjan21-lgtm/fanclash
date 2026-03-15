'use client';
export default function WeatherSettings({ config, onChange }: {
  config: Record<string, unknown>;
  onChange: (c: Record<string, unknown>) => void;
}) {
  return (
    <>
      <div>
        <label className="block text-sm text-gray-400 mb-1">파티클 밀도</label>
        <select value={(config.particleDensity as string) || 'medium'}
          onChange={e => onChange({ ...config, particleDensity: e.target.value })}
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm">
          <option value="low">낮음</option>
          <option value="medium">중간</option>
          <option value="high">높음</option>
        </select>
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">날씨 판정 기간</label>
        <select value={(config.weatherWindow as number) || 5}
          onChange={e => onChange({ ...config, weatherWindow: parseInt(e.target.value) })}
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm">
          <option value={3}>3분</option>
          <option value={5}>5분</option>
          <option value={10}>10분</option>
        </select>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm text-gray-400">화면 흔들림</label>
          <p className="text-xs text-gray-600">폭풍/블리자드 시 화면 흔들림 효과</p>
        </div>
        <button onClick={() => onChange({ ...config, screenShake: !(config.screenShake ?? true) })}
          className={`px-3 py-1 rounded-full text-xs font-bold ${(config.screenShake ?? true) ? 'bg-green-600' : 'bg-gray-700'}`}
          aria-label="화면 흔들림 토글" aria-pressed={(config.screenShake ?? true) as boolean}>
          {(config.screenShake ?? true) ? 'ON' : 'OFF'}
        </button>
      </div>
    </>
  );
}

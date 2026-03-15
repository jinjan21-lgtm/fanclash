'use client';
export default function MusicSettings({ config, onChange }: {
  config: Record<string, unknown>;
  onChange: (c: Record<string, unknown>) => void;
}) {
  return (
    <>
      <div>
        <label className="block text-sm text-gray-400 mb-1">볼륨</label>
        <input type="range" min={0} max={100}
          value={(config.volume as number) ?? 70}
          onChange={e => onChange({ ...config, volume: parseInt(e.target.value) })}
          className="w-full accent-purple-500" />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0</span>
          <span className="text-purple-400 font-bold">{(config.volume as number) ?? 70}%</span>
          <span>100</span>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm text-gray-400">시각화 효과</label>
          <p className="text-xs text-gray-600">피아노 키 + 음표 파티클 표시</p>
        </div>
        <button onClick={() => onChange({ ...config, showVisual: !(config.showVisual ?? true) })}
          className={`px-3 py-1 rounded-full text-xs font-bold ${(config.showVisual ?? true) ? 'bg-green-600' : 'bg-gray-700'}`}
          aria-label="시각화 효과 토글" aria-pressed={(config.showVisual ?? true) as boolean}>
          {(config.showVisual ?? true) ? 'ON' : 'OFF'}
        </button>
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">스케일 타입</label>
        <select value={(config.scaleType as string) || 'pentatonic'}
          onChange={e => onChange({ ...config, scaleType: e.target.value })}
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm">
          <option value="pentatonic">펜타토닉 (기본, 안정적)</option>
          <option value="major">메이저 (밝은 느낌)</option>
          <option value="minor">마이너 (감성적)</option>
        </select>
      </div>
    </>
  );
}

export const STYLE_PRESETS: { id: string; name: string; desc: string; css: string; preview: Record<string, string> }[] = [
  {
    id: 'none',
    name: '기본',
    desc: '테마 기본 스타일',
    css: '',
    preview: { background: 'transparent', border: '2px dashed #374151' },
  },
  {
    id: 'glass',
    name: '글래스',
    desc: '반투명 유리 효과',
    css: `.widget-container { background: rgba(255,255,255,0.08); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.15); border-radius: 16px; padding: 16px; }`,
    preview: { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '16px', backdropFilter: 'blur(4px)' },
  },
  {
    id: 'neon',
    name: '네온',
    desc: '빛나는 네온 테두리',
    css: `.widget-container { background: rgba(0,0,0,0.7); border: 2px solid #a855f7; border-radius: 12px; padding: 16px; box-shadow: 0 0 15px rgba(168,85,247,0.4), inset 0 0 15px rgba(168,85,247,0.1); }`,
    preview: { background: 'rgba(0,0,0,0.7)', border: '2px solid #a855f7', borderRadius: '12px', boxShadow: '0 0 10px rgba(168,85,247,0.4)' },
  },
  {
    id: 'gradient',
    name: '그라데이션',
    desc: '컬러 그라데이션 배경',
    css: `.widget-container { background: linear-gradient(135deg, rgba(168,85,247,0.3), rgba(59,130,246,0.3)); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 16px; }`,
    preview: { background: 'linear-gradient(135deg, rgba(168,85,247,0.3), rgba(59,130,246,0.3))', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' },
  },
  {
    id: 'dark',
    name: '다크',
    desc: '어두운 배경 + 둥근 모서리',
    css: `.widget-container { background: rgba(0,0,0,0.85); border: 1px solid rgba(255,255,255,0.05); border-radius: 20px; padding: 20px; }`,
    preview: { background: 'rgba(0,0,0,0.85)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px' },
  },
  {
    id: 'retro',
    name: '레트로',
    desc: '픽셀 게임 스타일',
    css: `.widget-container { background: #1a1a2e; border: 3px solid #e94560; border-radius: 0; padding: 16px; box-shadow: 4px 4px 0 #e94560; font-family: 'Press Start 2P', monospace; }`,
    preview: { background: '#1a1a2e', border: '3px solid #e94560', borderRadius: '0', boxShadow: '4px 4px 0 #e94560' },
  },
  {
    id: 'minimal',
    name: '미니멀',
    desc: '깔끔한 흰색 라인',
    css: `.widget-container { background: transparent; border: 1px solid rgba(255,255,255,0.3); border-radius: 8px; padding: 16px; }`,
    preview: { background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px' },
  },
  {
    id: 'fire',
    name: '불꽃',
    desc: '빨간 그라데이션 + 글로우',
    css: `.widget-container { background: linear-gradient(135deg, rgba(239,68,68,0.2), rgba(234,179,8,0.2)); border: 1px solid rgba(239,68,68,0.4); border-radius: 12px; padding: 16px; box-shadow: 0 0 20px rgba(239,68,68,0.2); }`,
    preview: { background: 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(234,179,8,0.2))', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '12px', boxShadow: '0 0 10px rgba(239,68,68,0.2)' },
  },
];

export default function StylePresets({ config, onChange }: { config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const currentId = (config.stylePreset as string) || 'none';

  const selectPreset = (preset: typeof STYLE_PRESETS[number]) => {
    onChange({ ...config, stylePreset: preset.id, customCss: preset.css });
  };

  return (
    <div className="grid grid-cols-4 gap-2">
      {STYLE_PRESETS.map(preset => (
        <button
          key={preset.id}
          onClick={() => selectPreset(preset)}
          className={`group relative p-1 rounded-lg border-2 transition-all ${
            currentId === preset.id
              ? 'border-purple-500 ring-1 ring-purple-500/30'
              : 'border-gray-700 hover:border-gray-500'
          }`}
        >
          <div
            className="w-full h-12 rounded-md mb-1.5"
            style={preset.preview}
          />
          <p className="text-xs font-medium truncate">{preset.name}</p>
          <p className="text-[10px] text-gray-500 truncate">{preset.desc}</p>
        </button>
      ))}
    </div>
  );
}

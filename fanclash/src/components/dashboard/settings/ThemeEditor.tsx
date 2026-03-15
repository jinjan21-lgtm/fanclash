'use client';
import { useState, useCallback } from 'react';

interface ThemeConfig {
  backgroundColor: string;
  backgroundOpacity: number;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  padding: number;
  fontFamily: string;
  textColor: string;
  glowEnabled: boolean;
  glowColor: string;
  glowIntensity: number;
}

const DEFAULT_THEME: ThemeConfig = {
  backgroundColor: '#000000',
  backgroundOpacity: 70,
  borderColor: '#a855f7',
  borderWidth: 1,
  borderRadius: 12,
  padding: 16,
  fontFamily: 'default',
  textColor: '#ffffff',
  glowEnabled: false,
  glowColor: '#a855f7',
  glowIntensity: 15,
};

const FONT_OPTIONS = [
  { value: 'default', label: '기본' },
  { value: "'Noto Sans KR', sans-serif", label: '고딕' },
  { value: "'Noto Serif KR', serif", label: '명조' },
  { value: "'JetBrains Mono', monospace", label: '모노' },
];

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : { r: 0, g: 0, b: 0 };
}

function generateCSS(config: ThemeConfig): string {
  const { r, g, b } = hexToRgb(config.backgroundColor);
  const opacity = config.backgroundOpacity / 100;

  let css = `.widget-container {\n`;
  css += `  background: rgba(${r},${g},${b},${opacity});\n`;
  css += `  border: ${config.borderWidth}px solid ${config.borderColor};\n`;
  css += `  border-radius: ${config.borderRadius}px;\n`;
  css += `  padding: ${config.padding}px;\n`;
  css += `  color: ${config.textColor};\n`;

  if (config.fontFamily !== 'default') {
    css += `  font-family: ${config.fontFamily};\n`;
  }

  if (config.glowEnabled) {
    css += `  box-shadow: 0 0 ${config.glowIntensity}px ${config.glowColor}, inset 0 0 ${Math.round(config.glowIntensity * 0.6)}px ${config.glowColor}40;\n`;
  }

  css += `}`;
  return css;
}

function getPreviewStyle(config: ThemeConfig): React.CSSProperties {
  const { r, g, b } = hexToRgb(config.backgroundColor);
  const opacity = config.backgroundOpacity / 100;

  const style: React.CSSProperties = {
    background: `rgba(${r},${g},${b},${opacity})`,
    border: `${config.borderWidth}px solid ${config.borderColor}`,
    borderRadius: `${config.borderRadius}px`,
    padding: `${config.padding}px`,
    color: config.textColor,
  };

  if (config.fontFamily !== 'default') {
    style.fontFamily = config.fontFamily;
  }

  if (config.glowEnabled) {
    style.boxShadow = `0 0 ${config.glowIntensity}px ${config.glowColor}, inset 0 0 ${Math.round(config.glowIntensity * 0.6)}px ${config.glowColor}40`;
  }

  return style;
}

interface ThemeEditorProps {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

export default function ThemeEditor({ config, onChange }: ThemeEditorProps) {
  // Parse existing theme from config or use defaults
  const [theme, setTheme] = useState<ThemeConfig>(() => {
    const saved = config.themeConfig as ThemeConfig | undefined;
    return saved ? { ...DEFAULT_THEME, ...saved } : DEFAULT_THEME;
  });
  const [showRawCss, setShowRawCss] = useState(false);

  const updateTheme = useCallback((partial: Partial<ThemeConfig>) => {
    const newTheme = { ...theme, ...partial };
    setTheme(newTheme);
    const css = generateCSS(newTheme);
    onChange({ ...config, customCss: css, stylePreset: 'custom', themeConfig: newTheme });
  }, [theme, config, onChange]);

  const generatedCss = generateCSS(theme);

  return (
    <div className="space-y-4 mt-4">
      <p className="text-sm text-gray-400 font-medium">또는 직접 커스텀</p>

      {/* Live Preview */}
      <div className="bg-gray-800/50 rounded-lg p-4">
        <p className="text-xs text-gray-500 mb-2">미리보기</p>
        <div className="flex justify-center p-6 bg-[url('/preview-bg.png')] bg-cover bg-center rounded-md" style={{ backgroundImage: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}>
          <div style={getPreviewStyle(theme)} className="w-full max-w-[280px]">
            <p className="text-sm font-bold mb-1" style={{ color: theme.textColor }}>위젯 미리보기</p>
            <p className="text-xs opacity-70" style={{ color: theme.textColor }}>실시간으로 스타일이 반영됩니다</p>
          </div>
        </div>
      </div>

      {/* Editor Controls */}
      <div className="space-y-3">
        {/* Background */}
        <div className="flex items-center gap-3">
          <label className="text-xs text-gray-400 w-16 shrink-0">배경색</label>
          <input
            type="color"
            value={theme.backgroundColor}
            onChange={e => updateTheme({ backgroundColor: e.target.value })}
            className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
          />
          <label className="text-xs text-gray-400 w-14 shrink-0">투명도</label>
          <input
            type="range"
            min={0}
            max={100}
            value={theme.backgroundOpacity}
            onChange={e => updateTheme({ backgroundOpacity: Number(e.target.value) })}
            className="flex-1 accent-purple-500"
          />
          <span className="text-xs text-gray-500 w-8 text-right">{theme.backgroundOpacity}%</span>
        </div>

        {/* Border */}
        <div className="flex items-center gap-3">
          <label className="text-xs text-gray-400 w-16 shrink-0">테두리색</label>
          <input
            type="color"
            value={theme.borderColor}
            onChange={e => updateTheme({ borderColor: e.target.value })}
            className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
          />
          <label className="text-xs text-gray-400 w-14 shrink-0">두께</label>
          <input
            type="range"
            min={0}
            max={5}
            value={theme.borderWidth}
            onChange={e => updateTheme({ borderWidth: Number(e.target.value) })}
            className="flex-1 accent-purple-500"
          />
          <span className="text-xs text-gray-500 w-8 text-right">{theme.borderWidth}px</span>
        </div>

        {/* Border Radius */}
        <div className="flex items-center gap-3">
          <label className="text-xs text-gray-400 w-16 shrink-0">모서리</label>
          <input
            type="range"
            min={0}
            max={30}
            value={theme.borderRadius}
            onChange={e => updateTheme({ borderRadius: Number(e.target.value) })}
            className="flex-1 accent-purple-500"
          />
          <span className="text-xs text-gray-500 w-8 text-right">{theme.borderRadius}px</span>
        </div>

        {/* Padding */}
        <div className="flex items-center gap-3">
          <label className="text-xs text-gray-400 w-16 shrink-0">패딩</label>
          <input
            type="range"
            min={8}
            max={32}
            value={theme.padding}
            onChange={e => updateTheme({ padding: Number(e.target.value) })}
            className="flex-1 accent-purple-500"
          />
          <span className="text-xs text-gray-500 w-8 text-right">{theme.padding}px</span>
        </div>

        {/* Font */}
        <div className="flex items-center gap-3">
          <label className="text-xs text-gray-400 w-16 shrink-0">폰트</label>
          <select
            value={theme.fontFamily}
            onChange={e => updateTheme({ fontFamily: e.target.value })}
            className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-1.5 text-sm focus:border-purple-500 focus:outline-none"
          >
            {FONT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Text Color */}
        <div className="flex items-center gap-3">
          <label className="text-xs text-gray-400 w-16 shrink-0">글자색</label>
          <input
            type="color"
            value={theme.textColor}
            onChange={e => updateTheme({ textColor: e.target.value })}
            className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
          />
        </div>

        {/* Glow Effect */}
        <div className="border-t border-gray-700 pt-3">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-gray-400">글로우 효과</label>
            <button
              onClick={() => updateTheme({ glowEnabled: !theme.glowEnabled })}
              className={`w-10 h-5 rounded-full transition-colors relative ${
                theme.glowEnabled ? 'bg-purple-600' : 'bg-gray-700'
              }`}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                theme.glowEnabled ? 'left-5' : 'left-0.5'
              }`} />
            </button>
          </div>

          {theme.glowEnabled && (
            <div className="space-y-2 pl-2">
              <div className="flex items-center gap-3">
                <label className="text-xs text-gray-400 w-14 shrink-0">색상</label>
                <input
                  type="color"
                  value={theme.glowColor}
                  onChange={e => updateTheme({ glowColor: e.target.value })}
                  className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-xs text-gray-400 w-14 shrink-0">강도</label>
                <input
                  type="range"
                  min={5}
                  max={30}
                  value={theme.glowIntensity}
                  onChange={e => updateTheme({ glowIntensity: Number(e.target.value) })}
                  className="flex-1 accent-purple-500"
                />
                <span className="text-xs text-gray-500 w-8 text-right">{theme.glowIntensity}px</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Raw CSS Toggle */}
      <div className="border-t border-gray-700 pt-3">
        <button
          onClick={() => setShowRawCss(!showRawCss)}
          className="text-xs text-gray-500 hover:text-gray-400 transition"
        >
          {showRawCss ? '닫기' : '고급: CSS 직접 편집'}
        </button>
        {showRawCss && (
          <textarea
            value={(config.customCss as string) || generatedCss}
            onChange={e => onChange({ ...config, customCss: e.target.value, stylePreset: 'custom' })}
            rows={6}
            className="mt-2 w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-xs font-mono text-gray-300 focus:border-purple-500 focus:outline-none resize-none"
            placeholder=".widget-container { ... }"
          />
        )}
      </div>
    </div>
  );
}

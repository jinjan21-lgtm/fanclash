# FanClash 기존 기능 개선 구현 계획

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** FanClash 출시 전 UX + 안정화 개선 — 하입 피처 설정 UI, 대시보드 레이아웃, 연동 UX, 안정화

**Architecture:** WidgetSettingsModal 818줄을 15개 파일로 분리. CSS 새니타이저 유틸리티 추가. 대시보드 레이아웃을 8섹션→4섹션으로 축소. 연동 페이지에 타임아웃/재시도/한국어 에러 추가. DonationPhysics 메모리 누수 수정 및 ConfirmModal 공통 컴포넌트 추가.

**Tech Stack:** Next.js 16, TypeScript, Tailwind CSS, Supabase, Socket.IO, Zod, Matter.js

**Spec:** `docs/superpowers/specs/2026-03-15-fanclash-improvements-design.md`

---

## Chunk 1: Foundation — CSS 새니타이저 + ConfirmModal + WidgetSettingsModal 분리

### Task 1: CSS 새니타이저 유틸리티

**Files:**
- Create: `fanclash/src/lib/sanitize-css.ts`
- Create: `fanclash/__tests__/lib/sanitize-css.test.ts`

- [ ] **Step 1: Write failing tests for CSS sanitizer**

```typescript
// fanclash/__tests__/lib/sanitize-css.test.ts
import { sanitizeCSS } from '@/lib/sanitize-css';

describe('sanitizeCSS', () => {
  it('allows safe CSS properties', () => {
    const input = '.widget-container { background: red; border-radius: 8px; padding: 16px; }';
    expect(sanitizeCSS(input)).toBe(input);
  });

  it('removes javascript: URLs', () => {
    const input = '.x { background: url(javascript:alert(1)); }';
    expect(sanitizeCSS(input)).not.toContain('javascript:');
  });

  it('removes expression()', () => {
    const input = '.x { width: expression(document.body.clientWidth); }';
    expect(sanitizeCSS(input)).not.toContain('expression');
  });

  it('removes @import rules', () => {
    const input = '@import url("https://evil.com/steal.css"); .x { color: red; }';
    expect(sanitizeCSS(input)).not.toContain('@import');
  });

  it('removes data: URLs', () => {
    const input = '.x { background: url(data:text/html,<script>alert(1)</script>); }';
    expect(sanitizeCSS(input)).not.toContain('data:');
  });

  it('removes -moz-binding', () => {
    const input = '.x { -moz-binding: url("http://evil.com/xbl"); }';
    expect(sanitizeCSS(input)).not.toContain('-moz-binding');
  });

  it('handles empty input', () => {
    expect(sanitizeCSS('')).toBe('');
  });

  it('handles undefined input', () => {
    expect(sanitizeCSS(undefined as unknown as string)).toBe('');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd fanclash && npx jest __tests__/lib/sanitize-css.test.ts --no-cache`
Expected: FAIL — module not found

- [ ] **Step 3: Implement CSS sanitizer**

```typescript
// fanclash/src/lib/sanitize-css.ts
const DANGEROUS_PATTERNS = [
  /javascript\s*:/gi,
  /expression\s*\(/gi,
  /@import\b/gi,
  /url\s*\(\s*['"]?\s*data\s*:/gi,
  /-moz-binding\s*:/gi,
  /behavior\s*:/gi,
  /<\/?script/gi,
  /on\w+\s*=/gi,
];

export function sanitizeCSS(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';

  let css = raw;

  // Remove dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    css = css.replace(pattern, '/* removed */');
  }

  // Remove url() with non-http(s) schemes (except data-safe image types we might want later)
  css = css.replace(/url\s*\(\s*['"]?(?!https?:\/\/|#|\.\/|\.\.\/)[^)'"]*['"]?\s*\)/gi, '/* removed */');

  return css;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd fanclash && npx jest __tests__/lib/sanitize-css.test.ts --no-cache`
Expected: All 8 tests PASS

- [ ] **Step 5: Apply sanitizer to overlay page**

Modify: `fanclash/src/app/overlay/[widgetId]/page.tsx:53-57`

Replace:
```tsx
const customCss = (widget.config as Record<string, unknown>)?.customCss as string | undefined;

return (
  <ErrorBoundary fallback={<div className="bg-transparent" />}>
    {customCss && <style dangerouslySetInnerHTML={{ __html: customCss }} />}
```

With:
```tsx
import { sanitizeCSS } from '@/lib/sanitize-css';
// (add import at top of file)

const customCss = sanitizeCSS(
  (widget.config as Record<string, unknown>)?.customCss as string ?? ''
);

return (
  <ErrorBoundary fallback={<div className="bg-transparent" />}>
    {customCss && <style dangerouslySetInnerHTML={{ __html: customCss }} />}
```

- [ ] **Step 6: Commit**

```bash
git add fanclash/src/lib/sanitize-css.ts fanclash/__tests__/lib/sanitize-css.test.ts fanclash/src/app/overlay/\[widgetId\]/page.tsx
git commit -m "feat: add CSS sanitizer to prevent XSS in custom widget styles"
```

---

### Task 2: ConfirmModal 공통 컴포넌트

**Files:**
- Create: `fanclash/src/components/ui/ConfirmModal.tsx`

- [ ] **Step 1: Create ConfirmModal component**

```tsx
// fanclash/src/components/ui/ConfirmModal.tsx
'use client';

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'default';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  title,
  message,
  confirmText = '확인',
  cancelText = '취소',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60]"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-sm mx-4 p-6"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold mb-2">{title}</h3>
        <p className="text-gray-400 text-sm mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-lg font-medium ${
              variant === 'danger'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-purple-600 hover:bg-purple-700'
            }`}
          >
            {confirmText}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 bg-gray-700 rounded-lg hover:bg-gray-600"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add fanclash/src/components/ui/ConfirmModal.tsx
git commit -m "feat: add reusable ConfirmModal component"
```

---

### Task 3: WidgetSettingsModal 분리 — 기존 설정 컴포넌트 추출

**Files:**
- Create: `fanclash/src/components/dashboard/settings/AlertSettings.tsx`
- Create: `fanclash/src/components/dashboard/settings/RankingSettings.tsx`
- Create: `fanclash/src/components/dashboard/settings/ThroneSettings.tsx`
- Create: `fanclash/src/components/dashboard/settings/GoalSettings.tsx`
- Create: `fanclash/src/components/dashboard/settings/AffinitySettings.tsx`
- Create: `fanclash/src/components/dashboard/settings/BattleSettings.tsx`
- Create: `fanclash/src/components/dashboard/settings/TimerSettings.tsx`
- Create: `fanclash/src/components/dashboard/settings/TeamBattleSettings.tsx`
- Create: `fanclash/src/components/dashboard/settings/RouletteSettings.tsx`
- Create: `fanclash/src/components/dashboard/settings/StylePresets.tsx`
- Create: `fanclash/src/components/dashboard/settings/MessagesSettings.tsx`
- Modify: `fanclash/src/components/dashboard/WidgetSettingsModal.tsx`

- [ ] **Step 1: Create settings directory and extract all existing sub-components**

Each file should export a single component. Extract the following functions from `WidgetSettingsModal.tsx`:

**AlertSettings.tsx** — lines 239-290 of current file
**RankingSettings.tsx** — lines 292-320
**ThroneSettings.tsx** — lines 322-349
**GoalSettings.tsx** — lines 351-409 (note: this has unique props, not config/onChange)
**AffinitySettings.tsx** — lines 411-451
**BattleSettings.tsx** — lines 453-485
**TimerSettings.tsx** — lines 487-603
**TeamBattleSettings.tsx** — lines 605-661
**RouletteSettings.tsx** — lines 753-817 (needs `useState` import)
**StylePresets.tsx** — lines 663-751 (includes `STYLE_PRESETS` constant)
**MessagesSettings.tsx** — extract inline JSX from lines 166-178

Each extracted file follows this pattern:
```tsx
'use client';
// imports if needed (useState for RouletteSettings)

// For StylePresets.tsx, also export the STYLE_PRESETS constant

export default function XxxSettings({ config, onChange }: {
  config: Record<string, unknown>;
  onChange: (c: Record<string, unknown>) => void;
}) {
  // ... exact same code from WidgetSettingsModal.tsx
}
```

Special cases:
- `GoalSettings` has unique props (milestones, newAmount, etc.) — keep its existing interface
- `RouletteSettings` uses `useState` — add the import
- `StylePresets` includes both the `STYLE_PRESETS` array and the component

- [ ] **Step 2: Rewrite WidgetSettingsModal as a shell**

Replace `WidgetSettingsModal.tsx` (818 lines → ~120 lines). Import all settings from `./settings/` directory. The modal shell handles:
- Common config (title, sound URL)
- Widget style section (Pro gating + StylePresets)
- Save/cancel buttons
- Goal-specific state (milestones)
- Dynamic type-based settings panel rendering

The switch block at lines 137-181 becomes imports:
```tsx
import AlertSettings from './settings/AlertSettings';
import RankingSettings from './settings/RankingSettings';
// ... etc
import MusicSettings from './settings/MusicSettings';
// ... etc

// In render:
{widget.type === 'alert' && <AlertSettings config={config} onChange={setConfig} />}
// ... etc for all 15 types
```

Remove: `getDefaultTitle` function (move to a shared constant or keep inline), all sub-component function definitions.

- [ ] **Step 3: Verify the app still builds**

Run: `cd fanclash && npx next build`
Expected: Build succeeds with no errors

- [ ] **Step 4: Commit**

```bash
git add fanclash/src/components/dashboard/settings/ fanclash/src/components/dashboard/WidgetSettingsModal.tsx
git commit -m "refactor: split WidgetSettingsModal into individual settings components"
```

---

### Task 4: 하입 피처 5종 설정 컴포넌트 생성

**Files:**
- Create: `fanclash/src/components/dashboard/settings/MusicSettings.tsx`
- Create: `fanclash/src/components/dashboard/settings/GachaSettings.tsx`
- Create: `fanclash/src/components/dashboard/settings/PhysicsSettings.tsx`
- Create: `fanclash/src/components/dashboard/settings/TerritorySettings.tsx`
- Create: `fanclash/src/components/dashboard/settings/WeatherSettings.tsx`
- Modify: `fanclash/src/components/dashboard/WidgetSettingsModal.tsx` (add imports + switch cases)

- [ ] **Step 1: Create MusicSettings**

```tsx
// fanclash/src/components/dashboard/settings/MusicSettings.tsx
'use client';

export default function MusicSettings({ config, onChange }: {
  config: Record<string, unknown>;
  onChange: (c: Record<string, unknown>) => void;
}) {
  return (
    <>
      <div>
        <label className="block text-sm text-gray-400 mb-1">볼륨</label>
        <input
          type="range"
          min={0} max={100}
          value={(config.volume as number) ?? 70}
          onChange={e => onChange({ ...config, volume: parseInt(e.target.value) })}
          className="w-full accent-purple-500"
        />
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
        <button
          onClick={() => onChange({ ...config, showVisual: !(config.showVisual ?? true) })}
          className={`px-3 py-1 rounded-full text-xs font-bold ${(config.showVisual ?? true) ? 'bg-green-600' : 'bg-gray-700'}`}
          aria-label="시각화 효과 토글"
          aria-pressed={(config.showVisual ?? true) as boolean}
        >
          {(config.showVisual ?? true) ? 'ON' : 'OFF'}
        </button>
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">스케일 타입</label>
        <select
          value={(config.scaleType as string) || 'pentatonic'}
          onChange={e => onChange({ ...config, scaleType: e.target.value })}
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm"
        >
          <option value="pentatonic">펜타토닉 (기본, 안정적)</option>
          <option value="major">메이저 (밝은 느낌)</option>
          <option value="minor">마이너 (감성적)</option>
        </select>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Create GachaSettings**

```tsx
// fanclash/src/components/dashboard/settings/GachaSettings.tsx
'use client';

export default function GachaSettings({ config, onChange }: {
  config: Record<string, unknown>;
  onChange: (c: Record<string, unknown>) => void;
}) {
  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm text-gray-400">뽑기 히스토리 표시</label>
          <p className="text-xs text-gray-600">최근 뽑기 결과를 화면에 표시</p>
        </div>
        <button
          onClick={() => onChange({ ...config, showHistory: !(config.showHistory ?? true) })}
          className={`px-3 py-1 rounded-full text-xs font-bold ${(config.showHistory ?? true) ? 'bg-green-600' : 'bg-gray-700'}`}
          aria-label="히스토리 표시 토글"
          aria-pressed={(config.showHistory ?? true) as boolean}
        >
          {(config.showHistory ?? true) ? 'ON' : 'OFF'}
        </button>
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">최대 히스토리 수</label>
        <select
          value={(config.maxHistory as number) || 10}
          onChange={e => onChange({ ...config, maxHistory: parseInt(e.target.value) })}
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm"
        >
          <option value={5}>5개</option>
          <option value={10}>10개</option>
          <option value={20}>20개</option>
        </select>
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">최소 후원 금액</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={(config.minAmount as number) || 1000}
            onChange={e => onChange({ ...config, minAmount: parseInt(e.target.value) })}
            step={1000} min={0}
            className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
          />
          <span className="text-gray-400 text-sm">원</span>
        </div>
        <p className="text-xs text-gray-600 mt-1">이 금액 미만의 후원은 가챠를 트리거하지 않습니다</p>
      </div>
    </>
  );
}
```

- [ ] **Step 3: Create PhysicsSettings**

```tsx
// fanclash/src/components/dashboard/settings/PhysicsSettings.tsx
'use client';

export default function PhysicsSettings({ config, onChange }: {
  config: Record<string, unknown>;
  onChange: (c: Record<string, unknown>) => void;
}) {
  return (
    <>
      <div>
        <label className="block text-sm text-gray-400 mb-1">최대 오브젝트 수</label>
        <select
          value={(config.maxObjects as number) || 50}
          onChange={e => onChange({ ...config, maxObjects: parseInt(e.target.value) })}
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm"
        >
          <option value={20}>20개 (가벼움)</option>
          <option value={50}>50개 (기본)</option>
          <option value={100}>100개 (무거움)</option>
        </select>
        <p className="text-xs text-gray-600 mt-1">오브젝트가 많을수록 CPU 사용량이 증가합니다</p>
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">중력 강도</label>
        <select
          value={(config.gravity as string) || 'medium'}
          onChange={e => onChange({ ...config, gravity: e.target.value })}
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm"
        >
          <option value="low">약 (느리게 떨어짐)</option>
          <option value="medium">중 (기본)</option>
          <option value="high">강 (빠르게 떨어짐)</option>
        </select>
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">이모지 크기</label>
        <select
          value={(config.emojiSize as string) || 'auto'}
          onChange={e => onChange({ ...config, emojiSize: e.target.value })}
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm"
        >
          <option value="auto">자동 (금액 비례)</option>
          <option value="small">작게 (고정)</option>
          <option value="large">크게 (고정)</option>
        </select>
      </div>
    </>
  );
}
```

- [ ] **Step 4: Create TerritorySettings**

```tsx
// fanclash/src/components/dashboard/settings/TerritorySettings.tsx
'use client';

export default function TerritorySettings({ config, onChange }: {
  config: Record<string, unknown>;
  onChange: (c: Record<string, unknown>) => void;
}) {
  return (
    <>
      <div>
        <label className="block text-sm text-gray-400 mb-1">격자 크기</label>
        <select
          value={(config.gridSize as string) || '20x12'}
          onChange={e => onChange({ ...config, gridSize: e.target.value })}
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm"
        >
          <option value="10x6">10x6 (소형)</option>
          <option value="20x12">20x12 (기본)</option>
          <option value="30x18">30x18 (대형)</option>
        </select>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm text-gray-400">리더보드 표시</label>
          <p className="text-xs text-gray-600">점령 면적 상위 5명 표시</p>
        </div>
        <button
          onClick={() => onChange({ ...config, showLeaderboard: !(config.showLeaderboard ?? true) })}
          className={`px-3 py-1 rounded-full text-xs font-bold ${(config.showLeaderboard ?? true) ? 'bg-green-600' : 'bg-gray-700'}`}
          aria-label="리더보드 표시 토글"
          aria-pressed={(config.showLeaderboard ?? true) as boolean}
        >
          {(config.showLeaderboard ?? true) ? 'ON' : 'OFF'}
        </button>
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">점령 최소 금액</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={(config.minAmount as number) || 1000}
            onChange={e => onChange({ ...config, minAmount: parseInt(e.target.value) })}
            step={1000} min={0}
            className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
          />
          <span className="text-gray-400 text-sm">원</span>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 5: Create WeatherSettings**

```tsx
// fanclash/src/components/dashboard/settings/WeatherSettings.tsx
'use client';

export default function WeatherSettings({ config, onChange }: {
  config: Record<string, unknown>;
  onChange: (c: Record<string, unknown>) => void;
}) {
  return (
    <>
      <div>
        <label className="block text-sm text-gray-400 mb-1">파티클 밀도</label>
        <select
          value={(config.particleDensity as string) || 'medium'}
          onChange={e => onChange({ ...config, particleDensity: e.target.value })}
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm"
        >
          <option value="low">낮음 (가벼움)</option>
          <option value="medium">중간 (기본)</option>
          <option value="high">높음 (화려함)</option>
        </select>
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">날씨 변경 기준 시간</label>
        <select
          value={(config.weatherWindow as number) || 5}
          onChange={e => onChange({ ...config, weatherWindow: parseInt(e.target.value) })}
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm"
        >
          <option value={3}>3분</option>
          <option value={5}>5분 (기본)</option>
          <option value={10}>10분</option>
        </select>
        <p className="text-xs text-gray-600 mt-1">이 시간 동안의 누적 후원으로 날씨 단계를 결정합니다</p>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm text-gray-400">화면 흔들림 효과</label>
          <p className="text-xs text-gray-600">폭풍/블리자드 단계에서 화면 흔들림</p>
        </div>
        <button
          onClick={() => onChange({ ...config, screenShake: !(config.screenShake ?? true) })}
          className={`px-3 py-1 rounded-full text-xs font-bold ${(config.screenShake ?? true) ? 'bg-green-600' : 'bg-gray-700'}`}
          aria-label="화면 흔들림 효과 토글"
          aria-pressed={(config.screenShake ?? true) as boolean}
        >
          {(config.screenShake ?? true) ? 'ON' : 'OFF'}
        </button>
      </div>
    </>
  );
}
```

- [ ] **Step 6: Wire new settings into WidgetSettingsModal**

Add imports and switch cases in `WidgetSettingsModal.tsx` for music, gacha, physics, territory, weather:

```tsx
import MusicSettings from './settings/MusicSettings';
import GachaSettings from './settings/GachaSettings';
import PhysicsSettings from './settings/PhysicsSettings';
import TerritorySettings from './settings/TerritorySettings';
import WeatherSettings from './settings/WeatherSettings';

// In the type-specific settings section:
{widget.type === 'music' && <MusicSettings config={config} onChange={setConfig} />}
{widget.type === 'gacha' && <GachaSettings config={config} onChange={setConfig} />}
{widget.type === 'physics' && <PhysicsSettings config={config} onChange={setConfig} />}
{widget.type === 'territory' && <TerritorySettings config={config} onChange={setConfig} />}
{widget.type === 'weather' && <WeatherSettings config={config} onChange={setConfig} />}
```

- [ ] **Step 7: Add ConfigSummary entries for hype widgets**

In `WidgetCard.tsx`, add cases to the `ConfigSummary` switch (after line 194):

```tsx
case 'music':
  if (config.volume !== undefined) items.push(`볼륨 ${config.volume}%`);
  if (config.scaleType) {
    const scales: Record<string, string> = { pentatonic: '펜타토닉', major: '메이저', minor: '마이너' };
    items.push(scales[config.scaleType as string] || '');
  }
  break;
case 'gacha':
  if (config.minAmount) items.push(`${(config.minAmount as number).toLocaleString()}원 이상`);
  if (config.maxHistory) items.push(`히스토리 ${config.maxHistory}개`);
  break;
case 'physics':
  if (config.maxObjects) items.push(`최대 ${config.maxObjects}개`);
  if (config.gravity) {
    const gravities: Record<string, string> = { low: '약', medium: '중', high: '강' };
    items.push(`중력 ${gravities[config.gravity as string] || ''}`);
  }
  break;
case 'territory':
  if (config.gridSize) items.push(config.gridSize as string);
  if (config.minAmount) items.push(`${(config.minAmount as number).toLocaleString()}원 이상`);
  break;
case 'weather':
  if (config.weatherWindow) items.push(`${config.weatherWindow}분 기준`);
  break;
```

- [ ] **Step 8: Update overlay components to consume new config**

The overlay components must read the new config keys set by the settings UI.

**DonationPhysics.tsx** — update interface and apply gravity/emojiSize:
```tsx
// Update interface:
interface DonationPhysicsProps {
  widgetId?: string;
  config?: { maxObjects?: number; gravity?: string; emojiSize?: string };
}

// In engine creation (line 29), use gravity from config:
const gravityValues: Record<string, number> = { low: 0.8, medium: 1.5, high: 3.0 };
const engine = Matter.Engine.create({
  gravity: { x: 0, y: gravityValues[config?.gravity || 'medium'] || 1.5 }
});

// In triggerDrop, adjust radius based on emojiSize:
const baseRadius = config?.emojiSize === 'small' ? 15
  : config?.emojiSize === 'large' ? 40
  : Math.min(15 + Math.log10(Math.max(amount, 1000)) * 12, 60); // 'auto'
```

**DonationMusic.tsx** — read volume, showVisual, scaleType from config.
**DonationGacha.tsx** — read showHistory, maxHistory, minAmount from config.
**DonationTerritory.tsx** — read gridSize, showLeaderboard, minAmount from config.
**DonationWeather.tsx** — read particleDensity, weatherWindow, screenShake from config.

Each overlay component already receives `config?: Record<string, unknown>`. The implementer should read the new keys with defaults matching the settings defaults (e.g., `config?.volume ?? 70`).

- [ ] **Step 9: Verify build**

Run: `cd fanclash && npx next build`
Expected: Build succeeds

- [ ] **Step 10: Commit**

```bash
git add fanclash/src/components/overlay/ fanclash/src/components/dashboard/settings/ fanclash/src/components/dashboard/WidgetSettingsModal.tsx fanclash/src/components/dashboard/WidgetCard.tsx
git commit -m "feat: add settings UI for hype widgets and wire config to overlay components"
```

---

## Chunk 2: 대시보드 레이아웃 개편 + Stats 페이지

### Task 5: 대시보드 레이아웃 개편

**Files:**
- Modify: `fanclash/src/app/dashboard/page.tsx`

- [ ] **Step 1: Remove Quick Actions section and fan pages section**

Delete lines 227-278 (fan pages + quick actions sections). These duplicate sidebar navigation.

- [ ] **Step 2: Merge ConnectionStatus + quick stats into header row**

Replace the separate header (lines 71-74) and stats grid (lines 90-108) with a combined row:

```tsx
{/* Header with connection status + quick stats */}
<div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
  <div className="flex-1">
    <h2 className="text-2xl font-bold">안녕하세요, {streamer?.display_name || '스트리머'}님!</h2>
  </div>
  <div className="flex items-center gap-3">
    <div className="flex items-center gap-2 bg-gray-900 rounded-lg px-3 py-2">
      <span className="text-purple-400 font-bold text-sm">{totalToday.toLocaleString()}원</span>
      <span className="text-gray-600 text-xs">오늘</span>
    </div>
    <div className="flex items-center gap-2 bg-gray-900 rounded-lg px-3 py-2">
      <span className="text-green-400 font-bold text-sm">{activeWidgets}</span>
      <span className="text-gray-600 text-xs">위젯</span>
    </div>
    <div className="flex items-center gap-2 bg-gray-900 rounded-lg px-3 py-2">
      <span className="text-blue-400 font-bold text-sm">{connectedIntegrations}</span>
      <span className="text-gray-600 text-xs">연동</span>
    </div>
    <ConnectionStatus />
  </div>
</div>
```

- [ ] **Step 3: Add auto-hide + expand for onboarding guide**

The onboarding section currently uses `{!allDone && (...)}`. Change to use localStorage for dismissal:

```tsx
{/* Onboarding guide — auto-hide when all done, manual re-expand */}
<OnboardingGuide steps={steps} completedSteps={completedSteps} allDone={allDone} />
```

Create an inline client component wrapper at top of file or a separate small component:

```tsx
// Add 'use client' wrapper for the onboarding section
// In a new file: fanclash/src/components/dashboard/OnboardingGuide.tsx
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Step { done: boolean; label: string; desc: string; href: string; cta: string; }

export default function OnboardingGuide({ steps, completedSteps, allDone }: {
  steps: Step[];
  completedSteps: number;
  allDone: boolean;
}) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('fanclash_onboarding_collapsed');
    if (stored === 'true' || allDone) setCollapsed(true);
  }, [allDone]);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('fanclash_onboarding_collapsed', String(next));
  };

  if (allDone && collapsed) return null;

  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg">시작 가이드</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">{completedSteps}/{steps.length} 완료</span>
          <button onClick={toggle} className="text-xs text-gray-500 hover:text-gray-300">
            {collapsed ? '펼치기' : '접기'}
          </button>
        </div>
      </div>
      {!collapsed && (
        <>
          <div className="h-2 bg-gray-800 rounded-full mb-5 overflow-hidden">
            <div className="h-full bg-purple-600 rounded-full transition-all duration-500"
              style={{ width: `${(completedSteps / steps.length) * 100}%` }} />
          </div>
          <div className="space-y-3">
            {steps.map((step, i) => (
              <div key={i} className={`flex items-center gap-4 p-3 rounded-lg ${step.done ? 'bg-green-900/20' : 'bg-gray-800/50'}`}>
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                  step.done ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400'}`}>
                  {step.done ? '✓' : i + 1}
                </span>
                <div className="flex-1">
                  <p className={`font-medium ${step.done ? 'text-green-400 line-through' : 'text-white'}`}>{step.label}</p>
                  <p className="text-xs text-gray-500">{step.desc}</p>
                </div>
                {!step.done && (
                  <Link href={step.href} className="px-4 py-1.5 bg-purple-600 rounded-lg text-sm hover:bg-purple-700 whitespace-nowrap">
                    {step.cta}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Move widget status into right column alongside top fans**

Merge the "Active widgets" section into the right column of the 2-column layout:

```tsx
{/* 2-column: Recent donations + Top fans & widgets */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
  {/* Left: Recent donations */}
  <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
    {/* ... existing recent donations code ... */}
  </div>

  {/* Right: Top fans + widget status */}
  <div className="space-y-4">
    {/* Top fans */}
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
      {/* ... existing top fans code ... */}
    </div>

    {/* Widget status (compact) */}
    {widgets && widgets.length > 0 && (
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm">위젯 상태</h3>
          <Link href="/dashboard/widgets" className="text-xs text-purple-400 hover:text-purple-300">관리</Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {widgets.map(w => (
            <span key={w.id} className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs ${
              w.enabled ? 'bg-green-900/20 text-green-400' : 'bg-gray-800 text-gray-500'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${w.enabled ? 'bg-green-400' : 'bg-gray-600'}`} />
              {WIDGET_LABELS[w.type] || w.type}
            </span>
          ))}
        </div>
      </div>
    )}
  </div>
</div>
```

- [ ] **Step 5: Move Pro banner to bottom (subtle)**

```tsx
{/* Pro upgrade — subtle bottom banner */}
{plan === 'free' && (
  <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 flex items-center justify-between">
    <p className="text-sm text-gray-400">
      <span className="text-purple-400 font-medium">Pro</span>로 업그레이드하면 모든 위젯과 상세 통계를 이용할 수 있습니다
    </p>
    <Link href="/dashboard/pricing"
      className="px-4 py-2 bg-purple-600/80 hover:bg-purple-600 rounded-lg text-xs font-medium whitespace-nowrap transition-colors">
      업그레이드
    </Link>
  </div>
)}
```

- [ ] **Step 6: Verify build**

Run: `cd fanclash && npx next build`
Expected: Build succeeds

- [ ] **Step 7: Commit**

```bash
git add fanclash/src/app/dashboard/page.tsx fanclash/src/components/dashboard/OnboardingGuide.tsx
git commit -m "refactor: redesign dashboard layout — compact header, 2-column, remove duplicates"
```

---

### Task 6: Stats 페이지 무료 티어 개선

**Files:**
- Modify: `fanclash/src/app/dashboard/stats/page.tsx:15-29`

- [ ] **Step 1: Replace empty free-user page with basic stats**

Replace the Pro-gate block (lines 15-29) with basic stats for free users:

```tsx
if (isProFeature('stats', userPlan)) {
  // Free users: show basic stats without charts/filters
  const { data: allDonations } = await supabase
    .from('donations')
    .select('amount, fan_nickname, created_at')
    .eq('streamer_id', user!.id);

  const today = new Date().toISOString().split('T')[0];
  const totalAll = allDonations?.reduce((sum, d) => sum + d.amount, 0) || 0;
  const totalCount = allDonations?.length || 0;
  const uniqueFans = new Set(allDonations?.map(d => d.fan_nickname)).size;
  const todayCount = allDonations?.filter(d => d.created_at.startsWith(today)).length || 0;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">후원 통계</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900 rounded-xl p-5">
          <p className="text-gray-400 text-sm">총 후원</p>
          <p className="text-2xl font-bold text-purple-400 mt-1">{totalAll.toLocaleString()}원</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-5">
          <p className="text-gray-400 text-sm">후원 횟수</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{totalCount}회</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-5">
          <p className="text-gray-400 text-sm">참여 팬 수</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{uniqueFans}명</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-5">
          <p className="text-gray-400 text-sm">오늘 후원</p>
          <p className="text-2xl font-bold text-yellow-400 mt-1">{todayCount}건</p>
        </div>
      </div>
      <div className="bg-gray-900 rounded-xl p-8 border border-gray-800 text-center">
        <p className="text-gray-400 mb-4">기간별 차트, 시즌 시스템, CSV 내보내기 등은 Pro에서 이용 가능합니다.</p>
        <Link href="/dashboard/pricing" className="inline-block px-6 py-2 bg-purple-600 rounded-lg hover:bg-purple-700 text-sm">
          Pro 업그레이드
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add fanclash/src/app/dashboard/stats/page.tsx
git commit -m "feat: show basic stats for free users instead of empty page"
```

---

## Chunk 3: 연동 UX 개선

### Task 7: 연동 페이지 — 타임아웃 + 한국어 에러 + LIVE 뱃지

**Files:**
- Modify: `fanclash/src/app/dashboard/integrations/page.tsx`
- Modify: `fanclash/src/components/dashboard/IntegrationCard.tsx` (add LIVE badge, timeout, Korean errors)
- Create: `fanclash/src/lib/integration-errors.ts`

- [ ] **Step 1: Create Korean error message mapping**

```typescript
// fanclash/src/lib/integration-errors.ts
export const LIVE_REQUIRED_PLATFORMS = ['tiktok', 'chzzk', 'soop'] as const;

export function getKoreanError(platform: string, rawError: string): string {
  const lower = rawError.toLowerCase();

  if (lower.includes('not live') || lower.includes('offline') || lower.includes('not broadcasting')) {
    return '방송이 꺼져 있습니다. 방송 시작 후 다시 시도해주세요.';
  }
  if (lower.includes('auth') || lower.includes('token') || lower.includes('key') || lower.includes('invalid') || lower.includes('401')) {
    return '인증 키가 올바르지 않습니다. 다시 확인해주세요.';
  }
  if (lower.includes('timeout') || lower.includes('timed out') || lower.includes('ETIMEDOUT')) {
    return '플랫폼 서버가 응답하지 않습니다. 잠시 후 다시 시도해주세요.';
  }
  if (lower.includes('network') || lower.includes('ECONNREFUSED') || lower.includes('ENOTFOUND') || lower.includes('fetch')) {
    return '네트워크 연결을 확인해주세요.';
  }

  return `연결에 실패했습니다: ${rawError}`;
}

export function isLiveRequired(platform: string): boolean {
  return (LIVE_REQUIRED_PLATFORMS as readonly string[]).includes(platform);
}
```

- [ ] **Step 2: Add LIVE badge and timeout to IntegrationCard**

In `IntegrationCard.tsx`, add:
- `LIVE 필수` badge next to platform name for tiktok/chzzk/soop
- 15-second timeout on connect button click
- Korean error messages via `getKoreanError`

The connect button handler should:
```tsx
const handleConnect = () => {
  // Clear previous error
  // Show "연결 중..." spinner
  // Set 15s timeout: if no response, show timeout message
  // On success: clear timeout, show connected
  // On error: clear timeout, show Korean error
  onToggleConnection(integration, true);

  const timeoutId = setTimeout(() => {
    if (!integration.connected) {
      setLocalError('플랫폼 서버가 응답하지 않습니다. 잠시 후 다시 시도해주세요.');
      setConnecting(false);
    }
  }, 15000);

  setConnectTimeoutId(timeoutId);
};
```

- [ ] **Step 3: Remove 5-second polling from integrations page**

In `integrations/page.tsx`, remove the polling `useEffect` (lines 63-70). The Socket.IO `integration:status` event already handles real-time updates.

- [ ] **Step 4: Verify build**

Run: `cd fanclash && npx next build`
Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
git add fanclash/src/lib/integration-errors.ts fanclash/src/components/dashboard/IntegrationCard.tsx fanclash/src/app/dashboard/integrations/page.tsx
git commit -m "feat: add LIVE badges, 15s timeout, Korean error messages to integrations"
```

---

### Task 7b: 연동 자동 재시도 로직

**Files:**
- Modify: `fanclash/src/components/dashboard/IntegrationCard.tsx`
- Modify: `fanclash/src/app/dashboard/integrations/page.tsx`

- [ ] **Step 1: Add retry state and logic to IntegrationCard**

In `IntegrationCard.tsx`, add retry state management:

```tsx
// State:
const [retryCount, setRetryCount] = useState(0);
const [retrying, setRetrying] = useState(false);
const MAX_RETRIES = 5;
const RETRY_INTERVAL = 30000; // 30s
const retryTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

// When connection fails (in error handler or timeout):
const startRetry = () => {
  if (retryCount >= MAX_RETRIES) {
    setRetrying(false);
    setLocalError('자동 재연결 실패. 수동으로 다시 시도해주세요.');
    return;
  }
  setRetrying(true);
  retryTimerRef.current = setTimeout(() => {
    setRetryCount(prev => prev + 1);
    onToggleConnection(integration, true);
  }, RETRY_INTERVAL);
};

// Display in card:
{retrying && (
  <p className="text-xs text-yellow-400 mt-1">
    재연결 중... ({retryCount}/{MAX_RETRIES})
  </p>
)}

// Cleanup on unmount:
useEffect(() => {
  return () => { if (retryTimerRef.current) clearTimeout(retryTimerRef.current); };
}, []);

// Reset retry count on successful connection:
// When integration.connected becomes true, reset:
useEffect(() => {
  if (integration?.connected) {
    setRetryCount(0);
    setRetrying(false);
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
  }
}, [integration?.connected]);
```

- [ ] **Step 2: Verify build**

Run: `cd fanclash && npx next build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add fanclash/src/components/dashboard/IntegrationCard.tsx
git commit -m "feat: add auto-retry logic (30s interval, max 5 attempts) for integrations"
```

> **Note:** Server-side heartbeat (30s DB sync) requires backend changes and is deferred to a separate task.

---

## Chunk 4: 안정화

### Task 8: DonationPhysics 메모리 누수 수정

**Files:**
- Modify: `fanclash/src/components/overlay/DonationPhysics.tsx`

- [ ] **Step 1: Fix memory leak**

Add `World.clear()`, `bodiesMetaRef` cleanup, and setTimeout tracking:

```tsx
// Add ref for tracking setTimeout IDs
const timeoutIdsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

// In cleanup (line 90-93), replace with:
return () => {
  cancelAnimationFrame(renderLoopRef.current);
  // Clear all pending timeouts
  timeoutIdsRef.current.forEach(id => clearTimeout(id));
  timeoutIdsRef.current.clear();
  // Clear physics world and engine
  Matter.World.clear(engine.world, false);
  Matter.Engine.clear(engine);
  // Clear body metadata
  bodiesMetaRef.current.clear();
};

// In triggerDrop (line 126-129), track the timeout:
const timeoutId = setTimeout(() => {
  const meta = bodiesMetaRef.current.get(body.id);
  if (meta) meta.showName = false;
  timeoutIdsRef.current.delete(timeoutId);
}, 3000);
timeoutIdsRef.current.add(timeoutId);
```

- [ ] **Step 2: Commit**

```bash
git add fanclash/src/components/overlay/DonationPhysics.tsx
git commit -m "fix: DonationPhysics memory leak — clear world, timeouts, metadata on unmount"
```

---

### Task 9: WidgetCard 삭제 확인 모달 + 목표 리셋 확인

**Files:**
- Modify: `fanclash/src/components/dashboard/WidgetCard.tsx`
- Modify: `fanclash/src/components/dashboard/WidgetSettingsModal.tsx` (goal reset confirm)

- [ ] **Step 1: Add delete confirmation to WidgetCard**

In `WidgetCard.tsx`:

```tsx
import ConfirmModal from '@/components/ui/ConfirmModal';

// Add state:
const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

// Replace deleteWidget direct call (line 106-108):
<button onClick={() => setShowDeleteConfirm(true)}
  className="w-full py-1.5 text-xs text-gray-500 hover:text-red-400 transition-colors">
  위젯 삭제
</button>

// Add modal before closing tag:
{showDeleteConfirm && (
  <ConfirmModal
    title="위젯 삭제"
    message="이 위젯을 삭제하시겠습니까? 설정과 데이터가 모두 삭제됩니다."
    confirmText="삭제"
    variant="danger"
    onConfirm={() => { deleteWidget(); setShowDeleteConfirm(false); }}
    onCancel={() => setShowDeleteConfirm(false)}
  />
)}
```

- [ ] **Step 2: Add goal reset confirmation**

In the GoalSettings component (now at `settings/GoalSettings.tsx`), wrap the reset button:

```tsx
import { useState } from 'react';
import ConfirmModal from '@/components/ui/ConfirmModal';

// Add state:
const [showResetConfirm, setShowResetConfirm] = useState(false);

// Replace direct reset button:
<button onClick={() => setShowResetConfirm(true)}
  className="w-full py-2 bg-red-900/50 border border-red-800 rounded-lg text-sm text-red-400 hover:bg-red-900">
  현재 목표 금액 초기화 (0원으로)
</button>
{showResetConfirm && (
  <ConfirmModal
    title="목표 초기화"
    message="목표 진행도가 0원으로 초기화됩니다. 이 작업은 되돌릴 수 없습니다."
    confirmText="초기화"
    variant="danger"
    onConfirm={() => { onReset(); setShowResetConfirm(false); }}
    onCancel={() => setShowResetConfirm(false)}
  />
)}
```

- [ ] **Step 3: Commit**

```bash
git add fanclash/src/components/dashboard/WidgetCard.tsx fanclash/src/components/dashboard/settings/GoalSettings.tsx
git commit -m "feat: add confirmation modals for widget delete and goal reset"
```

---

### Task 10: 에러 바운더리 강화 + 접근성 기본

**Files:**
- Create: `fanclash/src/components/dashboard/SectionErrorBoundary.tsx`
- Modify: `fanclash/src/app/dashboard/page.tsx` (wrap sections)
- Modify: `fanclash/src/components/dashboard/ConnectionStatus.tsx` (add text labels)

- [ ] **Step 1: Create SectionErrorBoundary**

```tsx
// fanclash/src/components/dashboard/SectionErrorBoundary.tsx
'use client';
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
}

export default class SectionErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-gray-900 rounded-xl p-6 border border-red-900/30 text-center">
          <p className="text-gray-400 text-sm mb-3">
            {this.props.fallbackTitle || '이 섹션'} 로드에 실패했습니다
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 bg-gray-800 rounded-lg text-sm hover:bg-gray-700"
          >
            다시 시도
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

- [ ] **Step 2: Add text labels to ConnectionStatus indicators**

In `ConnectionStatus.tsx`, add text alongside color dots:

```tsx
// Replace color-only indicator with color + text:
<span className={`text-xs ${i.connected ? 'text-green-400' : 'text-gray-500'}`}>
  {PLATFORM_LABELS[i.platform as PlatformType]} {i.connected ? '연결됨' : '끊김'}
</span>
```

- [ ] **Step 3: Add aria attributes to toggle buttons in WidgetCard**

In `WidgetCard.tsx`, add accessibility to the ON/OFF toggle (line 65-68):

```tsx
<button onClick={toggleEnabled}
  className={`px-3 py-1 rounded-full text-xs font-bold ${widget.enabled ? 'bg-green-600' : 'bg-gray-700'}`}
  aria-label={`${label.name} ${widget.enabled ? '비활성화' : '활성화'}`}
  aria-pressed={widget.enabled}
>
  {widget.enabled ? 'ON' : 'OFF'}
</button>
```

- [ ] **Step 4: Commit**

```bash
git add fanclash/src/components/dashboard/SectionErrorBoundary.tsx fanclash/src/components/dashboard/ConnectionStatus.tsx fanclash/src/components/dashboard/WidgetCard.tsx
git commit -m "feat: add SectionErrorBoundary, text labels for status, aria attributes"
```

---

### Task 11: 최종 빌드 확인

- [ ] **Step 1: Run full build**

Run: `cd fanclash && npx next build`
Expected: Build succeeds with no errors

- [ ] **Step 2: Run all tests**

Run: `cd fanclash && npx jest --passWithNoTests`
Expected: All tests pass

- [ ] **Step 3: Final commit if any fixes needed**

---

## Deferred Items (다음 세션에서 처리)

스펙에 포함되었으나 이번 계획에서는 제외된 항목:

1. **Zod 폼 검증 (Spec 4.3)** — 위젯 설정 + 연동 설정에 Zod 스키마 적용. 별도 태스크로 분리.
2. **모달 포커스 트랩 + ESC 닫기 (Spec 4.5 일부)** — aria 속성은 추가했으나 포커스 트랩은 Headless UI 도입이 필요할 수 있음.
3. **서버 사이드 heartbeat (Spec 3 DB 동기화)** — 백엔드 IntegrationManager 수정 필요. 프론트엔드 범위 밖.
4. **계정 삭제 셀프서비스 (Spec 4.2)** — 설정 페이지 수정 + 서버 API 필요. 별도 태스크.
5. **연동 해제 확인 모달 (Spec 4.2)** — IntegrationCard에 ConfirmModal 추가. 간단하지만 이번 범위에서 제외.
6. **`dangerouslySetInnerHTML` 완전 제거** — CSS 새니타이저로 XSS 방지했으나 DOM API 삽입으로의 전환은 별도 리팩터링.

export interface SubtitleStyle {
  id: string;
  name: string;
  description: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  color: string;
  backgroundColor: string;
  backgroundOpacity: number;
  position: 'bottom' | 'center' | 'top';
  animation: 'none' | 'fade' | 'pop' | 'slide';
  outline: boolean;
  outlineColor: string;
}

export const SUBTITLE_PRESETS: SubtitleStyle[] = [
  {
    id: 'tiktok',
    name: '틱톡 스타일',
    description: '큰 글씨 + 검정 테두리 + 중앙',
    fontFamily: 'sans-serif',
    fontSize: 48,
    fontWeight: '900',
    color: '#ffffff',
    backgroundColor: '#000000',
    backgroundOpacity: 0,
    position: 'center',
    animation: 'pop',
    outline: true,
    outlineColor: '#000000',
  },
  {
    id: 'shorts',
    name: '유튜브 쇼츠',
    description: '노란 글씨 + 반투명 배경 + 하단',
    fontFamily: 'sans-serif',
    fontSize: 36,
    fontWeight: '700',
    color: '#fbbf24',
    backgroundColor: '#000000',
    backgroundOpacity: 60,
    position: 'bottom',
    animation: 'fade',
    outline: false,
    outlineColor: '#000000',
  },
  {
    id: 'instagram',
    name: '인스타 릴스',
    description: '깔끔한 흰 글씨 + 하단',
    fontFamily: 'sans-serif',
    fontSize: 32,
    fontWeight: '600',
    color: '#ffffff',
    backgroundColor: '#000000',
    backgroundOpacity: 40,
    position: 'bottom',
    animation: 'slide',
    outline: false,
    outlineColor: '#000000',
  },
  {
    id: 'gaming',
    name: '게이밍',
    description: '네온 글씨 + 글로우 효과',
    fontFamily: 'monospace',
    fontSize: 40,
    fontWeight: '700',
    color: '#a855f7',
    backgroundColor: '#000000',
    backgroundOpacity: 50,
    position: 'bottom',
    animation: 'pop',
    outline: true,
    outlineColor: '#7c3aed',
  },
  {
    id: 'minimal',
    name: '미니멀',
    description: '작은 글씨 + 하단 자막 바',
    fontFamily: 'sans-serif',
    fontSize: 24,
    fontWeight: '400',
    color: '#ffffff',
    backgroundColor: '#1f2937',
    backgroundOpacity: 80,
    position: 'bottom',
    animation: 'fade',
    outline: false,
    outlineColor: '#000000',
  },
];

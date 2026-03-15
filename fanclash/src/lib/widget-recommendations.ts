import type { WidgetType } from '@/types';

export type BroadcastStyle = 'game' | 'talk' | 'food' | 'music' | 'art' | 'other';

export type BroadcastPlatform = 'chzzk' | 'soop' | 'tiktok' | 'twitch' | 'youtube';

export interface WidgetRecommendation {
  type: WidgetType;
  name: string;
  emoji: string;
  description: string;
  reason: string;
  priority: 'essential' | 'recommended';
}

export interface DonationPlatformInfo {
  platform: string;
  label: string;
  field: string;
  placeholder: string;
  helpSteps: string[];
}

export function getRecommendations(style: BroadcastStyle): WidgetRecommendation[] {
  const essential: WidgetRecommendation[] = [
    { type: 'alert', name: '후원 알림', emoji: '🔔', description: '후원 시 화면에 알림 표시', reason: '필수', priority: 'essential' },
    { type: 'ranking', name: '랭킹 보드', emoji: '🏆', description: '후원 순위 실시간 표시', reason: '필수', priority: 'essential' },
  ];

  const styleMap: Record<BroadcastStyle, WidgetRecommendation[]> = {
    game: [
      { type: 'battle', name: '후원 배틀', emoji: '⚔️', description: '팬끼리 후원 대결', reason: '게임 방송에 딱!', priority: 'recommended' },
      { type: 'slots', name: '슬롯머신', emoji: '🎰', description: '후원하면 미션 뽑기', reason: '랜덤 이벤트', priority: 'recommended' },
      { type: 'train', name: '콤보 트레인', emoji: '🚂', description: '연속 후원 콤보', reason: '경쟁심 자극', priority: 'recommended' },
    ],
    talk: [
      { type: 'roulette', name: '룰렛', emoji: '🎡', description: '벌칙·미션 뽑기', reason: '토크 컨텐츠', priority: 'recommended' },
      { type: 'mission', name: '팬 미션', emoji: '🎯', description: '팬과 함께 목표 달성', reason: '시청자 참여', priority: 'recommended' },
      { type: 'goal', name: '목표 게이지', emoji: '📊', description: '후원 목표 진행바', reason: '동기 부여', priority: 'recommended' },
    ],
    food: [
      { type: 'roulette', name: '룰렛', emoji: '🎡', description: '메뉴 뽑기 이벤트', reason: '먹방 필수템', priority: 'recommended' },
      { type: 'meter', name: '분위기 미터', emoji: '🌡️', description: '실시간 분위기 측정', reason: '반응 시각화', priority: 'recommended' },
      { type: 'train', name: '콤보 트레인', emoji: '🚂', description: '연속 후원 콤보', reason: '분위기 과열', priority: 'recommended' },
    ],
    music: [
      { type: 'music', name: '도네이션 뮤직', emoji: '🎵', description: '후원이 음악이 되는', reason: '음악 방송 특화', priority: 'recommended' },
      { type: 'goal', name: '목표 게이지', emoji: '📊', description: '신곡 공개 목표', reason: '목표 설정', priority: 'recommended' },
      { type: 'mission', name: '팬 미션', emoji: '🎯', description: '리퀘스트 미션', reason: '팬 참여', priority: 'recommended' },
    ],
    art: [
      { type: 'timer', name: '타이머', emoji: '⏱️', description: '시간 내 완성 도전', reason: '긴장감', priority: 'recommended' },
      { type: 'goal', name: '목표 게이지', emoji: '📊', description: '작품 완성 목표', reason: '진행도 표시', priority: 'recommended' },
      { type: 'roulette', name: '룰렛', emoji: '🎡', description: '주제 뽑기', reason: '아이디어', priority: 'recommended' },
    ],
    other: [
      { type: 'roulette', name: '룰렛', emoji: '🎡', description: '이벤트 뽑기', reason: '범용', priority: 'recommended' },
      { type: 'battle', name: '후원 배틀', emoji: '⚔️', description: '팬끼리 대결', reason: '컨텐츠', priority: 'recommended' },
      { type: 'goal', name: '목표 게이지', emoji: '📊', description: '후원 목표', reason: '동기 부여', priority: 'recommended' },
    ],
  };

  return [...essential, ...styleMap[style]];
}

export const BROADCAST_PLATFORMS: { id: BroadcastPlatform; name: string; icon: string }[] = [
  { id: 'chzzk', name: '치지직', icon: '📺' },
  { id: 'soop', name: '숲/아프리카', icon: '🌲' },
  { id: 'tiktok', name: '틱톡', icon: '🎵' },
  { id: 'twitch', name: '트위치', icon: '💜' },
  { id: 'youtube', name: '유튜브', icon: '▶️' },
];

export const BROADCAST_STYLES: { id: BroadcastStyle; name: string; emoji: string; desc: string }[] = [
  { id: 'game', name: '게임 방송', emoji: '🎮', desc: 'FPS, RPG, 전략 등 게임 플레이' },
  { id: 'talk', name: '토크·잡담', emoji: '💬', desc: '시청자와 대화, 리액션' },
  { id: 'food', name: '먹방', emoji: '🍔', desc: '음식 리뷰, 쿡방' },
  { id: 'music', name: '음악·노래', emoji: '🎵', desc: '커버, 작곡, 연주' },
  { id: 'art', name: '그림·창작', emoji: '🎨', desc: '일러스트, 디자인, 공예' },
  { id: 'other', name: '기타', emoji: '📦', desc: '위에 해당 없음' },
];

export const PLATFORM_DONATION_MAP: Record<string, DonationPlatformInfo[]> = {
  chzzk: [
    { platform: 'toonation', label: '투네이션', field: 'alertbox_key', placeholder: '알림박스 키 입력', helpSteps: ['투네이션 로그인', '대시보드 → 알림박스', 'URL에서 키 복사'] },
  ],
  soop: [
    { platform: 'toonation', label: '투네이션', field: 'alertbox_key', placeholder: '알림박스 키 입력', helpSteps: ['투네이션 로그인', '대시보드 → 알림박스', 'URL에서 키 복사'] },
  ],
  tiktok: [
    { platform: 'tiktok', label: '틱톡 라이브', field: 'username', placeholder: '틱톡 사용자명 (@없이)', helpSteps: ['틱톡 프로필 → 사용자명 확인', '@를 제외하고 입력'] },
  ],
  twitch: [
    { platform: 'streamlabs', label: '스트림랩스', field: 'socket_token', placeholder: 'Socket API Token', helpSteps: ['Streamlabs 로그인', 'Settings → API Settings', 'Socket API Token 복사'] },
  ],
  youtube: [
    { platform: 'streamlabs', label: '스트림랩스', field: 'socket_token', placeholder: 'Socket API Token', helpSteps: ['Streamlabs 로그인', 'Settings → API Settings', 'Socket API Token 복사'] },
  ],
};

export const WIDGET_SIZES: Partial<Record<WidgetType, { w: number; h: number }>> = {
  alert: { w: 800, h: 600 },
  ranking: { w: 400, h: 600 },
  battle: { w: 800, h: 500 },
  slots: { w: 500, h: 400 },
  train: { w: 500, h: 400 },
  roulette: { w: 500, h: 500 },
  mission: { w: 500, h: 400 },
  goal: { w: 450, h: 350 },
  meter: { w: 400, h: 500 },
  music: { w: 600, h: 400 },
  timer: { w: 400, h: 300 },
  gacha: { w: 500, h: 600 },
};

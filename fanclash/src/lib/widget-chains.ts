import type { WidgetEventType, WidgetActionType } from './widget-events';

export interface EventChain {
  id: string;
  name: string;
  description: string;
  trigger: WidgetEventType;
  triggerCondition?: Record<string, unknown>;
  action: WidgetActionType;
  actionData?: Record<string, unknown>;
  enabled: boolean;
}

export const DEFAULT_CHAINS: EventChain[] = [
  {
    id: 'battle-to-roulette',
    name: '배틀 종료 → 룰렛',
    description: '배틀이 끝나면 룰렛이 자동으로 돌아갑니다',
    trigger: 'battle:finished',
    action: 'roulette:spin',
    enabled: false,
  },
  {
    id: 'rpg-to-gacha',
    name: 'RPG 레벨업 → 가챠',
    description: '팬이 레벨업하면 무료 가챠 1회 자동 실행',
    trigger: 'rpg:levelup',
    action: 'gacha:pull',
    enabled: false,
  },
  {
    id: 'combo-to-slots',
    name: '콤보 10 → 슬롯',
    description: '도네이션 트레인 10콤보 달성 시 슬롯머신 자동 회전',
    trigger: 'train:combo',
    triggerCondition: { minCombo: 10 },
    action: 'slots:spin',
    enabled: false,
  },
  {
    id: 'meter-to-weather',
    name: '미터 MAX → 블리자드',
    description: '핫/콜드 미터가 MAX에 도달하면 날씨가 블리자드로 변경',
    trigger: 'meter:max',
    action: 'weather:blizzard',
    enabled: false,
  },
  {
    id: 'goal-to-train',
    name: '목표 달성 → 콤보 리셋',
    description: '도네 목표 달성 시 트레인 콤보가 특별 이펙트와 함께 리셋',
    trigger: 'goal:complete',
    action: 'train:celebrate',
    enabled: false,
  },
  {
    id: 'jackpot-to-alert',
    name: '잭팟 → 특별 알림',
    description: '슬롯 잭팟 시 전체 화면 특별 알림',
    trigger: 'slots:jackpot',
    action: 'alert:special',
    enabled: false,
  },
];

/** Check if a chain's trigger condition is satisfied */
export function checkTriggerCondition(
  chain: EventChain,
  eventData: Record<string, unknown>,
): boolean {
  if (!chain.triggerCondition) return true;

  // combo-to-slots: minCombo check
  if (chain.triggerCondition.minCombo != null) {
    const comboCount = eventData.comboCount as number | undefined;
    if (comboCount == null || comboCount < (chain.triggerCondition.minCombo as number)) {
      return false;
    }
  }

  return true;
}

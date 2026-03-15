import type { WidgetType } from '@/types';

// Free: 핵심 위젯 3개로 가치 체험 → Pro 전환 유도
export const FREE_ALLOWED_WIDGETS: WidgetType[] = ['alert', 'ranking', 'goal'];

export const FREE_MAX_INTEGRATIONS = 2;
export const PRO_MAX_INTEGRATIONS = Infinity;

export const PRO_FEATURES = {
  maxWidgets: Infinity,
  maxIntegrations: Infinity,
  customSound: true,
  customCss: true,
  stats: true,
  allThemes: true,
  fanLeaderboard: true,
  seasonSystem: true,
  socialShare: true,
};

export const FREE_FEATURES = {
  maxWidgets: 3,
  maxIntegrations: 2,
  customSound: false,
  customCss: false,
  stats: false,
  allThemes: false,
  fanLeaderboard: true,
  seasonSystem: false,
  socialShare: false,
};

export function canCreateWidget(plan: string, currentCount: number): boolean {
  if (plan === 'pro') return true;
  return currentCount < FREE_ALLOWED_WIDGETS.length;
}

export function isWidgetLocked(type: WidgetType, plan: string): boolean {
  if (plan === 'pro') return false;
  return !FREE_ALLOWED_WIDGETS.includes(type);
}

export function canAddIntegration(plan: string, currentCount: number): boolean {
  if (plan === 'pro') return true;
  return currentCount < FREE_MAX_INTEGRATIONS;
}

export function isProFeature(feature: string, plan: string): boolean {
  if (plan === 'pro') return false;
  const proOnly = ['customSound', 'customCss', 'stats', 'allThemes', 'seasonSystem', 'socialShare'];
  return proOnly.includes(feature);
}

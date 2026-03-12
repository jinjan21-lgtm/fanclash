import type { WidgetType } from '@/types';

export const FREE_ALLOWED_WIDGETS: WidgetType[] = ['alert'];

export const PRO_FEATURES = {
  maxWidgets: Infinity,
  customSound: true,
  customCss: true,
  stats: true,
  allThemes: true,
  fanLeaderboard: true,
};

export const FREE_FEATURES = {
  maxWidgets: 1,
  customSound: false,
  customCss: false,
  stats: false,
  allThemes: false,
  fanLeaderboard: true,
};

export function canCreateWidget(plan: string, currentCount: number): boolean {
  if (plan === 'pro') return true;
  return currentCount < 1;
}

export function isWidgetLocked(type: WidgetType, plan: string): boolean {
  if (plan === 'pro') return false;
  return !FREE_ALLOWED_WIDGETS.includes(type);
}

export function isProFeature(feature: string, plan: string): boolean {
  if (plan === 'pro') return false; // Pro users can use everything
  const proOnly = ['customSound', 'customCss', 'stats', 'allThemes'];
  return proOnly.includes(feature);
}

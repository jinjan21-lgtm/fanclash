import type { WidgetType } from '@/types';

export const FREE_WIDGET_LIMIT = 3;

export const PRO_FEATURES = {
  maxWidgets: Infinity,
  customSound: true,
  customCss: true,
  stats: true,
  allThemes: true,
  fanLeaderboard: true,
};

export const FREE_FEATURES = {
  maxWidgets: FREE_WIDGET_LIMIT,
  customSound: false,
  customCss: false,
  stats: false,
  allThemes: false,
  fanLeaderboard: true,
};

export function canCreateWidget(plan: string, currentCount: number): boolean {
  if (plan === 'pro') return true;
  return currentCount < FREE_WIDGET_LIMIT;
}

export function isProFeature(feature: string, plan: string): boolean {
  if (plan === 'pro') return false; // Pro users can use everything
  const proOnly = ['customSound', 'customCss', 'stats', 'allThemes'];
  return proOnly.includes(feature);
}

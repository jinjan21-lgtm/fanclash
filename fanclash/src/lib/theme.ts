export type Theme = 'dark' | 'light';

export function getTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  return (localStorage.getItem('theme') as Theme) || 'dark';
}

export function setTheme(theme: Theme) {
  localStorage.setItem('theme', theme);
  document.documentElement.classList.toggle('light-theme', theme === 'light');
}

export function initTheme() {
  if (typeof window === 'undefined') return;
  const theme = getTheme();
  document.documentElement.classList.toggle('light-theme', theme === 'light');
}

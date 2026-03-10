import type { ThemeName } from '@/types';

export const themes: Record<ThemeName, {
  bg: string; text: string; accent: string; card: string; border: string;
  highlight: string; fontClass: string;
}> = {
  modern: {
    bg: 'bg-transparent', text: 'text-white', accent: 'text-purple-400',
    card: 'bg-gray-900/80', border: 'border-gray-700', highlight: 'bg-purple-600',
    fontClass: 'font-sans',
  },
  game: {
    bg: 'bg-transparent', text: 'text-green-300', accent: 'text-yellow-400',
    card: 'bg-black/90', border: 'border-cyan-500', highlight: 'bg-red-600',
    fontClass: 'font-mono',
  },
  girlcam: {
    bg: 'bg-transparent', text: 'text-pink-100', accent: 'text-pink-400',
    card: 'bg-pink-950/80', border: 'border-pink-300', highlight: 'bg-pink-500',
    fontClass: 'font-sans',
  },
};

'use client';

import { useState, useEffect } from 'react';
import { getTheme, setTheme, initTheme, type Theme } from '@/lib/theme';

export default function ThemeToggle() {
  const [current, setCurrent] = useState<Theme>('dark');

  useEffect(() => {
    initTheme();
    setCurrent(getTheme());
  }, []);

  const toggle = () => {
    const next: Theme = current === 'dark' ? 'light' : 'dark';
    setTheme(next);
    setCurrent(next);
  };

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors w-full"
      aria-label={current === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
    >
      {current === 'dark' ? (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
        </svg>
      )}
      <span className="text-xs">{current === 'dark' ? '라이트 모드' : '다크 모드'}</span>
    </button>
  );
}

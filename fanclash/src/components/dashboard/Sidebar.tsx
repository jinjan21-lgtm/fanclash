'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const NAV_ITEMS = [
  { href: '/dashboard', label: '대시보드', icon: '📊' },
  { href: '/dashboard/widgets', label: '위젯 관리', icon: '🎮' },
  { href: '/dashboard/stats', label: '후원 통계', icon: '📈' },
  { href: '/dashboard/integrations', label: '연동 설정', icon: '🔗' },
  { href: '/dashboard/donations', label: '테스트 후원', icon: '🧪' },
  { href: '/dashboard/command', label: '커맨드', icon: '🎛️' },
  { href: '/dashboard/pricing', label: '요금제', icon: '💎' },
  { href: '/dashboard/settings', label: '프로필 설정', icon: '⚙️' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <>
      {/* Mobile header bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-purple-400">FanClash</h1>
        <button onClick={() => setOpen(!open)} className="text-2xl text-gray-400">
          {open ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile overlay */}
      {open && (
        <div className="md:hidden fixed inset-0 z-30 bg-black/50" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static z-40 top-0 left-0 h-full w-64 bg-gray-900 border-r border-gray-800 p-4
        transition-transform duration-200
        ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
      `}>
        <h1 className="text-xl font-bold text-purple-400 mb-8 px-3 hidden md:block">FanClash</h1>
        <div className="mt-14 md:mt-0">
          <nav className="space-y-1.5">
            {NAV_ITEMS.map(item => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-colors ${
                  pathname === item.href ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}>
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>
          <div className="border-t border-gray-800 mt-4 pt-3">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-gray-400 hover:bg-red-900/30 hover:text-red-400 transition-colors w-full"
            >
              <span className="text-lg">🚪</span>
              <span className="font-medium">로그아웃</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

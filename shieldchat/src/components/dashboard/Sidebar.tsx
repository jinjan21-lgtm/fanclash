'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase-browser';
import ThemeToggle from './ThemeToggle';

const navItems = [
  { href: '/dashboard', label: '대시보드', icon: '📊' },
  { href: '/dashboard/comments', label: '댓글 관리', icon: '💬' },
  { href: '/dashboard/reports', label: '리포트', icon: '📄' },
  { href: '/dashboard/legal', label: '법적 가이드', icon: '⚖️' },
  { href: '/dashboard/settings', label: '설정', icon: '⚙️' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createSupabaseBrowser();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 min-h-screen flex flex-col">
      <div className="p-6 border-b border-gray-800">
        <Link href="/dashboard" className="text-xl font-bold text-rose-500">
          ShieldChat
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                isActive
                  ? 'bg-rose-500/10 text-rose-400 font-medium'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-800 space-y-1">
        <Link
          href="/dashboard/pricing"
          className="block w-full text-center px-3 py-2 bg-rose-600/10 text-rose-400 text-sm rounded-lg hover:bg-rose-600/20 transition"
        >
          Pro 업그레이드
        </Link>
        <ThemeToggle />
        <button
          onClick={handleLogout}
          className="w-full px-3 py-2 text-sm text-gray-500 hover:text-gray-300 transition text-left"
        >
          로그아웃
        </button>
      </div>
    </aside>
  );
}

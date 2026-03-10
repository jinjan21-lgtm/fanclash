'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/dashboard', label: '대시보드', icon: '📊' },
  { href: '/dashboard/widgets', label: '위젯 관리', icon: '🎮' },
  { href: '/dashboard/donations', label: '후원 입력', icon: '💰' },
  { href: '/dashboard/battle', label: '배틀 관리', icon: '⚔️' },
  { href: '/dashboard/integrations', label: '연동 설정', icon: '🔗' },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-64 bg-gray-900 min-h-screen p-4 border-r border-gray-800">
      <h1 className="text-xl font-bold text-purple-400 mb-8 px-3">FanClash</h1>
      <nav className="space-y-1">
        {NAV_ITEMS.map(item => (
          <Link key={item.href} href={item.href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              pathname === item.href ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}>
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}

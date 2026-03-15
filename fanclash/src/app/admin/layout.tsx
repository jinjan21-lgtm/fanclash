import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/admin';
import Link from 'next/link';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await isAdmin();
  if (!admin) redirect('/dashboard');

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/admin" className="text-lg font-bold text-red-400">FanClash Admin</Link>
          <nav className="flex gap-4 text-sm text-gray-400">
            <Link href="/admin" className="hover:text-white">설정</Link>
            <Link href="/admin/users" className="hover:text-white">사용자</Link>
          </nav>
        </div>
        <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-300">대시보드로 돌아가기</Link>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}

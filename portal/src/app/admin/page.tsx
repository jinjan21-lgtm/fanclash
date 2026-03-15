import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

interface AppStat {
  name: string;
  table: string;
  color: string;
  total: number;
  recent: number;
}

export default async function AdminPage() {
  const supabase = await createClient();

  // Query user counts from each app's profile table
  const [fanclash, clipforge, shieldchat] = await Promise.all([
    supabase.from('streamers').select('created_at', { count: 'exact', head: false }),
    supabase.from('cf_profiles').select('created_at', { count: 'exact', head: false }),
    supabase.from('sc_profiles').select('created_at', { count: 'exact', head: false }),
  ]);

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const countRecent = (data: { created_at: string }[] | null) => {
    if (!data) return 0;
    return data.filter(d => d.created_at >= weekAgo).length;
  };

  const apps: AppStat[] = [
    {
      name: 'FanClash',
      table: 'streamers',
      color: 'purple',
      total: fanclash.count ?? fanclash.data?.length ?? 0,
      recent: countRecent(fanclash.data),
    },
    {
      name: 'ClipForge',
      table: 'cf_profiles',
      color: 'emerald',
      total: clipforge.count ?? clipforge.data?.length ?? 0,
      recent: countRecent(clipforge.data),
    },
    {
      name: 'ShieldChat',
      table: 'sc_profiles',
      color: 'rose',
      total: shieldchat.count ?? shieldchat.data?.length ?? 0,
      recent: countRecent(shieldchat.data),
    },
  ];

  const totalUsers = apps.reduce((sum, a) => sum + a.total, 0);
  const totalRecent = apps.reduce((sum, a) => sum + a.recent, 0);
  const maxRecent = Math.max(...apps.map(a => a.recent), 1);

  const colorMap: Record<string, { bg: string; text: string; bar: string; border: string }> = {
    purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', bar: 'bg-purple-500', border: 'border-purple-500/20' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', bar: 'bg-emerald-500', border: 'border-emerald-500/20' },
    rose: { bg: 'bg-rose-500/10', text: 'text-rose-400', bar: 'bg-rose-500', border: 'border-rose-500/20' },
  };

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-lg font-bold text-gray-400 hover:text-white transition-colors">
              진크루
            </Link>
            <span className="text-gray-700">/</span>
            <h1 className="text-lg font-bold">어드민</h1>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Top stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total users */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-xs text-gray-500 mb-1">총 사용자</p>
            <p className="text-3xl font-bold">{totalUsers.toLocaleString()}</p>
            <p className="text-xs text-gray-600 mt-1">3개 앱 합산</p>
          </div>

          {/* Per app */}
          {apps.map(app => {
            const c = colorMap[app.color];
            return (
              <div key={app.name} className={`bg-gray-900 border ${c.border} rounded-xl p-5`}>
                <p className={`text-xs ${c.text} mb-1`}>{app.name}</p>
                <p className="text-3xl font-bold">{app.total.toLocaleString()}</p>
                <p className="text-xs text-gray-600 mt-1">
                  최근 7일 +{app.recent}
                </p>
              </div>
            );
          })}
        </div>

        {/* Recent signups chart */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold">최근 7일 가입자</h2>
            <span className="text-sm text-gray-500">총 {totalRecent}명</span>
          </div>
          <div className="space-y-4">
            {apps.map(app => {
              const c = colorMap[app.color];
              const pct = maxRecent > 0 ? Math.round((app.recent / maxRecent) * 100) : 0;
              return (
                <div key={app.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-sm font-medium ${c.text}`}>{app.name}</span>
                    <span className="text-sm text-gray-400">{app.recent}명</span>
                  </div>
                  <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${c.bar} rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* App usage overview */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-bold mb-4">앱별 사용 현황</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-800">
                  <th className="pb-3 font-medium">앱</th>
                  <th className="pb-3 font-medium text-right">총 사용자</th>
                  <th className="pb-3 font-medium text-right">7일 신규</th>
                  <th className="pb-3 font-medium text-right">비율</th>
                </tr>
              </thead>
              <tbody>
                {apps.map(app => {
                  const c = colorMap[app.color];
                  const share = totalUsers > 0 ? Math.round((app.total / totalUsers) * 100) : 0;
                  return (
                    <tr key={app.name} className="border-b border-gray-800/50 last:border-0">
                      <td className={`py-3 font-medium ${c.text}`}>{app.name}</td>
                      <td className="py-3 text-right">{app.total.toLocaleString()}</td>
                      <td className="py-3 text-right text-gray-400">+{app.recent}</td>
                      <td className="py-3 text-right text-gray-400">{share}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}

import { createClient } from '@/lib/supabase/server';

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const { data: streamers, count } = await supabase
    .from('streamers')
    .select('id, display_name, plan, referral_code, referred_by, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">사용자 관리</h1>
      <p className="text-gray-400 text-sm mb-6">전체 {count || 0}명</p>

      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400">
              <th className="text-left px-4 py-3">이름</th>
              <th className="text-left px-4 py-3">플랜</th>
              <th className="text-left px-4 py-3">추천코드</th>
              <th className="text-left px-4 py-3">추천인</th>
              <th className="text-left px-4 py-3">가입일</th>
            </tr>
          </thead>
          <tbody>
            {streamers?.map(s => (
              <tr key={s.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                <td className="px-4 py-3 font-medium">{s.display_name}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${s.plan === 'pro' ? 'bg-purple-600/20 text-purple-400' : 'bg-gray-700 text-gray-400'}`}>
                    {s.plan === 'pro' ? 'Pro' : 'Free'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400 font-mono text-xs">{s.referral_code}</td>
                <td className="px-4 py-3 text-gray-500">{s.referred_by ? 'Yes' : '-'}</td>
                <td className="px-4 py-3 text-gray-500">{new Date(s.created_at).toLocaleDateString('ko-KR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

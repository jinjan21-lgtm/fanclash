import { createClient } from '@/lib/supabase/server';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: streamer } = await supabase.from('streamers').select().eq('id', user!.id).single();

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">안녕하세요, {streamer?.display_name || '스트리머'}님!</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-900 rounded-xl p-6">
          <p className="text-gray-400 text-sm">오늘 총 후원</p>
          <p className="text-3xl font-bold text-purple-400 mt-2">집계 중...</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-6">
          <p className="text-gray-400 text-sm">활성 위젯</p>
          <p className="text-3xl font-bold text-green-400 mt-2">0개</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-6">
          <p className="text-gray-400 text-sm">진행 중 배틀</p>
          <p className="text-3xl font-bold text-red-400 mt-2">없음</p>
        </div>
      </div>
    </div>
  );
}

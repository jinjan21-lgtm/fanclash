import { createClient } from '@/lib/supabase/server';
import BattleControl from '@/components/dashboard/BattleControl';

export default async function BattlePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">배틀 관리</h2>
      <p className="text-gray-400 mb-4">베네핏을 걸고 배틀을 개설하세요. 시청자가 도네로 참가합니다.</p>
      <BattleControl streamerId={user!.id} />
    </div>
  );
}

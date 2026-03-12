import { createClient } from '@/lib/supabase/server';
import DonationForm from '@/components/dashboard/DonationForm';

export default async function DonationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">테스트 후원 입력</h2>
      <p className="text-gray-400 mb-1">위젯 테스트를 위한 수동 후원 입력입니다.</p>
      <p className="text-gray-500 text-sm mb-4">실제 후원은 연동된 플랫폼(투네이션, 틱톡, 치지직 등)에서 자동 수집됩니다.</p>
      <DonationForm streamerId={user!.id} />
    </div>
  );
}

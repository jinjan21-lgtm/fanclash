import { createClient } from '@/lib/supabase/server';
import DonationForm from '@/components/dashboard/DonationForm';

export default async function DonationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">후원 입력</h2>
      <p className="text-gray-400 mb-4">방송 중 받은 후원을 수동으로 입력하세요. 위젯에 실시간 반영됩니다.</p>
      <DonationForm streamerId={user!.id} />
    </div>
  );
}

import { getSetting } from '@/lib/admin';
import type { ReferralSettings } from '@/types/admin';
import ReferralSettingsForm from '@/components/admin/ReferralSettingsForm';

export default async function AdminPage() {
  const referral = await getSetting<ReferralSettings>('referral');

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">사이트 설정</h1>
      <ReferralSettingsForm initialSettings={referral || { enabled: true, reward_type: 'pro_days', reward_days: 7, reward_both: true }} />
    </div>
  );
}

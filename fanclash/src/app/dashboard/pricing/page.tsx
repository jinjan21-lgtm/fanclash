import { createClient } from '@/lib/supabase/server';
import PricingCards from '@/components/dashboard/PricingCards';

export default async function PricingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: streamer } = await supabase.from('streamers').select('plan').eq('id', user!.id).single();

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">요금제</h2>
      <p className="text-gray-400 mb-6">현재 플랜: <span className="text-purple-400 font-bold">{streamer?.plan === 'pro' ? 'Pro' : 'Free'}</span></p>
      <PricingCards currentPlan={streamer?.plan || 'free'} />
    </div>
  );
}

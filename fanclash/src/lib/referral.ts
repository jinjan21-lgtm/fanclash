import { SupabaseClient } from '@supabase/supabase-js';
import type { ReferralSettings } from '@/types/admin';

/**
 * Apply referral rewards to both referrer and referee based on site_settings.
 * Call this after a new streamer with referred_by is created.
 */
export async function applyReferralReward(
  supabase: SupabaseClient,
  newStreamerId: string,
  referrerId: string,
) {
  // Load referral settings
  const { data: setting } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'referral')
    .single();

  if (!setting) return;
  const config = setting.value as ReferralSettings;
  if (!config.enabled || config.reward_type === 'none') return;

  const proUntil = new Date();
  proUntil.setDate(proUntil.getDate() + config.reward_days);
  const proUntilISO = proUntil.toISOString();

  // Reward referee (new user)
  await supabase.from('streamers').update({
    plan: 'pro',
    pro_until: proUntilISO,
  }).eq('id', newStreamerId);

  // Reward referrer
  if (config.reward_both) {
    // Extend existing pro_until or set new
    const { data: referrer } = await supabase
      .from('streamers')
      .select('plan, pro_until')
      .eq('id', referrerId)
      .single();

    if (referrer) {
      const existingEnd = referrer.pro_until ? new Date(referrer.pro_until) : new Date();
      const base = existingEnd > new Date() ? existingEnd : new Date();
      base.setDate(base.getDate() + config.reward_days);

      await supabase.from('streamers').update({
        plan: 'pro',
        pro_until: base.toISOString(),
      }).eq('id', referrerId);
    }
  }
}

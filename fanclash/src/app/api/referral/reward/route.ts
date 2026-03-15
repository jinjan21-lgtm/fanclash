import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyReferralReward } from '@/lib/referral';

export async function POST(req: NextRequest) {
  const { new_streamer_id, referrer_id } = await req.json();
  if (!new_streamer_id || !referrer_id) {
    return NextResponse.json({ error: 'Missing ids' }, { status: 400 });
  }

  const supabase = await createClient();
  await applyReferralReward(supabase, new_streamer_id, referrer_id);
  return NextResponse.json({ ok: true });
}

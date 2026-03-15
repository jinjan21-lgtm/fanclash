import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { detectPlatform, PLAN_LIMITS, generateMockHighlights } from '@/types';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });

  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });

  const body = await request.json();
  const { vod_url } = body;

  if (!vod_url) {
    return NextResponse.json({ error: 'URL을 입력해주세요.' }, { status: 400 });
  }

  const platform = detectPlatform(vod_url);
  if (platform === 'unknown') {
    return NextResponse.json({ error: '지원되지 않는 플랫폼입니다.' }, { status: 400 });
  }

  // Check usage limits
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, clips_used_this_month')
    .eq('id', user.id)
    .single();

  if (profile) {
    const plan = (profile.plan || 'free') as 'free' | 'pro';
    const limit = PLAN_LIMITS[plan].clips_per_month;
    if (limit !== Infinity && (profile.clips_used_this_month || 0) >= limit) {
      return NextResponse.json({
        error: `이번 달 클립 한도(${limit}개)에 도달했습니다. Pro로 업그레이드하세요.`,
      }, { status: 403 });
    }
  }

  // Create job
  const { data: job, error } = await supabase
    .from('jobs')
    .insert({
      user_id: user.id,
      vod_url,
      platform,
      status: 'processing',
      progress: 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // MVP: Simulate processing completion after a delay
  // In production, this would trigger an async worker
  simulateJobProcessing(supabase, job.id);

  return NextResponse.json(job, { status: 201 });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function simulateJobProcessing(supabase: any, jobId: string) {
  // Simulate 15 seconds of processing
  const steps = [10, 25, 40, 55, 70, 85, 95, 100];
  for (let i = 0; i < steps.length; i++) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const progress = steps[i];
    if (progress < 100) {
      await supabase
        .from('jobs')
        .update({ progress })
        .eq('id', jobId);
    } else {
      const highlights = generateMockHighlights();
      await supabase
        .from('jobs')
        .update({
          progress: 100,
          status: 'completed',
          highlights,
          completed_at: new Date().toISOString(),
        })
        .eq('id', jobId);
    }
  }
}

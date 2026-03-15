import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PLAN_LIMITS } from '@/types';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });

  const { data, error } = await supabase
    .from('clips')
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
  const { job_id, title, start_time, end_time } = body;

  if (!job_id || start_time == null || end_time == null) {
    return NextResponse.json({ error: '필수 정보가 누락되었습니다.' }, { status: 400 });
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
        error: `이번 달 클립 한도(${limit}개)에 도달했습니다.`,
      }, { status: 403 });
    }
  }

  // Verify job belongs to user
  const { data: job } = await supabase
    .from('jobs')
    .select('id')
    .eq('id', job_id)
    .eq('user_id', user.id)
    .single();

  if (!job) {
    return NextResponse.json({ error: '작업을 찾을 수 없습니다.' }, { status: 404 });
  }

  const duration = end_time - start_time;

  const { data: clip, error } = await supabase
    .from('clips')
    .insert({
      job_id,
      user_id: user.id,
      title: title || `클립 ${new Date().toLocaleString('ko-KR')}`,
      start_time,
      end_time,
      duration,
      format: '9:16',
      subtitle_style: 'default',
      clip_url: `https://mock-cdn.clipforge.kr/clips/${Date.now()}.mp4`,
      thumbnail_url: null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Increment usage
  if (profile) {
    await supabase
      .from('profiles')
      .update({ clips_used_this_month: (profile.clips_used_this_month || 0) + 1 })
      .eq('id', user.id);
  }

  return NextResponse.json(clip, { status: 201 });
}

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET: list missions for streamer
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const streamerId = request.nextUrl.searchParams.get('streamer_id');
  const status = request.nextUrl.searchParams.get('status');

  if (!streamerId) {
    return NextResponse.json({ error: 'Missing streamer_id' }, { status: 400 });
  }

  let query = supabase
    .from('fan_missions')
    .select('*')
    .eq('streamer_id', streamerId)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ missions: data || [] });
}

// POST: create new mission
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const body = await request.json();
  const { streamer_id, title, description, goal_type, goal_value, reward, time_limit_minutes } = body;

  if (!streamer_id || !title || !goal_type || !goal_value || !reward) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  if (!['donation_count', 'unique_donors', 'total_amount'].includes(goal_type)) {
    return NextResponse.json({ error: 'Invalid goal_type' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('fan_missions')
    .insert({
      streamer_id,
      title,
      description: description || null,
      goal_type,
      goal_value: parseInt(goal_value),
      reward,
      time_limit_minutes: time_limit_minutes ? parseInt(time_limit_minutes) : null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ mission: data });
}

// PUT: update mission progress
export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const body = await request.json();
  const { mission_id, current_value } = body;

  if (!mission_id || typeof current_value !== 'number') {
    return NextResponse.json({ error: 'Missing mission_id or current_value' }, { status: 400 });
  }

  // Get current mission
  const { data: mission } = await supabase
    .from('fan_missions')
    .select('*')
    .eq('id', mission_id)
    .single();

  if (!mission) {
    return NextResponse.json({ error: 'Mission not found' }, { status: 404 });
  }

  const updateData: Record<string, unknown> = { current_value };

  // Check if mission is completed
  if (current_value >= mission.goal_value && mission.status === 'active') {
    updateData.status = 'completed';
    updateData.completed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('fan_missions')
    .update(updateData)
    .eq('id', mission_id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ mission: data });
}

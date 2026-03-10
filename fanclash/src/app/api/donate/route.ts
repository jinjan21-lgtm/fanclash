import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Simple rate limiting
const rateLimits = new Map<string, { count: number; resetAt: number }>();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { streamer_id, fan_nickname, amount, message } = body;

    // Validate
    if (!streamer_id || !fan_nickname || typeof amount !== 'number' || amount < 1000 || amount > 1_000_000) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }
    if (fan_nickname.length > 50 || (message && message.length > 500)) {
      return NextResponse.json({ error: 'Input too long' }, { status: 400 });
    }

    // Rate limit: 10 per minute per IP
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const now = Date.now();
    const entry = rateLimits.get(ip);
    if (entry && now < entry.resetAt && entry.count >= 10) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }
    if (!entry || now > entry.resetAt) {
      rateLimits.set(ip, { count: 1, resetAt: now + 60_000 });
    } else {
      entry.count++;
    }

    // Verify streamer exists
    const { data: streamer } = await supabase.from('streamers').select('id').eq('id', streamer_id).single();
    if (!streamer) {
      return NextResponse.json({ error: 'Streamer not found' }, { status: 404 });
    }

    // TODO: Process payment via Toss Payments before saving donation
    // For now, this creates the donation record directly (for testing)
    // In production, this should:
    // 1. Create a Toss payment request
    // 2. Redirect to Toss checkout
    // 3. On callback/webhook, save donation and emit socket event

    // Save donation
    await supabase.from('donations').insert({
      streamer_id,
      fan_nickname: fan_nickname.trim(),
      amount,
      message: (message || '').trim(),
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// In-memory rate limiting (best-effort on serverless — state resets per cold start)
// For stricter limits, migrate to Upstash Redis or Supabase-based rate limiting
const rateLimits = new Map<string, { count: number; resetAt: number }>();

async function emitDonationToSocket(streamer_id: string, fan_nickname: string, amount: number, message: string) {
  const socketUrl = process.env.SOCKET_SERVER_URL || process.env.NEXT_PUBLIC_SOCKET_URL;
  if (!socketUrl) {
    throw new Error('SOCKET_SERVER_URL or NEXT_PUBLIC_SOCKET_URL environment variable is required');
  }
  const secret = process.env.SOCKET_SERVER_SECRET;
  if (!secret) {
    throw new Error('SOCKET_SERVER_SECRET environment variable is required');
  }

  const res = await fetch(`${socketUrl}/emit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${secret}`,
    },
    body: JSON.stringify({
      event: 'donation:add',
      data: { streamer_id, fan_nickname, amount, message },
    }),
  });

  if (!res.ok) {
    throw new Error(`Socket server responded with ${res.status}`);
  }
}

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

    // Emit to Socket.IO server via HTTP
    await emitDonationToSocket(streamer_id, fan_nickname.trim(), amount, (message || '').trim());

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

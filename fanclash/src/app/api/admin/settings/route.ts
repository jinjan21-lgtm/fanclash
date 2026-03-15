import { NextRequest, NextResponse } from 'next/server';
import { isAdmin, setSetting } from '@/lib/admin';

export async function POST(req: NextRequest) {
  const admin = await isAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { key, value } = await req.json();
  if (!key || value === undefined) {
    return NextResponse.json({ error: 'Missing key or value' }, { status: 400 });
  }

  await setSetting(key, value);
  return NextResponse.json({ ok: true });
}

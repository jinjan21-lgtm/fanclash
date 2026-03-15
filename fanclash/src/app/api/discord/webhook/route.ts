import { NextRequest, NextResponse } from 'next/server';
import { sendDiscordNotification } from '@/lib/discord';

export async function POST(req: NextRequest) {
  try {
    const { webhookUrl, title, description } = await req.json();

    if (!webhookUrl) {
      return NextResponse.json({ error: 'Webhook URL이 필요합니다' }, { status: 400 });
    }
    if (!title || !description) {
      return NextResponse.json({ error: 'title과 description이 필요합니다' }, { status: 400 });
    }

    const result = await sendDiscordNotification(webhookUrl, title, description);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

export interface DiscordConfig {
  donations: boolean;
  battles: boolean;
  missions: boolean;
  achievements: boolean;
}

export const DEFAULT_DISCORD_CONFIG: DiscordConfig = {
  donations: true,
  battles: true,
  missions: true,
  achievements: true,
};

export async function sendDiscordNotification(
  webhookUrl: string,
  title: string,
  description: string
): Promise<{ ok: boolean; error?: string }> {
  if (!webhookUrl) return { ok: false, error: 'Webhook URL이 없습니다' };

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [{
          title,
          description,
          color: 0x7c3aed,
          footer: { text: 'FanClash' },
          timestamp: new Date().toISOString(),
        }],
      }),
    });

    if (!res.ok) {
      return { ok: false, error: `Discord API 오류: ${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: '디스코드 전송 중 오류가 발생했습니다' };
  }
}

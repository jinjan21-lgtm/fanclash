export const LIVE_REQUIRED_PLATFORMS = ['tiktok', 'chzzk', 'soop'] as const;

export function getKoreanError(platform: string, rawError: string): string {
  const lower = rawError.toLowerCase();

  if (lower.includes('not live') || lower.includes('offline') || lower.includes('not broadcasting')) {
    return '방송이 꺼져 있습니다. 방송 시작 후 다시 시도해주세요.';
  }
  if (lower.includes('auth') || lower.includes('token') || lower.includes('key') || lower.includes('invalid') || lower.includes('401')) {
    return '인증 키가 올바르지 않습니다. 다시 확인해주세요.';
  }
  if (lower.includes('timeout') || lower.includes('timed out') || lower.includes('etimedout')) {
    return '플랫폼 서버가 응답하지 않습니다. 잠시 후 다시 시도해주세요.';
  }
  if (lower.includes('network') || lower.includes('econnrefused') || lower.includes('enotfound') || lower.includes('fetch')) {
    return '네트워크 연결을 확인해주세요.';
  }

  return `연결에 실패했습니다: ${rawError}`;
}

export function isLiveRequired(platform: string): boolean {
  return (LIVE_REQUIRED_PLATFORMS as readonly string[]).includes(platform);
}

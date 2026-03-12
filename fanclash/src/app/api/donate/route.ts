// [DISABLED] 직접 후원 API — 추후 Toss Payments 결제 연동 시 디벨롭 예정
// 현재 FanClash 컨셉: 외부 플랫폼 후원을 수집하여 이벤트화
// 이 엔드포인트는 Pro 구독 결제 API로 대체 예정

import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: '직접 후원 기능은 현재 비활성화 상태입니다. 외부 플랫폼 연동을 이용해주세요.' },
    { status: 410 }
  );
}

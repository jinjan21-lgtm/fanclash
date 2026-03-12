# 남은 업무

> 마지막 업데이트: 2026-03-12

## 긴급 (즉시 처리)
- (없음)

## 높음 (이번 주)
- [ ] **Toss Payments 결제 연동**
  - /api/donate에 실결제 플로우 구현
  - Toss 결제 요청 → 리다이렉트 → 콜백/웹훅에서 donation 저장 + 소켓 이벤트
  - 현재는 DB 직접 저장 (테스트용)
- [ ] **추가 이벤트 위젯** (룰렛 완료, 나머지 미착수)
  - 보스 레이드 — 보스 HP를 후원금으로 깎는 협력 이벤트
  - 후원 뽑기 (가챠) — 등급별 랜덤 카드 + 이펙트
  - 후원 빙고 — 3x3/4x4 미션판, 후원으로 칸 선택
  - 도네 경매 — 베네핏 놓고 최고 입찰자 낙찰

## 보통
- (없음)

## 낮음 (여유 시)
- [ ] E2E 테스트 추가 (Playwright 또는 Cypress)
- [ ] 모바일 대시보드 최적화
- [ ] 위젯 테마 추가 (다크/라이트/커스텀)
- [ ] 위젯 드래그 정렬 (대시보드 위젯 목록)
- [ ] 다국어 지원 (영어)

## 완료된 항목 (참고용)
- [x] 핵심 위젯 9종 → 10종 (룰렛 추가)
- [x] 위젯 모션 대폭 강화 (MessageBoard, EventTimer, RankingBoard, TeamBattle)
- [x] 프로덕션 코드 정리 (localhost 제거, CORS 강화, 환경변수 검증)
- [x] 배틀 관리를 위젯 관리로 통합
- [x] 배포 완료 (Vercel + Supabase Cloud + Railway)
- [x] Supabase Auth 리다이렉트 URL 설정 완료
- [x] Gabia DNS A 레코드 설정 완료
- [x] login/signup Suspense boundary 수정

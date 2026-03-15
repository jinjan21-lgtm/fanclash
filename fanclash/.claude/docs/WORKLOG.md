# 작업 일지

## 2026-03-15 (세션 7)

### 완료한 태스크
- [x] 도네이션 트레인 (train) 위젯 추가
  - 상세: 연속 후원 콤보 카운터, 4단계 이펙트(심플/불/강렬/레인보우), 콤보 윈도우/최소금액/강도 설정
  - 파일: src/components/overlay/DonationTrain.tsx (신규), src/components/dashboard/settings/TrainSettings.tsx (신규)
- [x] 슬롯머신 (slots) 위젯 추가
  - 상세: 3릴 슬롯, 후원 금액 비례 매칭 확률, 3매치 잭팟+미션 표시, 스핀 시간 설정
  - 파일: src/components/overlay/DonationSlots.tsx (신규), src/components/dashboard/settings/SlotsSettings.tsx (신규)
- [x] 핫/콜드 미터 (meter) 위젯 추가
  - 상세: 롤링 윈도우 기반 후원 속도 게이지, ICE→COLD→NORMAL→HOT→MAX 5단계, 파티클 효과
  - 파일: src/components/overlay/DonationMeter.tsx (신규), src/components/dashboard/settings/MeterSettings.tsx (신규)
- [x] 랭킹 보드 애니메이션 강화
  - 상세: #1 변경 시 바운싱 크라운, 신규 진입 3초 골든 글로우, GlowBurst 3초로 확장
  - 파일: src/components/overlay/RankingBoard.tsx (수정)
- [x] 타입/라우팅/설정 연동
  - src/types/index.ts — WidgetType에 train/slots/meter 추가
  - src/app/overlay/[widgetId]/page.tsx — 오버레이 라우팅 추가
  - src/app/overlay/demo/[type]/page.tsx — 데모 컴포넌트 추가
  - src/components/dashboard/WidgetCard.tsx — 라벨+ConfigSummary 추가
  - src/components/dashboard/WidgetSettingsModal.tsx — 설정 연동
  - src/components/dashboard/WidgetPreviewModal.tsx — 프리뷰 사이즈 추가
  - src/app/dashboard/widgets/page.tsx — 위젯 목록 추가

---

## 2026-03-12 (세션 6)

### 완료한 태스크
- [x] 대시보드 연결 상태 UI 추가
  - 상세: Socket.IO 연결 상태(연결됨/재연결 중/끊김) 실시간 표시 + 재연결 버튼
  - 파일: src/components/dashboard/ConnectionStatus.tsx (신규), src/app/dashboard/page.tsx
  - 비고: 서버 컴포넌트에 클라이언트 컴포넌트로 삽입, 상단 인사말 옆 배치

---

## 2026-03-12 (세션 5)

### 완료한 태스크
- [x] 도네이션 처리 통합 리팩토링 (모든 위젯 1회 후원으로 연동)
  - 상세:
    1. server/services/donation-processor.ts 신규 — 통합 processDonation (중복 제거)
    2. server/services/battle-store.ts 신규 — activeBattles 공유 저장소
    3. 배틀 자동 연동: recruiting → 자동 참가, active → 금액 추가
    4. donation.ts, manager.ts 모두 공유 프로세서 호출로 변경
    5. 1회 후원 → alert, ranking, throne, goal, affinity, battle, messages, roulette, timer 모두 반응
  - 파일: server/services/donation-processor.ts, server/services/battle-store.ts, server/handlers/donation.ts, server/handlers/battle.ts, server/connectors/manager.ts
  - 비고: team_battle 서버 핸들러는 아직 미구현 (별도 작업 필요)

- [x] 이벤트 타이머 도네이션 연동
  - 상세: 3가지 모드 추가 (시간 추가/차감/자동 시작), 위젯 설정 UI + 오버레이 Socket.IO 수신
  - 파일: src/components/dashboard/WidgetSettingsModal.tsx, src/components/overlay/EventTimer.tsx
  - 비고: 서버 변경 없이 클라이언트에서 donation:new 이벤트 직접 수신

- [x] 배틀 관리 config 동기화 수정
  - 상세: recruiting 배틀이 위젯 설정 변경 후에도 이전 값(5000/180) 표시 → DB 자동 동기화
  - 파일: src/components/dashboard/BattleControl.tsx

- [x] Free 요금제 변경: 후원알림(alert) 위젯만 허용
  - 상세:
    1. plan.ts: FREE_WIDGET_LIMIT=3 → FREE_ALLOWED_WIDGETS=['alert'], isWidgetLocked() 추가
    2. widgets/page.tsx: Free 유저 alert 자동 생성, 위젯 추가 UI 제거 (Pro만 표시)
    3. 잠금 위젯 카드 UI: 잠금 아이콘 + Pro 배지, 미리보기 버튼 + 업그레이드 링크
    4. overlay/demo/[type]/page.tsx 신규: DB 없이 데모 데이터로 위젯 미리보기
    5. PricingCards: "위젯 3개" → "후원 알림 위젯 1개", "다른 위젯 사용 불가" 추가
  - 파일: src/lib/plan.ts, src/app/dashboard/widgets/page.tsx, src/app/overlay/demo/[type]/page.tsx, src/components/dashboard/PricingCards.tsx
  - 비고: 빌드 성공 확인

---

## 2026-03-12 (세션 4)

### 완료한 태스크
- [x] 직접 후원 비활성화 (프로덕트 컨셉 정리)
  - 상세:
    1. /donate/[streamerId] → 404 반환
    2. /api/donate → 410 Gone 반환
    3. DonateForm → null 반환
    4. 대시보드 "팬 후원 페이지" → "플랫폼 연동" 카드로 교체
    5. 팬 리더보드 "후원하기" 링크 제거
    6. 빠른 실행 "테스트 후원" → "프로필 설정"
    7. PricingCards "수동 후원 입력" 제거
    8. /dashboard/donations를 "테스트 후원 입력"으로 명칭 변경 (위젯 테스트용 유지)
    9. Toss Payments 방향: 직접 후원 → Pro 구독 정기결제로 전환
  - 파일: donate/[streamerId]/page.tsx, api/donate/route.ts, DonateForm.tsx, dashboard/page.tsx, fan/[streamerId]/page.tsx, dashboard/donations/page.tsx, PricingCards.tsx, REMAINING.md
  - 비고: 컨셉 = 이벤트 레이어 (외부 플랫폼 후원 수집 → 게이미피케이션), 직접 결제 X

- [x] 전역 CLAUDE.md 업데이트
  - 상세: /session-handoff를 세션 시작 + 작업 완료 시 두 시점 모두 자동 실행하도록 설정

---

## 2026-03-12 (세션 3)

### 완료한 태스크
- [x] 룰렛 위젯 DB 제약조건 수정
  - 상세: widgets 테이블의 type CHECK 제약조건에 'roulette'이 누락되어 위젯 생성 불가했음. migration 005 추가 및 Supabase DB에 직접 SQL 실행
  - 파일: supabase/migrations/005_add_roulette_type.sql
  - 비고: Supabase MCP 서버 추가 시도 (postgres MCP는 SELECT만 허용), 최종적으로 사용자가 SQL Editor에서 직접 실행

- [x] "배틀 운영" → "배틀 관리" 명칭 변경
  - 상세: WidgetCard의 버튼 텍스트와 모달 제목을 "운영"에서 "관리"로 변경
  - 파일: src/components/dashboard/WidgetCard.tsx

- [x] BattleControl이 위젯 설정값을 읽도록 수정
  - 상세: 하드코딩된 기본값(5000/180) 대신 widget.config의 defaultMinAmount, defaultTimeLimit, defaultBenefit을 사용. WidgetCard에서 config prop 전달
  - 파일: src/components/dashboard/BattleControl.tsx, src/components/dashboard/WidgetCard.tsx
  - 비고: 커밋 & push 완료 (63e28ea)

- [x] Supabase MCP 서버 등록
  - 상세: claude mcp add --transport http supabase https://mcp.supabase.com/mcp
  - 비고: 다음 세션에서 OAuth 인증 후 execute_sql 사용 가능

---

## 2026-03-12 (세션 2)

### 완료한 태스크
- [x] 프로덕션 코드 정리 (보안 + 안정성)
  - 상세:
    1. 모든 localhost:3001 하드코딩 제거 (socket/client.ts, DashboardNotifications.tsx, integrations/page.tsx, api/donate/route.ts)
    2. 환경변수 없으면 에러 throw / 서버 즉시 종료 (SUPABASE_URL, CORS_ORIGIN, SOCKET_SERVER_SECRET)
    3. CORS 와일드카드(*) 기본값 제거, 명시적 origin 리스트 필수
    4. SOCKET_SERVER_SECRET 빈 값 허용 제거
    5. Socket.IO 재연결 설정 추가 (reconnectionAttempts: 10, exponential backoff)
    6. DonateForm 에러 핸들링 (한국어 사용자 메시지)
    7. 서버 console.log 정리
    8. rate limiting 서버리스 한계 문서화
  - 파일: server/index.ts, src/lib/socket/client.ts, src/components/dashboard/DashboardNotifications.tsx, src/app/dashboard/integrations/page.tsx, src/app/api/donate/route.ts, src/components/fan/DonateForm.tsx
  - 비고: TypeScript 체크 + 빌드 성공, 커밋 & push 완료 (b3fafc9)

- [x] ws 의존성 커밋 (chzzk/soop 커넥터용)
  - 파일: package.json, package-lock.json
  - 비고: 커밋 & push 완료 (c2489c3)

- [x] 연동 설정 UX 개선
  - 상세: "연동 설정하기" 클릭 시 가이드가 자동으로 펼쳐지도록 변경
  - 파일: src/components/dashboard/IntegrationCard.tsx

- [x] 배틀 관리를 위젯 관리로 통합
  - 상세:
    1. 사이드바(LNB)에서 "배틀 관리" 메뉴 제거
    2. WidgetCard에 배틀/팀배틀 위젯용 "배틀 운영" 버튼 추가
    3. 클릭 시 모달로 BattleControl 표시 (배틀 개설/시작/취소)
  - 파일: src/components/dashboard/Sidebar.tsx, src/components/dashboard/WidgetCard.tsx

---

## 2026-03-12

### 완료한 태스크
- [x] 커스텀 사운드 Pro 체크 + 커스텀 CSS (Pro only) + 레퍼럴 시스템
  - 상세:
    1. WidgetSettingsModal에 plan prop 추가, 커스텀 사운드 URL 입력에 Pro 체크 (Free → 업그레이드 안내)
    2. 커스텀 CSS textarea 추가 (Pro only), 오버레이에 .widget-container + style 태그로 적용
    3. plan.ts에 customCss 기능 추가, PricingCards에 커스텀 CSS 항목 추가
    4. DB migration: streamers에 referral_code (UNIQUE), referred_by 컬럼 추가
    5. 회원가입 페이지: ?ref= 쿼리 파라미터로 레퍼럴 코드 수신, 가입 시 referred_by 설정
    6. OAuth callback: ref 파라미터 전달 및 레퍼럴 코드 처리
    7. 설정 페이지: 초대 링크 복사 + 초대 수 표시
  - 파일: WidgetSettingsModal.tsx, WidgetCard.tsx, widgets/page.tsx, plan.ts, PricingCards.tsx, overlay/[widgetId]/page.tsx, 004_referrals.sql, types/index.ts, signup/page.tsx, auth/callback/route.ts, settings/page.tsx
  - 비고: 빌드 성공 확인

- [x] 치지직(Chzzk) + 숲(Soop) 커넥터 추가 & 연동 가이드 강화
  - 상세:
    1. ws 의존성 추가 (raw WebSocket용)
    2. ChzzkConnector 구현 (채팅 웹소켓, 치즈 후원 감지, 20초 heartbeat)
    3. SoopConnector 구현 (채팅 웹소켓, 별풍선/애드벌룬 감지, 60초 heartbeat)
    4. IntegrationManager에 chzzk/soop 커넥터 등록
    5. integration:error 서버 이벤트 추가 (연결 실패 시 클라이언트에 전달)
    6. PlatformType에 'soop' 추가, SoopConfig 타입 추가
    7. IntegrationCard에 5개 플랫폼 상세 가이드 내장 (접이식 UI)
    8. integrations 페이지에 soop 추가, 에러 상태 표시, 레거시 가이드 제거
  - 파일: server/connectors/chzzk.ts, soop.ts, manager.ts, server/index.ts, src/types/index.ts, IntegrationCard.tsx, integrations/page.tsx
  - 비고: 빌드 성공 확인

---

## 2026-03-11

### 완료한 태스크
- [x] 비즈니스 로직 감사 8개 이슈 수정
  - 상세:
    1. FREE_WIDGET_LIMIT 적용 (widgets/page.tsx에서 canCreateWidget 호출, 초과 시 안내 표시)
    2. /api/donate에서 Socket.IO로 donation:add 이벤트 발생 (위젯에 실시간 반영)
    3. donations.message 컬럼 존재 확인 (이슈 아님)
    4. 온보딩 스텝3 "OBS에 위젯 연결" 조건을 activeWidgets > 0으로 수정
    5. Stats 페이지 Pro 전용 gate 추가
    6. widgets 테이블에 UNIQUE(streamer_id, type) 제약 추가
    7. DashboardNotifications가 streamer:subscribe로 직접 구독 (위젯 없어도 동작)
    8. useSocket의 socket.off() → 개별 리스너 해제로 변경
  - 파일: widgets/page.tsx, api/donate/route.ts, dashboard/page.tsx, stats/page.tsx, DashboardNotifications.tsx, useSocket.ts, server/index.ts, overlay 8개 컴포넌트
  - 비고: 빌드 성공 확인

---

## 이전 세션

### 완료한 태스크
- [x] 위젯 미리보기 수정 (9종 모두 preview 모드 데모 데이터 추가)
- [x] DonationAlert 위젯 추가 (큐 시스템, TTS, 파티클)
- [x] OBS 연결 가이드 모달
- [x] 대시보드 알림 (Socket.IO + Toast)
- [x] 프로필 설정 페이지
- [x] 후원 통계 고도화 (필터, CSV, 차트)
- [x] 팬 후원 페이지 (/donate/[streamerId])
- [x] 사이드바 정리 (배틀 관리, 후원 입력 제거)
- [x] 데이터 & 비즈니스 로직 전체 감사

# 남은 업무

> 마지막 업데이트: 2026-03-15

## 긴급 (즉시 처리)
- (없음)

## 높음 (이번 주)
- [ ] **Toss Payments Pro 구독 결제**
  - /api/subscribe에 구독 결제 플로우 구현
  - Toss 정기결제 → 콜백/웹훅에서 plan 업데이트
  - 직접 후원은 비활성화됨 (외부 연동으로 전환)
- [ ] **추가 이벤트 위젯** (룰렛/가챠/트레인/슬롯/미터 완료, 나머지 미착수)
  - 보스 레이드 — 보스 HP를 후원금으로 깎는 협력 이벤트
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

## 보통
- [ ] **team_battle 서버 핸들러 구현**
  - 팀배틀 생성/시작/종료 서버 로직 + team_battle:update emit
  - 도네이션 시 자동 팀 배정 + 금액 반영

## 낮음 (클립/쉴드 통합 후속)
- [ ] ClipForge/ShieldChat → FanClash 리다이렉트 설정 (원본 앱에서 /dashboard/clips, /dashboard/shield로)
- [ ] Whisper API 자막 생성 연동 (OpenAI API 키 필요)
- [ ] YouTube 댓글 자동 수집 (YouTube Data API 키 필요)
- [ ] Claude API 문맥 기반 독성 분석 (Anthropic API 키 필요)
- [ ] 도네이션 피크 → 클립 하이라이트 힌트 자동 연동
- [ ] 클립 Supabase Storage 업로드 + cf_clips DB 저장
- [ ] 소셜 미디어 직접 업로드 (TikTok/YouTube API)

## 완료된 항목 (참고용)
- [x] ClipForge → FanClash 통합 (클립 메이커 UI + FFmpeg WASM)
- [x] ShieldChat → FanClash 통합 (댓글 방어 + PDF 리포트 + 법적 가이드)
- [x] Hype overlay config wiring (Music/Gacha/Territory/Weather)
- [x] Zod form validation (schemas + WidgetSettingsModal 검증)
- [x] Modal focus trap + ESC close (ConfirmModal, WidgetSettingsModal)
- [x] Server heartbeat for integrations (30s interval)
- [x] Integration disconnect confirm modal
- [x] Account deletion self-service (API + UI)
- [x] Remove dangerouslySetInnerHTML (DOM API로 CSS 주입)
- [x] OG images placeholder (SVG)
- [x] 도네이션 처리 통합 (1회 후원 → 모든 위젯 연동)
- [x] 이벤트 타이머 도네이션 연동 (시간 추가/차감/자동 시작)
- [x] 배틀 관리 config 동기화 수정
- [x] Free 요금제 변경: alert만 허용 + 잠금 위젯 미리보기 + 데모 오버레이
- [x] 위젯 이벤트 체이닝 (6개 체인, Socket.IO relay, Pro 전용)
- [x] 팬 RPG 위젯 + 팬 프로필 페이지 + 도네이션 인사이트
- [x] 핵심 위젯 9종 → 10종 (룰렛 추가)
- [x] 위젯 모션 대폭 강화 (MessageBoard, EventTimer, RankingBoard, TeamBattle)
- [x] 프로덕션 코드 정리 (localhost 제거, CORS 강화, 환경변수 검증)
- [x] 배틀 관리를 위젯 관리로 통합
- [x] 배포 완료 (Vercel + Supabase Cloud + Railway)
- [x] Supabase Auth 리다이렉트 URL 설정 완료
- [x] Gabia DNS A 레코드 설정 완료
- [x] login/signup Suspense boundary 수정
- [x] 직접 후원 비활성화 (컨셉 정리: 이벤트 레이어만)
- [x] 커스텀 사운드 Pro 체크 + 커스텀 CSS (Pro only)
- [x] 레퍼럴 시스템 (초대 링크, 가입 추적)
- [x] 대시보드 연결 상태 UI (Socket.IO 상태 + 재연결 버튼)

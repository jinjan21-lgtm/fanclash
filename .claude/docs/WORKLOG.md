# 작업 일지

## 2026-03-15 (팬 미션 + 크리에이터 탐색 + 업적 시스템)

### 완료한 태스크

#### Feature 1: 팬 미션 시스템 (mission 위젯)
- [x] DB 마이그레이션 (fan_missions 테이블)
  - 파일: fanclash/supabase/migrations/012_fan_missions.sql
- [x] DonationMission 오버레이 컴포넌트
  - 상세: 활성 미션 프로그레스 바, 시간 제한 카운트다운, 미션 달성 축하 (confetti), 최대 3개 동시 표시
  - 파일: fanclash/src/components/overlay/DonationMission.tsx
- [x] MissionControl 대시보드 패널
  - 상세: 미션 생성 폼 (제목/설명/목표유형/목표값/보상/시간제한), 활성 미션 목록 + 취소, 히스토리 탭
  - 파일: fanclash/src/components/dashboard/MissionControl.tsx
- [x] MissionSettings 설정 컴포넌트
  - 상세: 기본 시간 제한, 보상 텍스트 표시, 최대 표시 미션 수
  - 파일: fanclash/src/components/dashboard/settings/MissionSettings.tsx
- [x] API 라우트 (GET/POST/PUT)
  - 파일: fanclash/src/app/api/missions/route.ts
- [x] 전체 와이어링 (타입, 오버레이 라우팅, 데모, 라벨, 프리뷰, 위젯 카드)
  - 파일: types/index.ts, overlay pages, WidgetCard.tsx, widgets/page.tsx, WidgetPreviewModal.tsx, WidgetSettingsModal.tsx

#### Feature 2: 크리에이터 둘러보기 (/explore)
- [x] /explore 공개 페이지 (인증 불필요)
  - 상세: 서버 컴포넌트로 스트리머 조회 (활성 위젯 1개 이상), 팬 수/후원 수/위젯 타입 표시
  - 파일: fanclash/src/app/explore/page.tsx
- [x] ExploreGrid 클라이언트 컴포넌트
  - 상세: 닉네임 검색, 정렬 (최신활동/팬수/위젯수), 3컬럼 반응형 그리드, 프로필/실시간 링크
  - 파일: fanclash/src/components/explore/ExploreGrid.tsx
- [x] OG 메타태그 + CTA 푸터

#### Feature 3: 업적/뱃지 시스템
- [x] DB 마이그레이션 (fan_achievements 테이블)
  - 파일: fanclash/supabase/migrations/013_achievements.sql
- [x] 20개 업적 정의 (5 카테고리, 4 등급)
  - 파일: fanclash/src/lib/achievements.ts
  - 카테고리: donation(5), battle(3), gacha(4), rpg(3), special(5)
  - 등급: common, rare, epic, legendary
- [x] 업적 체커 (도네이션 컨텍스트 기반 자동 판정)
  - 파일: fanclash/src/lib/achievement-checker.ts
- [x] AchievementPopup 오버레이 컴포넌트
  - 상세: 등급별 스타일링, 슬라이드인 애니메이션, 4초 자동 해제
  - 파일: fanclash/src/components/overlay/AchievementPopup.tsx
- [x] API 라우트 (GET/POST)
  - 파일: fanclash/src/app/api/achievements/route.ts
- [x] 팬 프로필 페이지에 업적 그리드 추가
  - 파일: fanclash/src/app/fan/[streamerId]/[nickname]/page.tsx, FanProfileClient.tsx

#### 빌드 확인
- [x] 빌드 성공 (0 에러, 44 라우트)

---

## 2026-03-15 (크로스앱 연동 + 알림 + 어드민 + 문서 + 테마)

### 완료한 태스크

#### Feature 1: FanClash -> ClipForge 데이터 브릿지
- [x] 도네이션 피크 타임스탬프 export API 생성
  - 파일: fanclash/src/app/api/export/highlights/route.ts
  - 상세: 1분 윈도우 기반 도네이션 그룹핑, 3+ 건수 또는 10000원 초과 감지, 인접 윈도우 병합
- [x] ClipForge 새 클립 페이지에 FanClash 연동 UI 추가
  - 파일: clipforge/src/app/dashboard/new/page.tsx
  - 상세: 하이라이트 분석 완료 후 "FanClash 하이라이트 힌트" 안내 + 연동 버튼 (MVP placeholder)

#### Feature 2: 알림 센터
- [x] NotificationCenter 컴포넌트 생성
  - 파일: fanclash/src/components/dashboard/NotificationCenter.tsx
  - 상세: 벨 아이콘 드롭다운, 최대 20개 알림, 5종 타입(donation/battle/rpg/goal/error), 읽지않은 배지, 모두 읽음, localStorage 저장
- [x] DashboardNotifications에서 커스텀 이벤트 dispatch 연동
  - 파일: fanclash/src/components/dashboard/DashboardNotifications.tsx
- [x] 대시보드 레이아웃 헤더에 NotificationCenter 배치
  - 파일: fanclash/src/app/dashboard/layout.tsx

#### Feature 3: Portal 어드민 대시보드
- [x] Supabase 서버 클라이언트 설정
  - 파일: portal/src/lib/supabase/server.ts
- [x] /admin 페이지 생성 (3개 앱 통합 사용자 통계)
  - 파일: portal/src/app/admin/page.tsx
  - 상세: 총 사용자 카드, 앱별 사용자 카드, 7일 가입자 바 차트, 앱별 사용 현황 테이블

#### Feature 4: API 문서 페이지
- [x] /docs 정적 API 문서 페이지 생성
  - 파일: fanclash/src/app/docs/page.tsx
  - 상세: Socket.IO 수신 8종 + 발신 6종, REST API 5개 엔드포인트, 목차 사이드바, 다크 테마, 코드 블록

#### Feature 5: 다크/라이트 테마 토글
- [x] 3개 앱에 theme.ts 유틸리티 생성
  - 파일: {fanclash,clipforge,shieldchat}/src/lib/theme.ts
- [x] CSS 변수 추가 (globals.css) - 다크/라이트 모드 변수 + .light-theme 오버라이드
  - 파일: {fanclash,clipforge,shieldchat}/src/app/globals.css
- [x] ThemeToggle 컴포넌트 생성 + 각 앱 사이드바에 배치
  - 파일: {fanclash,clipforge,shieldchat}/src/components/dashboard/ThemeToggle.tsx
  - 파일: {fanclash,clipforge,shieldchat}/src/components/dashboard/Sidebar.tsx

#### 빌드 확인
- [x] 4개 앱 모두 빌드 성공 (FanClash, ClipForge, ShieldChat, Portal)

---

## 2026-03-15 (SEO + 자막 프리셋 + 감정 트렌드)

### 완료한 태스크

#### Feature 1: SEO + Lighthouse 최적화 (4개 앱)
- [x] FanClash: robots.txt, sitemap.ts, 메타태그 보강 (canonical, JSON-LD SoftwareApplication), 시맨틱 HTML (header/main/footer/nav)
  - 파일: public/robots.txt, src/app/sitemap.ts, src/app/layout.tsx, src/app/page.tsx
- [x] ClipForge: robots.txt, sitemap.ts, 메타태그 보강 (metadataBase, canonical, twitter, robots), 시맨틱 HTML
  - 파일: public/robots.txt, src/app/sitemap.ts, src/app/layout.tsx, src/app/page.tsx
- [x] ShieldChat: robots.txt, sitemap.ts, 메타태그 보강 (metadataBase, canonical, OG, twitter, robots), 시맨틱 HTML
  - 파일: public/robots.txt, src/app/sitemap.ts, src/app/layout.tsx, src/app/page.tsx
- [x] Portal: robots.txt, sitemap.ts, 메타태그 보강 (metadataBase, canonical, keywords)
  - 파일: public/robots.txt, src/app/sitemap.ts, src/app/layout.tsx

#### Feature 2: ClipForge 자막 스타일 프리셋
- [x] 5종 자막 프리셋 정의 (틱톡/쇼츠/릴스/게이밍/미니멀)
  - 파일: clipforge/src/lib/subtitle-styles.ts
- [x] SubtitlePreview 컴포넌트 (미니 프리뷰 + 클릭 선택)
  - 파일: clipforge/src/components/dashboard/SubtitlePreview.tsx
- [x] 새 클립 페이지에 자막 스타일 선택기 통합
  - 파일: clipforge/src/app/dashboard/new/page.tsx

#### Feature 3: ShieldChat 감정 트렌드 대시보드
- [x] 트렌드 API (시간대별 분포, 7일 트렌드, 반복 공격자, 키워드 빈도)
  - 파일: shieldchat/src/app/api/trends/route.ts
- [x] TrendDashboard 클라이언트 컴포넌트 (CSS 기반 차트 4종)
  - 파일: shieldchat/src/components/dashboard/TrendDashboard.tsx
- [x] 대시보드 페이지에 TrendDashboard 통합
  - 파일: shieldchat/src/app/dashboard/page.tsx

#### 빌드 확인
- [x] 4개 앱 모두 빌드 성공 (FanClash, ClipForge, ShieldChat, Portal)

---

## 2026-03-15 (크로스 프로덕트 + 공개 프로필 + 테마 에디터)

### 완료한 태스크

#### Feature 1: Cross-Product SSO 링크
- [x] FanClash 설정 페이지에 ClipForge/ShieldChat 링크 추가
  - 파일: fanclash/src/app/dashboard/settings/page.tsx
- [x] ClipForge 설정 페이지에 FanClash/ShieldChat 링크 추가
  - 파일: clipforge/src/app/dashboard/settings/page.tsx
- [x] ShieldChat 설정 페이지에 FanClash/ClipForge 링크 추가
  - 파일: shieldchat/src/app/dashboard/settings/page.tsx

#### Feature 2: 스트리머 공개 프로필 페이지
- [x] /streamer/[streamerId] 공개 프로필 페이지 생성
  - 상세: OG 메타태그, 프로필 헤더, 4종 스탯 카드, 활성 위젯 뱃지, RPG 랭킹 TOP 5, 탑 서포터 5명, 가챠 통계, URL 복사/실시간 방송 링크, 가입 CTA
  - 파일: fanclash/src/app/streamer/[streamerId]/page.tsx

#### Feature 3: 위젯 테마 비주얼 에디터
- [x] ThemeEditor 컴포넌트 생성 (Pro 전용)
  - 상세: 라이브 미리보기, 배경색+투명도/테두리+두께/모서리/패딩/폰트/글자색/글로우 효과 컨트롤, CSS 자동 생성, 고급 CSS 직접 편집 토글
  - 파일: fanclash/src/components/dashboard/settings/ThemeEditor.tsx
- [x] WidgetSettingsModal에 ThemeEditor 통합 (StylePresets 아래)
  - 파일: fanclash/src/components/dashboard/WidgetSettingsModal.tsx

#### 빌드 확인
- [x] 3개 앱 모두 빌드 성공 (FanClash, ClipForge, ShieldChat)

---

## 2026-03-15 (고도화)

### 완료한 태스크

#### 디밸롭 — 출시 준비 + 제품 완성도

##### FanClash
- [x] Socket.IO 이벤트 체인 서버 릴레이 (widget:event → widget:chain-action 브로드캐스트)
  - 파일: server/index.ts, src/types/index.ts
- [x] 실시간 관전 모드 (/live/[streamerId])
  - 상세: 팬이 인증 없이 실시간 후원/랭킹/배틀/RPG/미터/콤보 구경, OG 메타태그, 공유 버튼
  - 파일: src/app/live/[streamerId]/page.tsx, src/components/live/LiveSpectator.tsx
- [x] 인터랙티브 데모 페이지 (/demo)
  - 상세: 회원가입 없이 위젯 8종 체험, 테스트 후원 패널, iframe 기반
  - 파일: src/app/demo/page.tsx
- [x] PWA 매니페스트 (커맨드 패널 모바일 앱화)
  - 파일: public/manifest.json, public/icon.svg, layout.tsx, command/page.tsx
- [x] Playwright E2E 테스트 인프라 (4개 테스트 파일, 기본 스모크 테스트)
  - 파일: playwright.config.ts, e2e/*.spec.ts

##### MCN 통합 포털
- [x] 진크루 브랜드 포털 사이트 (portal/)
  - 상세: 3개 프로덕트 소개, CSS 애니메이션, 반응형, 다크 테마
  - 파일: portal/ 전체

##### 빌드 확인
- [x] 4개 앱 모두 빌드 성공 (FanClash 30p, ClipForge 14p, ShieldChat 19p, Portal 4p)

---

#### FanClash — 위젯 간 이벤트 연동 시스템
- [x] 이벤트 버스 + 체인 정의 (6종 기본 체인)
  - 파일: src/lib/widget-events.ts, src/lib/widget-chains.ts
- [x] 이벤트 발신 (6개 위젯: Battle, RPG, Train, Meter, Slots, Goal)
  - 상세: Socket.IO widget:event로 크로스 iframe 통신
- [x] 이벤트 수신 + 자동 액션 (5개 위젯: Roulette, Gacha, Slots, Weather, Train)
  - 상세: widget:chain-action 수신 → 자동 스핀/뽑기/블리자드/축하 실행
- [x] EventChainManager 대시보드 UI (Pro 전용)
  - 파일: EventChainManager.tsx, widgets/page.tsx
- [x] DB 마이그레이션 (streamers.event_chains jsonb)
  - 파일: supabase/migrations/011_event_chains.sql
- [x] 빌드 성공

#### ClipForge — 시뮬레이션 → 실제 영상 처리 전환
- [x] FFmpeg WASM 클라이언트 사이드 영상 처리 도입
  - 상세: @ffmpeg/ffmpeg + @ffmpeg/util 설치, COOP/COEP 헤더 설정, CDN 기반 WASM 로드
  - 파일: src/lib/video-processor.ts, next.config.ts, package.json
- [x] Web Audio API 기반 실제 하이라이트 감지
  - 상세: RMS 볼륨 분석, 1초 윈도우, 평균 2배 초과 피크 감지, 인접 구간 병합, 최대 10개
  - 파일: src/lib/audio-analyzer.ts
- [x] 새 클립 페이지 전면 재작성 (URL 입력 → 파일 업로드)
  - 상세: 드래그앤드롭 + 파일 선택, 오디오 분석 프로그레스, 하이라이트 목록, 클립 생성/미리보기/다운로드
  - 파일: src/app/dashboard/new/page.tsx
- [x] 대시보드/클립 페이지/랜딩 페이지 업데이트
  - 파일: dashboard/page.tsx, clips/page.tsx, page.tsx
- [x] 목업 코드 제거 (generateMockHighlights, simulateJobProcessing, POST /api/jobs)
  - 파일: src/types/index.ts, src/app/api/jobs/route.ts
- [x] 빌드 성공

#### ShieldChat — 실제 PDF 다운로드 구현
- [x] html2canvas + jspdf 기반 실제 PDF 생성
  - 상세: DOM 캡처 → PNG → 멀티페이지 A4 PDF, 한국어 완벽 렌더링
  - 파일: src/lib/pdf-generator.ts, package.json
- [x] 리포트 인쇄 페이지에 PDF 다운로드 버튼 추가
  - 상세: "PDF 다운로드" 버튼 + 로딩 스피너 + 레이아웃 개선
  - 파일: src/app/dashboard/reports/[id]/print/page.tsx
- [x] 리포트 목록에서 직접 PDF 다운로드 링크
  - 파일: src/app/dashboard/reports/page.tsx
- [x] 빌드 성공

---

## 2026-03-15 (ShieldChat)

### 완료한 태스크

#### ShieldChat MVP 구축
- [x] 프로젝트 스캐폴딩 (Next.js 16 + TypeScript + Tailwind + Supabase)
  - 파일: shieldchat/ 전체
- [x] DB 스키마 설계 (profiles, comments, reports + RLS + auto-profile trigger)
  - 파일: supabase/migrations/001_schema.sql
- [x] 한국어 독성 감지 엔진 (키워드 기반, 5 카테고리, 4 심각도)
  - 파일: src/lib/toxicity.ts
  - 상세: 욕설/협박/명예훼손/성희롱/차별 패턴 매칭, 가중치 기반 점수 산정, 축약형/우회 표현 포함
- [x] Supabase 인증 (로그인/회원가입/콜백)
  - 파일: src/app/login, signup, auth/callback
- [x] 랜딩 페이지 (히어로 + 3단계 + 기능 카드 + CTA + 푸터)
  - 파일: src/app/page.tsx
- [x] 대시보드 (통계 카드 + 심각도 분포 차트 + 최근 위험 댓글)
  - 파일: src/app/dashboard/page.tsx
- [x] 댓글 추가 (텍스트 입력 + 일괄 입력 2모드)
  - 파일: src/app/dashboard/comments/new/page.tsx
- [x] 댓글 목록 (필터/정렬/벌크선택/리포트 추가)
  - 파일: src/app/dashboard/comments/page.tsx
- [x] 댓글 상세 (분석 결과 + 증거 보존 + 메모 + 삭제)
  - 파일: src/app/dashboard/comments/[id]/page.tsx
- [x] 리포트 관리 (목록 + 새 리포트 + PDF 인쇄 페이지)
  - 파일: src/app/dashboard/reports/
- [x] 법적 가이드 (5개 섹션: 신고/법률/고소장/증거/유용한 링크)
  - 파일: src/app/dashboard/legal/page.tsx
- [x] 설정/요금제/이용약관/개인정보처리방침
- [x] API 라우트 (comments CRUD + reports CRUD + generate)
  - 파일: src/app/api/comments/, src/app/api/reports/
- [x] 다크 테마 (gray-950 + rose 액센트) + 모바일 반응형
- [x] 빌드 성공 (19 라우트, 0 에러)

---

## 2026-03-15 (ClipForge)

### 완료한 태스크

#### ClipForge MVP 구축
- [x] 프로젝트 스캐폴딩 (Next.js 16 + TypeScript + Tailwind + Supabase)
  - 파일: clipforge/ 전체
- [x] Supabase 스키마 (profiles, jobs, clips + RLS + auto-profile trigger)
  - 파일: clipforge/supabase/migrations/001_schema.sql
- [x] 랜딩 페이지 (히어로, 3단계, 기능 카드, 요금제, 푸터)
  - 파일: clipforge/src/app/page.tsx
- [x] 인증 (로그인/회원가입/callback)
  - 파일: clipforge/src/app/(auth)/login/page.tsx, signup/page.tsx, auth/callback/route.ts
- [x] 대시보드 레이아웃 + 사이드바 (모바일 반응형)
  - 파일: clipforge/src/app/dashboard/layout.tsx, Sidebar.tsx
- [x] 대시보드 메인 (사용량 통계 + 최근 작업)
  - 파일: clipforge/src/app/dashboard/page.tsx
- [x] 새 클립 만들기 (URL 입력 + 플랫폼 자동 감지)
  - 파일: clipforge/src/app/dashboard/new/page.tsx
- [x] 작업 상세 (5단계 진행 시뮬레이션 + 하이라이트 목록 + 클립 생성)
  - 파일: clipforge/src/app/dashboard/jobs/[jobId]/page.tsx
- [x] 클립 관리 (그리드 뷰, 정렬, 삭제)
  - 파일: clipforge/src/app/dashboard/clips/page.tsx
- [x] 설정 페이지 (프로필, 플랜, 사용량)
  - 파일: clipforge/src/app/dashboard/settings/page.tsx
- [x] 요금제 페이지 (Free vs Pro 비교 + FAQ)
  - 파일: clipforge/src/app/dashboard/pricing/page.tsx
- [x] API 라우트 6종 (jobs CRUD, clips CRUD, 사용량 제한)
  - 파일: clipforge/src/app/api/jobs/route.ts, [jobId]/route.ts, clips/route.ts, [clipId]/route.ts
- [x] 컴포넌트 3종 (Sidebar, JobCard, ClipCard)
  - 파일: clipforge/src/components/dashboard/*.tsx
- [x] 타입 + 유틸리티 (플랫폼 감지, 목 하이라이트 생성 등)
  - 파일: clipforge/src/types/index.ts
- [x] 빌드 성공 (14 routes, 0 errors)

---

## 2026-03-15 (FanClash)

### 완료한 태스크

#### 브레인스토밍 + 설계
- [x] FanClash 기존 기능 개선 브레인스토밍 (D: 기존 기능 개선)
  - 상세: 대시보드 UX, 위젯 설정, 연동 UX, 오버레이 품질 전체 분석 후 접근법 B(UX+안정화) 선택
  - 파일: docs/superpowers/specs/2026-03-15-fanclash-improvements-design.md
- [x] 구현 계획 작성 (12개 태스크, 4개 청크)
  - 파일: docs/superpowers/plans/2026-03-15-fanclash-improvements.md

#### Chunk 1: Foundation + 하입 피처 설정
- [x] CSS 새니타이저 유틸리티 (XSS 방지)
  - 파일: src/lib/sanitize-css.ts, __tests__/lib/sanitize-css.test.ts, overlay/[widgetId]/page.tsx
- [x] ConfirmModal 공통 컴포넌트
  - 파일: src/components/ui/ConfirmModal.tsx
- [x] WidgetSettingsModal 분리 (818줄 → 170줄 셸 + 11개 파일)
  - 파일: src/components/dashboard/settings/*.tsx, WidgetSettingsModal.tsx
- [x] 하입 피처 5종 설정 UI + 오버레이 연동
  - 상세: Music/Gacha/Physics/Territory/Weather 설정 컴포넌트, ConfigSummary, DonationPhysics gravity/emojiSize 연동
  - 파일: settings/{Music,Gacha,Physics,Territory,Weather}Settings.tsx, WidgetCard.tsx, DonationPhysics.tsx

#### Chunk 2: 대시보드 개편
- [x] 대시보드 레이아웃 개편
  - 상세: 8섹션→4섹션, Quick Actions 제거, 헤더+스탯 병합, 2컬럼 레이아웃, Pro 배너 하단
  - 파일: src/app/dashboard/page.tsx, OnboardingGuide.tsx
- [x] Stats 페이지 무료 티어 개선
  - 상세: 빈 화면 → 기본 4종 스탯 카드 표시
  - 파일: src/app/dashboard/stats/page.tsx

#### Chunk 3: 연동 UX
- [x] LIVE 뱃지 + 15초 타임아웃 + 한국어 에러 메시지
  - 파일: src/lib/integration-errors.ts, IntegrationCard.tsx, integrations/page.tsx (폴링 제거)
- [x] 자동 재시도 로직 (30초 간격, 최대 5회)
  - 파일: IntegrationCard.tsx

#### Chunk 4: 안정화
- [x] DonationPhysics 메모리 누수 수정
  - 상세: World.clear, setTimeout 추적, bodiesMetaRef 정리
  - 파일: DonationPhysics.tsx
- [x] 삭제 확인 모달 + 목표 리셋 확인
  - 파일: WidgetCard.tsx, GoalSettings.tsx
- [x] SectionErrorBoundary + ConnectionStatus 텍스트 라벨 + aria 속성
  - 파일: SectionErrorBoundary.tsx, ConnectionStatus.tsx, WidgetCard.tsx

#### 빌드 + 테스트
- [x] 최종 빌드 성공, 78개 테스트 전체 통과

#### 신규 위젯 배치 1 (A: 새 기능/위젯)
- [x] 도네이션 트레인 위젯 (train)
  - 상세: 연속 도네이션 콤보 카운터, 4단계 시각 효과 (펄스→불꽃→대형텍스트→레인보우)
  - 파일: DonationTrain.tsx, TrainSettings.tsx
  - 데모: /overlay/demo/train
- [x] 슬롯머신 위젯 (slots)
  - 상세: 3릴 슬롯, 7종 심볼, 금액 비례 당첨 확률, 미션 목록 설정
  - 파일: DonationSlots.tsx, SlotsSettings.tsx
  - 데모: /overlay/demo/slots
- [x] 핫/콜드 미터 위젯 (meter)
  - 상세: 롤링 윈도우 기반 분위기 게이지, 5단계(얼음→차가움→보통→뜨거움→MAX)
  - 파일: DonationMeter.tsx, MeterSettings.tsx
  - 데모: /overlay/demo/meter
- [x] 랭킹 보드 애니메이션 강화
  - 상세: 1등 변경 시 왕관 바운스, 신규 진입 3초 골든 글로우
  - 파일: RankingBoard.tsx
- [x] 모든 신규 위젯 앱 통합 (타입, 오버레이 라우팅, 데모, 설정, 라벨, 프리뷰)
- [x] 빌드 성공, 78개 테스트 통과

#### 잔여 개선 8건
- [x] 하입 오버레이 config 완전 연동 (Music/Gacha/Territory/Weather)
- [x] Zod 폼 검증 스키마 + WidgetSettingsModal 적용
- [x] 모달 ESC 닫기 + 포커스 트랩 (ConfirmModal, WidgetSettingsModal)
- [x] 서버 heartbeat (IntegrationManager 30초 간격 상태 확인)
- [x] 연동 해제 확인 모달 (IntegrationCard)
- [x] 계정 삭제 셀프서비스 (설정 페이지 + API)
- [x] dangerouslySetInnerHTML 제거 → DOM API 삽입
- [x] OG 이미지 SVG + 메타태그 정리

#### Supabase 공유 프로젝트 설정
- [x] ClipForge 테이블 접두사 cf_ 적용 (9개 파일)
- [x] ShieldChat 테이블 접두사 sc_ 적용 (12개 파일)
- [x] 분리 가이드 문서 작성 (.claude/docs/SUPABASE_SHARED.md)

#### 신규 위젯 + 기능 배치 3
- [x] 팬 RPG 위젯 (rpg)
  - 상세: 누적 도네이션으로 캐릭터 레벨업, 장비 자동 업그레이드, 칭호 변경, XP 배율 설정
  - 파일: DonationRPG.tsx, RPGSettings.tsx, api/rpg/route.ts, 010_fan_rpg.sql
  - 데모: /overlay/demo/rpg
- [x] 팬 프로필 페이지
  - 상세: /fan/[streamerId]/[nickname] 공개 페이지, 총 기여/RPG캐릭터/가챠컬렉션/배틀전적/호감도
  - 파일: src/app/fan/[streamerId]/[nickname]/page.tsx, FanProfileClient.tsx
- [x] 도네이션 인사이트
  - 상세: Pro 전용, 최고 시간대/팬 충성도/주간 트렌드/탑 서포터 4종 인사이트 카드
  - 파일: DonationInsights.tsx, stats/page.tsx
- [x] 빌드 성공

#### 신규 기능 배치 2
- [x] 팬 퀴즈 위젯 (quiz)
  - 상세: 스트리머 출제 → 팬 도네이션 메시지로 답변, QuizControl 패널, IDLE/ACTIVE/RESULT 상태
  - 파일: DonationQuiz.tsx, QuizSettings.tsx, QuizControl.tsx
- [x] 배틀 토너먼트 모드
  - 상세: 4/8강 대진표, 자동 라운드 진행, 결승 우승자 연출
  - 파일: BattleControl.tsx (TournamentControl), BattleArena.tsx, BattleSettings.tsx
- [x] 가챠 컬렉션/도감
  - 상세: gacha_collections 테이블, API route, 오버레이에 컬렉션 바, 팬별 등급 수집 추적
  - 파일: 009_gacha_collections.sql, api/gacha/collection/route.ts, DonationGacha.tsx, GachaSettings.tsx
- [x] 스트리머 커맨드 패널
  - 상세: /dashboard/command 모바일 최적화 페이지, 배틀/룰렛/타이머/퀴즈 원터치 컨트롤
  - 파일: src/app/dashboard/command/page.tsx, Sidebar.tsx
- [x] 빌드 성공, 78개 테스트 통과

---

## 2026-03-14

### 완료한 태스크

#### 기획 수정
- [x] FanClash 기획 수정 및 명확화
  - 상세: 핵심 컨셉(엔터테인먼트 레이어), Toss Phase 1 이동, 팬페이지 제외, 사용자 구분
  - 파일: .claude/docs/PLAN.md

#### Phase 1 마무리
- [x] 에러/로딩 상태 통일
  - 상세: 전체 대시보드에 스켈레톤 로더 + 에러 바운더리 추가
  - 파일: dashboard/loading.tsx, stats/loading.tsx, settings/loading.tsx, dashboard/error.tsx 외 4개 페이지 수정

- [x] SEO & OG 메타태그
  - 상세: OpenGraph, Twitter Card, keywords, metadataBase, title template
  - 파일: src/app/layout.tsx

- [x] 법적 페이지 + 사업자 정보
  - 상세: 개인정보 처리방침, 이용약관, 푸터 사업자 정보 (진크루/559-26-01952)
  - 파일: src/app/privacy/page.tsx, src/app/terms/page.tsx, src/app/page.tsx

- [x] 테스트 보강 (3개 → 6개 파일, 70개 테스트)
  - 파일: __tests__/services/donation.test.ts(23), donation-processor.test.ts(10), connector-manager.test.ts(19)

#### 비즈니스 디벨롭
- [x] 무료/Pro 기능 경계 재설계
  - 상세: Free 위젯 1개→3개(알림,랭킹,목표), 연동 2개, Pro에 시즌/소셜공유 추가
  - 파일: src/lib/plan.ts, PricingCards.tsx, widgets/page.tsx

- [x] 레퍼럴 프로그램 + 어드민 패널
  - 상세: /admin 어드민 페이지, site_settings 테이블, 레퍼럴 보상(Pro 무료 일수), 사용자 관리, 가입 시 자동 보상 적용
  - 파일: supabase/migrations/006_site_settings.sql, src/lib/admin.ts, src/lib/referral.ts, src/types/admin.ts, src/app/admin/*, src/app/api/admin/*, src/app/api/referral/*, signup/page.tsx, auth/callback/route.ts

- [x] 알림 시스템 확장 (6종 이벤트)
  - 상세: throne:change, battle:finished, affinity:levelup, goal:complete, integration:error 추가
  - 파일: src/components/dashboard/DashboardNotifications.tsx

- [x] 소셜 공유 카드
  - 상세: OG 이미지 동적 생성(next/og) + /share 공개 페이지 + 대시보드 공유 버튼
  - 파일: src/app/api/share/ranking/route.tsx, src/app/share/[streamerId]/page.tsx, dashboard/page.tsx

- [x] 시즌/리셋 시스템 (Pro 전용)
  - 상세: 시즌 생성/종료, 랭킹 스냅샷, 지난 시즌 조회
  - 파일: supabase/migrations/007_seasons.sql, src/app/api/seasons/*, src/components/dashboard/SeasonManager.tsx, stats/page.tsx

- [x] 멀티 스트리머 콜라보 배틀 (API만, Phase 2+ 검토)
  - 상세: 초대 코드 기반 크로스 스트리머 배틀. 크로스 플랫폼 가치 낮아 실시간 연동은 보류
  - 파일: supabase/migrations/008_collab_battles.sql, src/app/api/collab/*, src/components/dashboard/CollabBattleManager.tsx

#### 하입 피처 5종 (신규 위젯)
- [x] 도네이션 뮤직 (Tone.js, MIT)
  - 상세: 금액별 6단계 펜타토닉 아르페지오 + 피아노 키 시각화 + 음표 파티클
  - 파일: src/components/overlay/DonationMusic.tsx
  - 데모: /overlay/demo/music

- [x] 도네이션 가챠
  - 상세: N/R/SR/SSR/UR 5등급 뽑기, 금액 높을수록 높은 등급 확률, 카드 뒤집기 애니메이션, SR+ 화면 플래시
  - 파일: src/components/overlay/DonationGacha.tsx
  - 데모: /overlay/demo/gacha

- [x] 도네이션 폭격 (matter.js, MIT)
  - 상세: 물리엔진 기반, 후원하면 물체 떨어지고 쌓임, 금액 비례 크기, 이모지+닉네임
  - 파일: src/components/overlay/DonationPhysics.tsx
  - 데모: /overlay/demo/physics

- [x] 영토 전쟁
  - 상세: 20x12 격자 r/place 스타일, 닉네임→색상 해싱, 도네이션으로 칸 점령, 리더보드
  - 파일: src/components/overlay/DonationTerritory.tsx
  - 데모: /overlay/demo/territory

- [x] 방송 날씨
  - 상세: 5분간 누적 후원 기반 5단계 날씨 (맑음→흐림→비→폭풍→블리자드), CSS 파티클, 번개, 화면 흔들림
  - 파일: src/components/overlay/DonationWeather.tsx
  - 데모: /overlay/demo/weather

---

## 2026-03-10 ~ 2026-03-12 (이전 세션 요약)

### 완료한 태스크
- [x] Task 1: 프로젝트 스캐폴딩 (Next.js 16 + TypeScript + Tailwind + Supabase + Socket.IO)
- [x] Task 2: Supabase 스키마 & 인증
- [x] Task 3: Socket.IO 서버 & 5개 플랫폼 커넥터
- [x] Task 4: 핵심 UI 컴포넌트 & 대시보드
- [x] Task 5-6: 배틀 & 인터랙션 기능
- [x] 랜딩 페이지 리디자인, 스타일 프리셋, 연동 상태 개선, 한국어 에러, 사이드바 수정

---

## 2026-03-10

### 완료한 태스크
- [x] 크리에이터 프로덕트 아이디어 브레인스토밍 (14개 → Top 3)
- [x] FanClash 디자인 확정 (docs/superpowers/specs/2026-03-10-fanclash-design.md)

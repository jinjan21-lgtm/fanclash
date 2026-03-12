# FanClash (팬클래시)

## 개요
한국 스트리머를 위한 후원 기반 팬 참여 도구. 후원 금액에 따른 게이미피케이션 위젯을 OBS 오버레이로 제공.

## 목표
- [x] 핵심 위젯 9종 (ranking, throne, goal, affinity, battle, team_battle, timer, messages, alert)
- [x] 실시간 Socket.IO 연동
- [x] 팬 후원 페이지
- [x] 대시보드 (위젯 관리, 통계, 설정)
- [x] 외부 플랫폼 연동 (투네이션, 틱톡, Streamlabs, 치지직, 숲)
- [x] 배포 (Vercel + Supabase Cloud + Railway)
- [x] 프로덕션 보안 강화
- [ ] Toss Payments 결제 연동
- [ ] 이벤트 위젯 확장 (룰렛, 보스 레이드, 뽑기, 빙고, 경매)

## 기술 스택
- Next.js 16 App Router + TypeScript + Tailwind CSS
- Supabase (PostgreSQL + Auth + RLS)
- Socket.IO (Railway 별도 서버)
- Framer Motion (위젯 애니메이션)

## 아키텍처
- Next.js (Vercel): 대시보드, 팬 페이지, API routes
- Socket.IO 서버 (Railway): 실시간 후원 처리, 위젯 업데이트, 외부 플랫폼 커넥터
- Supabase Cloud: DB + Auth + RLS
- OBS Browser Source: /overlay/[widgetId] 페이지
- 서버 간 통신: Vercel API → Railway HTTP /emit (Bearer token 인증)

## 주요 기능
### 위젯 시스템
- 9종 위젯, 각각 OBS 오버레이로 사용 가능
- 미리보기 모드 (?preview=true)
- 위젯별 설정 (사운드, 테마, 지속시간 등)
- 배틀 운영: 위젯 관리 페이지 내에서 배틀 개설/시작/취소

### 요금제
- Free: 위젯 3개, 기본 기능
- Pro: 무제한 위젯, 통계, 커스텀 사운드, 커스텀 CSS

### 팬 페이지
- /fan/[streamerId]: 리더보드
- /donate/[streamerId]: 후원 페이지

### 외부 플랫폼 연동
- 투네이션, 틱톡, Streamlabs, 치지직, 숲
- 각 플랫폼별 상세 가이드 내장

### 레퍼럴 시스템
- 초대 링크 생성 및 공유
- 가입 추적, 초대 현황 표시

## 변경 이력
| 날짜 | 변경 내용 | 사유 |
|------|----------|------|
| 2026-03-11 | 최초 작성 | 세션 인수인계 문서화 |
| 2026-03-12 | 배포 완료, 아키텍처 업데이트 | Vercel+Railway+Supabase Cloud 배포 |
| 2026-03-12 | 이벤트 위젯 확장 목표 추가 | 룰렛/보스레이드/뽑기/빙고/경매 아이디어 논의 |
| 2026-03-12 | 배틀 관리 UI 변경 | LNB 독립 메뉴 → 위젯 관리 내 통합 |

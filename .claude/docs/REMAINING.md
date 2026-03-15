# 남은 업무

> 마지막 업데이트: 2026-03-15

## 보류 (블로커 있음)
- [ ] Toss Payments 구독 결제 연동
  - 블로커: 인증 절차 진행 중 (외부 대기)
- [ ] 배포 (Vercel + Supabase Cloud + Railway)
  - 블로커: 별도 세션 진행 중
- [ ] 통신판매업 신고
  - 블로커: 행정 절차 (사업자등록 완료)

## 높음
- [ ] Zod 폼 검증 (위젯 설정 + 연동 설정)
  - 이번 개선에서 deferred. 프론트+서버 동일 스키마 적용
- [ ] 모달 포커스 트랩 + ESC 닫기 통일
  - Headless UI 도입 검토 필요
- [ ] 서버 사이드 heartbeat (DB 연결 상태 동기화)
  - IntegrationManager 백엔드 수정 필요
- [ ] 하입 피처 오버레이 컴포넌트 config 완전 연동
  - DonationPhysics는 완료. Music/Gacha/Territory/Weather 오버레이에서 새 config 키 읽기 필요
- [ ] 온보딩 이메일/가이드 영상
  - 코드 외 작업: 가입 후 이탈 방지 콘텐츠 제작
- [ ] 크리에이터 커뮤니티/피드백 채널 개설
  - 코드 외 작업: 디스코드 or 카카오톡 오픈채팅
- [ ] MCN/에이전시 B2B 제휴용 랜딩/제안서
  - 코드 외 작업: 소속 스트리머 전원 도입 제안

## 높음 — ClipForge 후속
- [x] ClipForge MVP 완성 (UI/UX + 데이터 플로우 + 시뮬레이션)
- [ ] ClipForge 실제 영상 처리 파이프라인 (FFmpeg + Whisper + 하이라이트 감지 AI)
- [ ] ClipForge 배포 (Vercel + Supabase)
- [ ] ClipForge Toss Payments 구독 연동

## 보통
- [ ] 연동 해제 확인 모달 (IntegrationCard에 ConfirmModal 추가)
- [ ] 계정 삭제 셀프서비스 (설정 페이지 + 서버 API)
- [ ] `dangerouslySetInnerHTML` 완전 제거 (DOM API 삽입 전환)
- [ ] OG 이미지 제작 (og-image.png, 1200x630)
- [ ] 도네이션 부스터 통계 (FanClash 켠 날 vs 안 켠 날 비교 데이터)
- [x] 숏폼 자동화 프로덕트 기획/디자인 → ClipForge MVP 완료
- [ ] 악성 댓글 대응 프로덕트 기획/디자인

## 낮음 (여유 시)
- [ ] 방송 운영 통합 대시보드 기획
- [ ] 협찬 매칭 플랫폼 기획
- [ ] 크리에이터 세무 서비스 기획
- [ ] 크리에이터 교육 플랫폼 기획
- [ ] 콜라보 배틀 실시간 Socket.IO 연동 (크로스 플랫폼 — Phase 2+ 검토)

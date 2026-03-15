# 통합 기능 상태

## 클립 메이커 (구 ClipForge)

### 작동하는 기능
- [x] 영상 파일 업로드
- [x] Web Audio API 하이라이트 감지
- [x] FFmpeg WASM 클립 추출
- [x] 클립 다운로드
- [x] 자막 스타일 프리셋 선택

### 준비 중 (API 키 필요)
- [ ] Whisper API 자막 생성 — OpenAI API 키 필요
- [ ] FanClash 도네이션 피크 → 자동 하이라이트 힌트 — API 연동 구현 필요
- [ ] 소셜 미디어 직접 업로드 — TikTok/YouTube API 키 필요

### DB 참고
- 클립 데이터: `cf_clips` 테이블 (Supabase 공유 프로젝트)
- 작업 데이터: `cf_jobs` 테이블
- 프로필: FanClash `streamers` 테이블 재사용 (cf_profiles는 레거시)

## 댓글 방어 (구 ShieldChat)

### 작동하는 기능
- [x] 댓글 텍스트 입력 (단건 + 일괄)
- [x] 한국어 키워드 기반 독성 분석
- [x] 심각도 4단계 자동 분류
- [x] 증거 보존 (DB 저장)
- [x] PDF 리포트 다운로드
- [x] 법적 대응 가이드

### 준비 중 (API 키 필요)
- [ ] Claude API 문맥 기반 독성 분석 — Anthropic API 키 필요
- [ ] YouTube 댓글 자동 수집 — YouTube Data API 키 필요
- [ ] 치지직 댓글 자동 수집 — API 조사 필요
- [ ] 법률사무소 연동 — 제휴 필요

### DB 참고
- 댓글 데이터: `sc_comments` 테이블
- 리포트 데이터: `sc_reports` 테이블
- 프로필: FanClash `streamers` 테이블 재사용 (sc_profiles는 레거시)

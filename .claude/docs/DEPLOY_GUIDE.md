# 배포 가이드

> GitHub: https://github.com/jinjan21-lgtm/fanclash
> Supabase: https://xewqqgsxykjsfkqyjfku.supabase.co (ap-northeast-2)

## 1. Vercel 배포 (4개 앱)

### 설정 방법
1. https://vercel.com/new 접속
2. "Import Git Repository" → `jinjan21-lgtm/fanclash` 선택
3. **Root Directory** 설정 (아래 표 참고)
4. Framework: Next.js (자동 감지됨)
5. 환경변수 추가
6. Deploy 클릭

같은 레포를 **4번 import**해서 각각 다른 Root Directory로 설정합니다.

### 프로젝트별 설정

| Vercel 프로젝트명 | Root Directory | 환경변수 |
|-------------------|----------------|----------|
| `fanclash` | `fanclash` | 아래 참고 |
| `clipforge` | `clipforge` | 아래 참고 |
| `shieldchat` | `shieldchat` | 아래 참고 |
| `portal` | `portal` | 아래 참고 |

### 환경변수 (4개 앱 공통)

```
NEXT_PUBLIC_SUPABASE_URL=https://xewqqgsxykjsfkqyjfku.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhld3FxZ3N4eWtqc2ZrcXlqZmt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyNTk3MTAsImV4cCI6MjA4ODgzNTcxMH0.B-mDmf4LS4iNjxkYahfOEkRLmJzrCOcmFo-3kWPXPEM
```

### FanClash 추가 환경변수

```
NEXT_PUBLIC_SOCKET_URL=https://[RAILWAY_URL]
SUPABASE_SERVICE_ROLE_KEY=[SERVICE_ROLE_KEY]
```

> SERVICE_ROLE_KEY는 Supabase 대시보드 → Settings → API → service_role에서 확인

## 2. Railway 배포 (FanClash Socket.IO 서버)

1. https://railway.app → New Project
2. GitHub 레포 연결 → Root Directory: `fanclash/server`
3. 환경변수:
```
SUPABASE_URL=https://xewqqgsxykjsfkqyjfku.supabase.co
SUPABASE_SERVICE_ROLE_KEY=[SERVICE_ROLE_KEY]
PORT=3001
```
4. 배포 후 URL을 FanClash Vercel 환경변수 `NEXT_PUBLIC_SOCKET_URL`에 설정

## 3. Supabase 설정

### Auth 설정 (대시보드 → Authentication → URL Configuration)
```
Site URL: https://fanclash.vercel.app
Redirect URLs:
  - https://fanclash.vercel.app/auth/callback
  - https://clipforge.vercel.app/auth/callback
  - https://shieldchat.vercel.app/auth/callback
  - http://localhost:3000/auth/callback
```

### 마이그레이션 상태
모든 마이그레이션 적용 완료 (006~014):
- 006: site_settings + admin_users
- 007: seasons + season_rankings
- 008: collab_battles
- 009: gacha_collections
- 010: fan_rpg_characters
- 011: event_chains (streamers 컬럼)
- 012: cf_profiles + cf_jobs + cf_clips (ClipForge)
- 013: sc_profiles + sc_comments + sc_reports (ShieldChat)
- 014: multi_app_triggers (통합 트리거)

## 4. 배포 후 확인 체크리스트

- [ ] FanClash 랜딩 페이지 로드
- [ ] FanClash 로그인/회원가입 작동
- [ ] FanClash 대시보드 접근
- [ ] FanClash 위젯 오버레이 렌더링 (/overlay/demo/alert)
- [ ] FanClash Socket.IO 연결 (ConnectionStatus 확인)
- [ ] ClipForge 랜딩 + 로그인
- [ ] ClipForge 파일 업로드 + 클립 추출
- [ ] ShieldChat 랜딩 + 로그인
- [ ] ShieldChat 댓글 분석 + PDF 다운로드
- [ ] Portal 랜딩 페이지
- [ ] 크로스앱 SSO (한 앱에서 가입 → 다른 앱 자동 프로필 생성)

## 5. Claude Code에서 Vercel 토큰으로 자동 배포

### 토큰
Vercel API Token: `$VERCEL_TOKEN`
계정: `jinjan21-9740`
Scope: `jinjan21-9740s-projects`

### 배포 명령어 (Claude Code에서 사용)
```bash
TOKEN="$VERCEL_TOKEN"
SCOPE="jinjan21-9740s-projects"

# 각 앱 배포
cd fanclash && vercel --prod --yes --token "$TOKEN" --scope "$SCOPE"
cd clipforge && vercel --prod --yes --token "$TOKEN" --scope "$SCOPE"
cd shieldchat && vercel --prod --yes --token "$TOKEN" --scope "$SCOPE"
cd portal && vercel --prod --yes --token "$TOKEN" --scope "$SCOPE"
```

### 환경변수 관리
```bash
# 환경변수 추가
vercel env add VAR_NAME production --value "value" --yes --token "$TOKEN" --scope "$SCOPE"

# 환경변수 확인
vercel env ls --token "$TOKEN" --scope "$SCOPE"

# 프로젝트 목록
vercel project ls --token "$TOKEN" --scope "$SCOPE"

# 배포 로그
vercel inspect [DEPLOY_URL] --logs --token "$TOKEN" --scope "$SCOPE"
```

### 자동 배포 플로우
1. 코드 수정 → `git commit` → `git push origin master`
2. GitHub 연동 프로젝트: push만으로 자동 배포
3. CLI 프로젝트: `vercel --prod` 명령으로 수동 배포

### Vercel 프로젝트 현황
| 프로젝트 | URL | GitHub 연동 |
|----------|-----|------------|
| fanclash | https://www.fanclash.asia | O (자동 배포) |
| clipforge | https://clipforge-steel.vercel.app | CLI 배포 |
| shieldchat | https://shieldchat.vercel.app | CLI 배포 |
| portal | https://portal-pi-blush.vercel.app | CLI 배포 |

> GitHub 자동 배포로 전환하려면: Vercel 대시보드 → 프로젝트 → Settings → Git → Root Directory 설정

## 6. 도메인 설정 (선택)

Vercel 대시보드에서 커스텀 도메인 연결:
- fanclash.kr → fanclash.vercel.app
- clipforge.kr → clipforge.vercel.app
- shieldchat.kr → shieldchat.vercel.app
- jinkru.com → portal.vercel.app

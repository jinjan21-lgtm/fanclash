# Supabase 공유 프로젝트 가이드

> 3개 프로덕트(FanClash, ClipForge, ShieldChat)가 하나의 Supabase 프로젝트를 공유합니다.
> 무료 플랜(프로젝트 2개 제한)을 초과하지 않기 위한 구성입니다.

## 테이블 접두사 규칙

| 프로덕트 | 접두사 | 테이블 예시 |
|----------|--------|------------|
| FanClash | (없음) | `streamers`, `widgets`, `donations`, `integrations`, `battles`, `fan_profiles`, `donation_goals`, `seasons`, `collab_battles`, `site_settings`, `gacha_collections`, `fan_rpg_characters` |
| ClipForge | `cf_` | `cf_profiles`, `cf_jobs`, `cf_clips` |
| ShieldChat | `sc_` | `sc_profiles`, `sc_comments`, `sc_reports` |

## 환경 변수 설정

3개 앱 모두 동일한 Supabase 프로젝트 키를 사용합니다:

```env
# .env.local (3개 앱 모두 동일)
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[ANON_KEY]
SUPABASE_SERVICE_ROLE_KEY=[SERVICE_ROLE_KEY]  # 서버 전용
```

## Auth 공유

- 3개 앱이 같은 `auth.users` 테이블을 공유합니다
- 각 앱의 프로필 테이블은 별도 (`streamers`, `cf_profiles`, `sc_profiles`)
- 한 사용자가 3개 앱 모두에 가입하면 3개 프로필 레코드가 생성됩니다
- auth trigger 함수명 충돌 주의:
  - FanClash: `handle_new_user()` → `streamers`에 삽입
  - ClipForge: `cf_handle_new_user()` → `cf_profiles`에 삽입
  - ShieldChat: `sc_handle_new_user()` → `sc_profiles`에 삽입

## 마이그레이션 적용 순서

```bash
# 1. FanClash 마이그레이션 (001~010)
psql $DATABASE_URL < fanclash/supabase/migrations/001_initial.sql
# ... 010까지

# 2. ClipForge 마이그레이션
psql $DATABASE_URL < clipforge/supabase/migrations/001_schema.sql

# 3. ShieldChat 마이그레이션
psql $DATABASE_URL < shieldchat/supabase/migrations/001_schema.sql
```

## 나중에 분리하는 방법

프로덕트가 성장하면 각각 독립 Supabase 프로젝트로 분리합니다:

### 1단계: 새 Supabase 프로젝트 생성
```bash
# ClipForge용 새 프로젝트
supabase projects create clipforge --org-id [ORG_ID]
```

### 2단계: 마이그레이션 수정 (접두사 제거)
```sql
-- clipforge/supabase/migrations/001_schema.sql
-- cf_profiles → profiles
-- cf_jobs → jobs
-- cf_clips → clips
```

### 3단계: 코드에서 접두사 제거
```bash
# 전체 검색/치환
grep -r "cf_profiles" clipforge/src/ → "profiles"
grep -r "cf_jobs" clipforge/src/ → "jobs"
grep -r "cf_clips" clipforge/src/ → "clips"
```

### 4단계: 환경 변수 변경
```env
# clipforge/.env.local
NEXT_PUBLIC_SUPABASE_URL=https://[NEW_PROJECT_ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[NEW_ANON_KEY]
```

### 5단계: 데이터 마이그레이션
```sql
-- 기존 프로젝트에서 데이터 export
COPY cf_profiles TO '/tmp/cf_profiles.csv' CSV HEADER;
COPY cf_jobs TO '/tmp/cf_jobs.csv' CSV HEADER;
COPY cf_clips TO '/tmp/cf_clips.csv' CSV HEADER;

-- 새 프로젝트에 import (접두사 없는 테이블명)
COPY profiles FROM '/tmp/cf_profiles.csv' CSV HEADER;
COPY jobs FROM '/tmp/cf_jobs.csv' CSV HEADER;
COPY clips FROM '/tmp/cf_clips.csv' CSV HEADER;
```

### 6단계: Auth 사용자 마이그레이션
- Supabase CLI로 auth 데이터 export/import
- 또는 사용자에게 재가입 요청 (MVP 단계에서는 이게 더 현실적)

## 주의사항

1. **RLS 정책**: 각 앱의 RLS는 `auth.uid()`를 사용하므로 충돌 없음
2. **트리거 함수명**: 반드시 접두사 포함 (충돌 방지)
3. **스토리지 버킷**: 필요 시 `fc-`, `cf-`, `sc-` 접두사 사용
4. **Edge Functions**: 함수명에 접두사 사용
5. **무료 한도**: 500MB DB, 1GB 스토리지, 50,000 auth 사용자 — 3개 앱 합산

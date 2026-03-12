# Vercel + Railway Deployment Plan

> **For agentic workers:** REQUIRED: Use superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy FanClash to Vercel (Next.js) + Railway (Socket.IO) with Supabase Cloud DB.

**Architecture:** Next.js on Vercel connects to Socket.IO on Railway via HTTP for server-to-server, WebSocket for client. Both connect to Supabase Cloud.

**Tech Stack:** Vercel, Railway, Docker, Node.js 22, Socket.IO, Express (HTTP endpoint)

---

## Task 1: Socket.IO 서버에 HTTP /emit 엔드포인트 추가

**Files:**
- Modify: `server/index.ts`

- [ ] **Step 1:** `server/index.ts`에 express(또는 http) 기반 HTTP POST `/emit` 엔드포인트 추가. `SOCKET_SERVER_SECRET` 헤더 인증. CORS를 `CORS_ORIGIN` 환경변수로 변경. PORT를 `process.env.PORT`로 변경.

---

## Task 2: /api/donate에서 HTTP fetch로 변경

**Files:**
- Modify: `src/app/api/donate/route.ts`

- [ ] **Step 1:** socket.io-client import 제거, fetch()로 Socket.IO 서버의 `/emit` 엔드포인트 호출. `SOCKET_SERVER_URL`(내부용) + `SOCKET_SERVER_SECRET` 사용.

---

## Task 3: Railway용 server/package.json + Dockerfile 생성

**Files:**
- Create: `server/package.json`
- Create: `server/Dockerfile`
- Create: `server/.dockerignore`

- [ ] **Step 1:** server/package.json 생성 (express, socket.io, @supabase/supabase-js, dotenv, tsx, tiktok-live-connector)
- [ ] **Step 2:** Dockerfile 생성 (Node 22 alpine, npm install, tsx로 실행)
- [ ] **Step 3:** .dockerignore 생성

---

## Task 4: 환경변수 정리 및 next.config.ts 업데이트

**Files:**
- Modify: `next.config.ts`
- Create: `.env.local.example` 업데이트

- [ ] **Step 1:** next.config.ts에 serverExternalPackages 설정 (socket.io 관련 제외)
- [ ] **Step 2:** .env.local.example에 새 환경변수 추가

---

## Task 5: Vercel 배포

- [ ] **Step 1:** Vercel CLI로 프로젝트 생성 및 배포
- [ ] **Step 2:** 환경변수 설정

---

## Task 6: Railway 배포

- [ ] **Step 1:** Railway CLI로 Socket.IO 서버 배포
- [ ] **Step 2:** 환경변수 설정
- [ ] **Step 3:** Vercel의 NEXT_PUBLIC_SOCKET_URL을 Railway 도메인으로 업데이트

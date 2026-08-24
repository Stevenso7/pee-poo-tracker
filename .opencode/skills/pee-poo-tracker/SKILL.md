---
name: pee-poo-tracker
description: Working context for the "All the best" / 痾 the best mobile app (pee & poo tracker) — React Native (Expo) + NestJS + Supabase + Google Gemini. Load this skill when developing, debugging, or extending this project to instantly understand the stack, structure, and conventions.
---

# All the best (痾 the best)

A fun, Cantonese-first bathroom logging app. Users log pee/poo events (color, foam,
volume, consistency) with an optional photo, and can trigger **on-demand** AI analysis
(Gemini vision) of that photo. Friendly/informal tone — pee and poo are gross, so the
app keeps it playful.

## Tech stack
- **Mobile:** React Native (Expo SDK 52) + TypeScript. Supabase Auth (email),
  expo-image-picker, expo-notifications, @react-native-async-storage/async-storage.
- **Backend:** NestJS 10 + Prisma 6. Supabase (Postgres + Auth + Storage). Google Gemini
  (vision) called server-side via REST.
- **Monorepo:** npm workspaces (`apps/mobile`, `apps/api`, `packages/shared`).

## Repository layout
- `apps/mobile` — Expo app. Entry `index.js` → `App.tsx`. Screens in `src/screens`,
  auth context in `src/auth`, services in `src/services`.
- `apps/api` — NestJS. Modules: `auth`, `records`, `analyses`, `stats`, `settings`,
  `storage`, `jobs`, `health`. Prisma schema in `prisma/`.
- `packages/shared` — enums, Cantonese labels, zod schemas. **Build before use**
  (`npm run build:shared`).

## Critical gotchas (costly to re-discover)
- Supabase signs JWTs with **ES256** (elliptic curve, `kty: EC`), NOT RS256.
- JWKS URL is `{SUPABASE_URL}/auth/v1/.well-known/jwks.json` (note `.well-known`).
- Supabase keys are new-format: `SUPABASE_SECRET_KEY` (`sb_secret_...`) and
  `SUPABASE_PUBLISHABLE_KEY` (`sb_publishable_...`) — NOT `service_role`/`anon`.
- `DATABASE_URL` must use the **session pooler (port 5432)**, not the transaction
  pooler (6543) — Prisma migrations hang/fail otherwise.
- Gemini is called via its REST `generateContent` endpoint (no SDK), returning
  structured JSON (`responseMimeType: application/json` + `responseSchema`).
- Photos: **one per record**, stored in a **private** `records` bucket. Upload via
  presigned PUT, then `POST /records/:id/photo/confirm`. Display via
  `GET /records/:id/photo` (signed URL).
- Free tier quota: **3 AI analyses/month** (tracked on `profiles.analysisUsedThisMonth`).

## Conventions
- **Language:** UI and AI reports are in informal written Cantonese (口語粵文) —
  `屙尿` / `屙屎`, not formal written Chinese.
- **Tone:** chill, friendly, funny. Light emoji throughout (💧 💩 🚽 ✨).
- **Theme:** orange primary `#F2994A`, warm cream background `#FFF8F2`, rounded corners,
  pill-shaped chips.
- **Data:** Bristol scale (1–7) for poo consistency; color/foam/volume enums for pee
  (defined in `packages/shared/src/enums.ts`).

## Common commands
- `npm run dev:api` — NestJS on `:3000`, routes under `/v1`, Swagger at `/docs`.
- `npm run dev:mobile` — Expo; press `i` for the iOS simulator.
- `npm run build:shared` — rebuild shared after changing enums/labels.
- `npm run prisma:deploy -w @pee-poo/api` — apply migrations.

## Current state
Backend is fully working (DB migrated; auth; records CRUD; photo upload; analysis;
stats; settings; retention purge job). Mobile app works: auth, home, log (with photo),
history, record detail (analysis), settings. **AI analysis is untested** pending a
Gemini API key. iOS Simulator + Metro use a monorepo Metro config
(`apps/mobile/metro.config.js`) and a local `index.js` entry (do not revert to
`node_modules/expo/AppEntry.js`).

# All the best (屙 the best) 🚽

A fun, Cantonese-first bathroom logging app.

- **Mobile:** React Native (Expo)
- **Backend:** NestJS
- **Database / Auth / Storage:** Supabase
- **AI analysis:** Google Gemini (on-demand, vision)

See `docs/pee-poo-tracker-plan.md` for the product plan and
`docs/technical-spec.md` for the full engineering spec.

## Repository structure

```
apps/
  mobile/    React Native (Expo) app
  api/       NestJS backend
packages/
  shared/    Shared types, enums, Cantonese labels, zod schemas
```

## Prerequisites

- Node.js **24 (LTS)** — see `.nvmrc`; run `nvm use` (Node 20 is EOL and should
  not be used)
- npm >= 9
- A Supabase project
- A Google Gemini API key

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure the API

```bash
cp apps/api/.env.example apps/api/.env
# edit apps/api/.env — fill DATABASE_URL, SUPABASE_URL, SUPABASE_SECRET_KEY, GEMINI_API_KEY
```

### 3. Configure the mobile app

```bash
cp apps/mobile/.env.example apps/mobile/.env
# edit apps/mobile/.env — fill EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY, EXPO_PUBLIC_API_URL
```

### 4. Set up Supabase

1. Create a **private** Storage bucket named `records`.
2. Enable Auth providers: email (and Apple / Google if desired).
3. Run the database schema (from the repo root):

```bash
npm run prisma:migrate -w @pee-poo/api
# or, for quick local dev without migrations:
# npm run prisma:generate -w @pee-poo/api && npx -w @pee-poo/api prisma db push
```

### 5. Build the shared package

```bash
npm run build:shared
```

> The API and mobile app both consume `@pee-poo/shared` from its compiled
> `dist/`. Rebuild it whenever shared types change (`npm run build:shared`).

### 6. Run

```bash
npm run dev:api      # backend on http://localhost:3000/v1
npm run dev:mobile   # Expo dev server
```

## Docker (API)

```bash
# local Postgres + API
docker compose up -d

# build the API image alone
docker build -f apps/api/Dockerfile -t pee-poo-api .
```

## Notes

- The **bundle identifier / package** (`com.yourco.poolog` in `apps/mobile/app.json`)
  is a placeholder — change it before release.
- After adding/removing Expo native modules, run `npx expo install --fix` to align
  dependency versions.
- The API verifies Supabase JWTs via JWKS; keep `SUPABASE_SECRET_KEY`
  server-side only.

# Pee & Poo Tracker — Technical Specification (Build-Ready)

> Status: **Spec only — not yet implemented.**
> This document is the engineering reference for implementation. It assumes the
> decisions in `pee-poo-tracker-plan.md` (v3): React Native (Expo), NestJS,
> Supabase, Google Gemini, Cantonese-friendly tone, 1 photo/record, 3 free
> analyses/month, 20–25K HKD budget.

---

## Table of Contents

1. [Repository & Project Structure](#1-repository--project-structure)
2. [Shared Types, Enums & Constants](#2-shared-types-enums--constants)
3. [Database Schema (Prisma)](#3-database-schema-prisma)
4. [Authentication & Authorization](#4-authentication--authorization)
5. [API Specification](#5-api-specification)
6. [Photo Upload Flow](#6-photo-upload-flow)
7. [Gemini Integration](#7-gemini-integration)
8. [Quota Logic](#8-quota-logic)
9. [Reminders](#9-reminders)
10. [Scheduled Jobs](#10-scheduled-jobs)
11. [Localization (Cantonese)](#11-localization-cantonese)
12. [Environment Variables](#12-environment-variables)
13. [Testing Strategy](#13-testing-strategy)
14. [CI/CD & Deployment](#14-cicd--deployment)
15. [Milestone Task Backlog](#15-milestone-task-backlog)
16. [Definition of Done](#16-definition-of-done)

---

## 1. Repository & Project Structure

Monorepo using **npm workspaces** (or pnpm). Two apps + one optional shared package.

```
pee-poo-tracker/
├── apps/
│   ├── mobile/                 # React Native (Expo)
│   └── api/                    # NestJS
├── packages/
│   └── shared/                 # shared TS types, enums, zod schemas
├── docs/
│   ├── pee-poo-tracker-plan.md
│   └── technical-spec.md
├── .gitignore
├── package.json                # workspaces
└── README.md
```

> **Recommendation:** keep a `packages/shared` package for enums/types/zod schemas
> used by both apps. If monorepo tooling feels heavy, v1 may duplicate these files;
> the single-source shared package is preferred.

### 1.1 Mobile (`apps/mobile`, Expo + TypeScript)

```
apps/mobile/
├── App.tsx
├── app.json                    # Expo config (name, slug, icon, splash, plugins)
├── eas.json                    # EAS Build profiles
├── src/
│   ├── components/             # reusable UI (Button, Card, Mascot, ...)
│   ├── screens/                # Auth, Home, LogForm, History, Detail, Settings
│   ├── navigation/             # expo-router or react-navigation
│   ├── hooks/                  # useRecords, useAnalysis, useSettings, ...
│   ├── services/
│   │   ├── api.ts              # typed API client (fetch/axios)
│   │   ├── supabase.ts         # supabase-js client (auth)
│   │   └── storage.ts          # presigned upload helper
│   ├── store/                  # lightweight state (zustand / context)
│   ├── theme/                  # colors, spacing, typography (fun palette)
│   ├── i18n/                   # zh-HK strings + enum label maps
│   └── types/                  # re-export from packages/shared
└── package.json
```

Key dependencies:

- `expo`, `expo-router`, `expo-image-picker`, `expo-camera`, `expo-notifications`
- `@supabase/supabase-js`
- `@tanstack/react-query`
- `zod`, `zod`-validated API layer
- `react-native-reanimated` (optional animations)
- `react-native-google-mobile-ads` (later)

### 1.2 Backend (`apps/api`, NestJS + TypeScript + Prisma)

```
apps/api/
├── src/
│   ├── main.ts                 # bootstrap, global prefix /v1, Swagger
│   ├── app.module.ts
│   ├── config/                 # env validation (zod)
│   ├── common/
│   │   ├── guards/jwt-auth.guard.ts
│   │   ├── decorators/current-user.decorator.ts
│   │   ├── filters/http-exception.filter.ts
│   │   └── interceptors/logging.interceptor.ts
│   ├── prisma/
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   ├── auth/                   # Supabase JWT verification, profile upsert
│   ├── records/                # CRUD + photo confirm
│   ├── analyses/               # Gemini call + quota + cache
│   ├── stats/                  # summary/trends
│   ├── settings/               # profile settings
│   ├── storage/                # presigned URLs, object delete
│   └── jobs/                   # retention purge (cron)
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── test/                       # unit + e2e
├── .env.example
└── package.json
```

Key dependencies:

- `@nestjs/*`, `@prisma/client`, `prisma`
- `@supabase/supabase-js` (storage + auth admin verification)
- `jwks-rsa` + `passport-jwt` (verify Supabase JWT)
- `@google/generative-ai`
- `zod`, `class-validator`, `class-transformer`
- `@nestjs/schedule` (cron)
- `@nestjs/swagger`

---

## 2. Shared Types, Enums & Constants

### 2.1 Enums (machine values)

| Enum             | Values                                                                                                      |
| ---------------- | ----------------------------------------------------------------------------------------------------------- |
| `RecordType`     | `PEE`, `POO`                                                                                                |
| `PeeColor`       | `TRANSPARENT`, `PALE_YELLOW`, `YELLOW`, `DARK_YELLOW`, `AMBER`, `BROWN`, `RED_PINK`, `BLUE_GREEN`, `CLOUDY` |
| `PeeFoam`        | `NONE`, `SLIGHT`, `MODERATE`, `HEAVY`                                                                       |
| `PeeVolume`      | `SMALL`, `MEDIUM`, `LARGE`                                                                                  |
| `PooColor`       | `BROWN`, `DARK_BROWN`, `YELLOW`, `GREEN`, `BLACK`, `RED`, `PALE_CLAY`, `GREY`                               |
| `AnalysisStatus` | `PENDING`, `COMPLETED`, `FAILED`                                                                            |
| `Plan`           | `FREE`, `PREMIUM`                                                                                           |

`pooConsistency` is an **integer 1–7** (Bristol scale), not an enum (validation via
constraint + zod).

### 2.2 Cantonese labels (client-side map)

```ts
export const PEE_COLOR_LABELS: Record<PeeColor, string> = {
	TRANSPARENT: "透明",
	PALE_YELLOW: "淡黃",
	YELLOW: "黃",
	DARK_YELLOW: "深黃",
	AMBER: "琥珀",
	BROWN: "啡色",
	RED_PINK: "紅/粉紅",
	BLUE_GREEN: "藍/綠",
	CLOUDY: "混濁",
};

export const PEE_FOAM_LABELS = {
	NONE: "無泡",
	SLIGHT: "少少泡",
	MODERATE: "中等",
	HEAVY: "好多泡",
} as const;

export const PEE_VOLUME_LABELS = {
	SMALL: "少",
	MEDIUM: "中等",
	LARGE: "多",
} as const;

export const POO_COLOR_LABELS = {
	BROWN: "啡色",
	DARK_BROWN: "深啡",
	YELLOW: "黃色",
	GREEN: "綠色",
	BLACK: "黑色",
	RED: "紅色",
	PALE_CLAY: "淺色/泥色",
	GREY: "灰色",
} as const;

export const POO_CONSISTENCY_LABELS: Record<number, string> = {
	1: "一粒粒，好硬",
	2: "一條條，表面凹凸",
	3: "一條條，有裂紋",
	4: "一條條，滑捋捋",
	5: "一舊舊，軟熟",
	6: "糊狀",
	7: "水狀",
};
```

### 2.3 Shared zod schemas (used by client + server)

```ts
export const RecordTypeEnum = z.enum(["PEE", "POO"]);

export const CreateRecordSchema = z.discriminatedUnion("type", [
	z.object({
		type: z.literal("PEE"),
		recordedAt: z.coerce.date(),
		peeColor: z.nativeEnum(PeeColor).optional(),
		peeFoam: z.nativeEnum(PeeFoam).optional(),
		peeVolume: z.nativeEnum(PeeVolume).optional(),
		notes: z.string().max(500).optional(),
		needsPhotoUpload: z.boolean().optional(),
	}),
	z.object({
		type: z.literal("POO"),
		recordedAt: z.coerce.date(),
		pooColor: z.nativeEnum(PooColor).optional(),
		pooConsistency: z.number().int().min(1).max(7).optional(),
		notes: z.string().max(500).optional(),
		needsPhotoUpload: z.boolean().optional(),
	}),
]);

export const AnalysisReportSchema = z.object({
	summary: z.string(),
	observations: z.object({
		color: z.string().optional(),
		clarity: z.string().optional(),
		foam: z.string().optional(),
		consistency: z.string().optional(),
	}),
	possibleInterpretations: z.array(z.string()),
	lifestyleHints: z.array(z.string()),
	redFlags: z.array(z.string()),
	confidence: z.enum(["low", "medium", "high"]),
	disclaimer: z.string(),
});
```

---

## 3. Database Schema (Prisma)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum RecordType {
  PEE
  POO
}

enum PeeColor {
  TRANSPARENT
  PALE_YELLOW
  YELLOW
  DARK_YELLOW
  AMBER
  BROWN
  RED_PINK
  BLUE_GREEN
  CLOUDY
}

enum PeeFoam {
  NONE
  SLIGHT
  MODERATE
  HEAVY
}

enum PeeVolume {
  SMALL
  MEDIUM
  LARGE
}

enum PooColor {
  BROWN
  DARK_BROWN
  YELLOW
  GREEN
  BLACK
  RED
  PALE_CLAY
  GREY
}

enum AnalysisStatus {
  PENDING
  COMPLETED
  FAILED
}

enum Plan {
  FREE
  PREMIUM
}

model Profile {
  userId               String   @id @db.Uuid
  language             String   @default("yue")
  reminderEnabled      Boolean  @default(false)
  reminderTimes        String[] @default([]) // ["21:00"]
  photoRetentionDays   Int      @default(14)
  plan                 Plan     @default(FREE)
  analysisUsedThisMonth Int     @default(0)
  analysisMonth        String   @default("") // "YYYY-MM"
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
  records              Record[]
  analyses             Analysis[]

  @@map("profiles")
}

model Record {
  id               String     @id @default(uuid()) @db.Uuid
  userId           String     @db.Uuid
  type             RecordType
  recordedAt       DateTime   @db.Timestamptz(6)
  createdAt        DateTime   @default(now()) @db.Timestamptz(6)

  // Pee fields
  peeColor         PeeColor?
  peeFoam          PeeFoam?
  peeVolume        PeeVolume?

  // Poo fields
  pooColor         PooColor?
  pooConsistency   Int?       // Bristol 1-7 (CHECK via migration)

  notes            String?

  // Single photo
  photoStoragePath String?
  photoContentType String?
  photoSizeBytes   Int?
  photoUploadedAt  DateTime?  @db.Timestamptz(6)

  profile          Profile    @relation(fields: [userId], references: [userId])
  analysis         Analysis?

  @@index([userId, recordedAt])
  @@map("records")
}

model Analysis {
  id             String         @id @default(uuid()) @db.Uuid
  recordId       String         @unique @db.Uuid
  userId         String         @db.Uuid
  model          String
  status         AnalysisStatus @default(PENDING)
  inputSnapshot  Json?
  reportJson     Json?
  reportText     String?
  disclaimer     String?
  createdAt      DateTime       @default(now()) @db.Timestamptz(6)
  completedAt    DateTime?      @db.Timestamptz(6)

  record         Record         @relation(fields: [recordId], references: [id], onDelete: Cascade)
  profile        Profile        @relation(fields: [userId], references: [userId])

  @@map("analyses")
}
```

### Migration-level CHECK constraints (Prisma does not auto-emit these)

```sql
ALTER TABLE records
  ADD CONSTRAINT chk_poo_consistency CHECK (poo_consistency BETWEEN 1 AND 7);

ALTER TABLE profiles
  ADD CONSTRAINT chk_photo_retention CHECK (photo_retention_days BETWEEN 1 AND 90);
```

### RLS (safety net only)

NestJS connects with the **service role** key and enforces per-user scoping in
queries (`WHERE user_id = ...`). Optionally enable RLS and add policies so direct
client access is also constrained; the backend remains the source of truth.

---

## 4. Authentication & Authorization

- **Identity:** Supabase Auth (email/password, Apple, Google OAuth).
- Client stores the Supabase session; attaches the **access token (JWT)** to every
  API call as `Authorization: Bearer <jwt>`.
- **NestJS verification:** a `JwtAuthGuard` validates the token against the Supabase
  project's **JWKS** endpoint (or HS256 with the project JWT secret). Extract the
  `sub` claim as the user id.
- A `@CurrentUser()` decorator exposes `{ userId }` to controllers.
- **Profile bootstrap:** after sign-in, the app calls `GET /settings`; the backend
  **upserts** a `Profile` row for that user if missing.

```ts
// auth/jwt-auth.guard.ts (sketch)
@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {}
// JwtStrategy: secretOrKeyProvider via jwks-rsa pointing to
// `${SUPABASE_URL}/auth/v1/jwks`; jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
```

---

## 5. API Specification

Base URL: `https://api.example.com/v1`. All routes (except `/health`) require JWT.
Errors use a consistent envelope: `{ "statusCode": 400, "message": "...", "error": "..." }`.

### 5.1 Create record — `POST /records`

Request (PEE):

```json
{
	"type": "PEE",
	"recordedAt": "2026-08-22T12:30:00+08:00",
	"peeColor": "YELLOW",
	"peeFoam": "SLIGHT",
	"peeVolume": "MEDIUM",
	"notes": "飲咗好多水",
	"needsPhotoUpload": true
}
```

Request (POO):

```json
{
	"type": "POO",
	"recordedAt": "2026-08-22T12:30:00+08:00",
	"pooColor": "BROWN",
	"pooConsistency": 4,
	"notes": "",
	"needsPhotoUpload": true
}
```

Response `201`:

```json
{
	"record": {
		"id": "7f4d...",
		"type": "PEE",
		"recordedAt": "2026-08-22T12:30:00+08:00",
		"peeColor": "YELLOW",
		"peeFoam": "SLIGHT",
		"peeVolume": "MEDIUM",
		"notes": "飲咗好多水",
		"photoStoragePath": null,
		"photoUploadedAt": null,
		"createdAt": "2026-08-22T12:31:00+08:00"
	},
	"photoUploadUrl": "https://<project>.supabase.co/storage/v1/object/upload/sign/...",
	"photoStoragePath": "records/<userId>/<recordId>.jpg"
}
```

> `photoUploadUrl` / `photoStoragePath` are present only when `needsPhotoUpload` is
> `true`. The presigned URL is a **PUT** signed upload URL with content-type bound
> to `image/jpeg` (or negotiated content type).

### 5.2 Confirm photo — `POST /records/:id/photo/confirm`

Request:

```json
{
	"storagePath": "records/<userId>/<recordId>.jpg",
	"contentType": "image/jpeg",
	"sizeBytes": 245000
}
```

Response `200`: updated `record` (with `photoStoragePath`, `photoUploadedAt` set).
Errors: `404` record not found / not owned; `400` invalid path.

### 5.3 List records — `GET /records?type=PEE&from=2026-08-01&to=2026-08-31&limit=50&cursor=...`

Response `200`:

```json
{
	"items": [{ "record": "..." }],
	"nextCursor": "opaque-cursor-or-null"
}
```

Pagination via cursor on `(recordedAt, id)`. Default sort `recordedAt desc`.

### 5.4 Get record — `GET /records/:id`

Response `200`: record (including photo metadata + cached `analysis` if present).

### 5.5 Edit record — `PATCH /records/:id`

Body: partial form fields (same field rules as create). Returns updated record.

### 5.6 Delete record — `DELETE /records/:id`

Response `204`. Also deletes the photo from Storage and the analysis row (cascade).

### 5.7 Trigger analysis — `POST /records/:id/analyze`

Request: `{ "force": false }` (optional).

- If `force=false` and a **COMPLETED** analysis exists → return it (no quota cost).
- If no photo → `400 { message: "未上載相片" }`.
- If FREE quota exhausted → `429 { message: "今個月嘅免費分析次數用晒喇" }`.

Response `200` (synchronous; see §7 for latency):

```json
{
	"analysis": {
		"id": "...",
		"recordId": "...",
		"model": "gemini-2.5-flash",
		"status": "COMPLETED",
		"reportJson": {
			"summary": "...",
			"observations": {},
			"possibleInterpretations": [],
			"lifestyleHints": [],
			"redFlags": [],
			"confidence": "medium",
			"disclaimer": "..."
		},
		"reportText": "一句簡單總結...",
		"disclaimer": "呢個只係參考，唔係醫療建議。如果擔心，記得去睇醫生。",
		"createdAt": "...",
		"completedAt": "..."
	},
	"quota": { "limit": 3, "usedThisMonth": 1, "remaining": 2 }
}
```

> If the Gemini call fails, return `502` with `status: "FAILED"` and a friendly
> retry message. The failed row is persisted so the client can show the error.

### 5.8 Get cached analysis — `GET /records/:id/analysis`

Response `200`: analysis, or `404` if none.

### 5.9 Stats summary — `GET /stats/summary?from=2026-08-01&to=2026-08-31`

Response `200`:

```json
{
	"from": "2026-08-01",
	"to": "2026-08-31",
	"daily": [{ "date": "2026-08-01", "peeCount": 3, "pooCount": 1 }],
	"totals": { "peeCount": 62, "pooCount": 24 },
	"avgPerDay": { "pee": 2.0, "poo": 0.8 },
	"mostCommonPeeColor": "YELLOW",
	"mostCommonPooConsistency": 4
}
```

### 5.10 Settings — `GET /settings` and `PATCH /settings`

GET response:

```json
{
	"language": "yue",
	"reminderEnabled": true,
	"reminderTimes": ["21:00"],
	"photoRetentionDays": 14,
	"plan": "FREE",
	"analysisQuota": { "limit": 3, "usedThisMonth": 1, "remaining": 2 }
}
```

PATCH accepts a partial body (e.g. `{ "reminderTimes": ["09:00","21:00"] }`).
Validation: `reminderTimes` are `HH:mm`, unique, max 3; `photoRetentionDays` 1–90.

### 5.11 Export — `GET /export?format=json`

Returns all records (JSON, UTF-8, with Cantonese labels resolved). `format=csv`
optional later.

### 5.12 Health — `GET /health` → `200 { "status": "ok" }` (no auth).

---

## 6. Photo Upload Flow

1. Client requests record creation with `needsPhotoUpload: true`.
2. Server generates `photoStoragePath = records/<userId>/<recordId>.<ext>` and a
   **signed PUT URL** (Supabase `createSignedUploadUrl`) with the correct
   content-type.
3. Client picks/compresses the image, then `PUT`s the bytes directly to the signed
   URL (no extra auth header needed).
4. Client calls `POST /records/:id/photo/confirm` with path/content-type/size.
5. Server verifies the object exists and saves metadata.

**Image handling (client):**

- Use `expo-image-picker` with `quality` compression, cap max dimension ~1600px,
  target JPEG < ~1MB. (Reduces storage + Gemini cost.)

**Deletion:** `DELETE /records/:id` and the retention job both remove the object
from Storage and clear/nil the photo fields.

---

## 7. Gemini Integration

### 7.1 Setup

- SDK: `@google/generative-ai`.
- Model from env: `GEMINI_MODEL` (default `gemini-2.5-flash`).
- Use `generateContent` with `generationConfig.responseMimeType = "application/json"`
  and `responseSchema` (structured output) to force the JSON shape in §2.3.

### 7.2 Input assembly

- Fetch the image from Supabase Storage server-side (service role).
- Encode as inline `inlineData` (base64) with mime type.
- Build a text part containing the structured form fields:
  `類型：屙尿／屙屎；顏色：...；泡泡：...；量：...；質地(Bristol)：...；備註：...`

### 7.3 System prompt (Cantonese, friendly)

```
你係一個親切、幽默、講廣東話嘅健康小助手。你負責睇用戶上傳嘅廁所相片，再根據相片同埋佢哋填寫嘅資料，畀出輕鬆、清楚嘅觀察同建議。

規矩：
1. 只可以描述你喺相片入面見到嘅嘢（顏色、清澈度、泡泡、質感、形狀等）。
2. 可以畀啲可能嘅解釋同生活小貼士（例如飲水、飲食），語氣要輕鬆、關心。
3. 如果有嘢值得睇醫生，要溫柔咁提醒，但絕對唔可以診斷疾病。
4. 一定要包埋免責聲明，講明呢啲唔係醫療建議。
5. 如果張相唔係相關嘅相（唔係廁所相），要禮貌咁拒絕，可以用少少幽默。
6. 全部用口語廣東話（粵文）回答，唔好用書面語。

用語對照：屙尿 = pee，屙屎 = poo。
Bristol 糞便分類：1=一粒粒好硬，2=一條條表面凹凸，3=一條條有裂紋，4=一條條滑捋捋，5=一舊舊軟熟，6=糊狀，7=水狀。
```

### 7.4 Response validation & storage

- Parse Gemini JSON, validate with `AnalysisReportSchema` (zod).
- On validation failure → mark `FAILED` and retry once with a fix-up instruction;
  if still invalid, return a graceful fallback message.
- Store `inputSnapshot` (form fields + prompt version) and `reportJson`.
- Always persist the mandatory `disclaimer`.

### 7.5 Latency & error handling

- v1 uses a **synchronous** call with a 30s server timeout (Gemini vision may take
  5–20s). The client shows a loading state.
- _(Future optimization)_ switch to async: return `202` + analysis id, poll
  `GET /records/:id/analysis`.

---

## 8. Quota Logic

- **Free tier:** 3 fresh analyses/month.
- **Cached return (no `force`):** free, does not consume quota.
- **Every fresh Gemini call (`force` or first time):** consumes 1 quota.
- **Premium (later):** unlimited.
- Implementation (on-the-fly, no cron needed):
  1. Load profile.
  2. If `analysisMonth !== currentMonth` → reset `analysisUsedThisMonth = 0` and
     set `analysisMonth = currentMonth`.
  3. If `plan === FREE && analysisUsedThisMonth >= 3` → reject with `429`.
  4. After a successful call → increment.
- Product note (flag for review): decide whether re-running the _same_ record in
  the same month should be free. Current spec charges 1 per fresh call.

---

## 9. Reminders

- Library: `expo-notifications` (local, no push server).
- Each **time slot** (`HH:mm`) becomes a **daily** repeating notification.
- On app start and on settings change: cancel all scheduled reminders and
  re-schedule from `reminderTimes` (idempotent).
- Cap **3 slots/day**. Default `["21:00"]`.
- Cantonese copy (example):
  - Title: `記低今日嘅記錄未？`
  - Body: `今日屙咗未呀？撳一下就記低佢啦 💩`
- Permissions: request notification permission on first enable; handle denial
  gracefully (show a settings hint).

```ts
// scheduling sketch
for (const t of times) {
	const [h, m] = t.split(":").map(Number);
	await Notifications.scheduleNotificationAsync({
		content: { title: "...", body: "..." },
		trigger: {
			type: Notifications.SchedulableTriggerInputTypes.DAILY,
			hour: h,
			minute: m,
		},
	});
}
```

---

## 10. Scheduled Jobs

`@nestjs/schedule` cron:

### 10.1 Photo retention purge — daily 03:00 HKT

1. Find users whose `photoRetentionDays` is set.
2. For each, find records with `photoUploadedAt < now - photoRetentionDays`.
3. Delete objects from Supabase Storage.
4. Null the photo fields on those records (records/analysis text retained).

### 10.2 (Optional) Quota reset — not needed

Handled on-the-fly (see §8).

---

## 11. Localization (Cantonese)

- Primary locale **`zh-HK`**; fallback `zh-HK` only for v1 (optionally `en` later).
- Library: `i18next` + `expo-localization` (or `react-i18next`).
- All UI strings in Traditional Chinese with a friendly/informal tone.
- Enum label maps centralized (§2.2).
- Dates/times formatted in `Asia/Hong_Kong` timezone.

Example copy:
| Key | Value |
|---|---|
| `log.button.confirm` | `搞掂！` |
| `log.empty` | `今日仲未屙喎，飲返多啲水先啦` |
| `log.success` | `記錄咗喇，做得好 👏` |
| `analysis.disclaimer` | `呢個只係參考，唔係醫療建議。如果擔心，記得去睇醫生。` |
| `quota.exhausted` | `今個月嘅免費分析次數用晒喇` |

---

## 12. Environment Variables

### Mobile (`apps/mobile/.env`, injected via EAS)

```
EXPO_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
EXPO_PUBLIC_API_URL=https://api.example.com/v1
```

### Backend (`apps/api/.env`)

```
DATABASE_URL=postgresql://...            # Supabase Postgres (pooler) connection string
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
SUPABASE_JWT_SECRET=<optional HS256 secret>  # or rely on JWKS
GEMINI_API_KEY=<gemini-api-key>
GEMINI_MODEL=gemini-2.5-flash
PORT=3000
CORS_ORIGIN=*                            # tighten for prod
```

> **Never commit `.env`.** Provide `.env.example` files. Mobile secrets that are
> `EXPO_PUBLIC_*` are embedded in the bundle; keep anon key only (it is safe with
> RLS), never the service-role key.

---

## 13. Testing Strategy

### Backend

- **Unit:** services (quota logic, record validation, retention purge, Gemini
  response parsing).
- **e2e:** Supertest against a test DB for auth + record CRUD + analyze flow
  (mock Gemini).
- **Prompt evaluation:** a small golden set (5–10 labeled images) + expected
  Cantonese output; scripted/manual check when the prompt changes.

### Mobile

- **Component:** Jest + React Native Testing Library (form validation, empty states).
- **E2E (optional, later):** Maestro or Detox for the core "log a pee" flow.

### Contract

- Shared zod schemas in `packages/shared` keep client/server in sync; add a
  lightweight typecheck CI step for both apps.

---

## 14. CI/CD & Deployment

### CI (GitHub Actions)

- On PR: `npm run lint`, `tsc --noEmit`, unit tests (api + mobile).
- Optional: Prisma migrate diff check.

### Backend deploy

- NestJS → Docker image → **Railway / Render / Fly.io** (or any Node PaaS).
- Run `prisma migrate deploy` on release.
- Health check at `/health`.

### Mobile build

- **EAS Build** for iOS (needs Apple Developer account) and Android (Play account).
- Submit via EAS Submit / App Store Connect / Play Console.
- Staging vs production channels via `eas.json` profiles.

### Infra

- Supabase project (Postgres, Auth, Storage) provisioned; bucket `records` **private**.
- Supabase Auth providers: email (enable), Apple + Google (enable, needs config).

---

## 15. Milestone Task Backlog

### M0 — Setup & scaffolding

- [ ] Monorepo init (npm workspaces), shared package.
- [ ] Expo app scaffold + navigation + theme tokens.
- [ ] NestJS scaffold + Prisma + env validation.
- [ ] Supabase project + private `records` bucket.
- [ ] CI: lint + typecheck + test.
- [ ] **Decide bundle identifier / App ID.**

### M1 — MVP core (no AI)

- [ ] Supabase auth sign-in/sign-up (email + Apple/Google).
- [ ] Profile bootstrap + `GET/PATCH /settings`.
- [ ] `POST /records`, `GET /records`, `GET /records/:id`, `PATCH`, `DELETE`.
- [ ] Pee/poo forms (Cantonese, Bristol picker).
- [ ] Daily counters + history list + basic dashboard.
- [ ] **Reminders** (local, time-slot based).
- [ ] Friendly brand tone baseline (copy + palette).

### M2 — Photo + retention

- [ ] Image picker/camera + compression.
- [ ] Presigned upload + `POST /records/:id/photo/confirm`.
- [ ] Per-record photo view.
- [ ] `GET/PATCH /settings` retention setting.
- [ ] Retention purge cron job.

### M3 — On-demand Gemini analysis

- [ ] `POST /records/:id/analyze` + `GET /records/:id/analysis`.
- [ ] Gemini proxy (structured output, Cantonese prompt).
- [ ] Quota (3/month free) + caching.
- [ ] Analysis report UI (loading/error/disclaimer states).

### M4 — Trends & polish

- [ ] `/stats/summary` + charts/calendar heatmap.
- [ ] `GET /export`.
- [ ] Consent flows (photo + analysis).
- [ ] Beta on both stores (TestFlight / Play internal).

### M5 — Release

- [ ] Store submission + review fixes.
- [ ] Monitoring/logging.
- [ ] (Later) AdMob + freemium subscription groundwork.

---

## 16. Definition of Done

A feature is "done" when:

- [ ] Types + zod validation are defined in `packages/shared`.
- [ ] Backend endpoint implemented with JWT guard + per-user scoping.
- [ ] Unit tests pass for the logic; e2e covers the happy path.
- [ ] Mobile screen implemented with Cantonese strings + loading/empty/error states.
- [ ] Manual QA on iOS and Android (or simulator).
- [ ] Privacy/consent requirements honored (photo & analysis).
- [ ] No secrets committed; `.env.example` updated.
- [ ] Docs/README updated if the API or setup changed.

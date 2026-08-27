# Pee & Poo Tracker — Product Plan & Tech Stack (v3)

> Working title. **No implementation yet.** This is the finalized plan reflecting
> all decisions, including brand tone, one-photo limit, reminders, quota, ads, and
> budget.

---

## 0. Resolved Decisions (summary)

| Question                  | Decision                                                        |
| ------------------------- | --------------------------------------------------------------- |
| Mobile framework          | **React Native (Expo)**                                         |
| Backend                   | **NestJS**                                                      |
| Database / Storage / Auth | **Supabase** (Postgres + Storage + Auth)                        |
| AI analysis               | **Google Gemini** (vision-capable)                              |
| Platforms                 | **iOS + Android**                                               |
| Accounts                  | Cloud accounts (log in to save/back up records)                 |
| Language & tone           | **Native Cantonese, friendly/informal** (屙尿 / 屙屎)           |
| Brand voice               | **Chill, fun, funny** — make a "disgusting" topic lighthearted  |
| Reminders                 | **In v1**, multiple configurable **time slots** (see §3.6)      |
| Photo upload              | **Exactly 1 photo per record** (optional)                       |
| Analysis quota            | **3 free analyses/month** (free tier)                           |
| Photo retention           | User-configurable; default **2 weeks**, max **3 months**        |
| Monetization              | Free-first; **gentle pop-up ads** (frequency-capped) + freemium |
| Budget                    | **20–25K HKD**                                                  |
| App name                  | TBD — low dev impact, see §15                                   |

---

## 1. Product Overview

A lightweight personal health-logging app for Hong Kong users to record bathroom
events — **with a fun, chill personality** so a "gross" topic feels approachable:

- **屙尿 (Pee)** — log color, foam, volume.
- **屙屎 (Poo)** — log color, and softness/hardness (Bristol Stool Scale).
- Daily counters and simple trends.
- Optional **single** photo per record.
- **On-demand** Gemini analysis (photo + form data) — only when the user taps it.
- Daily reminders to log.

### Core principles

1. **Recorder first, analyst second** — data entry in a few taps.
2. **Fun first** — friendly, humorous tone and visuals; health info stays clear and
   responsible (with proper disclaimers).

---

## 2. Goals & Non-Goals

### Goals

1. Fast, low-friction logging (< 10 seconds without photo).
2. Accurate daily counters and a simple history/calendar view.
3. Secure, private photo handling (sensitive health data).
4. On-demand Gemini analysis with clear "not medical advice" framing.
5. iOS + Android from one React Native codebase.
6. Native Cantonese experience (UI + AI reports) in an informal, friendly voice.
7. Daily logging reminders.
8. A playful, memorable brand that removes embarrassment.

### Non-Goals (v1)

- Automatic/continuous monitoring or medical diagnosis.
- Social features, sharing, or heavy gamification.
- Doctor/clinic integration or prescriptions.
- Wearable/Bluetooth device support.
- Full offline-first architecture (v1 online-first with best-effort caching).
- Subscription billing in the very first release (deferred).

---

## 3. Key Features

### 3.1 Logging — 屙尿 (Pee)

| Field     | Type     | Options (Cantonese, friendly)                          |
| --------- | -------- | ------------------------------------------------------ |
| Type      | enum     | `pee`                                                  |
| Timestamp | datetime | when it happened (defaults to now)                     |
| Color     | enum     | 透明、淡黃、黃、深黃、琥珀、啡色、紅/粉紅、藍/綠、混濁 |
| Foam      | enum     | 無泡、少少泡、中等、好多泡                             |
| Volume    | enum     | 少、中等、多                                           |
| Notes     | text     | optional                                               |

### 3.2 Logging — 屙屎 (Poo)

| Field       | Type     | Options (Cantonese, friendly)                       |
| ----------- | -------- | --------------------------------------------------- |
| Type        | enum     | `poo`                                               |
| Timestamp   | datetime | when it happened (defaults to now)                  |
| Color       | enum     | 啡色、深啡、黃色、綠色、黑色、紅色、淺色/泥色、灰色 |
| Consistency | enum     | Bristol 1–7, Cantonese labels (below)               |
| Notes       | text     | optional                                            |

**Bristol scale (Cantonese, friendly labels):**

1. 一粒粒，好硬（便秘 feel）
2. 一條條，表面凹凸
3. 一條條，有裂紋
4. 一條條，滑捋捋（完美！）
5. 一舊舊，軟熟
6. 糊狀
7. 水狀（屙水）

### 3.3 Photo Upload — **one photo per record**

- Exactly **one** optional photo per record (camera or image picker).
- Compress/resize before upload (reduces storage + Gemini cost).
- Stored in a **private** Supabase Storage bucket (signed URLs).
- If the user picks a new photo, it replaces the previous one.

### 3.4 On-Demand AI Analysis (Gemini)

- A record shows an **「分析」** button (only meaningful when a photo exists).
- Backend sends the photo + structured form fields to Gemini.
- Result: a **Cantonese, friendly-but-clear report** — observations, possible
  interpretations, hydration/diet hints, red flags, mandatory disclaimer.
- **Cached** — reopening shows the last report without re-calling Gemini.
- **Free tier quota: 3 analyses/month.**

### 3.5 Dashboard & Trends

- Today's 屙尿 count / 屙屎 count.
- 7/30-day bar chart or calendar heatmap.
- Simple stats: average frequency, most common colors.

### 3.6 Reminders — time slots (v1)

**Clarification:** a "reminder time slot" is a **specific time of day** (e.g.,
21:00), _not_ an interval like "every 30 minutes."

- **Default:** one slot at **21:00** (evening reflection).
- **User can add/remove multiple slots**, e.g., 09:00 and 21:00 (cap at ~3/day to
  avoid annoyance).
- Each slot fires **one** local notification per day at that clock time.
- **No interval-based reminders** (they are annoying).
- Gentle Cantonese copy, e.g. 「今日屙咗未呀？記低佢啦 💩」
- _(Later idea)_ a "smart nudge" that only reminds if nothing has been logged yet
  that day — not in v1.

### 3.7 Settings & Privacy

- Sign-in (email / Apple / Google).
- **Photo retention** — user-selectable (default 2 weeks, max 3 months).
- **Reminder time slots** management.
- Data export (JSON/CSV).
- Account & data deletion.
- Explicit consent before first photo upload and first AI analysis.

---

## 4. Brand Voice & UI Tone (fun / chill / funny)

Because pee & poo are "gross," the design should disarm that discomfort:

- **Playful mascot/emoji** — 💩/🚽/💧 as friendly characters (e.g., a smiley poo
  mascot that reacts to the Bristol type: 完美! / 加油飲水!).
- **Warm, humorous micro-copy** — e.g. confirm button 「搞掂！」, empty state
  「今日仲未屙喎，飲返多啲水先啦」, success toast 「記錄咗喇，做得好 👏」.
- **Soft, bright color palette** — pastels, rounded cards, friendly typography;
  avoid clinical/medical styling.
- **Friendly animations** — light confetti or a happy mascot on streak days.
- **Clear boundary:** the **fun** stays in the UI/copy; the **AI report** stays
  warm but responsible (always includes the "not medical advice" disclaimer and
  clear red-flag guidance).
- **Accessibility:** fun but still legible — sufficient contrast, readable font
  sizes, don't let humor obscure meaning.

---

## 5. Tech Stack (final)

### Mobile — **React Native (Expo)**

- Expo (managed workflow) + **EAS Build** for App Store / Play Store.
- Key libraries:
  - `expo-image-picker` / `expo-camera` — photo.
  - `expo-notifications` — local daily reminders.
  - `@supabase/supabase-js` — auth + storage.
  - `react-native-google-mobile-ads` — AdMob (later, via config plugin).
  - `@tanstack/react-query` — server state.
  - `zod` — form/API validation.
  - `react-native-reanimated` / `react-native-skia` (optional) — playful animations.
- Single codebase for iOS + Android.

### Backend — **NestJS**

- REST API + business logic + Gemini proxy (API key server-side).
- Modules: `auth`, `records`, `analyses`, `stats`, `settings`, `jobs`.
- ORM: **Prisma** → Supabase Postgres.
- Scheduled jobs: `@nestjs/schedule` for **photo retention purge**.
- Validation via `class-validator`/`zod`; Swagger docs.

### Database / Storage / Auth — **Supabase**

- **PostgreSQL** (from NestJS via Prisma).
- **Supabase Storage** (private bucket) for photos.
- **Supabase Auth** (email / Apple / Google) issues the JWT; NestJS verifies it.

### AI — **Google Gemini**

- Model: **`gemini-2.5-flash`** (fast, cheap, strong vision); configurable.
- SDK: `@google/generative-ai` inside NestJS.
- Structured JSON via response schema / function-calling.

---

## 6. Architecture

```
┌──────────────────────┐        ┌─────────────────────────────────┐        ┌──────────────┐
│ React Native (Expo)  │  ───▶  │  NestJS backend (API + jobs)     │  ───▶  │ Google Gemini│
│ iOS + Android        │        │   - verify Supabase JWT          │        │ (vision)     │
└──────────────────────┘        │   - Prisma -> Postgres           │        └──────────────┘
        │                       │   - Gemini proxy + quota         │
        │ supabase-js (auth, storage)                              │
        ▼                       └─────────────────────────────────┘
┌──────────────────────────────────────────────────────────────────┐
│ Supabase: Postgres (DB) · Storage (photos) · Auth (JWT)          │
└──────────────────────────────────────────────────────────────────┘
```

### Flows

**Log a record (no photo):** App → `POST /records` → NestJS → Postgres.

**Log a record with photo:**

1. App → `POST /records` → NestJS creates record + returns **one** presigned URL.
2. App uploads the image to Supabase Storage.
3. NestJS links the photo to the record.

**On-demand analysis:**

1. User taps 「分析」.
2. App → `POST /records/:id/analyze` (JWT).
3. NestJS checks **quota (3/month free)**, fetches image + record, calls Gemini.
4. Gemini returns structured JSON → stored in `analyses` → returned to app.
5. Later requests serve the cached report (unless user re-runs).

**Retention purge (scheduled job):**

1. `@nestjs/schedule` cron runs daily.
2. Finds photos older than each user's `photo_retention_days`.
3. Deletes from Storage + nulls photo fields (record/analysis text kept).

---

## 7. Data Model (PostgreSQL)

> With the **one-photo-per-record** rule, photo fields are stored directly on the
> `records` row (no separate photos table needed).

### `profiles` (1:1 with auth.users)

| Column                   | Type        | Notes                          |
| ------------------------ | ----------- | ------------------------------ |
| user_id                  | uuid        | PK, FK → auth.users            |
| language                 | text        | default `yue`                  |
| reminder_times           | time[]      | array of daily reminder slots  |
| reminder_enabled         | bool        |                                |
| photo_retention_days     | int         | default 14, max 90             |
| plan                     | text        | `free` \| `premium`            |
| analysis_used_this_month | int         | quota tracking                 |
| analysis_month           | text        | e.g. `2026-08` for quota reset |
| created_at               | timestamptz |                                |

### `records`

| Column             | Type        | Notes                 |
| ------------------ | ----------- | --------------------- |
| id                 | uuid        | PK                    |
| user_id            | uuid        | FK → auth.users       |
| type               | text        | `pee` \| `poo`        |
| recorded_at        | timestamptz | when it happened      |
| created_at         | timestamptz |                       |
| pee_color          | text        | nullable enum         |
| pee_foam           | text        | nullable enum         |
| pee_volume         | text        | nullable enum         |
| poo_color          | text        | nullable enum         |
| poo_consistency    | int         | nullable, Bristol 1–7 |
| notes              | text        | nullable              |
| photo_storage_path | text        | nullable (one photo)  |
| photo_content_type | text        | nullable              |
| photo_size_bytes   | int         | nullable              |
| photo_uploaded_at  | timestamptz | nullable              |

### `analyses`

| Column         | Type        | Notes                                          |
| -------------- | ----------- | ---------------------------------------------- |
| id             | uuid        | PK                                             |
| record_id      | uuid        | FK → records (unique: one analysis per record) |
| user_id        | uuid        | FK → auth.users                                |
| model          | text        | e.g. `gemini-2.5-flash`                        |
| status         | text        | `pending` \| `completed` \| `failed`           |
| input_snapshot | jsonb       | form fields + prompt version                   |
| report_json    | jsonb       | structured result                              |
| report_text    | text        | Cantonese report                               |
| disclaimer     | text        |                                                |
| created_at     | timestamptz |                                                |
| completed_at   | timestamptz |                                                |

### Indexes & constraints

- Index `records(user_id, recorded_at)`; `analyses(record_id)` unique.
- CHECK constraints for enums.
- **RLS as safety net**, but primary per-user enforcement is in NestJS queries
  (NestJS connects with a service key and scopes by `user_id`).

---

## 8. AI Analysis Design (Gemini + Cantonese, friendly)

### 8.1 Prompt structure

- **System prompt:** role = a chill, friendly Cantonese health buddy; rules:
  - Describe only **observable** features (color, clarity, foam, consistency).
  - Give possible interpretations + hydration/diet hints in a light, caring tone.
  - Flag anything worth seeing a doctor, but **never diagnose**.
  - Always include a disclaimer.
  - If the image isn't a relevant/appropriate image, politely decline with humor.
  - **Output in native written Cantonese (口語粵文), friendly tone.**
- **User input:** photo + structured form fields + optional notes.

### 8.2 Structured output (JSON)

```json
{
	"summary": "一句輕鬆總結（粵文）",
	"observations": {
		"color": "...",
		"clarity": "...",
		"foam": "...",
		"consistency": "..."
	},
	"possible_interpretations": ["...", "..."],
	"lifestyle_hints": ["...", "..."],
	"red_flags": ["..."],
	"confidence": "low|medium|high",
	"disclaimer": "呢個只係參考，唔係醫療建議。如果擔心，記得去睇醫生。"
}
```

### 8.3 Guardrails & behavior

- **On-demand only**; **cached** until re-run.
- **Quota:** 3 free analyses/month (free tier); premium = unlimited (later).
- **Rate limiting** to protect cost.
- **Reproducibility:** store input + prompt version.
- **Cost control:** compress/resize before upload; single photo.
- **Privacy:** Gemini API (no training on user data for standard API); keys
  server-side only.

### 8.4 Cantonese quality

- Golden test set of images + expected Cantonese outputs to evaluate prompts.
- Glossary in the system prompt for consistent terms (屙尿 / 屙屎 / Bristol labels).

---

## 9. API Summary (NestJS)

| Method    | Path                    | Description                                    |
| --------- | ----------------------- | ---------------------------------------------- |
| POST      | `/records`              | Create record (+ one presigned upload URL)     |
| GET       | `/records`              | List (date range, type filters)                |
| GET       | `/records/:id`          | Detail                                         |
| PATCH     | `/records/:id`          | Edit                                           |
| DELETE    | `/records/:id`          | Delete                                         |
| POST      | `/records/:id/analyze`  | Trigger/return Gemini analysis (quota-checked) |
| GET       | `/records/:id/analysis` | Cached analysis                                |
| GET       | `/stats/summary`        | Daily counts, trends                           |
| GET/PATCH | `/settings`             | Reminders, retention, language                 |
| GET       | `/export`               | JSON/CSV export                                |

---

## 10. Non-Functional Requirements

- **Privacy:** photos sensitive — private bucket, signed URLs, encryption at rest,
  retention auto-purge.
- **Consent:** explicit opt-in before first photo and first AI analysis.
- **Security:** Gemini + Supabase service keys server-side only.
- **Performance:** form save < 1s; upload async; analysis shows progress.
- **Localization:** Traditional Chinese (HK) UI + written Cantonese reports; HK
  timezone.
- **Tone consistency:** fun UI/copy, but clear, responsible health guidance.

---

## 11. Delivery Phases

### M0 — Setup & scaffolding

- Repo, Expo + NestJS setup, CI, environments, **bundle identifier/app ID** decided
  (see §15).

### M1 — MVP core (no AI)

- Auth (Supabase), pee/poo forms, daily counters, history.
- **Reminders** (local, time-slot based).
- Dashboard + playful brand tone baseline.

### M2 — Photo + retention

- Camera/image picker, compression, private upload (one photo), per-record view.
- **Retention setting** + scheduled purge job.

### M3 — On-demand Gemini analysis

- NestJS Gemini integration, Cantonese report UI, caching, disclaimer, **quota (3/mo)**.

### M4 — Trends & polish

- Charts/calendar, export, settings, consent flows, beta on both stores.

### M5 — Release & monetization groundwork

- App Store / Play Store submission, monitoring.
- (Later) gentle AdMob pop-ups + freemium subscription.

---

## 12. Monetization (deferred, but planned)

### Final approach

1. **Launch free & ad-free** — build trust and a user base.
2. **Introduce gentle pop-up (interstitial) ads** — user explicitly wants pop-ups,
   but **non-aggressive**:
   - **Frequency-capped** (e.g., max 1 interstitial per session / per day).
   - **Never** shown during photo upload or while viewing an AI report (sensitive
     moments).
   - **Not** shown immediately after logging (avoid interrupting the fast flow).
   - Prefer showing after a natural break (e.g., closing the dashboard).
3. **Freemium**, gated on the costly feature:
   - **Free:** 3 AI analyses/month + gentle ads.
   - **Premium (later):** unlimited analyses, no ads, longer retention, export.

### Ads (AdMob) — rules

- Interstitials allowed, but gentle (as above).
- Banner/rewarded are fine; no ads over photo/analysis screens.

---

## 13. Budget (20–25K HKD confirmed)

| Item                                                            | Estimate (HKD)    |
| --------------------------------------------------------------- | ----------------- |
| Mobile app (RN/Expo) — forms, UI, auth, reminders, fun branding | 8,000–11,000      |
| Backend (NestJS + Prisma + Gemini proxy + quota + jobs)         | 5,000–7,000       |
| Integration, testing, both-store submission                     | 3,000–5,000       |
| Post-launch fixes / buffer                                      | 3,000–5,000       |
| **Total**                                                       | **19,000–28,000** |

> 20–25K HKD is reasonable if scope stays disciplined; keep an eye on the
> **branding/animations** (fun UI can quietly expand scope) and the **Gemini
> prompt/quality** work (needs a test set).

### Ongoing costs (post-launch)

- Supabase free tier likely enough initially.
- Gemini: pay-per-call (reduced by compression + 3/mo quota).
- Apple Developer US$99/yr + Google Play US$25 one-time.

---

## 14. Risks & Mitigations

| Risk                                         | Mitigation                                                        |
| -------------------------------------------- | ----------------------------------------------------------------- |
| Gemini gives medical-sounding advice         | Strict prompt + disclaimer + no-diagnosis rule                    |
| Gemini cost blow-up                          | On-demand only, caching, quota, rate limits, compression          |
| Photo privacy                                | Private bucket, signed URLs, retention purge, consent             |
| "Fun" tone goes too far and undermines trust | Keep health info clear/responsible; separate UI humor from report |
| Cantonese quality varies                     | Golden test set + glossary + prompt evaluation                    |
| Over-notification annoyance                  | Time-slot (not interval) reminders, cap 3/day                     |

---

## 15. App Name — impact on development

**Short answer: the name itself barely affects development**, but a couple of
adjacent things are worth deciding early:

| Thing                                                      | Changeable later? | Notes                                                                        |
| ---------------------------------------------------------- | ----------------- | ---------------------------------------------------------------------------- |
| Display name (app name on home screen)                     | ✅ Easy           | Just a config value; can change anytime                                      |
| **Bundle identifier / App ID** (e.g., `com.yourco.poolog`) | ⚠️ Harder         | Used for store listings, push, sign-in; changing it after release is painful |
| Branding (logo, mascot, colors)                            | 🔸 Medium         | Affects design work; decide before heavy UI work                             |
| Store listing name / keywords                              | ✅ Easy           | Editable in App Store Connect / Play Console                                 |

**Recommendation:** pick a _rough_ name or at least the **bundle identifier/App ID**
soon (e.g., `com.<yourco>.<slug>`), because it's cheap to set now and annoying to
change later. The friendly display name and mascot can keep evolving.

---

## 16. Open Items (remaining)

1. **App name / bundle identifier** — TBD (see §15).
2. **Mascot/branding** — a smiley poo? a toilet buddy? Decide before heavy UI work.
3. **AdMob account / Ad Unit IDs** — needed when ads are introduced (later).
4. **Apple Developer + Google Play accounts** — needed for store submission.
5. **Gemini API key & billing** — set up in Google AI Studio / Vertex AI.

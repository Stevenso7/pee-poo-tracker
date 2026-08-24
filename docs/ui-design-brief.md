# UI Design Brief — All the best (痾 the best)

Use this document to generate UI designs, mockups, or component libraries for the app.

## 1. App overview
A mobile app for logging pee (💧) and poo (💩) events. Users pick a few simple options
about each event, optionally attach one photo, and can optionally ask an AI to analyze
the photo. The subject matter is slightly gross, so the design must feel **light,
warm, and fun** — never clinical, medical, or embarrassing.

## 2. Brand personality
- **Chill, friendly, funny** — like a buddy, not a doctor.
- Playful use of emoji as visual anchors (💧 pee, 💩 poo, 🚽 brand, ✨ AI).
- Encouraging micro-copy: 「搞掂！」「記錄咗喇，做得好 👏」.
- Warm and approachable, soft shapes, generous whitespace.

## 3. Main theme color: ORANGE 🟠
Orange is the hero color. Use it for primary actions and accents throughout.

### Full palette
| Token | Hex | Use |
|---|---|---|
| Primary (orange) | `#F2994A` | Primary buttons, active states, links |
| Primary dark | `#E8862D` | Pressed/active button shade |
| Primary light | `#FFD9B8` | Tints, backgrounds behind primary |
| Background | `#FFF8F2` | App background (warm cream) |
| Surface | `#FFFFFF` | Cards, sheets, inputs |
| Text | `#3A2E2A` | Headings, body text (warm dark brown) |
| Muted text | `#8A7B75` | Secondary text, timestamps |
| Pee accent | `#FFD166` | Pee button / highlights (soft yellow) |
| Poo accent | `#A9745B` | Poo button / highlights (warm brown) |
| Success | `#27AE60` | Confirmation, healthy |
| Danger | `#EB5757` | Red flags, delete, warnings |
| Border | `#F0E3D8` | Dividers, chip outlines |

## 4. Typography & language
- UI copy is **informal written Cantonese** (口語粵文): `屙尿`, `屙屎`.
- Friendly system sans-serif (SF Pro / Roboto), rounded feel.
- Large, readable headings; emoji used generously as icons.

## 5. Shape & component style
- **Rounded corners**: 12–20px radius on cards/buttons; pill-shaped (fully rounded)
  selectable chips.
- **Soft flat colors**, minimal shadows, no harsh outlines.
- **Large tap targets** with comfortable spacing.
- Light playful motion (e.g., a little celebration on save). Nothing heavy.

## 6. Screens

### A. Auth (登入 / 註冊)
- 🚽 emoji as the logo, app name 痾 the best, warm greeting.
- Email + password fields (rounded), one big **orange** primary button.
- A subtle text link to switch between sign in / sign up.

### B. Home
- Greeting: 「今日痾咗未呀？記低佢啦～」.
- Today's counters (💧 今日屙尿 N 次 · 💩 今日屙屎 N 次).
- Two large buttons: **💧 屙尿** (pee yellow) and **💩 屙屎** (poo brown).
- Bottom links: 📖 記錄 and ⚙️ 設定.

### C. Log form (record a pee / poo)
- Title (💧 屙尿 or 💩 屙屎) + a back button.
- Options as **pill chips**:
  - Pee: 顏色 (color), 泡泡 (foam), 量 (volume).
  - Poo: 顏色 (color), 質地 (consistency, Bristol 1–7).
- One photo slot: 📷 影相 / 🖼️ 揀相 buttons, preview with a remove option.
- Optional 備註 (notes) field.
- **Orange** 搞掂！ submit button.

### D. History (記錄)
- List of past records with 💧/💩 emoji, timestamp.
- Badges: 📷 (has photo), ✨ (has AI analysis).
- Tap a row to open detail.

### E. Record detail
- Type + timestamp, the selected fields, the photo (if any).
- **AI analysis** section: summary, observations, lifestyle hints, and red flags
  (red flags in danger color). Always show the disclaimer: 「呢個只係參考，唔係醫療建議」.
- **Orange** 分析 button (or 再分析一次).

### F. Settings (設定)
- Daily reminder toggle, photo retention selector (7/14/30/60/90 日), plan/quota info.
- 登出 (sign out) button in danger color.

## 7. AI report display
- Summary in a slightly emphasized style.
- Section headings: 觀察 / 可能原因 / 生活小貼士 / 要留意.
- 「要留意」(red flags) items in the danger color.
- Confidence label (低/中/高) and the medical disclaimer at the bottom.

## 8. Accessibility & tone
- Sufficient color contrast (dark brown text on cream/orange).
- Text labels alongside emoji (emoji alone is not enough).
- Keep the tone warm and non-judgmental at all times.

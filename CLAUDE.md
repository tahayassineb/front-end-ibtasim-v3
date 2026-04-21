# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

**ibtasim** (ابتسم) is a Moroccan charitable donation platform with two core flows:
- **Project donations** — one-time or recurring donations to humanitarian projects
- **Kafala** — monthly orphan sponsorship (تكلفة شهرية مع تجديد تلقائي)

Stack: React 19 + Vite + Tailwind CSS (frontend) · Convex serverless (backend + DB + storage) · Whop (card payments in MAD) · WaSender (WhatsApp notifications) · Vercel (hosting, auto-deploy from `main`)

UI is Arabic-first (RTL), with French and English fallbacks. All user-facing text uses inline styles — no Tailwind on most pages. `fontFamily: 'Tajawal, sans-serif'` throughout.

---

## Commands

```bash
# Dev server (frontend only)
npm run dev

# Run Convex backend locally alongside dev server
npx convex dev

# Lint
npm run lint

# Build
npm run build
```

### Deploy (two separate steps — always both)

```bash
# 1. Frontend → triggers Vercel auto-rebuild
git add . && git commit -m "..." && git push origin main

# 2. Convex backend — MUST run after any change to convex/ files
npx convex deploy --yes
```

The `--yes` flag is required for non-interactive terminals. Vercel never touches Convex.

---

## Architecture

### Frontend (`src/`)

```
src/
  App.jsx               — React Router v7, all routes, ScrollToTop, ToastRenderer, GlobalErrorLogger
  context/AppContext.jsx — Global state: auth (user, isAuthenticated, login/logout),
                           language (ar/fr/en + dir), showToast(), donation state helpers
  pages/                — One file per page/flow (see Key Files below)
  components/
    MainLayout.jsx       — Public header + sticky nav
    AdminLayout.jsx      — Admin sidebar layout (Outlet-based)
    RichTextEditor.jsx   — contentEditable rich editor (bold/italic/lists/heading via execCommand)
    kafala/KafalaAvatar.jsx
    CountryCodeSelector.jsx
  lib/convex.js          — convexFileUrl() helper: converts storageId → public URL
```

**Routing pattern**: Public pages wrapped in `<MainLayout>`. Donation/kafala flows are full-screen (no layout wrapper). Admin routes use `<AdminLayout>` with nested `<Outlet>`.

**Color tokens** (not in a shared file — used inline across pages):
- Teal (projects/donations): `#0d7477` primary, `#0A5F62` dark, `#E6F4F4` bg
- Warm sand (kafala): `#8B6914` dark, `#C4A882` main, `#F5EBD9` bg, `#E8D4B0` border
- Text: `#0e1a1b` primary, `#64748b` secondary, `#94a3b8` muted

**Amounts**: All monetary values stored in **centimes** (MAD × 100) in Convex. Display divides by 100.

### Backend (`convex/`)

```
convex/
  schema.ts       — All table definitions (source of truth for data shapes)
  payments.ts     — Whop checkout: createWhopCheckout action, createKafalaWhopCheckout
  donations.ts    — createDonation, processWhopPayment (idempotent), verifyDonation
  kafala.ts       — Kafala CRUD + kafalaSponsorship management
  projects.ts     — Project CRUD (createProject, updateProject include benefitCards)
  stories.ts      — Blog/story CRUD + generateStoryImageUploadUrl
  storage.ts      — generateProjectImageUploadUrl, deleteProjectImage
  http.ts         — HTTP routes: /webhooks/whop, /donate/success, /whatsapp-webhook, /storage/
  whatsapp.ts     — WaSender session lifecycle + normalizeQrCode()
  notifications.ts— WhatsApp messages after donation verified
  auth.ts         — loginWithPassword, registerUser, verifyOtp
  crons.ts        — Scheduled jobs (WhatsApp QR auto-refresh is disabled/commented)
  errorLogs.ts    — logClientError mutation (called by GlobalErrorLogger in App.jsx)
```

**Storage pattern**: Images uploaded via `generateUploadUrl` mutation → POST to returned URL → save `storageId` string in DB → `convexFileUrl(storageId)` in frontend to get public URL.

### Multi-step Flows

Both flows are full-screen modal-style pages (no MainLayout):

**DonationFlow** (`/donate/:projectId`) — Steps 0–6:
- 0: Auth (3 options: login / register / guest → selecting one replaces options with form)
- 1: Amount (presets + custom)
- 2: Payment method (card_whop vs bank/agency transfer)
- 3: Receipt upload (bank transfer only)
- 4: Personal info (skipped if logged in)
- 5: Review
- 6: Success

**KafalaFlow** (`/kafala/:id/sponsor`) — Steps 0–3:
- 0: Auth (2 options: login / register)
- 1: Plan type (monthly vs annual)
- 2: Payment method
- 3: Review + submit

---

## Convex Environment Variables

| Variable | Format | Notes |
|----------|--------|-------|
| `WHOP_API_KEY` | `apik_xxx` | Needs `plan:create` + checkout session scopes |
| `WHOP_COMPANY_ID` | `biz_xxx` | **Not** the API key — starts with `biz_` |
| `WHOP_PRODUCT_ID` | `prod_xxx` | Defaults to `prod_1khGq1pY0YRXM` |
| `WHOP_WEBHOOK_SECRET` | `whsec_xxx` | Svix webhook verification |
| `WASENDER_MASTER_TOKEN` | `...` | WaSender master token |
| `CONVEX_SITE_URL` | `https://bold-lemming-266.eu-west-1.convex.site` | Convex HTTP base |
| `FRONTEND_URL` | `https://xxx.vercel.app` | If set, Whop redirects here post-payment |

Set via `npx convex env set KEY value` or Convex Dashboard → Settings → Env Vars.

---

## Whop Payment Integration

**Working endpoints** (standard API keys):
- `POST https://api.whop.com/api/v2/plans` — create one-time plan for custom amount
- `POST https://api.whop.com/api/v2/checkout_sessions` — returns `{ purchase_url }`
- `GET https://api.whop.com/api/v2/payments/{id}` — verify payment, read `metadata.donationId`

**Does NOT work**: `/v2/checkout_configurations` (requires enterprise scopes).

`initial_price` = actual MAD amount (e.g., `350`), **not centimes** (not `35000`).

Preset plan IDs: 200 MAD → `plan_FX2nfOyGnmaCf`, 500 MAD → `plan_KCTR7FdaRv4rv`, 1000 MAD → `plan_6Ed3nRvJGJ8cO`.

Post-payment: Whop redirects to `/donate/success` HTTP handler → verifies via Whop API → calls `processWhopPayment` (idempotent) → if `FRONTEND_URL` set, redirects to React success page.

---

## Donation Status Flow

```
pending → awaiting_receipt        (bank transfer: user uploads receipt)
        → awaiting_verification   (admin reviews)
        → verified / rejected

pending → verified                (card_whop: auto via processWhopPayment)
```

Verification always: increments `project.raisedAmount`, `user.totalDonated`, `user.donationCount`, inserts `verificationLogs` entry, schedules WhatsApp notification.

---

## WhatsApp (WaSender)

Base URL: `https://www.wasenderapi.com/api` · Auth: `Bearer {WASENDER_MASTER_TOKEN}`

Session flow: create (`POST /sessions`) → connect (`POST /sessions/{id}/connect`) → scan QR → connected.

`normalizeQrCode()` in `convex/whatsapp.ts` handles two QR formats:
- Raw pairing string starting with digit (e.g. `2@...`) → pass to qrserver.com
- Base64 PNG → prepend `data:image/png;base64,`

`createAndConnectSession` checks only `if (!sessionId)` — WaSender sometimes omits `api_key` in response (never needed for subsequent calls).

---

## Database Schema Highlights

- All prices/amounts in centimes (MAD × 100) except Whop `initial_price` which is actual MAD
- `kafala.bio` is `{ ar, fr, en }` object; use `getBioText(bio)` pattern to extract by lang
- `projects.benefitCards` — optional array of `{ icon, value, label }` for impact display
- `stories.coverImage` / `stories.body` — optional; coverImage is a storageId, body is HTML string
- `stories.slug` / `stories.metaDescription` — SEO fields (if added)
- Sponsorship renewal tracked in `kafalaSponsorship.nextRenewalDate`; reminders sent by cron

---

## Key Files

| File | Purpose |
|------|---------|
| `convex/schema.ts` | Single source of truth for all data shapes |
| `convex/payments.ts` | Whop checkout actions for both donations and kafala |
| `convex/http.ts` | HTTP routes: Whop webhook, `/donate/success`, WhatsApp webhook |
| `convex/stories.ts` | Blog CRUD + `generateStoryImageUploadUrl` |
| `src/App.jsx` | All routes + `ScrollToTop` + `ToastRenderer` + `GlobalErrorLogger` |
| `src/context/AppContext.jsx` | Auth state, language, toast, donation helpers |
| `src/pages/DonationFlow.jsx` | 6-step donation wizard (projects) |
| `src/pages/KafalaFlow.jsx` | 4-step sponsorship wizard (kafala) |
| `src/pages/AdminProjectForm.jsx` | Project creation/edit including `benefitCards` editor |
| `src/pages/AdminStories.jsx` | Blog/story creation with cover image + rich body |
| `src/pages/AdminSettings.jsx` | WhatsApp config, system health (~1000 lines) |
| `src/lib/convex.js` | `convexFileUrl(storageId)` — always use this, never construct URL manually |
| `JOURNEY.md` | Chronological decision log — bugs found, root causes, fixes, lessons |

---

## Gotchas

1. **Two deploys**: git push (Vercel) + `npx convex deploy --yes` (Convex) are always both needed
2. **Amounts**: Convex stores centimes; Whop `initial_price` takes actual MAD — don't confuse
3. **`WHOP_COMPANY_ID`**: starts with `biz_`, not `apik_` — was set wrong before
4. **storageId vs URL**: Always store Convex `storageId` in DB, call `convexFileUrl()` in frontend
5. **QR code expires**: ~30–60s; no auto-poll — user clicks Reconnect manually
6. **WaSender `api_key`**: May not be returned on session create; never require it
7. **`FRONTEND_URL` unset**: Whop redirects to Convex site showing inline HTML, not React app
8. **Auth step in flows**: First screen shows option cards; selecting one replaces cards with form (no scroll needed). Back button (`← تغيير الخيار`) resets `authMode` to null.
9. **fileRef in KafalaFlow**: Hidden `<input ref={fileRef}>` must stay **outside** payment-method conditional blocks — if inside, it unmounts and `fileRef.current?.click()` silently fails
10. **Tailwind + inline styles**: Most pages use inline styles exclusively; only `AdminLayout`, `ErrorBoundary`, and a few components use Tailwind classes

---

## Standing Instruction

**Always write a new entry in `JOURNEY.md` at the end of every session or task.**

Include: what was broken, what you tried, what mistakes you made, root cause, fix, lessons for the next instance. Non-negotiable — do it for small sessions too.

---

## Mandatory Post-Execution Review

**After completing ANY task, execution plan, or code change — without exception:**

1. **Build check**: Run `npm run build`. Zero errors required before reporting done.
2. **Lint check**: Run `npx eslint [changed files]` and fix any new `error`-level issues introduced (not pre-existing warnings).
3. **Self-audit**: Re-read every file you modified and check for:
   - Undefined variables or imports
   - Props passed but never destructured (or vice versa)
   - State shape mismatches between parent and child
   - `useRef` / `useState` used without being imported
   - Relative import depth correctness (`../../` chain counts)
4. **Behavior verification**: For each changed file, state in one sentence what the user-visible behavior is before and after. If it changed, flag it explicitly.
5. **JOURNEY.md entry**: Write a new entry per the Standing Instruction above.

This review step is non-negotiable. Do not mark a task complete until these 5 checks pass.
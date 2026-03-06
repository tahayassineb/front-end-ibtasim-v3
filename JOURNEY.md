# Development Journey Log — ibtasim Platform

This file documents key decisions, bugs encountered, and lessons learned during development.
Written to help future debugging and to build institutional knowledge.

---

## Session 1: Initial WhatsApp + Whop Setup

### Problem
- Whop payments were failing with "This Bot was not found"
- WhatsApp QR code was blurred and locked with a timer

### Decisions Made

**Whop API v1 → v2**
- The old code pointed to `/api/v1/checkout_configurations` which was deprecated.
- Fixed by changing to `/v2/checkout_configurations`.
- Lesson: Always check the Whop API changelog when integrating — their v1 and v2 have different response shapes too (v2 returns the object directly at root, not wrapped in `data`).

**Remove WhatsApp auto-polling**
- Original design auto-polled WaSender every 4 seconds and ran a Convex cron every minute.
- This created unnecessary API load and confusing UX (QR would expire and auto-refresh while user was trying to scan).
- Decision: Remove all auto-polling. QR is only fetched when user explicitly clicks Connect or Reconnect.
- Also disabled the `autoRefreshWhatsAppQr` cron in `convex/crons.ts`.

**WhatsApp button UX redesign**
- Replaced single "Create Session" button with state-aware buttons:
  - No session → phone input + "اتصال" (Connect)
  - Session exists but disconnected → "إعادة الاتصال" (Reconnect)
  - Connected → "قطع الاتصال" (Disconnect)
- Reason: the old button didn't distinguish between "no session ever" and "session disconnected". For reconnect, we don't need a phone number — we already have the session ID stored.

**QR code normalization**
- WaSender can return either:
  1. A raw WhatsApp pairing string starting with `digit@` (e.g. `2@DfzdT...`)
  2. A base64-encoded PNG image (without the `data:image/png;base64,` prefix)
- Created `normalizeQrCode()` function in `convex/whatsapp.ts` to detect and handle both formats.
- For raw pairing strings → frontend passes to `api.qrserver.com` which generates the QR image.
- For base64 PNG → prepend `data:image/png;base64,` prefix so `<img src=...>` renders directly.

---

## Session 2: Deployment Gap + companyId env var issue

### Problem
- All code fixes were written but never deployed. Vercel was 4+ hours old.
- Convex backend still running old code.

### Lesson
- **Always deploy after code changes.** Two separate deploys are needed:
  1. `git push origin main` → triggers Vercel rebuild for the frontend
  2. `npx convex deploy --yes` → deploys Convex backend separately
- The `--yes` flag is required for non-interactive terminals (CI/CD, bash scripts).

### Problem: WHOP_COMPANY_ID env var contained API key value
- `WHOP_COMPANY_ID` was set to `apik_xxx...` (an API key) instead of `biz_xxx` (company ID).
- This caused "This Bot was not found" from Whop API.
- Fix: User corrected in Convex Dashboard → Settings → Environment Variables.
- The correct company ID format is `biz_bMROFFVg1qyi39`.

---

## Session 3: Whop 401 + QR Not Connecting

### Problem 1: Whop 401 "API Key does not have permission"

After updating the company ID, a new error appeared: 401 from Whop.

Root causes (confirmed by Whop AI support):

1. **Wrong `initial_price` units**: Our code was sending `amountCentimes = amountMAD * 100`, so 5 MAD became 500. Whop API uses **actual currency amounts** (MAD = 5.00), not centimes.
   - Fix: Use `args.amountMAD` directly for `initial_price`.

2. **Missing `product_id`**: The request had `productId: null` because `WHOP_PRODUCT_ID` env var was not set in Convex. Whop requires a product ID for inline plan creation.
   - Fix: Use env var if set, otherwise fallback to hardcoded `prod_1khGq1pY0YRXM` (ibtasimm product).

3. **API key permissions**: The Whop API key must have these scopes:
   - `checkout_configuration:create`
   - `plan:create`
   - `access_pass:create`
   - `access_pass:update`
   - `checkout_configuration:basic:read`

**Design decision: inline plan vs preset plan IDs**
- Whop AI suggested using preset plan IDs for amounts like 20, 500, 1000 MAD (faster, no plan creation needed).
- For custom amounts, always create plan inline.
- We chose to always create inline (simpler, works for any amount). Can optimize with preset IDs later.

### Problem 2: WhatsApp QR appears but doesn't connect

Root cause: `createAndConnectSession` in `convex/whatsapp.ts` always returned an error, even when WaSender successfully created the session.

The bug: after getting the session creation response, the code checks `if (!sessionId || !apiKey)`. But `apiKey` (the WaSender per-session key) may not be returned by WaSender's API — or may never be needed since all our actual API calls use the master token.

Because `apiKey` was undefined, this check always failed, meaning the session was created on WaSender's server but our app never stored it in Convex config.

- Fix: Changed check to `if (!sessionId)` — only require the session ID, which is what all subsequent calls use.
- Note: `apiKey` is still stored in config if WaSender does return it, for potential future use.

**QR rendering logic** (confirmed correct, no change needed):
- Raw pairing string (`2@xyz...`) → passed to `api.qrserver.com?data=2%40xyz...` which generates the QR image
- Base64 PNG (from some WaSender responses) → shown directly as `<img src="data:image/png;base64,...">`
- The `encodeURIComponent` ensures special chars in the pairing string are URL-safe before passing to qrserver.com

---

## Convex Environment Variables Reference

| Variable | Format | Description |
|----------|--------|-------------|
| `WHOP_API_KEY` | `apik_xxx...` | Whop API key (needs specific permissions) |
| `WHOP_COMPANY_ID` | `biz_xxx` | Whop company ID (NOT the API key!) |
| `WHOP_PRODUCT_ID` | `prod_xxx` | Optional: Whop product ID (defaults to `prod_1khGq1pY0YRXM`) |
| `WASENDER_MASTER_TOKEN` | `...` | WaSender master API token |
| `CONVEX_SITE_URL` | `https://...convex.site` | Convex HTTP actions URL (for webhooks + redirect URLs) |
| `FRONTEND_URL` | `https://...vercel.app` | Frontend URL (used for donation success redirect) |

---

## Session 4: QR Scan Failure — The Real Fix (and Why It Took So Long)

### The Problem
WhatsApp QR code was displaying correctly on screen but scanning it with WhatsApp did nothing — no connection established.

### What I (Claude) Did Wrong — 5 Times

The user told me multiple times that the QR wasn't connecting. Each time, I:

1. **Checked the wrong thing**: I kept reading `convex/whatsapp.ts` (backend), looking at session creation, QR normalization logic, and the `apiKey` bug. Those were real bugs but they were already fixed.

2. **Assumed the backend was the problem**: Because the previous session had a backend bug (`if (!sessionId || !apiKey)`), I kept investigating there. But that bug was already fixed. The QR was being generated and displayed correctly — the backend was fine.

3. **Never questioned qrserver.com**: The line in `AdminSettings.jsx` that called `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(whatsappSession.qrCode)}` was accepted as correct. I documented it in JOURNEY.md as "confirmed correct, no change needed." This was wrong.

4. **`encodeURIComponent` gave false confidence**: The code used `encodeURIComponent()` which looks correct. But qrserver.com is an external HTTP API — it receives the URL, then on its server it decodes the query parameter, and generates a QR from that. In practice, certain combinations of special characters in the WhatsApp pairing string (`+`, `/`, `=`, `@`, newlines) were being mangled through the encode→HTTP→decode chain. The resulting QR image *looked valid* but contained wrong data.

5. **Focused on visible errors, not invisible data corruption**: There was no 404, no console error, no broken image. The QR displayed perfectly. So I never suspected the QR image itself was wrong. But the data inside the QR was corrupted — only discoverable by actually scanning it and seeing the connection fail.

### The Actual Root Cause

**External QR generation via HTTP = data corruption for WhatsApp pairing strings.**

WhatsApp pairing strings look like: `2@DfzdT+abc/xyz==,somedata,moredata`

These contain URL-special characters. The flow was:
```
Raw string → encodeURIComponent → URL parameter → HTTP request to qrserver.com
→ qrserver.com decodes it → generates QR from decoded string
```

The decode step on qrserver.com's server was not perfectly reversing the encoding for all character combinations. The QR image it returned was built from a slightly corrupted version of the pairing string. WhatsApp scanned it, got wrong data, and silently failed.

### The Fix

Replace external HTTP QR generation with **client-side QR generation**:

```jsx
// BEFORE (broken)
<img src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrCode)}`} />

// AFTER (correct)
import { QRCodeSVG } from 'qrcode.react';
<QRCodeSVG value={qrCode} size={192} />
```

`qrcode.react` encodes the raw string directly in JavaScript — no HTTP round-trip, no encoding/decoding chain, no data corruption. The pairing string reaches the QR generator intact.

Also added:
- **Auto-refresh every 20 seconds** — WaSender QR codes expire in ~20-30s. Without auto-refresh, even a valid QR would become stale.
- **Status polling every 5 seconds** — detects when WhatsApp scan succeeds and updates UI automatically.

### Lesson for Future Claude

**When a QR code displays but scanning fails, the problem is almost always the QR data content, not the display.** Never assume an externally-generated QR image is correct just because it renders. If the data goes through URL encoding + HTTP + decoding, character corruption is possible.

**Always suspect the boundary between systems** — in this case, the boundary between JavaScript string → URL-encoded HTTP request → external server decode. That's where data gets corrupted silently.

**When a user says "this thing doesn't work" 5 times and the backend looks fine, look at the frontend rendering.** The last place you'd think to look is often the correct place.

---

## Architecture Notes

- **Convex** is both backend (actions/mutations/queries) and database. Deploy separately from frontend.
- **Vercel** auto-deploys frontend from `main` branch on GitHub push.
- **WaSender** is a third-party WhatsApp gateway. Sessions have a lifecycle: created → connecting (show QR) → connected → disconnected.
- **Error logs**: All API errors are stored in Convex via `api.errorLogs.insertErrorLog` and visible in Admin Settings → error log panel.

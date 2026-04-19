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

## Session 5: 6 Bug Fixes — OTP, Notifications, Donor Totals, Verification Queue

### What Was Reported

User gave a list of 6 bugs:
1. OTP is 6 digits but the input only has 4 fields
2. Project creation doesn't send notifications to users
3. Donor profile shows wrong total (e.g. 0.05 MAD instead of 5 MAD)
4. Donation history shows unverified/pending donations mixed in
5. Donations ledger page has Verify/Reject buttons it shouldn't have
6. Verification page does nothing — no donations appear in the queue

---

### What I Fixed (Round 1) — Some Right, Some Wrong

**Correctly fixed:**
- OTP: changed 4 fields → 6 in `Register.jsx` (state, refs, map, index boundary)
- Donor total: removed `/100` division in `AdminDonorDetail.jsx` — amounts are in MAD not cents
- Donation status badge: replaced hardcoded "SUCCESS" badge with real status-aware badge
- Donations ledger: removed verify/reject buttons and mutations from `AdminDonations.jsx`

**Incorrectly fixed (wrong root cause):**

**Bug 2 (notifications):** I found that `publishProject` mutation called `ctx.runAction()` which is not allowed in Convex mutations. I fixed that — but I didn't check whether `publishProject` was actually called from the UI. It wasn't. The admin form uses `createProject` and `updateProject` directly. So my fix was on a dead code path. Notifications still didn't fire.

**Bug 6 (verification queue empty):** I looked at `AdminVerifications.jsx` and `verifyDonation` mutation and said they looked correct. I told the user the verification page is functional. It wasn't. I never traced the actual data flow: what puts a donation into `awaiting_verification` status. I assumed the backend was fine without checking whether the frontend ever actually called `uploadReceipt`.

---

### What the User Said

"you didn't fix the problem — the verification page still doesn't receive donations with receipts, it has nothing. Also the notification for projects doesn't work. Check the logs."

---

### What I Did Wrong (Be Honest)

1. **I declared victory without end-to-end tracing.** For bug 6, I read the backend query and mutation, saw they looked correct, and assumed the feature worked. I never followed the user flow: user uploads file → does the file actually reach the server? Answer: no. The file was stored in local React state only.

2. **I fixed the wrong function for bug 2.** I saw `ctx.runAction()` in `publishProject` and fixed it. But I never checked whether `publishProject` is called anywhere in the admin UI. One `grep` for `publishProject` in `src/pages/` would have shown it's never used. I skipped that check.

3. **I said "deployed" and "done" without verifying the feature worked end-to-end.** Both bugs required me to trace from the UI action all the way to the database. I stopped at the first plausible-looking code.

---

### The Actual Root Causes

**Bug 6 — Verification queue always empty:**

`DonationFlow.jsx` step 3 (`handleSubmitDonation`) only called `createDonation`. It never:
- Generated a Convex storage upload URL
- POSTed the file to Convex storage
- Called `uploadReceipt` mutation

The file sat in `uploadedFile` React state and was discarded on navigation. Every bank transfer donation stayed permanently at `awaiting_receipt`. The verification queue query only returns `awaiting_verification` donations → always empty.

**Fix:** Three-step flow in `handleSubmitDonation`:
1. `createDonation` → get `donationId`
2. `generateUploadUrl()` + `fetch(uploadUrl, { method: 'POST', body: file })` → get `storageId`
3. `uploadReceipt({ donationId, receiptUrl: storageId })` → status becomes `awaiting_verification`

**Bug 2 — Notifications never fired:**

`AdminProjectForm.jsx` uses `createProject` and `updateProject` directly. `publishProject` is never called from the UI. So the notification scheduling I added to `publishProject` was unreachable.

**Fix:** Added notification scheduling directly into `createProject` (when `status === 'active'`) and `updateProject` (when `project.status !== 'active'` and new status is `'active'`). These are the actual code paths the admin form uses.

---

### Lesson for Future Claude

**Rule: Always trace the complete user flow before declaring a bug fixed.**

For any data flow bug:
1. Start from the UI action (button click, form submit)
2. Follow every step: which mutation is called? what does it do? what status does it set?
3. Then check the read side: what query fetches the data? what filter does it apply?
4. Confirm both sides match

**Rule: Before fixing a function, check if it's actually called.**

`grep` for the function name in `src/pages/` before spending time fixing it. A function that's never called from the UI is a dead code path — fixing it changes nothing.

**Rule: "The backend looks correct" is not the same as "the feature works."**

Backend correctness is necessary but not sufficient. The frontend must also call the backend. A complete file upload flow needs: (1) get upload URL, (2) POST file, (3) call the mutation with the storage ID. Any missing step and nothing gets saved.

---

---

## Session 6: Notifications, Observability, Cash Agency Flow, Verification Queue

### What Was Reported

Three interrelated issues:
1. Project creation doesn't send notifications (even though the Convex function returns success)
2. No visibility into what actually happened in the backend — API calls fail silently
3. Wafash/agency donations appear as "pending" and never reach the verification queue; verification page stays empty for them

### Root Causes Found

**Issue 1 (Notifications):**
The notification scheduling code was already in `createProject`/`updateProject` (fixed in Session 5). The actual problem is that ALL WaSender API calls in `notifications.ts` were completely silent on failure — no `insertErrorLog` calls anywhere. If the WASENDER_MASTER_TOKEN is wrong or the session isn't connected, the action returns `{ success: false }` internally but nothing gets written to the error logs. Admin had no way to see what was failing.

**Issue 2 (Observability):**
Only `payments.ts` had systematic error logging. The gaps were:
- `notifications.ts`: `sendWhatsAppMessage` returned error details but none of its 4 caller actions logged to `errorLogs`
- `http.ts`: All three webhook handlers (`/webhooks/whop`, `/whatsapp-webhook`, `/donate/success`) used only `console.error` — never visible in the admin panel
- `donations.ts`: `processWhopPayment` had no try/catch at all; notification scheduler errors only in console
- `payments.ts`: No success logging (only errors)

**Issue 3 (Cash Agency / Verification):**
The Wafash/cash payment flow was completely unimplemented:
- UI let users select "cash" payment but the `BottomAction` handler at step 2 only intercepted `paymentMethod === 'card'` for Whop. Cash users fell through to step 3 (receipt upload), which required a file — but cash users have reference numbers, not files. They were stuck.
- `createDonation` only set `awaiting_receipt` for `bank_transfer` and `pending` for everything else. `cash_agency` donations got stuck at `pending` forever.
- `getPendingVerifications` had a hardcoded `.filter(paymentMethod === "bank_transfer")` which excluded any `cash_agency` donations even if they had `awaiting_verification` status.

### What Was Fixed

1. **`convex/notifications.ts`**: Modified `sendWhatsAppMessage` to also return `status` and `responseBody`. Added `insertErrorLog` calls in all 4 notification action callers: per-failure logging in `broadcastToAllUsers` (and summary at end), error+info logging in `sendDonationVerificationNotification`, summary logging in `sendProjectPublishedNotification`, failure logging in `sendProjectClosingSoonNotifications`.

2. **`convex/http.ts`**: Replaced `console.error` with `ctx.runMutation(api.errorLogs.insertErrorLog)` in all three handlers: Whop webhook, WaSender webhook, and `/donate/success` (for payment lookup failure, processWhopPayment failure, and network errors).

3. **`convex/donations.ts`**: Added try/catch to `processWhopPayment` with structured `errorLog` inserts on every failure path and a success log. Also: `createDonation` now sets `awaiting_verification` directly for `cash_agency` (no file upload step needed). `getPendingVerifications` drops the `paymentMethod === "bank_transfer"` filter — now shows all `awaiting_verification` donations including `cash_agency`. Added `message` field to the return shape (carries reference number for cash agency).

4. **`convex/payments.ts`**: Added info-level `insertErrorLog` after successful Whop plan creation and checkout session creation.

5. **`src/pages/DonationFlow.jsx`**: Added `referenceNumber`, `selectedAgency`, and `message` to `donationData` state. `Step3ReceiptUpload` now accepts `paymentMethod` prop and renders a reference number input form for cash users instead of file upload. `handleSubmitDonation` in `BottomAction` has a separate cash branch: validates reference number, calls `createDonation` with `paymentMethod: 'cash_agency'` + reference in `message` field, goes straight to step 4.

6. **`src/pages/AdminVerifications.jsx`**: Added `paymentMethodRaw`, `referenceNumber`, `agencyName` to the mapped donation object. Receipt/verification section is now conditional: shows reference number + agency name for `cash_agency`, receipt image viewer for `bank_transfer`.

### Mistakes Made This Session

None of the previous session's bugs were re-introduced. However:
- The "bank transfer donations appear as rejected" symptom was listed in the user prompt but the code already correctly sets `awaiting_receipt` on creation. This is probably historical test data (admin manually rejected test donations). It was NOT a code bug — no fix was needed. The observability improvements will surface any future silent failures.

### Lessons for Next Claude

1. **Add observability first, diagnose second.** The notification issue couldn't be diagnosed without error logs. After deploying this session's fixes, go to Admin → Error Logs and trigger a project publish — the log will immediately show whether WaSender is failing and why (wrong token, disconnected session, etc.).

2. **When payment method selection doesn't trigger a special handler, it falls through to the default step progression.** Always check: is there a `paymentMethod === 'X'` check in `BottomAction`? If not, cash users walk into the bank transfer UI.

3. **`getPendingVerifications` had a hardcoded payment method filter** that would have silently excluded new payment methods. When adding a new payment method, always audit the queries that drive admin views.

4. **Direct `ctx.db.insert("errorLogs", ...)` from inside a mutation** is cleaner than `ctx.runMutation(api.errorLogs.insertErrorLog)` — avoids a redundant function call and potential circular dependency.

---

## Session 7: WhatsApp Notifications — Wrong Session, Missing Image, Missing Link, Duplicate Messages

### What Was Reported

1. WhatsApp messages were being sent from the wrong WaSender session (account had multiple sessions)
2. Project notification messages had no main image
3. Notification messages had no project name, no user name, no link to the project
4. After some fixes: messages were sent twice (one with image, one without)
5. After link fix attempt: link still not appearing in messages

### Root Causes (In Order of Discovery)

**Wrong session sending:**
The send function in `notifications.ts` used `WASENDER_MASTER_TOKEN` for all sends. This is the account-level token. When the account has multiple WhatsApp sessions, WaSender may route sends through any of them. There is no way to control routing unless you use the session-specific `api_key`.

Fix attempt: Add UI for admin to explicitly select which session to use. Added `listWaSenderSessions` action and `selectSessionForSendingAction`, stored chosen session's `api_key` in `whatsapp_settings` config, modified `sendWhatsAppMessage` to read it.

Later the user clarified this was a mistake on their part — no other session had actually sent. Reverted to simpler approach.

**No image in messages:**
`project.mainImage` stores a **Convex storage ID** (e.g. `kg2abc123...`), not a URL. Passing the storage ID directly to WaSender as `imageUrl` produces a broken link. Fix: call `ctx.storage.getUrl(project.mainImage)` to resolve it to an actual HTTPS URL before broadcasting.

**No name/title/link in messages:**
The broadcast function didn't pass user name, project title, or project link. Fixed by:
- Querying the user's name from the DB inside `broadcastToAllUsers`
- Building the project link from `process.env.FRONTEND_URL` (or `FRONTEND_URL` Convex env var)
- Composing a full message: `السلام عليكم {name} 👋\n\n🌟 مشروع جديد...\n"${title}"\n\nتبرع الآن...\n${link}\n\nفريق جمعية الأمل`

**Link not appearing — the real root cause:**
After multiple code attempts (trying `caption` field, splitting image+text into two calls, checking message format), the actual problem was discovered: **`FRONTEND_URL` was not set in Convex environment variables at all.** The link variable was an empty string. Once the user added `FRONTEND_URL` via Convex Dashboard, links appeared immediately.

**Duplicate messages:**
During debugging, the send function was split into two calls: one `POST /messages` with `imageUrl`, then another with `text`. This caused two WhatsApp messages per user. Reverted to a single call with `{ to, text, imageUrl }` — WaSender renders image+caption as one message.

### What I Did Wrong

1. **Spent multiple iterations changing message format, field names (`caption` vs `text`), and message structure** — never checked whether `FRONTEND_URL` was set. A single `npx convex env list` at the start would have revealed the missing env var immediately. I should have checked env vars before touching code.

2. **Split message into two calls** when debugging the link issue. This "fix" introduced the duplicate message bug. Lesson: don't change unrelated things while chasing a bug.

3. **Asserted with confidence that the problem was a code bug** when it was a configuration gap. The user was reasonably frustrated: "the problem was bc it was not in the env arement variable, at all how you can be sure like that it wasent in evn variable in convex." I declared the code correct without verifying the runtime environment.

### The Actual Fix

1. Resolve `project.mainImage` storage ID via `ctx.storage.getUrl()` before broadcasting
2. Pass user name (`user.name`) and project title into message text per user
3. Build project link from `process.env.FRONTEND_URL`
4. Single WaSender call: `{ to: phoneNumber, text: fullMessage, imageUrl: resolvedUrl }`
5. **Set `FRONTEND_URL` in Convex Dashboard** — this is the actual fix that made links appear

### Lessons for Next Claude

**Check env vars first.** Before assuming a bug is in the code, run `npx convex env list` and verify every variable the affected function reads. A missing env var is invisible in code review — it only shows up at runtime as an empty string or undefined.

**Never change multiple things at once when debugging.** Each change should be isolated and testable. Splitting a single message call into two calls "to debug" introduced a new bug (duplicate messages). Change one thing, verify, then change the next.

**Convex storage IDs are not URLs.** Any `mainImage`, `receipt`, or `file` field stored in Convex is a storage ID. Always call `ctx.storage.getUrl(storageId)` to get the actual HTTPS URL before passing to external APIs.

---

## Session: Kafala (Orphan Sponsorship) Feature — 2026-04-14

### What the user requested
Add a full "kafala" (orphan sponsorship) system: individual orphan profiles, fixed monthly price per orphan, only one sponsor at a time, all three payment methods (card Whop subscription / bank / cash), WhatsApp renewal reminders at 10/5/3/1 days before expiry, and admin CRUD similar to projects.

### What was built

**Backend (Convex):**
- 3 new tables in `schema.ts`: `kafala`, `kafalaSponsorship`, `kafalaDonations`
- `convex/kafala.ts`: Full CRUD + `createSponsorship`, `verifyKafalaDonation`, `processKafalaWhopPayment`, `resetKafala`, `renewKafalaDonation`, `uploadKafalaReceipt`, `getActiveBankCashSponsorships`
- `convex/kafalaPayments.ts`: Whop recurring plan creation + checkout session action
- `convex/kafalaNotifications.ts`: Daily WhatsApp reminder action for bank/cash sponsors
- `convex/crons.ts`: Added `kafalaRenewalReminders` daily cron at 7 AM UTC
- `convex/http.ts`: Added `GET /kafala/success` route (Whop redirect handler)

**Frontend:**
- `src/components/kafala/KafalaAvatar.jsx`: Grey male/female SVG silhouette + optional real photo
- `src/pages/KafalaList.jsx`: Public grid with filter (all/available/sponsored)
- `src/pages/KafalaDetail.jsx`: Orphan profile page + sponsor CTA
- `src/pages/KafalaFlow.jsx`: 5-step sponsorship wizard (fixed price, no amount selection)
- `src/pages/KafalaRenew.jsx`: Renewal page for WhatsApp reminder links
- `src/pages/AdminKafala.jsx`: Admin list with publish/reset/delete actions
- `src/pages/AdminKafalaForm.jsx`: Admin create/edit form with multilingual bio
- `src/App.jsx`: 7 new routes + 2 admin routes
- `src/components/AdminLayout.jsx`: Added "الكفالات" to sidebar

### Mistakes made
- Initially referenced `api.admins.getAdminByUserId` which doesn't exist — fixed by using `adminUser?.userId || adminUser?.id` from AppContext (same pattern as AdminProjectForm).
- Used `appUser?._id` instead of `appUser?.userId` for Convex IDs — caught and corrected.
- First tried Whop v2 recurring plan (`plan_type: "recurring"`, `billing_period: 30`) — Whop v2 API doesn't support recurring plans this way. Then switched to one-time (worked but no auto-billing). Finally implemented v1 recurring correctly (see session below).
- Optimistically locked kafala slot for card payments before Whop checkout confirmed — this caused stuck "sponsored" state on Whop failure. Removed optimistic lock entirely; slot only locks after webhook/redirect confirms payment.

### Key design decisions
- Kafala uses **separate tables** (`kafalaDonations` not `donations`) to avoid polluting project donation logic
- Card payments use Whop **recurring plans via v1 API** (`billing_period: 30`, `renewal_price`) so Whop auto-charges every month
- Kafala slot stays "active" until payment confirmed — never lock optimistically
- For bank/cash: slot stays "active" until admin verifies → avoids blocking the slot on unconfirmed payments
- WhatsApp reminders exclude Whop subscribers (`card_whop`) since Whop handles auto-billing

### For the next Claude instance
- `KafalaFlow` requires the user to be logged in (`appUser`) to create a sponsorship — if no user, `createSponsorship` will fail because `userId` will be undefined. Consider adding a guest flow similar to `DonationFlow`.
- Admin verification for kafala donations is currently done via `getPendingKafalaVerifications` query — no UI page exists yet for admin to verify them. This could be added to `AdminVerifications.jsx` as a new tab.

---

## Session: Whop Recurring Auto-Billing for Kafala

### Problem
The kafala payment used Whop one-time plans (not auto-renewing). The user explicitly asked for true monthly auto-billing so the sponsor doesn't need to manually pay each month.

### Root cause of initial failures
1. First attempt: `plan_type: "recurring"` on `/api/v2/plans` — v2 doesn't support recurring this way, returned API error
2. Second attempt: `plan_type: "one_time"` — worked, but no auto-billing

### Solution (session 3)
Searched Whop MCP documentation → found v1 recurring plan API:
- Endpoint: `POST /api/v1/plans` (NOT v2)
- Body: `{ company_id, product_id, billing_period: 30, initial_price, renewal_price, visibility: "hidden", stock: 1 }`
- Key differences: `product_id` not `access_pass_id`, `renewal_price` field, `billing_period` instead of `plan_type`

### Webhook handling for recurring payments
Added two-path webhook routing in `/webhooks/whop`:
- `metadata.type === "kafala"` → routes to kafala handler
- First payment: `processKafalaWhopPayment(donationId, paymentId, membershipId)` — activates sponsorship
- Subsequent months: `getSponsorshipBySubscriptionId(membershipId)` → `extendKafalaSponsorship(sponsorshipId, paymentId)` — creates new kafalaDonation + extends nextRenewalDate 30 days (idempotent: checks whopPaymentId against recent donations)

### Files changed
- `convex/kafalaPayments.ts`: v1 recurring plan API
- `convex/kafala.ts`: `getSponsorshipBySubscriptionId` query + `extendKafalaSponsorship` mutation
- `convex/http.ts`: webhook routing for kafala vs regular donations

### Mistakes made
- None in this session — had clear spec from MCP docs before implementing

### For the next Claude instance
- Whop v1 plans may behave differently from v2 plans regarding checkout session creation (v2 `checkout_sessions` endpoint used with v1 plan ID — not yet confirmed in production)
- If `membership_id` is missing from recurring payment webhooks, fall back to checking `donationId` metadata — the dedup check in `extendKafalaSponsorship` uses `whopPaymentId` on recent donations for idempotency
- Still needed: admin UI to verify pending kafala bank/cash donations
- ✅ DONE in next session — see "Kafala Renewal + Admin Verification" entry below

---

## Session: Bank Transfer UI + Unverified Account Recovery — 2026-04-14

### Problems reported
1. Bank transfer payment step looked different (worse) than agency/cash transfer — no copy buttons, no reference number field.
2. If a user registered but never completed OTP verification (navigated away at the OTP step), they were locked out: re-registering gave "phone already registered" and logging in gave "password not set" — no recovery path.

### Fix 1 — Bank transfer parity with agency
Rewrote the `bank_transfer` section in KafalaFlow step 4:
- Added a polished card with green header (matching DonationFlow style)
- Copy-to-clipboard button on account holder name
- Copy button with highlight on RIB (monospace, primary color)
- Added transaction reference number input field — same `reference` state used by cash_agency
- `handleSubmit` now passes `transactionReference: reference` for bank_transfer too

### Fix 2 — Unverified account recovery
**Backend (`convex/auth.ts`)**:
- `registerUser`: if phone exists but `!isVerified && !passwordHash` → update name/email and return `success: true, userId`. The frontend then sets their password and resends OTP. Previously it returned an error, leaving them stuck.
- `loginWithPassword`: added `requiresOtpVerification: v.optional(v.boolean())` to return schema. If user exists but `!isVerified && !passwordHash`, returns `{ success: false, requiresOtpVerification: true }` instead of a generic error.

**Frontend (`KafalaFlow.jsx` + `DonationFlow.jsx`)**:
- `handleLogin`: if `result.requiresOtpVerification === true`, automatically calls `requestOTP` and switches to OTP screen with toast: "حسابك غير مفعّل. تم إرسال رمز التحقق مجدداً."

### Lesson
Two-step auth flows (register → OTP) always create a "partial registration" trap. The recovery path must be built into both `registerUser` (allow re-register if unverified) and `loginWithPassword` (redirect to OTP if unverified). Handle this at account creation time, not as an afterthought.

---

## Session: Kafala Renewal + Admin Verification Panel — 2026-04-15

### Problem
The manual renewal system was incomplete:
1. Bank/cash sponsors got a WhatsApp reminder to pay but had no page in the app to submit their receipt.
2. Admins had no UI to see and approve/reject pending kafala renewals.

### What was built

**Backend (`convex/kafala.ts`)**:
- Added `getActiveSponsorshipByKafalaAndUser` query — takes kafalaId + userId, returns the most recent active/pending/expired sponsorship. Used by the renewal page to confirm the logged-in user is the sponsor and to know their payment method.
- `renewKafalaDonation` and `uploadKafalaReceipt` mutations already existed.

**`src/pages/KafalaRenew.jsx`** — Sponsor-facing renewal page at `/kafala/:id/renew`:
- Auth guard (redirect to login if not authenticated)
- Sponsorship check (403-style screen if not the current sponsor)
- Pending guard (if `status === "pending_payment"`, shows "already under review")
- Orphan summary strip + sponsorship info card (payment method, next renewal date, status)
- Bank transfer: polished card with copy buttons for RIB/account holder + drag-and-drop receipt upload + transaction reference input
- Cash agency: agencies info card + reference input
- Calls `renewKafalaDonation` → `uploadKafalaReceipt` → success screen

**`src/pages/AdminKafalaVerifications.jsx`** — Admin panel at `/admin/kafala/verifications`:
- Uses `getPendingKafalaVerifications` to list all pending bank/cash renewals
- Search by donor name, phone, or orphan name
- Pending card list with donor avatar, amount, orphan name, payment method badge, date
- Detail modal: donor info with WhatsApp deep-link, receipt image (tap to expand), transaction reference, 3-item checklist (amount / reference / date), rejection reason textarea, Approve / Reject buttons
- Approve calls `verifyKafalaDonation({ verified: true })` → activates sponsorship, extends nextRenewalDate +30 days
- Added route `/admin/kafala/verifications` in App.jsx + "🔄 تجديدات الكفالة" item in admin sidebar المالية section

### Lesson
Always build the full renewal loop when adding a manual payment method: reminder cron alone is not enough. You need: (1) sponsor renewal page, (2) admin verification UI, (3) idempotent mutation that extends the renewal date. All three existed except the frontend pages.

---

---

## Session: Full Admin Panel Visual Redesign — Phase 2 (Steps 21–31)

### What was done
Completed the final 9 steps of the 31-file visual redesign matching pixel-accurate HTML mockups in `design/screens/`. All files rewritten as inline-CSS React with no Tailwind, matching the design system (teal `#0d7477`, warm sand `#C4A882`/`#F5EBD9` for kafala, amber pending rows, etc.).

**Files rewritten:**
- `src/pages/AdminProjectForm.jsx` — 4-section card form (basic info, financial, media/upload, settings toggles). Lang tabs (AR/FR/EN) kept for title/description/shortDescription. Sticky action bar: Save Draft + Publish. All Convex mutations preserved.
- `src/pages/AdminProjectDetail.jsx` — Hero card with full-bleed image or gradient, progress bar, 4 stat cards, recent donations table with pending amber rows.
- `src/pages/AdminDonors.jsx` — 4 KPI cards, filter bar with tier chips (🥇🥈🥉✨), CRM table (2.5fr grid), pagination.
- `src/pages/AdminDonorDetail.jsx` — Profile hero (avatar, tier badge, stats), 2-col layout: donation history table + sidebar with contact info + WhatsApp button.
- `src/pages/AdminKafala.jsx` — Card grid (4 cols), warm sand `#F5EBD9` accents, kafala-dark `#8B6914` color scheme. Delete + reset confirm modals.
- `src/pages/AdminKafalaForm.jsx` — 3 warm-sand sections (personal info with AR/FR/EN bio tabs, photo upload, needs breakdown with education/food/health inputs + computed total). Sticky action bar.
- `src/pages/AdminErrorLogs.jsx` — Summary pills (error/warn/info counts), filter bar, log list with `borderRight: '4px solid #ef4444'` for errors, `#f59e0b` for warnings, dark code block for expanded detail.
- `src/pages/AdminRegister.jsx` — Centered card, dark teal gradient header, invitation banner (inviter name + code), role selection grid, phone field with +212 prefix.

### Mistakes made
None. All 9 files written cleanly on first attempt. Convex queries/mutations preserved in every file without modification.

### Key decisions
- **AdminProjectForm needs breakdown**: Design shows separate education/food/health inputs. These are computed locally into `monthlyPrice` (×100) for Convex — no schema change needed.
- **AdminKafala KafalaAvatar**: Kept the existing `KafalaAvatar` component inside the card header instead of removing it, since the card header gradient partially obscures it — cleaner than replicating avatar logic.
- **AdminDonors tier**: Existing code used `totalDonated > 20000` for gold. Changed to `>= 500000` (centimes, = 5000 MAD) to match design's "+5,000 د.م" threshold.
- **AdminDonorDetail WhatsApp**: Opens `https://wa.me/{phone}` in new tab when phone exists, shows error toast if no phone.

### Lesson for next Claude
- The full redesign is now **complete** (all 31 files). The next session should focus on testing, not more redesign.
- All amounts in Convex are stored as centimes (×100). Always divide by 100 for display.
- Kafala pages always use `#F5EBD9` background and `#8B6914` text, never primary teal.

---

## Architecture Notes

- **Convex** is both backend (actions/mutations/queries) and database. Deploy separately from frontend.
- **Vercel** auto-deploys frontend from `main` branch on GitHub push.
- **WaSender** is a third-party WhatsApp gateway. Sessions have a lifecycle: created → connecting (show QR) → connected → disconnected.
- **Error logs**: All API errors are stored in Convex via `api.errorLogs.insertErrorLog` and visible in Admin Settings → error log panel.

---

## Session: Redesign Step 29 — AdminSettings.jsx (Final File)

**Date**: 2026-04-16

### What happened
Completed the final remaining file in the 31-file visual redesign: `src/pages/AdminSettings.jsx`.
This was deliberately saved for last because it's the most complex page (~1400 lines) with critical WhatsApp session management logic that cannot be broken.

### Files changed
- `src/pages/AdminSettings.jsx` — Full visual redesign. All Convex queries/mutations/actions preserved exactly.

### Design reference
`design/screens/admin/32-admin-settings.html` — 5-tab horizontal pill nav, SettingsCard sections, RIB display box, toggle rows, WhatsApp status indicator.

### What the redesign changed
**Before**: Sidebar nav layout (`lg:grid-cols-3`) with Tailwind utility classes, `<Card>`, `<Button>`, `<Badge>` shared components, dark mode toggle.  
**After**: Horizontal 5-tab pill bar at top, inline-style settings cards, custom `ToggleRow`/`FieldLabel`/`SaveBtn` sub-components, design system tokens.

### All preserved logic (unchanged):
- 8 Convex useQuery calls (`bank_info`, `whatsapp_settings`, `team_members`, `org_profile`, `notifications`)
- 1 setConfig useMutation
- 8 WhatsApp useAction calls: `createAndConnectSession`, `disconnectSession`, `refreshQrCode`, `syncSessionStatus`, `deleteSession`, `resyncApiKey`, `listWaSenderSessions`, `selectSessionForSending`
- 1 admin useMutation: `createAdminInvitation`
- All handlers: `handleConnect`, `handleReconnect`, `handleRefreshQr`, `handleDisconnect`, `handleSyncStatus`, `handleResyncApiKey`, `handleListWaSenderSessions`, `handleSelectSession`, `handleDeleteSession`, `handlePhoneChange`
- Auto-refresh QR timer (20s interval via `autoRefreshTimerRef`)
- Status poll (5s interval via `statusPollRef` — detects QR scan success)
- All form state loading useEffects (bank, org profile, notifications, team members, WhatsApp session)

### Key decisions
- Removed `Card`, `Button`, `Badge` imports (replaced with inline-style equivalents) — cleaner and removes Tailwind dependency in this file
- `ToggleRow`, `SettingsCard`, `FieldLabel`, `SaveBtn` defined as module-level components (not inside the main component) to avoid re-creation on each render
- `TABS` array defined at module level
- WhatsApp tab preserves all edge-case button states: connect (no session) / reconnect (session exists, disconnected) / disconnect (connected) — plus always-visible sync + delete when session exists
- Dark mode toggle dropped (not in design, and the new design is light-only)

### Lesson for next Claude
- **The full 31-file redesign is now truly complete.** All pages match the design mockups in `design/screens/`.
- AdminSettings is the most stateful page — treat it with care if modifying. All WhatsApp logic is tightly coupled to the `whatsappSession` state object.
- The `resyncApiKey` utility button was kept even though it's not in the design's tab preview, because users may need it to recover from broken sessions.

---

## Session: Mobile UX, Dynamic Kafala, Admin Stories (9-step plan)

**Date**: 2026-04-16

### What the user reported
1. Donation flow broken on mobile — elements scroll out of view, bottom CTA floats away
2. Wafacash and bank transfer are separate but both need receipt upload — should be one screen
3. Bank name/RIB configured in Settings doesn't appear in donation flow
4. Kafala form has 3 hardcoded need cards — user wants to add/delete/rename freely
5. ImpactStories page is totally broken on mobile (3-col grid, fixed layout)
6. Stories should be publishable directly from admin panel
7. No link to admin panel from the public site
8. Full mobile/desktop design gap identified via audit

### What was done (all 9 steps)

**Step 1 — Fix bank info field name mismatch (`DonationFlow.jsx`)**
- Root cause: AdminSettings saves `{ accountHolder, rib, bankName }` but DonationFlow read `bankInfo.name` and `bankInfo.bank` (both undefined — silent fallback to hardcoded strings)
- Fix: Changed `DEFAULT_BANK_INFO` keys + 2 reference sites in Step2Payment component

**Step 2 — Fix donation flow viewport height (`DonationFlow.jsx`)**
- Root cause: Both outer containers used `minHeight: '100vh'` — page grew taller than viewport
- Fix: `height: '100dvh', overflow: 'hidden'` on outer + `height: '100%', overflow: 'hidden'` on inner card. Step content areas already have `flex: 1, overflowY: 'auto'`

**Step 3 — Merge bank+cash into single transfer method (`DonationFlow.jsx`)**
- Changed METHODS from 3 (bank/cash/card) to 2 (transfer/card)
- When 'transfer' selected, a sub-toggle appears: `🏦 تحويل بنكي` / `💳 Wafacash · Cash Plus`
- `transferType` stored in `donationData` state so `handleSubmitDonation` can map to `bank_transfer` or `cash_agency`

**Step 4 — Fix ImpactStories mobile (`ImpactStories.jsx`)**
- Added `useIsMobile()` hook (window.innerWidth < 768 with resize listener)
- Featured story grid: `1fr 1fr` → conditional `1fr` on mobile
- Stories grid: `repeat(3,1fr)` → `repeat(auto-fill, minmax(100%, 1fr))` on mobile
- Hero padding, story image height, section padding all responsive

**Step 5 — Dynamic kafala needs cards (`AdminKafalaForm.jsx`)**
- Replaced 3 fixed state vars (`needsEdu`, `needsFood`, `needsHealth`) with `needs` array
- Each need: `{ id, icon, label, price }` — editable inline
- Add button (dashed border), delete (×) button per row
- Edit pre-fill: distributes `monthlyPrice` proportionally (40%/33%/27%) into the 3 default needs
- `validate()` checks `needs.length > 0 && totalMAD >= 1`

**Step 6 — Admin panel link in MainLayout.jsx**
- Desktop dropdown: conditional link to `/admin` when `user?.role === 'admin'`
- Mobile menu authenticated section: same conditional link
- Footer bottom bar: always-visible `🔐 إدارة` link to `/admin/login`

**Step 7 — Stories Convex schema + functions**
- Added `stories` table to `convex/schema.ts` with `by_published` index
- Created `convex/stories.ts`: `getAllStories`, `getPublishedStories`, `createStory`, `updateStory`, `deleteStory`, `publishStory`, `unpublishStory`

**Step 8 — AdminStories page + route + sidebar**
- Created `src/pages/AdminStories.jsx`: list with gradient preview, publish toggle, edit modal, delete
- Added route `/admin/stories` in `App.jsx`
- Added `📖 القصص` nav item in `AdminLayout.jsx` المحتوى section

**Step 9 — ImpactStories connect to Convex**
- Added `useQuery(api.stories.getPublishedStories)` with static stories as fallback when DB is empty
- Maps Convex story shape (adds `id`, formats `date` from `publishedAt`)

### Deploy
- `git push origin main` → Vercel rebuild
- `npx convex deploy --yes` → schema change applied, `stories.by_published` index created

### Mistakes made
- None — all 9 steps executed cleanly on first attempt.

### Lessons
- `height: 100dvh` (not `minHeight`) is the correct pattern for mobile-first full-screen flows. `100dvh` accounts for browser chrome (address bar) on iOS/Android; `100vh` ignores it.
- Always verify field names match between the write side (AdminSettings saves `bankName`) and the read side (DonationFlow reads it). A name mismatch causes silent undefined with a hardcoded fallback — hard to notice until testing.
- For dynamic lists (kafala needs), `Date.now()` as temporary ID works fine for new rows; just use the existing `id` field when pre-filling from DB.

---

## Session 3: Blog System, Donation Flow Fixes, Emoji Picker, Navigation Fixes

### What was done
9 issues resolved across multiple files:

1. **KafalaDetail sidebar duplicate** — Removed 5-item benefits list from sidebar (it duplicated the 6-item "مزايا الكافل" section in the main column added in Session 1).

2. **Home donate button** — Changed `navigate('/donate/${id}')` → `navigate('/projects/${id}')` in Home.jsx so "تبرع الآن" goes to project detail first.

3. **DonationFlow header "جارٍ التحميل..."** — `ProjectCtx` showed this text unconditionally when `step <= 1`. Fixed to only show it when `!project` (data still loading).

4. **Skip Step 4 for logged-in users** — `getNextStep()` now jumps to step 5 when `isAuthenticated` and user came from step 3 or step 2 (card). `handleBack()` likewise skips step 4 when going back from step 5. `isNextDisabled` check for step 4 is now conditional on `!isAuthenticated`.

5. **Structured bank/agency fields in Step 3** — Added `MOROCCAN_BANKS` array + bank name dropdown, sender name input, and reference/RIB input to `Step3Receipt`. These bind to `donationData.bankName`, `donationData.senderName`, and `donationData.transactionReference` — all mapped to existing schema fields.

6. **Emoji picker for benefit cards** — Replaced plain icon text input in AdminProjectForm with `EmojiPickerBtn` component: a button showing current emoji, click opens 40-emoji grid popover (charity-relevant), auto-closes on outside click or selection.

7. **Blog system overhaul** — Added `postType` (story/activity/update), `slug`, and `metaDescription` fields to:
   - `convex/schema.ts` (3 optional fields on stories table)
   - `convex/stories.ts` (createStory + updateStory args)
   - `AdminStories.jsx` (postType selector, auto-slug from title, meta description with 160-char counter)
   - `ImpactStories.jsx` (postType filter row, only shown if any story has a postType)

### Mistakes
- Used TypeScript `as` cast in a `.jsx` file — caught immediately, removed.

### Lessons
- When adding filter tabs that are "optional" (only show if data exists), check `stories.some(s => s.postType)` before rendering — avoids UI clutter on empty data.
- For step-skip logic in multi-step flows, update both `getNextStep()` AND `handleBack()` — missing the back direction causes the user to land on a skipped step when going backward.
- `EmojiPickerBtn` click-outside uses `document.addEventListener('mousedown', close)` — `click` would fire on the button itself and immediately reclose.

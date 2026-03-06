# ibtasim Platform — Project Documentation for Claude

## Project Overview

**ibtasim** (ابتسم) is a Moroccan charitable donation platform built with:
- **Frontend**: React + Vite + Tailwind CSS, deployed on **Vercel** (auto-deploys from `main` branch)
- **Backend**: **Convex** (serverless database + actions + HTTP routes), deployed separately
- **Payments**: **Whop** (card payments in MAD)
- **WhatsApp notifications**: **WaSender** API

---

## Deploy Commands

Two separate deploys are always needed after code changes:

```bash
# Frontend (triggers Vercel auto-rebuild)
git add . && git commit -m "..." && git push origin main

# Convex backend (deploy separately — Vercel does NOT touch Convex)
cd d:/verde.ai/front-end-ibtasim-v3
npx convex deploy --yes
```

**Critical**: Always run `npx convex deploy --yes` after any change to `convex/` files. The `--yes` flag is required for non-interactive terminals.

---

## Convex Environment Variables

Set via `npx convex env set KEY value` or Convex Dashboard → Settings → Environment Variables.

| Variable | Format | Description |
|----------|--------|-------------|
| `WHOP_API_KEY` | `apik_xxx...` | Whop API key — needs `plan:create` and checkout session scopes |
| `WHOP_COMPANY_ID` | `biz_xxx` | Whop company ID — NOT the API key! Format starts with `biz_` |
| `WHOP_PRODUCT_ID` | `prod_xxx` | Optional — defaults to `prod_1khGq1pY0YRXM` (ibtasimm product) |
| `WHOP_WEBHOOK_SECRET` | `whsec_xxx` | Svix webhook secret for verifying payment webhooks |
| `WASENDER_MASTER_TOKEN` | `...` | WaSender master API token for WhatsApp |
| `CONVEX_SITE_URL` | `https://bold-lemming-266.eu-west-1.convex.site` | Convex HTTP actions base URL |
| `FRONTEND_URL` | `https://xxx.vercel.app` | Frontend URL — if set, Whop redirects here after payment |

**Common mistake**: `WHOP_COMPANY_ID` was accidentally set to the API key value (`apik_...`). Correct format is `biz_bMROFFVg1qyi39`.

---

## Whop Payment Flow

### Architecture

```
User clicks Pay → createWhopCheckout action → checkout session URL
→ User pays on Whop → Whop redirects to /donate/success
→ Convex HTTP handler verifies payment via Whop API
→ processWhopPayment mutation marks donation as verified
→ Redirect to FRONTEND_URL/donate/success (if set) or render inline HTML
```

### Key Whop API Endpoints (working with standard API keys)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `https://api.whop.com/api/v2/plans` | POST | Create a one-time payment plan for custom amounts |
| `https://api.whop.com/api/v2/checkout_sessions` | POST | Create checkout session → returns `purchase_url` |
| `https://api.whop.com/api/v2/payments/{id}` | GET | Look up payment details (has `metadata.donationId`) |

**Does NOT work with standard keys**: `/v2/checkout_configurations` (requires special enterprise scopes).

### Preset Plan IDs (created once, reused for common amounts)

| Amount (MAD) | Plan ID |
|-------------|---------|
| 200 | `plan_FX2nfOyGnmaCf` |
| 500 | `plan_KCTR7FdaRv4rv` |
| 1000 | `plan_6Ed3nRvJGJ8cO` |

Product ID: `prod_1khGq1pY0YRXM` | Company ID: `biz_bMROFFVg1qyi39`

For custom amounts: create a new hidden plan first, then create checkout session.

### Plan Creation Body (for custom amounts)

```json
{
  "company_id": "biz_xxx",
  "access_pass_id": "prod_xxx",
  "initial_price": 350,
  "base_currency": "mad",
  "plan_type": "one_time",
  "visibility": "hidden",
  "unlimited_stock": true
}
```

**Important**: `initial_price` is the **actual MAD amount** (e.g., `350`), NOT centimes (NOT `35000`).

### Checkout Session Body

```json
{
  "plan_id": "plan_xxx",
  "redirect_url": "https://convex.site/donate/success",
  "metadata": { "donationId": "j17abc123..." }
}
```

Response: `{ "purchase_url": "https://whop.com/checkout/plan_xxx/?session=ch_xxx" }`

### After Payment

Whop redirects to `redirect_url` with params: `payment_id`, `receipt_id`, `checkout_status`, `status`, `state_id`.

The `/donate/success` HTTP handler in `convex/http.ts`:
1. Reads `payment_id` from URL params
2. Calls `GET /api/v2/payments/{payment_id}` to get `metadata.donationId` and `final_amount`
3. Calls `processWhopPayment` mutation — idempotent, marks donation as verified
4. If `FRONTEND_URL` is set: redirects to `{FRONTEND_URL}/donate/success?paid=true&donationId=xxx&amount=xxx`
5. Otherwise: renders inline Arabic success/failure HTML page

---

## WhatsApp (WaSender) Integration

WaSender API base: `https://www.wasenderapi.com/api`
Auth: `Authorization: Bearer {WASENDER_MASTER_TOKEN}`

### Session Lifecycle

1. **Create session**: `POST /sessions` with `{ id: phoneNumber }`
2. **Connect**: `POST /sessions/{id}/connect` → returns QR code (raw pairing string OR base64 PNG)
3. **Scan QR** with WhatsApp app → session becomes "connected"
4. **Disconnect**: `DELETE /sessions/{id}/connect`

### QR Code Normalization

WaSender can return two QR formats — handled by `normalizeQrCode()` in `convex/whatsapp.ts`:
- **Raw pairing string** (e.g., `2@DfzdT...`): pass to `api.qrserver.com?data=...` to generate QR image
- **Base64 PNG** (no prefix): prepend `data:image/png;base64,` → use as `<img src=...>`

### Key Bug Fixed

`createAndConnectSession` had check `if (!sessionId || !apiKey)`. WaSender doesn't always return `api_key` in the response. Since `apiKey` is never used in subsequent calls (all calls use `masterToken`), changed to `if (!sessionId)`.

### Webhook

`POST /whatsapp-webhook` in `convex/http.ts` listens for `connection.update` events to auto-mark WhatsApp as connected in config.

---

## Donation Status Flow

```
pending → awaiting_receipt (bank transfer uploads receipt)
        → awaiting_verification (receipt uploaded, admin reviews)
        → verified / rejected (admin or auto via Whop)

pending → verified (card_whop payment — auto-verified via processWhopPayment)
```

### Donation Verification

- **Card payments (Whop)**: Auto-verified by `/donate/success` HTTP handler calling `processWhopPayment` mutation
- **Bank transfers**: Admin manually verifies in Admin → Verifications panel
- **Both paths**: Update `project.raisedAmount`, `user.totalDonated`, `user.donationCount`, insert `verificationLogs` entry, schedule WhatsApp notification

---

## Key Files

| File | Purpose |
|------|---------|
| `convex/payments.ts` | Whop checkout: create plan + checkout session, return `purchase_url` |
| `convex/donations.ts` | Donation CRUD: `createDonation`, `processWhopPayment`, `verifyDonation` |
| `convex/http.ts` | HTTP routes: `/webhooks/whop`, `/donate/success`, `/whatsapp-webhook`, `/storage/` |
| `convex/whatsapp.ts` | WaSender integration: session create/connect/disconnect, QR normalization |
| `convex/notifications.ts` | WhatsApp message sending via WaSender after donation verified |
| `convex/schema.ts` | Database schema: donations, users, projects, admins, verificationLogs, errorLogs |
| `src/App.jsx` | React router — all routes including `/donate/success` |
| `src/pages/DonationFlow.jsx` | Multi-step donation form: amount → payment method → user info → checkout |
| `src/pages/DonateSuccess.jsx` | React success page (shown when FRONTEND_URL redirect is used) |
| `src/pages/AdminSettings.jsx` | Admin panel for WhatsApp config, system health, error logs |
| `JOURNEY.md` | Decision log documenting bugs found and why specific approaches were chosen |

---

## Error Logs

All backend errors are stored in Convex `errorLogs` table via `api.errorLogs.insertErrorLog`.
View in: Admin panel → Error Logs (`/admin/error-logs`).

---

## Common Gotchas

1. **Two deploys needed**: Frontend (git push) + Backend (`npx convex deploy --yes`) are separate
2. **Whop `initial_price`**: Use actual MAD amount, NOT centimes (5 not 500)
3. **`WHOP_COMPANY_ID` format**: Must start with `biz_`, not `apik_`
4. **`/v2/checkout_configurations` is blocked**: Use `/api/v2/checkout_sessions` instead
5. **QR code expires**: ~30–60 seconds after generation; use Reconnect button if expired
6. **WaSender `api_key`** may not be returned; don't require it for session creation
7. **`FRONTEND_URL` not set** = Whop redirects to Convex URL showing inline HTML (no React)

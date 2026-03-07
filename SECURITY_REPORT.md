# Security Audit Report — ibtasim Platform

**Date:** 2026-03-07
**Scope:** Full backend (`convex/`) + frontend (`src/`) audit
**Platform:** React + Convex, handling real payments (Whop/MAD) and personal donor data

---

## Executive Summary

The platform has **2 critical**, **5 high**, **5 medium**, and **3 low** severity findings. The most urgent issues are missing authorization checks on admin operations — any authenticated user can currently verify their own donation without paying, delete projects, or read all donor contact information.

---

## CRITICAL

### C1 — Any user can verify their own donation without paying
**File:** `convex/donations.ts:302-406`
**Functions:** `verifyDonation`, `rejectDonation`

These mutations accept an optional `adminId` from the client but never verify the caller is actually an admin. Any user can call `verifyDonation({ donationId: theirOwnDonation, verified: true })` from the browser.

**Impact:** Fraudulent donations get marked as verified, raising the project total, without any payment being made.

**Fix:**
```typescript
handler: async (ctx, args) => {
  // Add at the top of every admin mutation:
  const admin = await ctx.db.query("admins")
    .withIndex("by_email", ...)
    .first();
  if (!admin) throw new Error("Unauthorized");
```

---

### C2 — Any user can create/delete/publish projects
**File:** `convex/projects.ts:190-447`
**Functions:** `createProject`, `updateProject`, `deleteProject`, `publishProject`, `updateFeaturedOrder`

No authorization checks. The `createdBy` admin ID is accepted from the client as-is.

**Impact:** Any user can create fake fundraising projects, delete legitimate ones, or publish projects to broadcast notifications to all users.

**Fix:** Same pattern as C1 — verify caller is an admin before proceeding.

---

## HIGH

### H1 — All admin dashboard data is public
**File:** `convex/admin.ts:10-276`
**Functions:** `getDashboardStats`, `getDonors`, `getDonorById`, `getVerifications`

No access control. Anyone can call these queries from the browser.

**Impact:** Exposes all donor full names, phone numbers, email addresses, and donation history to any internet user who discovers the Convex API endpoint.

**Fix:** Check admin session before returning data.

---

### H2 — IDOR: any user can read any other user's donations
**File:** `convex/donations.ts:9-138`
**Functions:** `getDonationsByUser`, `getDonationById`

`getDonationsByUser({ userId: "someone_elses_id" })` returns all their donations including personal messages and receipt URLs.

**Impact:** Privacy violation. Donors' giving patterns and personal notes are exposed.

**Fix:** Verify `ctx.auth` matches the requested `userId`, or restrict to admin-only.

---

### H3 — Config including WhatsApp API keys readable by anyone
**File:** `convex/config.ts:8-27`
**Functions:** `getConfig`, `getAllConfig`

No auth check. Any caller can do `getConfig({ key: "whatsapp_settings" })` and receive the WaSender session API key and instance ID.

**Impact:** Attacker can use the API key to send WhatsApp messages as your organization.

**Fix:** For sensitive config keys (`whatsapp_settings`, `bank_info`), verify admin session.

---

### H4 — WaSender webhook auth is optional
**File:** `convex/http.ts:119-170`

`WASENDER_WEBHOOK_SECRET` is only checked if it is set in env vars. If not configured, any HTTP POST to `/whatsapp-webhook` is accepted.

**Impact:** Attacker sends fake `connection.update` event → WhatsApp session marked as connected in the admin panel without actually being connected.

**Fix:** Make the webhook secret **required**, not optional. Reject requests if the env var is not configured.

---

### H5 — No donation amount validation
**File:** `convex/donations.ts:236-278`
**Function:** `createDonation`

`amount: v.number()` has no minimum or maximum constraint. A user can create a donation of 0, -1, or 999,999,999 MAD.

**Impact:** Data integrity issues, inflated project totals.

**Fix:**
```typescript
amount: v.number(), // Add validation in handler:
if (args.amount < 1 || args.amount > 999999) throw new Error("Invalid amount");
```

---

## MEDIUM

### M1 — Whop webhook replay attack possible
**File:** `convex/http.ts:38-115`

The Svix `svix-timestamp` header is passed through to signature verification but never checked for freshness. An attacker who captures a valid `payment.succeeded` webhook can replay it hours later.

**Impact:** A donor's payment could trigger multiple `processWhopPayment` calls (though that function is idempotent, so this has limited real impact currently).

**Fix:** After verifying the signature, check that `svixTimestamp` is within 5 minutes of `Date.now()`.

---

### M2 — Svix signature strip is fragile
**File:** `convex/http.ts:30`

```typescript
const actual = signatureHeader.replace(/^v1,/, "");
```

If `signatureHeader` is `"v1,"` (empty signature), `actual` becomes `""`. The comparison `"" === expected` fails, which is correct — but there is no explicit check for an empty actual signature, leaving the logic fragile to format changes.

**Fix:** Validate that `actual.length > 0` before comparing.

---

### M3 — Phone number validation too lenient
**File:** `convex/notifications.ts:33-43`

`formatPhoneNumber()` only strips spaces and adds a `+` prefix. It accepts `"+abc"` or `"+"` as valid numbers.

**Fix:** Validate against E.164 regex: `/^\+[1-9]\d{7,14}$/`

---

### M4 — No rate limiting on donation creation
**File:** `convex/donations.ts:236-278`

OTP has rate limiting (3/hour) but `createDonation` has none. An attacker can create thousands of pending donations under any user ID.

**Fix:** Add a per-user rate limit (e.g., max 10 donations per hour in pending status).

---

### M5 — API error responses stored in database
**File:** `convex/http.ts:109-187`, `convex/payments.ts`

Full Whop API responses (including internal error details) are stored in `errorLogs` and logged to console. These may contain internal identifiers or token hints.

**Fix:** Sanitize error responses before storing — keep error type and status code, truncate message bodies.

---

## LOW

### L1 — Hardcoded fallback product ID
**File:** `convex/payments.ts:57`

```typescript
const productId = process.env.WHOP_PRODUCT_ID ?? "prod_1khGq1pY0YRXM";
```

If the env var is missing, the code silently uses a hardcoded ID. This should fail loudly in production.

**Fix:** `if (!productId) throw new Error("WHOP_PRODUCT_ID not configured");`

---

### L2 — No audit trail for admin operations
Multiple files

The `activities` table exists in the schema but is never written to. There is no record of which admin verified a donation, deleted a project, or changed settings.

**Fix:** Insert an `activities` record in every admin mutation (donation verification, project publish, settings change).

---

### L3 — Legacy plaintext password comparison
**File:** `convex/auth.ts:28-30`

```typescript
// Legacy: plaintext comparison (for accounts before hashing was added)
return password === stored;
```

Any account with a plaintext password (created before PBKDF2 was added) is vulnerable to database read attacks.

**Fix:** On successful legacy login, immediately re-hash and store the password with PBKDF2.

---

## Summary Table

| ID | Severity | File | Issue |
|----|----------|------|-------|
| C1 | Critical | donations.ts | verifyDonation has no auth check |
| C2 | Critical | projects.ts | createProject/deleteProject have no auth check |
| H1 | High | admin.ts | All admin queries are public |
| H2 | High | donations.ts | IDOR on getDonationsByUser |
| H3 | High | config.ts | WhatsApp API keys readable by anyone |
| H4 | High | http.ts | WaSender webhook secret is optional |
| H5 | High | donations.ts | No donation amount validation |
| M1 | Medium | http.ts | Webhook timestamp not checked (replay risk) |
| M2 | Medium | http.ts | Svix signature strip fragile |
| M3 | Medium | notifications.ts | Phone number not E.164 validated |
| M4 | Medium | donations.ts | No rate limit on donation creation |
| M5 | Medium | http.ts | Full API errors stored in DB |
| L1 | Low | payments.ts | Hardcoded fallback product ID |
| L2 | Low | N/A | No audit trail for admin operations |
| L3 | Low | auth.ts | Legacy plaintext password comparison |

---

## Recommended Fix Order

**Week 1 (before real traffic):**
1. Add `ctx.auth` / admin session checks to all mutations in `projects.ts` and `donations.ts`
2. Add auth checks to `admin.ts` queries (H1)
3. Set `WASENDER_WEBHOOK_SECRET` as required in `http.ts` (H4)
4. Add amount validation in `createDonation` (H5)

**Week 2:**
5. Fix IDOR on donation queries (H2)
6. Protect sensitive config keys (H3)
7. Add webhook timestamp validation (M1)
8. Add E.164 phone validation (M3)

**Later:**
9. Add audit trail (L2)
10. Fix legacy password path (L3)

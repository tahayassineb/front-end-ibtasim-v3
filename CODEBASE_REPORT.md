# Codebase Quality Report — ibtasim Platform

**Date:** 2026-03-07
**Stack:** React 19 + Convex 1.31 + Tailwind CSS 3, deployed on Vercel + Convex Cloud

---

## Overall Grades

| Category | Grade | Note |
|----------|-------|------|
| Architecture | B+ | Clean Convex/React split, good separation of concerns |
| Data model | B | Good indexes, but full-table scans on admin load |
| Code organization | B- | 9 of 20 pages exceed 500 lines; logic mixed with UI |
| Type safety | C | Frontend is plain JSX — no TypeScript, no prop checking |
| Error handling | B | Centralized error logs, but some silent `.catch(() => {})` |
| Testing | F | Zero test files anywhere in the project |
| Performance | D | Admin dashboard loads all donations into RAM on every page open |
| Scalability | D | Estimated hard limit: ~5,000 donations, ~200 concurrent users |
| Security | C | See SECURITY_REPORT.md for full findings |
| Documentation | B | JOURNEY.md, CLAUDE.md, SECURITY_REPORT.md now exist |

---

## What's Good

### Architecture
- **Convex reactive queries** — UI updates in real-time without manual polling or WebSocket management
- **Clean frontend/backend separation** — no business logic leaked into React components via raw fetch calls
- **Two-deployment model** documented clearly — Vercel (frontend) and Convex (backend) are independent
- **HTTP routes in Convex** — clean handling of Whop payment redirect and WaSender webhook

### Data Model (`convex/schema.ts`)
- **12 well-structured tables** with relationships: users → donations → projects → verificationLogs
- **Multilingual support built into schema** — `title: { ar, fr, en }` on projects and notifications
- **Good index coverage** for common access patterns:
  - `users.by_phone`, `users.by_email`
  - `donations.by_user`, `donations.by_project`, `donations.by_status`
  - `projects.by_status`, `projects.by_category`
- **Audit table exists** (`activities`) — not yet used, but the foundation is there

### Authentication
- **PBKDF2 with 100,000 iterations** — industry-standard password hashing using Web Crypto API
- **OTP system with rate limiting** — 3 attempts/hour, 1-minute cooldown, 10-minute expiry
- **Separate admin and user auth** — admins have their own table and login path

### Payments
- **Whop integration** handles custom amounts and preset plans correctly
- **Idempotent `processWhopPayment`** — safe to call multiple times for the same payment
- **Svix webhook signature verification** — cryptographically validates Whop events

### Other
- **Centralized error logging** to `errorLogs` table — visible in admin panel
- **WaSender retry logic** — exponential backoff on 429 rate limiting
- **JOURNEY.md and CLAUDE.md** — good institutional knowledge capture

---

## What's Bad

### 1. Admin dashboard loads ALL donations into memory (critical performance issue)

**File:** `convex/admin.ts:27`
```typescript
const donations = await ctx.db.query("donations").collect();
```

This loads every donation record into server memory on every admin dashboard load. With 5,000 donations, each record ~500 bytes = 2.5 MB per request. Convex actions have memory limits. With 10,000 donations this will start timing out.

**Fix:** Use indexed pagination + pre-computed stats:
```typescript
// Pre-compute stats in a cron job, store in config table
// Dashboard reads from config, not from live donation scan
```

---

### 2. DonationFlow.jsx is 1,660 lines — one file does everything

The entire multi-step donation flow (6 steps: auth, amount, payment method, bank receipt, confirmation, Whop redirect) is in one file with 20+ state variables and 10+ Convex hook calls.

**Problems:**
- Impossible to test individual steps
- Every re-render of step 1 re-renders step 6
- Hard to find and fix bugs

**Fix:** Extract each step into its own component:
- `DonationStep1_Auth.jsx`
- `DonationStep2_Amount.jsx`
- etc.

---

### 3. Zero tests

No Jest, no Vitest, no Convex test helpers. The entire codebase — 14 backend files and 20 frontend pages — is untested.

**Risk:** Any refactoring can break existing features with no safety net. This is the single most dangerous technical debt.

**Fix:** Start with Convex backend tests (highest ROI):
```typescript
// convex/tests/donations.test.ts
import { convexTest } from "convex-test";
// Test processWhopPayment idempotency
// Test verifyDonation authorization
// Test OTP rate limiting
```

---

### 4. Frontend is plain JSX, not TypeScript

All 20 pages and 15 components use `.jsx` not `.tsx`. There is no compile-time checking of:
- Convex query result types
- Component prop types
- Function argument types

**Risk:** Silent type errors (like passing the wrong ID type) only surface at runtime.

**Fix:** Migrate page by page to `.tsx`. Start with the most complex files (`DonationFlow.jsx`, `AdminSettings.jsx`).

---

### 5. Amount units were inconsistent across the codebase

Multiple display files had `amount / 100` assuming amounts are stored in centimes, but amounts are stored in MAD. This caused 5 MAD to display as 0.05 MAD in several places.

**Fixed in this session:** `AdminDashboard.jsx`, `AdminDonations.jsx`, `AdminDonorDetail.jsx`, `AdminProjectDetail.jsx`, `UserProfile.jsx`.

**Prevention:** Add a TypeScript type alias `type AmountMAD = number` and document the convention clearly in CLAUDE.md.

---

### 6. N+1 queries in verification panel

`getPendingVerifications` in `donations.ts` loads 50 donations, then for each one calls `ctx.db.get(d.userId)` and `ctx.db.get(d.projectId)` individually. That's up to 150 database reads for 50 donations.

**Fix:** Use a single join-like query pattern or batch the lookups.

---

### 7. Silent error catches in payments

**File:** `convex/payments.ts`
```typescript
}).catch(() => {}); // Silently ignores mutation failure
```

If `processWhopPayment` fails after a checkout session is created, the error is swallowed. The payment went through on Whop but the donation is never marked as verified.

**Fix:** Log the error to `errorLogs` and surface it to the admin.

---

## Scalability Assessment

### Current Limits

| Resource | Current limit | Why |
|----------|--------------|-----|
| Concurrent users | ~200 | 15 queries per page × 200 users = 3,000 req/sec (hits Convex limit) |
| Donation records | ~5,000 | `getDashboardStats()` full scan OOM above this |
| WhatsApp broadcast | ~240/min | WaSender rate limit (now using random 2-30s delay = ~60/hr) |

**OOM = Out Of Memory.** The server tries to load all records into RAM at once and runs out of space. The server then crashes or times out.

### To handle 1,000+ concurrent users

1. **Replace full table scans** with pre-computed stats stored in `config` table, updated by a Convex cron every 5 minutes
2. **Add React Query or SWR** for client-side caching — prevents re-fetching the same data on every navigation
3. **Split DonationFlow into components** — reduces unnecessary re-renders

### To handle 10,000+ donations

1. Pre-computed stats (as above) — the only blocking fix
2. Paginate all admin lists (most already have `take(50)` — good)
3. Add composite indexes: `(userId, createdAt)`, `(projectId, status)`

### To handle high WhatsApp volume

The random 2-30s delay between messages (added this session) is better for deliverability but limits throughput to ~60-120 messages/hour. For real broadcast volume (1000+ users), a proper message queue (like Convex scheduled actions with per-message scheduling) is needed.

---

## Priority Roadmap

### Week 1 — Critical fixes (blocking for any real traffic)
1. Add admin auth checks to all mutations (see SECURITY_REPORT.md C1, C2)
2. Fix `getDashboardStats` full table scan → pre-computed stats
3. Add at least 5 backend tests for the most critical paths

### Week 2-3 — High impact improvements
4. Extract DonationFlow into 6 sub-components
5. Add TypeScript to the 5 most complex pages
6. Add React Query caching for project and donation lists
7. Fix IDOR on donation queries (see SECURITY_REPORT.md H2)

### Month 2 — Professional quality
8. Full TypeScript migration of frontend
9. 80%+ test coverage on backend
10. Pre-computed dashboard stats via Convex cron
11. Sentry or similar for production error monitoring
12. Audit trail: write to `activities` table on all admin actions

---

## Files Reference

| File | Lines | Complexity | Priority to refactor |
|------|-------|-----------|---------------------|
| `src/pages/DonationFlow.jsx` | 1,660 | Very High | High |
| `src/pages/AdminSettings.jsx` | 1,264 | High | Medium |
| `src/pages/AdminProjectForm.jsx` | 1,110 | High | Medium |
| `convex/admin.ts` | 543 | Medium | High (full scan fix) |
| `convex/donations.ts` | 534 | Medium | High (auth + tests) |
| `convex/notifications.ts` | 532 | Medium | Low (working well) |
| `convex/whatsapp.ts` | 515 | Medium | Low (working well) |
| `convex/projects.ts` | 446 | Medium | High (auth fix) |

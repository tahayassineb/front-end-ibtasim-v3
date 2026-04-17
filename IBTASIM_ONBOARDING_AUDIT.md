# Ibtasim Onboarding Audit

## Scope

This audit covers `D:\verde.ai\front-end-ibtasim-v3` only.
The `association-espoir` folder is intentionally excluded.
When code and docs disagree, code is treated as the operational truth.

## Product Overview

Ibtasim is a charity platform with two main donation models:

- **Project donations**: donors contribute to fundraising campaigns such as water, food, or infrastructure projects.
- **Kafala sponsorship**: donors sponsor an orphan on a recurring or renewable basis, with a dedicated sponsorship flow separate from normal project donations.

### Target users

- Public donors browsing campaigns and making one-time contributions.
- Sponsors selecting and renewing orphan sponsorships.
- Authenticated users managing their profile and donation history.
- Admins operating the back office for projects, donations, sponsorships, verifications, settings, and logs.

### Core business idea

The application combines a donor-facing public website with an admin back office, backed by Convex. The public experience is focused on fundraising and sponsorship conversion. The admin side is responsible for campaign management, payment verification, donor management, settings, and operational monitoring.

### Important product distinction

Project donations and kafala sponsorships are not just two UI entry points into the same backend model:

- Project donations are tied to `projects` and recorded through `donations` and `payments`.
- Kafala is modeled separately through `kafala`, `kafalaSponsorship`, and `kafalaDonations`.

That separation matters for onboarding because the codebase duplicates some payment and workflow concepts across both domains rather than abstracting them behind one common transaction model.

## Architecture Map

## Frontend shell and routing

The route source of truth is `src/App.jsx`.

### Public routes

Public pages include:

- Home
- Projects list
- Project detail
- Impact page
- Login and register
- Donation flow and donation success
- Kafala list/detail/flow/renewal pages
- User profile

### Admin routes

Admin pages include:

- Dashboard
- Projects list/detail/form
- Donations and verifications
- Donors
- Kafala management
- Settings
- Error logs

### Route guard model

The admin route protection in `src/App.jsx:126` is a client-side role check:

- If `user?.role !== 'admin'`, the app redirects.

This is not a security boundary. It is only a frontend access convenience. Backend functions need their own authorization checks and, in several important cases, they do not have them.

## Backend structure

The backend is Convex-based. The schema baseline is `convex/schema.ts`.

### Main modules

- `convex/auth.ts`: login/register/account flows
- `convex/projects.ts`: project CRUD and listing logic
- `convex/donations.ts`: donation creation, verification, and donation-related admin workflows
- `convex/kafala.ts`: orphan sponsorship and kafala donation logic
- `convex/payments.ts`: payment integration logic
- `convex/http.ts`: HTTP endpoints, redirects, payment callback/success handling
- `convex/config.ts`: runtime settings/config storage
- `convex/admin.ts`: admin bootstrap, invitations, verification queries, admin utility flows
- `convex/storage.ts`: file upload/storage helpers
- `convex/whatsapp.ts`: WhatsApp integration/session handling

## HTTP and external entrypoints

`convex/http.ts` is the main non-React integration surface. It is the first place a new developer should inspect for:

- payment callback handling
- success/failure redirect flows
- HTML fallback rendering
- webhook-like request handling

Other important integration surfaces:

- `convex/storage.ts` for file uploads
- `convex/whatsapp.ts` for messaging integration
- `convex/config.ts` for operational settings and secrets-like values

## Configuration and notifications

The application stores a significant amount of operational configuration in Convex, not in a strongly separated server-only config layer. That makes config handling easy to wire into the admin UI, but it also creates risk when sensitive values are returned from general-purpose queries.

## Data Model Map

The schema source of truth is `convex/schema.ts`.

### Core tables

- `users`: public/authenticated user accounts
- `admins`: admin accounts and admin metadata
- `projects`: fundraising campaigns
- `donations`: project-linked donation records
- `payments`: payment records and payment state tracking
- `kafala`: orphan sponsorship entities
- `kafalaSponsorship`: active sponsorship relationships
- `kafalaDonations`: donation/payment records for kafala flows
- `config`: application settings and operational configuration
- `errorLogs`: captured app/admin/backend errors
- `verificationLogs`: payment verification audit trail
- admin invitation tables used for admin onboarding/bootstrap

### Entity relationships

- A public donor can create a `donation` tied to a `project`.
- A `payment` is used to track the payment attempt/status for donation flows.
- Kafala records use a separate sponsorship path rather than reusing the `projects` table.
- Admin workflows query and mutate multiple operational tables directly, especially for verifications and settings.

### Money units

A key onboarding trap is money handling.

Parts of the backend schema and logic imply or document that amounts are stored in cents. Parts of the frontend pass and display raw values without a consistent conversion rule. This mismatch is operationally important because:

- admin reporting may divide by 100
- public pages may display raw values directly
- donation creation may submit amounts without normalizing to cents first

This is one of the highest-priority logic issues in the codebase because it can affect reporting, display accuracy, and payment reconciliation.

### Status workflows

The codebase relies on status-driven workflows for:

- donation verification
- payment completion/failure
- sponsorship state
- admin approval or admin invitation flows

Those statuses are spread across multiple modules rather than defined in one central workflow map, so a new developer needs to trace behavior through both schema and mutation code rather than trusting a single reference document.

## Frontend to backend mapping

Important page-to-domain mappings:

- `src/pages/ProjectsList.jsx` and `src/pages/ProjectDetail.jsx` map to `projects`
- `src/pages/DonationFlow.jsx` maps to `donations`, `payments`, and verification/payment handling
- `src/pages/KafalaFlow.jsx` maps to `kafala`, `kafalaSponsorship`, and `kafalaDonations`
- admin project pages map to `projects`
- admin donation and verification pages map to `donations`, `payments`, and verification logs
- admin settings maps into `config` and related operational settings

## Frontend and Design System Review

## Documented design system

The intended design system is described across:

- `DESIGN_SYSTEM.md`
- `tailwind.config.js`
- `src/index.css`
- the `design/` directory mockups and static prototypes

The documented direction is coherent:

- teal/green identity for the public fundraising experience
- warmer gold/sand tones for kafala
- a denser admin back-office visual language
- explicit typography, spacing, color, and component guidance

## Actual implementation reality

The implemented frontend only partially follows that system.

### What is consistent

- The overall product intent is recognizable in the UI.
- There is a reusable component layer under `src/components`.
- Tailwind and shared CSS tokens exist.
- The mockups and docs broadly match the brand direction.

### What is inconsistent

- Styling is heavily driven by inline styles instead of shared primitives.
- The codebase contains very high `style={{...}}` usage across JSX.
- Layout logic is duplicated between pages and layout components.
- Some reusable components do not fully encode the design rules described in the docs.

This means the repo has a documented design system, but not a reliably enforced one.

## Layout and component layer

Primary layout components:

- `src/components/MainLayout.jsx`
- `src/components/AdminLayout.jsx`

Reusable UI primitives include:

- `src/components/Button.jsx`
- `src/components/Input.jsx`
- other shared form and editor components

In practice, many pages bypass these primitives or layer additional inline styles on top of them. That reduces consistency and makes future redesigns more expensive than the component structure suggests.

## RTL and i18n model

The application visually assumes RTL and Arabic in many places. That matches the target audience, but the implementation is only partially generalized:

- several layouts and pages hardcode RTL assumptions
- FR/EN support is structurally incomplete
- locale-aware formatting and layout behavior are not centralized enough

This is an onboarding trap for any developer who assumes the app already has a clean multilingual foundation.

## Major frontend consistency issues

- Dead or placeholder links still exist, including social links in `src/components/MainLayout.jsx:268`.
- Form labeling/accessibility is incomplete, including label wiring in `src/components/Input.jsx:112`.
- Shared button styling in `src/components/Button.jsx` does not cleanly enforce the documented token model.
- Rich inline styling makes component behavior and visual behavior drift apart.
- Design docs and the running route structure are not fully synchronized.

## Risk Register

Severity order below is intentional: security boundary issues first, then data integrity and logic risks, then runtime/frontend quality, then maintainability and onboarding gaps.

## P0: Security boundary failures

### 1. Backend authorization is not a real security boundary

The frontend checks admin access in `src/App.jsx:126`, but Convex functions in operational modules are not consistently protected by backend authorization checks.

Files to inspect first:

- `convex/config.ts`
- `convex/admin.ts`
- `convex/donations.ts`
- `convex/kafala.ts`

Why this matters:

- A client-side role gate does not protect direct mutation/query access.
- Sensitive reads and privileged writes must be enforced server-side.

### 2. Sensitive WhatsApp/session configuration is exposed

`convex/whatsapp.ts` stores and returns session data including API-key-like values, and `convex/config.ts` exposes configuration through general query access patterns.

High-risk references:

- `convex/whatsapp.ts:45`
- `convex/whatsapp.ts:577`
- `convex/config.ts:8`

Why this matters:

- Secrets or session material should not be broadly retrievable.
- This increases the risk of account takeover or third-party service abuse.

### 3. Admin bootstrap and invitation paths are overly exposed

High-risk references:

- `convex/admin.ts:308`
- `convex/admin.ts:355`
- `convex/admin.ts:413`
- `convex/admin.ts:479`

Why this matters:

- Admin creation/bootstrap should be tightly controlled.
- Publicly reachable bootstrap flows are dangerous even if they are only intended for first-run setup.

## P1: Data integrity and business logic risks

### 4. Money-unit handling is inconsistent

High-risk references:

- `src/pages/DonationFlow.jsx:830`
- `src/pages/DonationFlow.jsx:858`
- `src/pages/Home.jsx:210`
- `src/pages/Home.jsx:218`
- `src/pages/ProjectsList.jsx:304`
- `src/pages/ProjectsList.jsx:312`
- `convex/schema.ts`

Observed pattern:

- donation creation sends values from the UI without a single enforced cents conversion rule
- public pages display amounts differently from some admin/reporting logic

Impact:

- wrong displayed totals
- inconsistent reporting
- reconciliation and analytics errors

### 5. Payment and sponsorship updates appear weakly idempotent

Relevant modules:

- `convex/donations.ts`
- `convex/kafala.ts`
- `convex/http.ts`

Why this matters:

- payment callbacks and verification flows are exposed to retries, duplicate submissions, and race conditions
- sponsorship/donation state can be double-applied without a clear central idempotency model

### 6. Admin project form edits fields that are not clearly persisted

High-risk references:

- `src/pages/AdminProjectForm.jsx:102`
- `src/pages/AdminProjectForm.jsx:118`
- `src/pages/AdminProjectForm.jsx:366`
- `convex/projects.ts`

Observed pattern:

- the admin form edits fields such as `shortDescription` and other display-oriented values
- the backend project contract does not clearly persist the same set of fields

Impact:

- admins believe they saved content that may not survive persistence
- UI and backend contract drift

### 7. Verification logic is inconsistent across payment methods

High-risk references:

- `convex/admin.ts:212`
- `convex/admin.ts:243`
- `convex/donations.ts`

Observed pattern:

- admin verification queries filter `bank_transfer`
- donation logic also supports other methods such as `cash_agency`

Impact:

- operational blind spots in verification tooling
- missed or mishandled payments

### 8. HTML fallback rendering appears to reflect request-derived values

High-risk reference:

- `convex/http.ts:451`

Why this matters:

- if reflected values are not sanitized, the fallback HTML response path can become an injection surface

## P2: Runtime and frontend quality risks

### 9. App startup can fail on malformed local storage

High-risk references:

- `src/context/AppContext.jsx:193`
- `src/context/AppContext.jsx:203`
- `src/context/AppContext.jsx:219`

Observed pattern:

- stored JSON is parsed without robust guards

Impact:

- a bad localStorage value can break startup or state restoration

### 10. Lint output indicates structural React/runtime issues

Representative references:

- `src/components/AdminLayout.jsx:84`
- `src/components/RichTextEditor.jsx:47`
- `src/pages/ProjectDetail.jsx:66`
- `src/pages/AdminProjectDetail.jsx:91`

Impact:

- component purity issues
- unstable runtime values
- maintainability cost and harder debugging

### 11. Accessibility and navigation quality are incomplete

Representative references:

- `src/components/MainLayout.jsx:268`
- `src/components/Input.jsx:112`

Impact:

- reduced usability
- inconsistent keyboard/screen-reader behavior
- unfinished or placeholder UI elements in production-facing code

## P3: Maintainability and onboarding risks

### 12. Docs are useful but not fully current

Relevant docs:

- `WEBSITE_ARCHITECTURE.md`
- `BACKEND_ARCHITECTURE.md`
- `DESIGN_SYSTEM.md`
- `JOURNEY.md`
- `CLAUDE.md`

Observed pattern:

- the docs explain intent well
- route structure, persistence details, and operational behavior have drifted from parts of the documentation

Result:

- new developers can get oriented from docs, but should not trust them without verifying the implementation

### 13. Naming and structure create unnecessary cognitive load

Observed pattern:

- branding, package naming, and operational terminology are not consistently normalized across the repo
- project donations and kafala flows share patterns but are modeled separately

Result:

- the mental model takes longer to build
- new contributors can misread duplicated concepts as shared infrastructure

### 14. There is no visible automated test safety net

Observed pattern:

- `package.json` exposes `build`, `lint`, `dev`, and `preview`
- there is no visible test script in the application package

Result:

- critical flows rely heavily on manual verification
- payment/admin regressions are easier to ship unnoticed

## Code vs Doc Mismatches

These are the most important mismatches for onboarding:

- Route truth is `src/App.jsx`, not the architecture docs.
- Schema truth is `convex/schema.ts`, not older descriptions of entities.
- The design system is better documented than enforced.
- Admin authorization assumptions are stronger in the UI than in the backend.
- Amount/currency handling is described and used inconsistently across pages and backend logic.

## Validation

Repository health checks for `D:\verde.ai\front-end-ibtasim-v3`:

- `npm run build`: passed
- `npm run lint`: failed with 73 issues
- automated tests: no visible test script in `package.json`

What that means operationally:

- the app is buildable
- the codebase is not currently lint-clean
- there is no obvious automated coverage protecting payment, auth, admin, or sponsorship flows

## Developer Onboarding Order

This is the recommended reading order for a new developer joining the project.

### 1. Read the route map first

Start with:

- `src/App.jsx`

Goal:

- understand the actual surface area of the app
- separate public donor flows from admin flows

### 2. Read the schema second

Then read:

- `convex/schema.ts`

Goal:

- build the real domain model before reading implementation details

### 3. Read the global state and shared app context

Then read:

- `src/context/AppContext.jsx`

Goal:

- understand shared client state, session assumptions, and persisted app behavior

### 4. Read the highest-risk user flows

Then read:

- `src/pages/DonationFlow.jsx`
- `src/pages/KafalaFlow.jsx`
- `convex/http.ts`

Goal:

- understand donation creation, sponsorship flow, payment handoff, and callback handling

### 5. Read the admin operational surfaces

Then read:

- `src/pages/AdminDashboard.jsx`
- `src/pages/AdminDonations.jsx`
- `src/pages/AdminProjectForm.jsx`
- `src/pages/AdminSettings.jsx`
- `convex/admin.ts`
- `convex/config.ts`

Goal:

- understand how admins operate the system and where the risky config and verification paths live

### 6. Read the domain modules in backend order

Then read:

- `convex/projects.ts`
- `convex/donations.ts`
- `convex/kafala.ts`
- `convex/payments.ts`
- `convex/storage.ts`
- `convex/whatsapp.ts`

Goal:

- connect each route and workflow back to the backend contract and side effects

### 7. Read the design system and architecture docs last

Then read:

- `DESIGN_SYSTEM.md`
- `WEBSITE_ARCHITECTURE.md`
- `BACKEND_ARCHITECTURE.md`
- `JOURNEY.md`
- `CLAUDE.md`

Goal:

- understand intended direction, design rationale, and product history
- compare documentation intent against current implementation reality

## What A New Developer Should Internalize Early

- `src/App.jsx` and `convex/schema.ts` are the two fastest orientation files.
- This is one product with two important business domains: projects and kafala.
- Do not trust client-side admin checks as proof of backend authorization.
- Treat money-unit handling as a live risk until normalized.
- Treat the design system as partially implemented, not authoritative in runtime code.
- Expect docs to be helpful but not fully current.

## Short Conclusion

Ibtasim has a real product model, a coherent donor/admin split, and a meaningful design direction. The main issues are not absence of structure, but inconsistency at enforcement boundaries:

- security boundaries are too weak in backend access paths
- money and workflow handling are not normalized enough
- the design system is documented better than it is implemented
- the repo is buildable, but not lint-clean and not visibly test-protected

For a new developer, the correct posture is: trust the running code first, use the docs as intent, and inspect all payment, admin, config, and sponsorship paths with suspicion before changing behavior.

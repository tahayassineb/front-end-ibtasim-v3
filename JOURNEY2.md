# Session Journey - 2026-04-23

This file documents the implementation session for the premium platform feature package. WhatsApp behavior was intentionally left unchanged.

## Main Goal

Implement the planned platform upgrades:

- Premium Thmanyah font system
- Real admin roles and permissions
- Real team management
- Activity log and team performance
- Receipt/accounting center
- SEO/GEO publishing improvements
- Client-side image optimization
- Donor profile polish

## 1. Premium Font System - Thmanyah

Implemented the Thmanyah font trial using the local package from:

`D:\verde.ai\front-end-ibtasim-v3\new font`

Completed:

- Copied WOFF2 assets only into clean public web paths:
  - `public/fonts/thmanyah/sans/`
  - `public/fonts/thmanyah/serif-display/`
  - `public/fonts/thmanyah/serif-text/`
- Ignored OTF, `.DS_Store`, and `__MACOSX` files.
- Added `@font-face` rules for weights `300`, `400`, `500`, `700`, and `900`.
- Used `font-display: swap`.
- Added CSS variables:
  - `--font-brand`
  - `--font-arabic`
  - `--font-display-arabic`
  - `--font-text-arabic`
- Updated Tailwind font families.
- Updated app i18n font family choices.
- Added preload links for Thmanyah Sans regular and bold.
- Added a reversible `font_system` config flag:
  - `thmanyah`
  - `legacy`
- Added admin appearance/profile setting to switch between Thmanyah and legacy typography.

Important note:

- Font license still needs to be confirmed before production deployment.

## 2. Admin Roles, Invitations, And Permissions

Implemented the foundation for real admin roles.

Roles added:

- `owner`
- `manager`
- `validator`
- `viewer`

Backend changes:

- Added `role` to `admins`.
- Added `role` to `adminInvitations`.
- Added permission helpers in `convex/permissions.ts`.
- Added effective role handling so old admins without a role can still be treated safely.
- Added migration helper to make existing admins `owner`.
- Updated admin login/session response to include:
  - `role`
  - `fullName`
  - `phoneNumber`
  - `isActive`
- Updated admin invitation creation so the inviter assigns the role.
- Updated invitation acceptance so the invited admin receives the assigned role.
- Removed role self-selection from admin registration and made the assigned role read-only.

Permission enforcement added to key backend areas:

- Admin invitations
- Team role changes
- Deactivation/reactivation
- Donation verification/rejection
- Kafala verification/rejection
- Project creation/update
- Kafala creation/update/publish/delete
- Receipt export
- Activity/performance queries

## 3. Real Team Management UI

Replaced the fake/hardcoded team settings behavior with real Convex data.

Completed:

- Rebuilt the team settings tab to use real admins and pending invitations.
- Added active members section.
- Added inactive members section.
- Added pending invitations section.
- Added invite form with role selection.
- Added cancel invitation.
- Added role change.
- Added deactivate/reactivate.
- Preserved admin history by not physically deleting admins.
- Added permission-aware admin sidebar navigation.

## 4. Activity Log And Team Performance

Added an admin audit and performance foundation.

New backend file:

- `convex/activities.ts`

New admin routes:

- `/admin/activity`
- `/admin/team-performance`

Activity logging added for:

- Invitation created
- Invitation cancelled
- Role changed
- Member deactivated/reactivated
- Donation approved/rejected
- Kafala donation approved/rejected
- Project created/updated
- Kafala created/updated/published/deleted
- Receipt export

Team performance tracks counts for:

- Verifications
- Projects
- Stories
- Kafala actions
- Receipt exports
- Last activity

## 5. Receipt / Accounting Center

Added a new receipt/accounting workflow.

New backend file:

- `convex/receipts.ts`

New admin route:

- `/admin/receipts`

Completed:

- Normalized regular donations and kafala donations into one receipt list.
- Added filters for:
  - Type
  - Status
  - Search by donor/project/kafala/phone
- Added totals:
  - Receipt count
  - Total amount
  - Missing receipt count
- Added CSV export.
- Added ZIP/accounting package export using `jszip`.
- Added receipt export activity logging.
- Added `jszip` dependency to `package.json`.

## 6. SEO / GEO Publishing Improvements

Added the first SEO/GEO phase while keeping Vite.

New helper files:

- `convex/seo.ts`
- `src/lib/seo.js`

Completed:

- Added automatic slug generation.
- Added SEO fields for projects:
  - `slug`
  - `metaTitle`
  - `metaDescription`
  - `imageAlt`
  - `canonicalPath`
- Added SEO fields for stories:
  - `slug`
  - `metaTitle`
  - `metaDescription`
  - `imageAlt`
  - `canonicalPath`
- Added SEO fields for kafala:
  - `slug`
  - `metaTitle`
  - `metaDescription`
  - `imageAlt`
  - `canonicalPath`
- Added slug-or-ID lookup for public project detail pages.
- Added slug-or-ID lookup for public kafala detail pages.
- Updated story detail to resolve by ID or slug from published stories.
- Added dynamic route metadata updates for:
  - Project detail
  - Story detail
  - Kafala detail
- Added JSON-LD structured data for:
  - Project donation pages
  - Story/article pages
  - Kafala sponsorship pages
- Added static public files:
  - `public/robots.txt`
  - `public/sitemap.xml`

## 7. Image Performance And Upload Quality

Added client-side image optimization before Convex uploads.

New helper:

- `src/lib/imageOptimization.js`

Completed:

- Resize large images before upload.
- Compress to WebP when supported.
- Fallback to original type when WebP is not supported.
- Avoid replacing the file if optimization makes it larger.
- Added readable byte formatting.

Wired optimization into:

- Admin project main image upload
- Admin project gallery upload
- Admin story cover upload
- Admin story inline image upload
- Admin kafala photo upload

## 8. Donor Profile Polish

Improved `/profile` donation history behavior.

Completed:

- Donation rows now show receipt download link when a receipt exists.
- Donation rows show `Receipt pending` when missing.
- Verified donations show verification date when available.
- Existing donate/kafala renewal flows remain links to website flows, not app-store payment systems.

## 9. Build And Verification

Commands run:

```bash
npx convex codegen
npm run build
```

Results:

- Convex codegen passed.
- Vite production build passed.
- Targeted ESLint passed for the new/high-risk touched files:
  - `src/pages/features/stories/StoryDetail.jsx`
  - `src/pages/features/admin/AdminReceipts.jsx`
  - `src/pages/features/admin/stories/AdminStories.jsx`
  - `src/pages/features/kafala/KafalaDetail.jsx`
  - `src/pages/features/admin/projects/AdminProjectForm.jsx`
  - `src/pages/features/admin/kafala/AdminKafalaForm.jsx`
  - `src/lib/imageOptimization.js`
  - `src/lib/seo.js`
  - `src/lib/adminPermissions.js`

Known verification notes:

- Full `npm run lint` still fails because of pre-existing unrelated lint issues across older files.
- The Vite build warns that the main JS chunk is larger than 1000 kB.
- A future pass should code-split public/admin routes and heavy dependencies.

## 10. Important Files Changed Or Added

Backend:

- `convex/schema.ts`
- `convex/permissions.ts`
- `convex/activities.ts`
- `convex/receipts.ts`
- `convex/seo.ts`
- `convex/admin.ts`
- `convex/auth.ts`
- `convex/donations.ts`
- `convex/kafala.ts`
- `convex/projects.ts`
- `convex/stories.ts`

Frontend:

- `src/App.jsx`
- `src/components/AdminLayout.jsx`
- `src/index.css`
- `src/lib/i18n.js`
- `src/lib/adminPermissions.js`
- `src/lib/imageOptimization.js`
- `src/lib/seo.js`
- `src/pages/features/admin/AdminActivity.jsx`
- `src/pages/features/admin/AdminReceipts.jsx`
- `src/pages/features/admin/AdminTeamPerformance.jsx`
- `src/pages/features/admin/AdminLogin.jsx`
- `src/pages/features/admin/AdminRegister.jsx`
- `src/pages/features/admin/settings/TeamTab.jsx`
- `src/pages/features/admin/settings/ProfileTab.jsx`
- `src/pages/features/admin/projects/AdminProjectForm.jsx`
- `src/pages/features/admin/stories/AdminStories.jsx`
- `src/pages/features/admin/kafala/AdminKafalaForm.jsx`
- `src/pages/features/projects/ProjectDetail.jsx`
- `src/pages/features/stories/StoryDetail.jsx`
- `src/pages/features/kafala/KafalaDetail.jsx`
- `src/pages/features/public/UserProfile.jsx`

Public assets:

- `public/fonts/thmanyah/`
- `public/robots.txt`
- `public/sitemap.xml`

Package files:

- `package.json`
- `package-lock.json`

## 11. Out Of Scope / Not Changed

- WhatsApp behavior was not changed.
- Full WhatsApp inbox/history was not implemented.
- No migration to Next.js was done.
- No external image CDN was added.
- No physical admin deletion was added.
- No app-store payment flow was added.

## 12. Recommended Next Steps

1. Confirm Thmanyah font license before production.
2. Manually test admin roles using real accounts:
   - owner
   - manager
   - validator
   - viewer
3. Test receipt exports with real receipt files.
4. Test Arabic/French/English typography on mobile and desktop.
5. Add route-level code splitting to reduce bundle size.
6. Clean old unrelated lint issues in a separate technical debt pass.

## 13. Follow-Up Bug Fixes From Review

Claude Code reviewed the implementation and found three issues. They were addressed in this follow-up.

### Fixed Donation Permission Argument

Issue:

- `convex/donations.ts` had a permission check inside `getDonationById` that referenced `args.adminId`.
- `adminId` was not declared in the query args schema.
- Because of that, the permission check never executed.

Fix:

- Added `adminId: v.optional(v.id("admins"))` to `getDonationById` args.
- The existing `requireAdmin(ctx, args.adminId, "verification:write")` guard now works when an admin caller passes `adminId`.

### Added Backend Story Slug/ID Lookup

Issue:

- `StoryDetail.jsx` was loading all published stories and doing a client-side `.find()` by `_id` or `slug`.
- This worked but would become inefficient as stories grow.

Fix:

- Added `getPublishedStoryBySlugOrId` in `convex/stories.ts`.
- Updated `StoryDetail.jsx` to query one story directly by slug or ID.
- Existing public story URLs remain compatible.

### Removed Duplicate Convex File URL Helper

Issue:

- `AdminProjectForm.jsx` had a local duplicate `convexFileUrl()` implementation.
- The centralized helper already exists in `src/lib/convex.js`.

Fix:

- Removed the local duplicate helper.
- Imported and used `convexFileUrl` from `src/lib/convex.js`.

### Verification

- `npx convex codegen` passes after the fixes.
- `npm run build` passes after the fixes.
- Focused ESLint check for the affected frontend files passes. Convex `.ts` files are ignored by the current ESLint config, so Convex validation was verified through `npx convex codegen`.

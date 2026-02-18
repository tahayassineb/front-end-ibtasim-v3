# Documentation Context - Association Espoir

## Project Overview
Moroccan charity "Association Espoir" donation platform. Built with React 19 + Vite + Tailwind CSS.

## Key Documentation Files
- `DESIGN_SYSTEM.md` - Visual design tokens, colors, typography
- `USER_DESIGN_PROMPTS.md` - UX guidelines for donor-facing pages
- `ADMIN_DESIGN_PROMPTS.md` - UX guidelines for admin dashboard
- `WEBSITE_ARCHITECTURE.md` - Technical architecture overview
- `REBUILD_PLAN.md` - Migration notes from v2 to v3

## Architecture
- **Frontend**: React 19, React Router 7 (data API), Vite 7
- **Styling**: Tailwind CSS 3.4 with custom design tokens
- **Icons**: Material Symbols Outlined (Google Fonts)
- **Charts**: Recharts for admin analytics
- **State**: React Context (AppContext) + localStorage persistence
- **i18n**: Custom implementation (ar, fr, en) with RTL support

## Data Flow
1. Admin creates/edits projects → stored in localStorage (`admin_projects`)
2. Home page reads featured projects from same localStorage key
3. Donation flow captures donor info but doesn't persist (mock)
4. All data normalized on read to handle i18n object/string formats

## File Organization
```
src/
  components/       # Reusable UI components
    ui/            # Atomic UI (Toast, LoadingSpinner, EmptyState)
    index.js       # Barrel exports
  pages/           # Route components (Home, AdminDashboard, etc.)
  context/         # AppContext (auth, i18n, theme)
  assets/          # Static assets
```

## Conventions
- Single-file components with multiple named exports
- Page-level translation objects
- Material Symbols for icons (NOT Lucide)
- `glass-card` class for frosted panels
- `normalizeProject()` helper for data consistency

## Deployment
- Configured for Netlify (netlify.toml)
- Also has Vercel config (vercel.json)
- Build: `npm run build` (Vite)

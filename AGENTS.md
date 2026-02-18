# AGENTS.md - Association Espoir (front-end-ibtasim-v3)

## Project Context
Moroccan charity donation platform with admin dashboard. Supports Arabic (RTL), French, English.

## Non-Obvious Conventions

### Icons - CRITICAL
- **Use Material Symbols Outlined ONLY**: `<span className="material-symbols-outlined">icon_name</span>`
- **Never use Lucide React** - it's in dependencies but unused
- Icons flip horizontally in RTL: `[dir="rtl"] .material-symbols-outlined { transform: scaleX(-1) }`
- Add `.no-flip` class for icons that shouldn't flip (arrows, chevrons)

### i18n Pattern
- **useApp() hook** provides `t('key')`, `language`, `currentLanguage.dir`
- **Page-level translations**: Each page defines its own `translations` object (not centralized)
- **Text helper**: Use `getLocalizedText(obj)` pattern for i18n objects: `{en: '...', fr: '...', ar: '...'}`
- **dir attribute**: `<div dir={currentLanguage.dir}>` on root for RTL support

### Component Exports (Barrel Pattern)
Components export multiple named variants from single files:
```js
// components/Card.jsx
export const CardHeader = ...
export const CardMedia = ...
export default Card

// components/index.js
export { default as Card, CardHeader, CardMedia } from './Card'
```

### Data Flow
- **localStorage** persists admin projects (`admin_projects` key)
- **Home.jsx** loads featured projects from localStorage with `normalizeProject()` helper
- Project data supports both i18n objects and plain strings (normalization required)

### Styling
- **Custom color tokens**: `primary`, `bg-dark-card`, `text-secondary` (see tailwind.config.js)
- **Glass effect**: Use `glass-card` class for frosted glass panels
- **Shadows**: `shadow-primary`, `shadow-ios`, `shadow-card` are custom
- **Dark mode**: `darkMode: 'class'` - toggle class on html element

### Phone Validation
- **CountryCodeSelector component** handles phone formatting
- Use `validatePhoneByCountry()` and `formatPhoneForDisplay()` utils

### State Management
- **AppContext** holds: auth, language, theme, toast notifications
- **Toast system**: `showToast(message, type)` from useApp()

# Association Espoir - Design System

Based on analysis of all design mockups in `/design website/`

---

## 🎨 Color Palette

| Token | HEX | Usage |
|-------|-----|-------|
| **Primary** | `#0d7377` | Buttons, active states, links, progress bars |
| **Primary Light** | `#0d7477` | Variations, gradients |
| **Background Light** | `#f6f8f8` | Page background |
| **Background Dark** | `#112121` | Dark mode background |
| **Surface** | `#ffffff` | Cards, modals, inputs |
| **Surface Dark** | `#1a2e2e` | Dark mode cards |
| **Text Primary** | `#0e1a1b` | Headings, primary text |
| **Text Secondary** | `#64748b` | Labels, descriptions, placeholders |
| **Text Muted** | `#94a3b8` | Disabled, hints |
| **Border** | `#e2e8f0` | Input borders, dividers |
| **Success** | `#10b981` | Verified status, success messages |
| **Warning** | `#f59e0b` | Pending status, alerts |
| **Error** | `#ef4444` | Failed status, reject actions |
| **Info Background** | `#e7f2f3` | Search bars, chip backgrounds |

---

## 🔤 Typography

**Font Families:**
- Primary: `Inter, sans-serif`
- Arabic: `Tajawal, sans-serif`
- Combined: `"Inter", "Tajawal", sans-serif`

**Font Sizes:**
| Level | Size | Weight | Usage |
|-------|------|--------|-------|
| Hero | `text-4xl` | `font-black` | Hero headlines |
| H1 | `text-2xl` | `font-bold` | Page titles |
| H2 | `text-xl` | `font-bold` | Section titles |
| H3 | `text-lg` | `font-bold` | Card titles |
| Body | `text-base` | `font-normal` | Paragraphs |
| Small | `text-sm` | `font-medium` | Labels, buttons |
| Tiny | `text-xs` | `font-bold` | Badges, tracking labels |
| Micro | `text-[10px]` | `font-bold uppercase tracking-widest` | Overlines |

---

## 📐 Border Radius Scale

| Token | Value | Usage |
|-------|-------|-------|
| `rounded-lg` | `1rem` | Cards, modals, containers |
| `rounded-xl` | `1.5rem` | Large cards, hero sections |
| `rounded-2xl` | - | Buttons, inputs |
| `rounded-full` | `9999px` | Chips, badges, avatars |

---

## 🧩 Component Patterns

### Buttons

**Primary Button:**
```
bg-primary text-white font-bold py-4 px-6 rounded-xl 
shadow-lg shadow-primary/20 hover:bg-opacity-90 
transition-all active:scale-[0.98]
```

**Secondary Button (Outline):**
```
bg-white border-2 border-primary text-primary font-bold 
py-4 px-6 rounded-xl hover:bg-primary/5 transition-all
```

**Ghost Button:**
```
text-slate-500 hover:bg-slate-50 transition-colors 
border border-transparent rounded-xl
```

**Icon Button:**
```
flex items-center justify-center rounded-full 
bg-primary/10 text-primary h-10 w-10
```

---

### Inputs

**Text Input:**
```
w-full h-14 bg-white border border-slate-200 rounded-xl 
px-4 text-base focus:ring-2 focus:ring-primary/20 
focus:border-primary transition-all
```

**Input with Icon:**
```
relative
├─ icon: absolute right-4 top-1/2 -translate-y-1/2 text-slate-400
└─ input: pr-12 (padding for icon)
```

**Search Input:**
```
flex items-center bg-[#e7f2f3] rounded-2xl h-14
├─ icon container: bg-transparent text-primary pl-5
└─ input: bg-transparent border-none focus:ring-0
```

---

### Cards

**Standard Card:**
```
bg-white rounded-xl shadow-sm border border-slate-100 
overflow-hidden
```

**Project Card:**
```
bg-white rounded-xl overflow-hidden shadow-lg shadow-black/5 
border border-gray-100
├─ Image: aspect-[16/10] with gradient overlay
├─ Glass badge: absolute bottom-4 right-4
└─ Content: p-5 space-y-4
```

**Glass Card (for overlays):**
```
background: rgba(255, 255, 255, 0.7);
backdrop-filter: blur(12px);
border: 1px solid rgba(255, 255, 255, 0.3);
border-radius: 1rem;
```

**Stat Card:**
```
bg-white rounded-xl p-5 border border-gray-200 shadow-sm
flex flex-col gap-2
```

---

### Chips / Badges

**Active Category Chip:**
```
bg-primary text-white rounded-full px-6 h-10
flex items-center gap-2 shadow-md shadow-primary/20
```

**Inactive Category Chip:**
```
bg-[#e7f2f3] text-primary rounded-full px-5 h-10
border border-primary/5 flex items-center gap-2
```

**Status Badge:**
```
inline-flex items-center px-2 py-1 text-xs rounded-full
├─ Verified: bg-green-100 text-green-700
├─ Pending: bg-orange-100 text-orange-700
└─ Failed: bg-red-100 text-red-700
```

---

### Progress Bar

```
h-2 w-full bg-slate-100 rounded-full overflow-hidden
└─ fill: h-full bg-primary rounded-full
```

---

## 📱 Layout Patterns

### Mobile Container
```
max-w-md mx-auto (for mobile-first pages)
max-w-lg mx-auto (for wider mobile pages)
max-w-7xl mx-auto (for desktop admin)
```

### Sticky Header
```
sticky top-0 z-50 bg-background-light/80 backdrop-blur-md 
border-b border-gray-100
flex items-center p-4 justify-between
```

### Fixed Bottom Action
```
fixed bottom-0 left-0 right-0 
bg-background-light/95 backdrop-blur-lg 
border-t border-gray-100 p-4 z-50
```

### Page Structure (Mobile)
```
├─ Sticky Header
├─ Main Content (pb-24 for bottom action space)
└─ Fixed Bottom Action (if needed)
```

### Page Structure (Admin)
```
flex h-screen overflow-hidden
├─ Sidebar (hidden md:flex, w-64)
└─ Main (flex-1 overflow-y-auto)
   ├─ TopAppBar (sticky)
   └─ Content (max-w-7xl mx-auto)
```

---

## 🎯 Icons

**Icon Library:** Material Symbols Outlined

**Sizes:**
- Small: `text-[18px]` or `w-4 h-4`
- Default: `text-xl` or `w-5 h-5`
- Large: `text-3xl` or `w-8 h-8`

**Common Icons:**
| Usage | Icon Name |
|-------|-----------|
| Back | `arrow_back_ios` |
| Search | `search` |
| User | `person` |
| Heart/Donate | `favorite` or `volunteer_activism` |
| Menu | `menu` |
| Close | `close` |
| Check | `check_circle` |
| Warning | `error` or `warning` |
| Clock | `schedule` or `pending` |
| School | `school` |
| Health | `health_and_safety` |
| Water | `water_drop` |
| Food | `restaurant` |
| Money | `payments` or `account_balance_wallet` |
| WhatsApp | `chat` |
| More | `more_horiz` |
| Trending Up | `trending_up` |
| Dashboard | `dashboard` |
| Projects | `folder_open` |
| Donations | `volunteer_activism` |
| Donors | `groups` |
| Settings | `settings` |
| Verified | `verified` |
| Add | `add_circle` |

---

## 🌓 Dark Mode

**Toggle:** `dark` class on html element

**Key Dark Mode Classes:**
```
bg-background-dark (instead of bg-background-light)
text-white (instead of text-[#0e1a1b])
bg-slate-900 (cards instead of bg-white)
border-slate-800 (instead of border-gray-200)
```

---

## 🎭 Animation & Transitions

**Standard Transition:**
```
transition-all duration-300
```

**Button Active State:**
```
active:scale-[0.98]
```

**Hover Effects:**
```
hover:shadow-lg hover:border-primary/30
hover:bg-primary/5
hover:scale-[1.02]
```

**Backdrop Blur:**
```
backdrop-blur-md (12px)
backdrop-blur-xl (24px)
```

---

## 📋 Page-Specific Patterns

### Home Page
- Hero with gradient overlay on image
- Trust badge with glass effect
- Stats in glass card overlapping hero
- Project cards with image + gradient overlay
- Impact stats grid (2x2)

### Donation Flow
- Step indicator (if multi-step)
- Project hero card at top
- Amount selection grid (3 columns)
- Custom amount input
- Impact glass card
- Fixed bottom CTA with total

### Admin Dashboard
- Sidebar with icon + text navigation
- Stat cards row (4 on desktop, 2x2 on mobile)
- Chart with gradient fill
- Data table with hover states
- Pending verifications highlighted in orange

### Verification Modal
- Two-column layout on desktop
- Donor info card with avatar
- Large amount display
- Receipt image with zoom overlay
- Checklist with checkboxes
- Action buttons row (Cancel, Reject, Approve)

---

## ✅ Implementation Checklist

**Global Setup:**
- [ ] Load Material Symbols Outlined font
- [ ] Load Inter and Tajawal fonts
- [ ] Configure Tailwind with custom colors
- [ ] Set up dark mode class strategy

**Components to Build:**
- [ ] Button variants (Primary, Secondary, Ghost, Icon)
- [ ] Input with icon support
- [ ] Card variants (Standard, Project, Glass, Stat)
- [ ] Chip/Category filter
- [ ] Status Badge
- [ ] Progress Bar
- [ ] Modal/Dialog

**Layout Components:**
- [ ] Mobile Header with back button
- [ ] Admin Sidebar
- [ ] Admin TopAppBar
- [ ] Fixed Bottom Action Bar

**Responsive Behavior:**
- [ ] Mobile: Single column, full width
- [ ] Tablet: 2 columns for cards
- [ ] Desktop: Sidebar + Main layout

---

## 🚀 Quick Implementation Guide

**To implement any new page:**

1. **Choose Layout Pattern** (Mobile vs Admin)
2. **Apply Color Tokens** (use primary, background-light, text-primary)
3. **Use Border Radius** (rounded-xl for cards, rounded-full for chips)
4. **Add Shadows** (shadow-sm for cards, shadow-lg for CTAs)
5. **Include Transitions** (transition-all, active:scale-[0.98])
6. **Use Material Icons** (from the common icons list)
7. **Support RTL** (dir="rtl" for Arabic pages)
8. **Add Dark Mode** (dark: variants)

---

*This design system ensures consistency across all pages and makes it easy to add new features in the future.*

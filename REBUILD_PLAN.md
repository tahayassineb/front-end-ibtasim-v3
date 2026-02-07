# Association Espoir - Complete Website Rebuild Plan

## Overview
This document contains the comprehensive implementation plan for rebuilding the Association Espoir charity website based on the 22 design files provided.

---

## Part 1: Design System Tokens

### Color Palette

#### Primary Colors
| Token | Value | Usage |
|-------|-------|-------|
| `--color-primary` | `#0d7477` | Primary teal/turquoise - buttons, links, accents |
| `--color-primary-light` | `#0c7579` | Alternative primary shade |
| `--color-primary-dark` | `#0A5F62` | Hover states |
| `--color-primary-10` | `rgba(13, 116, 119, 0.1)` | Background tints |
| `--color-primary-20` | `rgba(13, 116, 119, 0.2)` | Progress bars, borders |

#### Background Colors
| Token | Value | Usage |
|-------|-------|-------|
| `--color-bg-light` | `#f6f8f8` | Main page background |
| `--color-bg-soft` | `#F8FAFA` | Card backgrounds, soft sections |
| `--color-bg-white` | `#FFFFFF` | Cards, modals, elevated surfaces |
| `--color-bg-dark` | `#112121` | Dark mode background |
| `--color-bg-dark-card` | `#1a2e2e` | Dark mode cards |
| `--color-teal-wash` | `#F0F7F7` | Subtle teal backgrounds |
| `--color-sage-light` | `#E8F1F2` | Info sections, highlights |

#### Text Colors
| Token | Value | Usage |
|-------|-------|-------|
| `--color-text-primary` | `#0e1a1b` | Main body text |
| `--color-text-secondary` | `#64748b` | Subtext, descriptions |
| `--color-text-muted` | `#94a3b8` | Placeholders, hints |
| `--color-text-white` | `#FFFFFF` | Text on dark/colored backgrounds |

#### Semantic Colors
| Token | Value | Usage |
|-------|-------|-------|
| `--color-success` | `#22c55e` | Verified, completed states |
| `--color-warning` | `#b8860b` / `#f59e0b` | Pending, attention needed |
| `--color-error` | `#d32f2f` / `#ef4444` | Rejected, error states |
| `--color-info` | `#0d7477` | Informational elements |

#### Border Colors
| Token | Value | Usage |
|-------|-------|-------|
| `--color-border-light` | `#E5E9EB` | Light borders |
| `--color-border-default` | `#e2e8f0` | Default borders |
| `--color-border-primary` | `rgba(13, 116, 119, 0.2)` | Primary-tinted borders |

---

### Typography System

#### Font Families
| Token | Value | Usage |
|-------|-------|-------|
| `--font-display` | `Inter, sans-serif` | Main UI text, headings |
| `--font-arabic` | `Tajawal, sans-serif` | Arabic text, RTL content |
| `--font-jakarta` | `Plus Jakarta Sans` | Alternative for some admin screens |

#### Font Weights
| Token | Value | Usage |
|-------|-------|-------|
| `--font-light` | `300` | Body text, descriptions |
| `--font-normal` | `400` | Regular text |
| `--font-medium` | `500` | Labels, emphasized text |
| `--font-semibold` | `600` | Buttons, subheadings |
| `--font-bold` | `700` | Headlines, important text |
| `--font-black` | `900` | Hero headlines, stats |

#### Font Sizes (Mobile-First Scale)
| Token | Value | Usage |
|-------|-------|-------|
| `--text-xs` | `10px` / `0.625rem` | Badges, captions, labels |
| `--text-sm` | `12px` / `0.75rem` | Secondary text, timestamps |
| `--text-base` | `13px` / `14px` | Body text, descriptions |
| `--text-md` | `15px` / `16px` | Form inputs, buttons |
| `--text-lg` | `17px` / `18px` | Subheadings, prices |
| `--text-xl` | `20px` / `24px` | Section titles |
| `--text-2xl` | `24px` / `28px` | Page titles |
| `--text-3xl` | `28px` / `32px` | Large headings |
| `--text-4xl` | `32px` / `40px` | Hero titles |

#### Line Heights
| Token | Value | Usage |
|-------|-------|-------|
| `--leading-tight` | `1.25` | Headlines |
| `--leading-normal` | `1.5` | Body text |
| `--leading-relaxed` | `1.625` | Paragraphs, descriptions |

#### Letter Spacing
| Token | Value | Usage |
|-------|-------|-------|
| `--tracking-tight` | `-0.015em` | Large headings |
| `--tracking-normal` | `0` | Body text |
| `--tracking-wide` | `0.05em` | Uppercase labels |
| `--tracking-wider` | `0.1em` | Badges, uppercase |
| `--tracking-widest` | `0.2em` | Section labels |

---

### Spacing System

#### Base Spacing Scale
| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | `4px` | Tight gaps |
| `--space-2` | `8px` | Small gaps, icon spacing |
| `--space-3` | `12px` | Default gaps |
| `--space-4` | `16px` | Standard padding |
| `--space-5` | `20px` | Section padding |
| `--space-6` | `24px` | Large gaps |
| `--space-8` | `32px` | Section separators |
| `--space-10` | `40px` | Major sections |
| `--space-12` | `48px` | Hero spacing |

#### Container Padding
| Token | Value | Usage |
|-------|-------|-------|
| `--px-mobile` | `16px` / `1rem` | Mobile horizontal padding |
| `--px-tablet` | `24px` | Tablet horizontal padding |
| `--px-desktop` | `32px` - `48px` | Desktop horizontal padding |

---

### Border Radius System

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | `0.5rem` / `8px` | Small elements, tags |
| `--radius-md` | `0.75rem` / `12px` | Buttons, inputs |
| `--radius-lg` | `1rem` / `16px` | Cards, containers |
| `--radius-xl` | `1.5rem` / `24px` | Large cards, modals |
| `--radius-2xl` | `2rem` / `32px` | Hero sections |
| `--radius-full` | `9999px` | Pills, avatars, badges |

---

### Shadow System

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle elevation |
| `--shadow-md` | `0 4px 6px -1px rgba(0,0,0,0.1)` | Cards, buttons |
| `--shadow-lg` | `0 10px 15px -3px rgba(0,0,0,0.1)` | Elevated cards |
| `--shadow-xl` | `0 20px 25px -5px rgba(0,0,0,0.1)` | Modals, floating elements |
| `--shadow-primary` | `0 4px 14px rgba(13,116,119,0.25)` | Primary button glow |
| `--shadow-ios` | `0 2px 12px rgba(0,0,0,0.04)` | iOS-style subtle shadow |

---

### Glassmorphism Effects

```css
.glass-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.dark .glass-card {
  background: rgba(17, 33, 33, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

---

## Part 2: Page Inventory

### Public Pages (Donor-Facing)

| # | Page Name | Design File | Route | Priority |
|---|-----------|-------------|-------|----------|
| 1 | **Home Page** | `charity_home_page_-_premium_moroccan_style` | `/` | P0 |
| 2 | **Projects Gallery** | `projects_gallery_-_moroccan_charity` | `/projects` | P0 |
| 3 | **Project Detail** | `project_detail_-_glassmorphic_sidebar` | `/projects/:id` | P0 |
| 4 | **Contact Page** | `contact_our_team` | `/contact` | P0 |
| 5 | **Impact Stories** | `impact_&_success_stories` | `/impact` | P1 |
| 6 | **Donor Login** | `donor_login_&_verification` | `/login` | P0 |
| 7 | **Donor Registration** | `donor_registration_flow` | `/register` | P0 |
| 8 | **Donation Checkout** | `donation_checkout_page` | `/donate` | P0 |
| 9 | **Phone Verification** | `donation_step_3__phone_verification_(ar)` | `/verify-phone` | P1 |
| 10 | **Payment Methods** | `donation_step_4__payment_methods_variant_1` | `/payment-methods` | P1 |
| 11 | **Receipt Upload** | `donation_step_5__receipt_upload` | `/upload-receipt` | P1 |
| 12 | **Donation Success** | `donation_success_&_thank_you` | `/donation-success` | P0 |

### Admin Pages (Staff-Only)

| # | Page Name | Design File | Route | Priority |
|---|-----------|-------------|-------|----------|
| 13 | **Admin Login** | `admin_secure_login` | `/admin/login` | P0 |
| 14 | **Executive Dashboard** | `admin__executive_dashboard_1` | `/admin/dashboard` | P0 |
| 15 | **Projects Management** | `admin__executive_dashboard_2` | `/admin/projects` | P0 |
| 16 | **Donations Ledger** | `admin__donations_management_ledger` | `/admin/donations` | P0 |
| 17 | **Mobile Verification** | `admin__donations_verification_ledger_(mobile)` | `/admin/verification` | P1 |
| 18 | **Verification Modal** | `admin__donation_verification_modal` | `/admin/verify/:id` | P1 |
| 19 | **Donor Directory** | `admin__donor_directory_&_crm` | `/admin/donors` | P1 |
| 20 | **Donor Detail** | `admin__donor_relationship_view` | `/admin/donors/:id` | P1 |
| 21 | **Project Editor** | `admin__project_editor_variant_2` | `/admin/projects/:id/edit` | P1 |
| 22 | **System Settings** | `admin__system_settings` | `/admin/settings` | P1 |
| 23 | **System Config** | `admin__system_settings_&_config` | `/admin/settings/config` | P1 |

---

## Part 3: Component Breakdown

### Layout Components

#### 1. `MainLayout`
- **Purpose**: Wrapper for public pages
- **Features**:
  - Sticky navigation with blur backdrop
  - Mobile-first max-width container (max-w-md for mobile, expands on desktop)
  - Footer with trust indicators
  - Dark mode support

#### 2. `AdminLayout`
- **Purpose**: Wrapper for admin pages
- **Features**:
  - Sidebar navigation (hidden on mobile, visible on md+)
  - Bottom navigation bar (mobile only)
  - Header with notifications
  - User profile dropdown

#### 3. `MobileContainer`
- **Props**: `children`, `className`
- **Behavior**: Centers content with max-w-md on mobile, expands naturally on desktop

---

### Navigation Components

#### 4. `PublicNavbar`
- **Features**:
  - Logo + "Charity Morocco" branding
  - "Donate Now" CTA button (primary)
  - Mobile hamburger menu
  - Backdrop blur effect
  - Border bottom on scroll

#### 5. `AdminSidebar`
- **Items**: Dashboard, Projects, Donations, Donors, Verifications, Settings
- **Active State**: Primary color background with icon fill
- **Collapsible**: Hidden on mobile

#### 6. `MobileBottomNav`
- **Items**: Home, Projects, Donate (center), Updates, More
- **Features**:
  - Center "Donate" button elevated with shadow
  - Active state with filled icons
  - Backdrop blur

#### 7. `AdminBottomNav`
- **Items**: Dashboard, Projects, Donations, Profile
- **Active State**: Primary color text

---

### UI Components

#### 8. `Button`
**Variants:**
- `primary`: Solid primary background, white text, shadow
- `secondary`: Primary/10 background, primary text, border
- `outline`: Transparent bg, primary border, primary text
- `ghost`: No background, hover state
- `danger`: Red background/text for destructive actions

**Sizes:**
- `sm`: h-10, px-4, text-sm
- `md`: h-12, px-6, text-base
- `lg`: h-14, px-8, text-lg

**Props:** `variant`, `size`, `loading`, `disabled`, `fullWidth`, `icon`

#### 9. `Card`
**Variants:**
- `default`: White bg, border, shadow-sm, rounded-xl
- `glass`: Glassmorphism effect
- `flat`: No shadow, border only
- `elevated`: Larger shadow

#### 10. `Input`
**Features:**
- Rounded-xl (12px)
- Borderless with bg-gray-100
- Focus ring (primary/20)
- Icon support (left/right)
- Label support

**Props:** `label`, `icon`, `iconRight`, `error`, `helperText`

#### 11. `ProgressBar`
- Height: h-2 or h-1.5
- Rounded full
- Background: primary/20
- Fill: primary color
- Optional percentage label

#### 12. `Badge`
**Variants:**
- `primary`: Primary bg/10, primary text
- `success`: Green bg/10, green text
- `warning`: Amber bg/10, amber text
- `error`: Red bg/10, red text
- `neutral`: Gray bg, gray text

**Sizes:** `sm` (text-[10px]), `md` (text-xs)

#### 13. `Avatar`
- **Props:** `src`, `name`, `size` (sm/md/lg)
- **Fallback:** Initials with primary bg

#### 14. `IconButton`
- Circular button with icon
- Sizes: 40px, 48px
- Hover: bg-primary/10

#### 15. `Chip/Filter`
- Pill-shaped buttons
- Active: Primary bg, white text
- Inactive: White bg, border, gray text
- Scrollable container

#### 16. `StatCard`
- **Props:** `label`, `value`, `trend`, `icon`
- Layout: Icon top-right, label top, value large bottom
- Trend indicator with color (green/red)

#### 17. `ProjectCard`
- Image (16:10 aspect ratio)
- Category badge (glass effect overlay)
- Title + description
- Progress bar with percentage
- Amount raised / goal
- CTA button

#### 18. `DonationCard` (Admin)
- Status badge (Pending/Verified/Rejected)
- Donor name + phone
- Amount + transaction ID
- Project name
- Payment method
- Action buttons

#### 19. `DonorCard` (Admin)
- Avatar + name + email
- Tier badge (Gold/Silver/Bronze)
- Total donated
- Donation count
- Last active
- View button

#### 20. `EmptyState`
- Icon (large)
- Title
- Description
- Optional CTA

#### 21. `LoadingSpinner`
- Primary color
- Sizes: sm, md, lg

#### 22. `Toast`/`Alert`
- Success, error, warning, info variants
- Auto-dismiss
- Icon + message

---

### Form Components

#### 23. `PhoneInput`
- Country code selector (Morocco default +212)
- Phone number input
- Validation

#### 24. `OTPInput`
- 6 digit inputs
- Auto-focus next
- Backspace handling
- Styled boxes with shadow

#### 25. `FileUpload`
- Drag & drop zone
- File type validation
- Preview for images
- Progress indicator

#### 26. `Toggle`
- iOS-style switch
- Primary color when on

#### 27. `RadioGroup`
- Segmented control style
- Used for frequency selection (One-time/Monthly)

#### 28. `Checkbox`
- Primary color check
- Label support

---

### Page-Specific Components

#### 29. `HeroSection` (Home)
- Full-width image with gradient overlay
- Title (English + Arabic)
- CTA button
- Stats card overlay

#### 30. `ImpactGrid` (Home)
- 2x2 grid of stat cards
- Icons from Material Symbols
- Large numbers with labels

#### 31. `SearchBar`
- Icon left
- Rounded-xl
- Primary-tinted background when focused

#### 32. `PaymentMethodCard`
- Icon
- Title + subtitle
- Chevron right
- Border with hover effect

#### 33. `VerificationChecklist`
- Checkbox list
- Receipt image viewer
- Zoom on click

#### 34. `DonationTrendsChart`
- SVG area chart
- Gradient fill
- X-axis labels

#### 35. `ProjectGallery`
- Grid of images
- Add button
- Hover effects

#### 36. `CommunicationLog`
- Timeline of messages
- WhatsApp integration
- Send message CTA

---

## Part 4: Responsive Strategy

### Mobile-First Approach
All designs are mobile-first (max-w-md: 448px). The rebuild will follow this pattern:

```
Base: Mobile (0-448px)
├─ sm: Large phones (640px)
├─ md: Tablets (768px) - Sidebar appears
├─ lg: Small laptops (1024px)
├─ xl: Desktops (1280px)
└─ 2xl: Large screens (1536px)
```

### Desktop Expansion Strategy

#### Home Page Desktop Adaptation
```
Mobile (1 col) → Desktop (12 col grid)
- Hero: Full-width, text overlay left
- Stats: 4-column grid (vs stacked)
- Projects: 3-column grid (vs single column)
- Impact: 4-column grid
- Footer: Multi-column layout
```

#### Projects Gallery Desktop
```
Mobile: Single column cards
Tablet: 2-column grid
Desktop: 3-column grid with filters sidebar
```

#### Admin Dashboard Desktop
```
Mobile: Bottom nav, stacked cards
Tablet: 2-column stats grid
Desktop: 
  - Fixed sidebar (256px)
  - 4-column stats
  - Side-by-side charts
  - Full data table
```

### Breakpoint-Specific Changes

| Element | Mobile | Tablet | Desktop |
|---------|--------|--------|---------|
| Container | max-w-md | max-w-3xl | max-w-7xl |
| Project Grid | 1 col | 2 col | 3 col |
| Stats Grid | 2 col | 2 col | 4 col |
| Admin Sidebar | Hidden | Hidden | Fixed 256px |
| Bottom Nav | Visible | Visible | Hidden |
| Padding | px-4 | px-6 | px-8 |

---

## Part 5: Implementation Order

### Phase 1: Foundation (Week 1)
1. Set up design system (colors, typography, spacing)
2. Create shared UI components
3. Implement layout components (MainLayout, AdminLayout)
4. Set up routing structure

### Phase 2: Public Pages (Week 2)
1. Home Page
2. Projects Gallery
3. Project Detail
4. Contact Page
5. Navigation components

### Phase 3: Auth & Donation Flow (Week 3)
1. Donor Login
2. Donor Registration
3. Donation Checkout
4. Payment Methods
5. Receipt Upload
6. Success Page

### Phase 4: Admin Core (Week 4)
1. Admin Login
2. Dashboard (with charts)
3. Projects Management
4. Donations Ledger

### Phase 5: Admin Extended (Week 5)
1. Donor Directory
2. Donor Detail
3. Verification Workflow
4. Project Editor
5. System Settings

---

## Part 6: Technical Notes

### Dependencies to Add
```bash
# Already present: React, React Router, Tailwind

# Charts
npm install recharts

# Icons
npm install @material-symbols/font

# Forms
npm install react-hook-form zod @hookform/resolvers

# Date handling
npm install date-fns

# Utilities
npm install clsx tailwind-merge
```

### Tailwind Config Extensions
```javascript
// tailwind.config.js additions
{
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0d7477',
          light: '#0c7579',
          dark: '#0A5F62',
        },
        background: {
          light: '#f6f8f8',
          dark: '#112121',
        },
        status: {
          gold: '#b8860b',
          red: '#d32f2f',
        }
      },
      fontFamily: {
        display: ['Inter', 'sans-serif'],
        arabic: ['Tajawal', 'sans-serif'],
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      }
    }
  }
}
```

### Key Implementation Details

1. **Dark Mode**: Use `darkMode: 'class'` with parent class toggle
2. **RTL Support**: All Arabic pages use `dir="rtl"` with proper font
3. **Mobile Container**: Use `max-w-md mx-auto` for mobile-first, expand on larger screens
4. **Glassmorphism**: Use `backdrop-blur` with semi-transparent backgrounds
5. **Shadows**: Primary buttons get `shadow-primary/20` for glow effect
6. **Progress Bars**: Always use `overflow-hidden` with rounded-full
7. **Icons**: Material Symbols Outlined with FILL variable for active states

---

## Part 7: File Structure

```
src/
├── components/
│   ├── ui/                    # Reusable UI components
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   ├── Input.jsx
│   │   ├── Badge.jsx
│   │   ├── ProgressBar.jsx
│   │   ├── Avatar.jsx
│   │   ├── IconButton.jsx
│   │   ├── Chip.jsx
│   │   ├── EmptyState.jsx
│   │   ├── LoadingSpinner.jsx
│   │   └── Toast.jsx
│   ├── layout/
│   │   ├── MainLayout.jsx
│   │   ├── AdminLayout.jsx
│   │   ├── PublicNavbar.jsx
│   │   ├── AdminSidebar.jsx
│   │   ├── MobileBottomNav.jsx
│   │   └── AdminBottomNav.jsx
│   └── forms/
│       ├── PhoneInput.jsx
│       ├── OTPInput.jsx
│       ├── FileUpload.jsx
│       ├── Toggle.jsx
│       ├── RadioGroup.jsx
│       └── Checkbox.jsx
├── pages/
│   ├── public/
│   │   ├── Home.jsx
│   │   ├── Projects.jsx
│   │   ├── ProjectDetail.jsx
│   │   ├── Contact.jsx
│   │   ├── Impact.jsx
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Donate.jsx
│   │   ├── VerifyPhone.jsx
│   │   ├── PaymentMethods.jsx
│   │   ├── UploadReceipt.jsx
│   │   └── DonationSuccess.jsx
│   └── admin/
│       ├── AdminLogin.jsx
│       ├── Dashboard.jsx
│       ├── Projects.jsx
│       ├── ProjectEdit.jsx
│       ├── Donations.jsx
│       ├── Verification.jsx
│       ├── Donors.jsx
│       ├── DonorDetail.jsx
│       └── Settings.jsx
├── hooks/
│   ├── useAuth.js
│   ├── useDarkMode.js
│   └── useMobile.js
├── lib/
│   ├── utils.js
│   ├── constants.js
│   └── api.js
├── styles/
│   └── globals.css
└── App.jsx
```

---

## Appendix: Design File Index

| # | File Name | Page Type | Key Features |
|---|-----------|-----------|--------------|
| 1 | charity_home_page | Public | Hero, stats, projects, impact grid |
| 2 | projects_gallery | Public | Search, filters, project cards |
| 3 | project_detail | Public | Glassmorphic donation card, gallery |
| 4 | contact_our_team | Public | Form + map layout |
| 5 | impact_&_success_stories | Public | Story cards, masonry grid |
| 6 | donor_login_&_verification | Auth | RTL Arabic, phone login |
| 7 | donor_registration_flow | Auth | RTL Arabic, form validation |
| 8 | donation_checkout_page | Donation | Amount selection, frequency |
| 9 | donation_step_3_phone_verification | Donation | OTP input, RTL |
| 10 | donation_step_4_payment_methods | Donation | Payment options, RTL |
| 11 | donation_step_5_receipt_upload | Donation | File upload, bank details |
| 12 | donation_success_&_thank_you | Donation | Success state, share buttons |
| 13 | admin_secure_login | Admin | Glass card, secure styling |
| 14 | admin__executive_dashboard_1 | Admin | Stats, chart, recent table |
| 15 | admin__executive_dashboard_2 | Admin | Projects list management |
| 16 | admin__donations_management_ledger | Admin | Status cards, donation list |
| 17 | admin__donations_verification_ledger_(mobile) | Admin | Verification workflow |
| 18 | admin__donation_verification_modal | Admin | Receipt viewer, checklist |
| 19 | admin__donor_directory_&_crm | Admin | Donor cards, tier badges |
| 20 | admin__donor_relationship_view | Admin | Profile, history, comms |
| 21 | admin__project_editor_variant_2 | Admin | Form sections, media gallery |
| 22 | admin__system_settings | Admin | Bank management form |
| 23 | admin__system_settings_&_config | Admin | Tabs, toggles, settings |

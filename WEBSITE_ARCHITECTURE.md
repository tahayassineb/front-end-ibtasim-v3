# Association Espoir - Website Architecture & Design Specification

## 📋 Project Overview
**Association Espoir** is a Moroccan charity website for supporting orphans and families in need. The platform allows donors to browse projects, make donations, and track their contributions.

---

## 🎭 User Personas & Stories

### 1. Public Visitor (Non-registered)
**Goals:**
- Browse charity projects and causes
- Learn about the association
- View impact statistics
- Understand donation process

**Stories:**
- As a visitor, I want to see featured projects so I can understand what the association does
- As a visitor, I want to read about the association's mission and values
- As a visitor, I want to see donation impact statistics
- As a visitor, I want to understand how to donate

### 2. Donor (Registered User)
**Goals:**
- Create an account
- Browse and donate to projects
- Track donation history
- Receive donation receipts
- Manage profile information

**Stories:**
- As a donor, I want to register with my name, email, and WhatsApp
- As a donor, I want to browse all active projects
- As a donor, I want to filter projects by category
- As a donor, I want to donate to specific projects
- As a donor, I want multiple payment options (bank transfer, credit card via Whop)
- As a donor, I want to receive WhatsApp verification codes
- As a donor, I want to see my donation history
- As a donor, I want to download donation receipts
- As a donor, I want to update my profile information

### 3. Admin (Association Staff)
**Goals:**
- Manage projects (CRUD)
- Track donations and donors
- Generate reports
- Manage content
- View analytics

**Stories:**
- As an admin, I want to create new charity projects
- As an admin, I want to edit existing projects
- As an admin, I want to view all donations
- As an admin, I want to filter donations by status
- As an admin, I want to see donor details
- As an admin, I want to view donation statistics
- As an admin, I want to export donation reports
- As an admin, I want to manage project categories

---

## 🏗️ Website Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ASSOCIATION ESPOIR PLATFORM                        │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────┐         ┌─────────────────────────────┐
│       PUBLIC SIDE           │         │        ADMIN SIDE           │
│       (All Visitors)        │         │    (Authenticated Only)     │
└─────────────────────────────┘         └─────────────────────────────┘

┌──────────────┐  ┌──────────────┐     ┌──────────────┐  ┌──────────────┐
│    Home      │  │   About      │     │   Dashboard  │  │   Projects   │
│   (Hero +    │  │   (Mission,  │     │   (Stats +   │  │   (CRUD +    │
│   Stats +    │  │   History,   │     │   Charts)    │  │   Analytics) │
│   Featured)  │  │   Team)      │     └──────────────┘  └──────────────┘
└──────────────┘  └──────────────┘
       │                 │
       ▼                 ▼
┌──────────────┐  ┌──────────────┐     ┌──────────────┐  ┌──────────────┐
│   Projects   │  │   Contact    │     │   Donations  │  │    Donors    │
│   (List +    │  │   (Form +    │     │   (List +    │  │   (List +    │
│   Filter)    │  │   Info)      │     │   Filter)    │  │   Detail)    │
└──────────────┘  └──────────────┘     └──────────────┘  └──────────────┘
       │
       ▼
┌──────────────┐  ┌──────────────┐     ┌──────────────┐
│   Project    │  │   Donation   │     │   Settings   │
│   Detail     │──▶│   Flow       │     │   (Config)   │
│   (Info +    │  │   (4 Steps)  │     └──────────────┘
│   Progress)  │  └──────────────┘
└──────────────┘         │
       │                 ▼
       │          ┌──────────────┐  ┌──────────────┐
       │          │    Login     │  │   Register   │
       │          │   (Phone +   │  │   (Account   │
       │          │   Verify)    │  │   Creation)  │
       │          └──────────────┘  └──────────────┘
       │
       ▼
┌──────────────┐
│   User       │
│   Profile    │
│   (History + │
│   Settings)  │
└──────────────┘
```

---

## 📄 All Pages & Components Specification

### ═══════════════════════════════════════════════════════════
### SECTION 1: PUBLIC PAGES (User Side)
### ═══════════════════════════════════════════════════════════

---

#### PAGE 1: HOME PAGE
**Route:** `/`
**Purpose:** Landing page with hero, stats, featured projects

**Sections/Components:**
1. **Header Component** (Sticky)
   - Logo (left in LTR, right in RTL)
   - Navigation: Home, Projects, About, Contact
   - Language Switcher (AR/FR/EN)
   - Login/Profile button
   - "Donate Now" CTA button
   - Mobile hamburger menu

2. **Hero Section**
   - Full-width background image (children/orphans)
   - Dark overlay gradient
   - Trust badge: "جمعية معتمدة | تأسست عام 2018"
   - Association logo (centered)
   - Main headline: "حياة أطفالنا" / "هدفكم"
   - Subheadline/description
   - Two CTAs: "اكتشف المشاريع" + "ابدأ الآن"
   - Scroll indicator

3. **Stats Bar Section**
   - 3 stat cards in row:
     - "+694 مشروع" (Projects)
     - "+18,000 مستفيد" (Beneficiaries)
     - "5,000,000+ DH" (Donations collected)
   - Large numbers with animated counter
   - Labels below

4. **Projects Section**
   - Section title: "مشاريعنا"
   - Subtitle: "قضايا تحتاج إلى دعمكم"
   - "عرض الكل" link (top left in RTL)
   - 2-3 featured project cards (grid)
   - Each card shows:
     - Project image
     - Category badge
     - Title
     - Description (truncated)
     - Progress bar with percentage
     - Amount raised / Goal

5. **How It Works Section**
   - Section title: "كيفية التبرع"
   - 3 steps with icons:
     - Step 1: "اختر مشروعاً" (Heart icon)
     - Step 2: "سجل معلوماتك" (Users icon)
     - Step 3: "أتمم التبرع" (HandHeart icon)
   - Icons with circular backgrounds
   - Connecting lines between steps

6. **Dua/Quote Section**
   - Islamic quote about orphans
   - Source: "رواه البخاري ومسلم"
   - Decorative styling

7. **CTA Section**
   - Background color or image
   - Title: "كن جزءاً من التغيير"
   - Description text
   - "أنشئ حسابك" button

8. **Footer Component**
   - 4 columns:
     - Logo + short description
     - Quick links
     - Legal links
     - Contact info + social icons
   - Copyright bar at bottom

---

#### PAGE 2: PROJECTS LIST
**Route:** `/projets`
**Purpose:** Browse all charity projects

**Sections:**
1. **Page Header**
   - Title: "المشاريع"
   - Breadcrumb: Home > Projects

2. **Filter Bar**
   - Category tabs/buttons: All, Education, Health, Housing, Emergency, Food
   - Sort dropdown: Newest, Most Funded, Ending Soon
   - Search input

3. **Projects Grid**
   - Responsive grid (1 col mobile, 2 tablet, 3 desktop)
   - Project cards (same as Home)
   - Load more button or pagination

4. **Empty State** (when no projects)
   - Icon + message

---

#### PAGE 3: PROJECT DETAIL
**Route:** `/projets/:id`
**Purpose:** Detailed view of single project

**Sections:**
1. **Project Header**
   - Large hero image
   - Category badge
   - Title
   - Status badge (Active/Completed/Funded)

2. **Progress Section**
   - Large progress bar
   - Amount raised (large number)
   - Goal amount
   - Percentage funded
   - Days remaining

3. **Project Info**
   - Description (rich text)
   - Beneficiary details
   - Location
   - Start/End dates

4. **Image Gallery**
   - Grid of project images
   - Lightbox on click

5. **Updates Section**
   - Timeline of project updates
   - Date + content

6. **Donation CTA**
   - Sticky or prominent button
   - "تبرع الآن"

7. **Similar Projects**
   - 2-3 related projects at bottom

---

#### PAGE 4: DONATION FLOW (Multi-step)
**Route:** `/donation/:projectId`
**Purpose:** Complete donation process

**Step 1: Amount Selection**
- Project summary (mini card)
- Predefined amounts: 100, 250, 500, 1000, 2000 DH
- Custom amount input
- Impact message (e.g., "يسمح بتوفير وجبات لـ 5 أطفال")
- "متابعة" button

**Step 2: Donor Information**
- Name input
- Email input
- Phone input with country code
- WhatsApp verification checkbox
- "متابعة" button

**Step 3: Verification Code**
- 6-digit code input
- Auto-focus between fields
- Resend timer (2:00)
- "تحقق" button

**Step 4: Payment Method**
- Options:
  - Bank Transfer (CIH, BMCE, etc.)
  - Credit Card (via Whop popup)
  - Cash (Agency)
- Bank details display
- Copy account number button
- "تم التحويل" button

**Step 5: Receipt Upload**
- File upload area
- Drag & drop support
- Supported formats: JPG, PNG, PDF
- "إرسال" button

**Step 6: Thank You**
- Success animation/checkmark
- Thank you message
- Donation reference number
- Share buttons (WhatsApp, Facebook)
- "العودة للرئيسية" button

---

#### PAGE 5: LOGIN / AUTHENTICATION
**Route:** `/connexion`
**Purpose:** User authentication

**Sections:**
1. **Login Form**
   - Phone number input
   - Country code selector
   - "إرسال رمز التحقق" button

2. **Verification Section** (appears after)
   - 6-digit code input
   - Auto-focus between fields
   - Resend option
   - "تأكيد" button

3. **First-time Registration** (if new user)
   - Name input
   - Email input
   - "إنشاء حساب" button

---

#### PAGE 6: USER PROFILE
**Route:** `/profil`
**Purpose:** User account management

**Sections:**
1. **Profile Header**
   - User avatar (initials)
   - Name
   - Member since date
   - Total donated amount

2. **Personal Information**
   - Editable form:
     - Full name
     - Email
     - Phone
     - Address (optional)
   - "حفظ التغييرات" button

3. **Donation History**
   - List of past donations
   - Each row shows:
     - Project name
     - Amount
     - Date
     - Status (Confirmed/Pending)
     - Receipt download link

4. **Settings**
   - Language preference
   - Notification preferences
   - Change password
   - Delete account

---

#### PAGE 7: ABOUT US
**Route:** `/a-propos`
**Purpose:** Information about the association

**Sections:**
1. **Mission Section**
   - Title: "رسالتنا"
   - Mission statement
   - Vision statement

2. **History Timeline**
   - Founded year highlight
   - Key milestones
   - Achievements over years

3. **Values Section**
   - 3-4 core values with icons
   - Transparency
   - Compassion
   - Impact

4. **Team Section** (Optional)
   - Key team members
   - Photos + names + roles

5. **Statistics Section**
   - Total projects
   - Total beneficiaries
   - Total donations
   - Years of service

---

#### PAGE 8: CONTACT
**Route:** `/contact`
**Purpose:** Contact the association

**Sections:**
1. **Contact Information**
   - Address
   - Phone numbers
   - Email
   - WhatsApp
   - Social media links

2. **Contact Form**
   - Name input
   - Email input
   - Subject dropdown
   - Message textarea
   - "إرسال" button

3. **Map Section** (Optional)
   - Embedded Google Map
   - Office location

---

### ═══════════════════════════════════════════════════════════
### SECTION 2: ADMIN PAGES (Dashboard Side)
### ═══════════════════════════════════════════════════════════

---

#### PAGE 9: ADMIN DASHBOARD
**Route:** `/admin`
**Purpose:** Admin overview and analytics

**Layout:** Sidebar + Main Content

**Sections:**
1. **Stats Cards Row**
   - Total donations (this month)
   - Active projects
   - Total donors
   - Pending verifications

2. **Donations Chart**
   - Line chart: Donations over time
   - Filter: Last 7 days, 30 days, Year

3. **Projects Progress Chart**
   - Bar chart: Funding progress by project

4. **Recent Donations Table**
   - Last 5-10 donations
   - Donor name, amount, project, status
   - "View all" link

5. **Quick Actions**
   - "New Project" button
   - "Add Donation" button

---

#### PAGE 10: ADMIN PROJECTS MANAGEMENT
**Route:** `/admin/projets`
**Purpose:** CRUD operations for projects

**Sections:**
1. **Header**
   - Title: "المشاريع"
   - "مشروع جديد" button

2. **Filter/Search Bar**
   - Search input
   - Status filter: All, Active, Completed, Draft
   - Category filter

3. **Projects Table**
   - Columns:
     - Image (thumbnail)
     - Title
     - Category
     - Goal amount
     - Raised amount
     - Progress %
     - Status
     - Actions (Edit, Delete, View)

4. **Pagination**

---

#### PAGE 11: ADMIN PROJECT FORM (Create/Edit)
**Route:** `/admin/projets/nouveau` or `/admin/projets/:id/edit`
**Purpose:** Create or edit project

**Form Sections:**
1. **Basic Information**
   - Title (AR, FR, EN)
   - Description (AR, FR, EN)
   - Category dropdown
   - Featured toggle

2. **Financial**
   - Goal amount
   - Currency (DH)
   - Minimum donation

3. **Media**
   - Main image upload
   - Gallery images upload (multiple)
   - Video URL (optional)

4. **Details**
   - Beneficiary count
   - Location
   - Start date
   - End date

5. **Status**
   - Status: Draft, Active, Completed, Cancelled

6. **Actions**
   - "حفظ" button
   - "حفظ كمسودة" button
   - "إلغاء" button

---

#### PAGE 12: ADMIN DONATIONS
**Route:** `/admin/donations`
**Purpose:** View and manage all donations

**Sections:**
1. **Header**
   - Title: "التبرعات"
   - Export button (CSV/Excel)

2. **Filter Bar**
   - Date range picker
   - Status filter: All, Pending, Confirmed, Rejected
   - Project filter
   - Search by donor name

3. **Donations Table**
   - Columns:
     - ID
     - Donor name
     - Amount
     - Project
     - Date
     - Payment method
     - Status (badge)
     - Actions (View, Confirm, Reject)

4. **Summary Stats**
   - Total confirmed
   - Total pending
   - Total amount

---

#### PAGE 13: ADMIN DONORS
**Route:** `/admin/donateurs`
**Purpose:** Donor management

**Sections:**
1. **Header**
   - Title: "المتبرعون"

2. **Filter/Search**
   - Search by name/phone
   - Sort by: Newest, Total donated

3. **Donors Table**
   - Columns:
     - Name
     - Phone
     - Email
     - Total donated
     - Donation count
     - First donation
     - Last donation
     - Actions (View details)

---

#### PAGE 14: ADMIN DONOR DETAIL
**Route:** `/admin/donateurs/:id`
**Purpose:** Individual donor profile

**Sections:**
1. **Donor Info Card**
   - Name
   - Contact info
   - Total donated
   - Member since

2. **Donation History Table**
   - All donations by this donor
   - Same columns as Admin Donations

---

#### PAGE 15: ADMIN SETTINGS
**Route:** `/admin/parametres`
**Purpose:** System configuration

**Sections:**
1. **Association Info**
   - Name
   - Description
   - Founded year
   - Logo upload
   - Bank account details (CIH, BMCE)

2. **Contact Settings**
   - Address
   - Phones
   - Email
   - Social media links

3. **Payment Settings**
   - Whop payment link
   - Bank transfer details

4. **Notification Settings**
   - Email notifications
   - WhatsApp notifications

---

### ═══════════════════════════════════════════════════════════
### SECTION 3: SHARED COMPONENTS
### ═══════════════════════════════════════════════════════════

---

#### COMPONENT: Header (Global)
**Usage:** All pages
**Props:** None (uses context)
**Features:**
- Sticky on scroll
- RTL/LTR support
- Language switcher
- Auth state aware
- Mobile responsive

---

#### COMPONENT: Footer (Global)
**Usage:** All pages
**Props:** None
**Sections:**
- Logo + description
- Quick links
- Legal links
- Contact info
- Social icons
- Copyright

---

#### COMPONENT: Project Card
**Usage:** Home, Projects List
**Props:** `project`, `variant`
**Variants:**
- `default`: Standard card
- `compact`: Smaller for grids
- `featured`: Highlighted

**Elements:**
- Image
- Category badge
- Title
- Description (2 lines)
- Progress bar
- Amount raised / Goal

---

#### COMPONENT: Progress Bar
**Usage:** Project Card, Project Detail
**Props:** `current`, `goal`, `showPercentage`
**Features:**
- Animated fill
- Percentage label
- Color based on progress

---

#### COMPONENT: Donation Chart
**Usage:** Admin Dashboard
**Props:** `data`, `type`
**Type:** Line chart or Bar chart

---

#### COMPONENT: Empty State
**Usage:** Lists with no data
**Props:** `icon`, `title`, `description`, `action`

---

#### COMPONENT: Loading Spinner
**Usage:** Async operations
**Props:** `size`, `color`

---

#### COMPONENT: Toast/Notification
**Usage:** Success/error messages
**Props:** `type`, `message`, `duration`

---

#### COMPONENT: Modal
**Usage:** Confirmations, forms
**Props:** `isOpen`, `onClose`, `title`, `children`

---

#### COMPONENT: Country Code Selector
**Usage:** Phone inputs
**Props:** `value`, `onChange`, `language`
**Features:**
- Flag icons
- Search/filter
- RTL/LTR support

---

#### COMPONENT: Admin Layout
**Usage:** All admin pages
**Structure:**
- Fixed sidebar
- Header bar
- Main content area
- Collapsible on mobile

**Sidebar Items:**
- Dashboard
- Projects
- Donations
- Donors
- Settings
- Logout

---

### ═══════════════════════════════════════════════════════════
### SECTION 4: DATA MODELS
### ═══════════════════════════════════════════════════════════

```
Project {
  id: string
  title: { ar: string, fr: string, en: string }
  description: { ar: string, fr: string, en: string }
  category: string
  image: string
  gallery: string[]
  goalAmount: number
  raisedAmount: number
  beneficiaryCount: number
  location: string
  startDate: date
  endDate: date
  status: 'draft' | 'active' | 'completed' | 'cancelled'
  featured: boolean
  createdAt: date
  updatedAt: date
}

Donor {
  id: string
  name: string
  email: string
  phone: string
  countryCode: string
  address?: string
  createdAt: date
  totalDonated: number
  donationCount: number
}

Donation {
  id: string
  donorId: string
  projectId: string
  amount: number
  currency: string
  paymentMethod: 'bank_transfer' | 'credit_card' | 'cash'
  status: 'pending' | 'confirmed' | 'rejected'
  receiptUrl?: string
  notes?: string
  createdAt: date
  confirmedAt?: date
}

AssociationInfo {
  name: string
  description: { ar: string, fr: string, en: string }
  foundedYear: number
  logo: string
  address: string
  phones: string[]
  email: string
  whatsapp: string
  socialLinks: {
    facebook?: string
    instagram?: string
    twitter?: string
    youtube?: string
  }
  bankAccounts: {
    bank: string
    accountNumber: string
    accountName: string
  }[]
}
```

---

### ═══════════════════════════════════════════════════════════
### SECTION 5: USER FLOWS
### ═══════════════════════════════════════════════════════════

```
FLOW 1: New Donor Journey
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Visit Home → Browse Projects → Select Project → View Details
    ↓
Click Donate → Register/Login → Enter Amount → Verify Phone
    ↓
Choose Payment → Complete Payment → Upload Receipt → Success!

FLOW 2: Returning Donor
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Login with Phone → Enter Code → Browse Projects → Select Project
    ↓
Enter Amount → Choose Payment → Complete → Success!

FLOW 3: Admin Project Creation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Login → Dashboard → Projects → New Project
    ↓
Fill Form → Upload Images → Set Goal → Publish

FLOW 4: Admin Donation Verification
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Dashboard → Donations → Filter Pending → View Details
    ↓
Check Receipt → Confirm/Update → Donor notified
```

---

### ═══════════════════════════════════════════════════════════
### SECTION 6: DESIGN NOTES
### ═══════════════════════════════════════════════════════════

**Logo Colors:**
- Primary: `#0D7377` (Teal)
- Background: `#0D7377`
- Text: `#FFFFFF`

**Design Requirements:**
1. **Modern & Clean**: Apple-inspired minimalism
2. **Trustworthy**: Professional, not playful
3. **Culturally Appropriate**: Islamic/Arabic design elements
4. **RTL Support**: Full Arabic layout support
5. **Mobile-First**: Responsive all breakpoints
6. **Accessible**: WCAG AA compliance

**Typography:**
- Arabic: Noto Sans Arabic / Tajawal
- Latin: Inter / SF Pro

**Key UI Elements to Design:**
- [ ] Home Page (All sections)
- [ ] Projects List Page
- [ ] Project Detail Page
- [ ] Donation Flow (5 steps)
- [ ] Login/Register Pages
- [ ] User Profile Page
- [ ] About Page
- [ ] Contact Page
- [ ] Admin Dashboard
- [ ] Admin Projects List
- [ ] Admin Project Form
- [ ] Admin Donations List
- [ ] Admin Donors List
- [ ] Header Component
- [ ] Footer Component
- [ ] Project Card Component
- [ ] Progress Bar Component
- [ ] Stats Cards
- [ ] Donation Chart
- [ ] Empty States
- [ ] Loading States
- [ ] Toast Notifications
- [ ] Modals

---

## 📝 Next Steps for Design

1. Design each page/component in your preferred tool (Figma, Adobe XD, etc.)
2. Export designs as images or share Figma link
3. Provide the designs to me for implementation
4. I'll code each component to match your designs pixel-perfect

**Priority Order (Suggested):**
1. Home Page (most important)
2. Project Detail + Donation Flow (conversion critical)
3. Login/Register (user onboarding)
4. Projects List
5. Admin Dashboard
6. Remaining pages

---

*Document Version: 1.0*
*Last Updated: 2025*
*Association Espoir - Design Specification*

# User/Public Side - Design Prompts

---

## 👤 User Personas

### Persona 1: First-Time Visitor (Non-registered)
**Name:** Ahmed, 35, Casablanca  
**Goal:** Learn about the association and decide whether to donate  
**Needs:**
- Understand what Association Espoir does
- See credibility/trust signals
- Browse projects easily
- Understand donation process

### Persona 2: Returning Donor (Registered)
**Name:** Fatima, 42, Rabat  
**Goal:** Make a donation to a specific cause  
**Needs:**
- Quick login with phone
- Browse projects efficiently
- Easy donation flow
- Track donation history
- Receive receipts

---

## 📊 User Journey Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         USER JOURNEY FLOW                                    │
└─────────────────────────────────────────────────────────────────────────────┘

FIRST-TIME VISITOR FLOW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    ┌──────────┐
    │  LANDS   │
    │   ON     │
    │   HOME   │
    └────┬─────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│  HOME PAGE                                                          │
│  • Sees hero with emotional image + dua                             │
│  • Trust badge "جمعية معتمدة"                                       │
│  • Stats showing impact (projects, beneficiaries, amount)           │
│  • Featured projects                                                │
│  • "How it works" steps                                             │
└────┬────────────────────────────────────────────────────────────────┘
     │
     ├─────────────────┬───────────────┬──────────────┐
     │                 │               │              │
     ▼                 ▼               ▼              ▼
┌─────────┐     ┌──────────┐   ┌──────────┐   ┌──────────┐
│ PROJECTS│     │  ABOUT   │   │ CONTACT  │   │ DONATE   │
│  LIST   │     │   PAGE   │   │   PAGE   │   │  BUTTON  │
└────┬────┘     └──────────┘   └──────────┘   └────┬─────┘
     │                                              │
     ▼                                              ▼
┌────────────────────────────────┐          ┌──────────────────────┐
│ PROJECT DETAIL                 │          │ LOGIN / REGISTER     │
│ • Project info                 │          │ • Phone input        │
│ • Progress bar                 │          │ • Verification code  │
│ • "Donate Now" button          │          │ • Name/Email (new)   │
└────┬───────────────────────────┘          └────┬─────────────────┘
     │                                           │
     └───────────────────┬───────────────────────┘
                         ▼
              ┌──────────────────────┐
              │   DONATION FLOW      │
              │   (5 Steps)          │
              ├──────────────────────┤
              │ 1. Select Amount     │
              │ 2. Enter Info        │
              │ 3. Verify Phone      │
              │ 4. Choose Payment    │
              │ 5. Upload Receipt    │
              │ 6. Success!          │
              └────┬─────────────────┘
                   │
                   ▼
            ┌──────────────┐
            │  THANK YOU   │
            │   PAGE       │
            │  • Receipt   │
            │  • Share     │
            └──────────────┘

RETURNING DONOR FLOW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    ┌──────────┐
    │  LOGIN   │────▶ Enter Phone → Enter Code → Dashboard
    └────┬─────┘
         │
         ▼
    ┌──────────┐
    │  PROFILE │
    │   PAGE   │
    ├──────────┤
    │ • Info   │
    │ • History│
    │ • Receipts
    └──────────┘
```

---

## 🎨 Design Prompts for Each User Page

---

### PAGE 1: HOME PAGE (Landing) ⭐ MOST IMPORTANT
**Route:** `/`

**Purpose:** Make emotional connection, build trust, drive donations

**Design Description:**
Create an emotionally impactful landing page that tells a story and inspires action.

**HERO SECTION:**
- Full-width background image of happy children (not sad/pity-inducing)
- Dark gradient overlay for text readability
- Trust badge at top: "جمعية معتمدة | تأسست عام 2018" with sparkle icon
- Association logo (centered)
- Main headline in large Arabic calligraphy style: "حياة أطفالنا"
- Subheadline: "هدفكم"
- Brief description paragraph
- TWO CTAs side by side:
  - "اكتشف المشاريع" (secondary/outline button)
  - "ابدأ الآن" (primary button with heart icon)
- Scroll indicator animation at bottom

**STATS BAR:**
- 3 statistics in a row:
  - "+694" / "مشروع"
  - "+18,000" / "مستفيد"
  - "5,000,000+ DH" / "مجموع التبرعات"
- Large numbers with animated counter effect
- Clean, minimal design with icons

**PROJECTS SECTION:**
- Section title: "مشاريعنا" with subtitle "قضايا تحتاج إلى دعمكم"
- "عرض الكل" link on left
- 2-3 project cards in a row
- Each card:
  - Project image (top)
  - Category badge (e.g., "تعليم", "صحة")
  - Project title
  - Short description (2 lines)
  - Progress bar
  - " raised / goal" text

**HOW IT WORKS:**
- 3 steps with icons in circles:
  1. "اختر مشروعاً" - Heart icon
  2. "سجل معلوماتك" - Users icon
  3. "أتمم التبرع" - HandHeart icon
- Connecting line between steps
- Brief description under each

**ISLAMIC DUA SECTION:**
- Quote: "أنا وكافل اليتيم في الجنة هكذا"
- Source: "رواه البخاري ومسلم"
- Decorative Islamic geometric pattern or frame
- Calm, spiritual feel

**FINAL CTA:**
- Background color or subtle pattern
- Title: "كن جزءاً من التغيير"
- Description
- "أنشئ حسابك" button

---

### PAGE 2: PROJECTS LIST
**Route:** `/projets`

**Purpose:** Browse all available charity projects

**Design Description:**
Create a browse/discovery page that helps users find causes they care about.

**PAGE HEADER:**
- Title: "المشاريع"
- Subtitle or description

**CATEGORY FILTER BAR:**
- Horizontal scrollable tabs:
  - الكل (All)
  - تعليم (Education)
  - صحة (Health)
  - سكن (Housing)
  - طوارئ (Emergency)
  - غذاء (Food)
- Active category highlighted

**PROJECT GRID:**
- Responsive: 1 col mobile, 2 tablet, 3 desktop
- Same project cards as home page
- Infinite scroll OR pagination

**EMPTY STATE:**
- Icon (search or folder)
- "لا توجد مشاريع في هذا القسم"

---

### PAGE 3: PROJECT DETAIL
**Route:** `/projets/:id`

**Purpose:** Show full project details and drive donation action

**Design Description:**
Create a compelling project page that converts visitors into donors.

**HERO HEADER:**
- Large project image (full width)
- Category badge (overlaid or below)
- Project title (large)
- Status badge (Active/Completed)

**DONATION PROGRESS CARD:**
- Sticky or prominent section
- Large progress bar showing % funded
- Amount raised (big number)
- Goal amount
- Number of donors
- Days remaining
- "تبرع الآن" CTA button (large, prominent)

**PROJECT INFO:**
- Rich description (multiple paragraphs)
- Beneficiary details
- Location
- Start/End dates

**IMAGE GALLERY:**
- Grid of project photos
- Click to enlarge (lightbox)

**PROJECT UPDATES:**
- Timeline of updates
- Date + content
- Photos if available

**SIMILAR PROJECTS:**
- "مشاريع مشابهة"
- 2-3 related projects at bottom

---

### PAGE 4: DONATION FLOW (Multi-Step Wizard)
**Route:** `/donation/:projectId`

**Purpose:** Complete donation process smoothly

**Design Description:**
Create a step-by-step wizard that's clear, trustworthy, and easy to complete.

**STEP 1: SELECT AMOUNT**
- Project summary card at top (mini version)
- Predefined amount buttons: 100, 250, 500, 1000, 2000 DH
- Custom amount input
- Impact message (e.g., "يسمح بتوفير وجبات لـ 5 أطفال")
- "متابعة" button

**STEP 2: DONOR INFORMATION**
- Full name input
- Email input
- Phone number input (with country code dropdown)
- Checkbox: "أرغب في استلام التأكيد عبر واتساب"
- "متابعة" button

**STEP 3: PHONE VERIFICATION**
- Title: "أدخل رمز التحقق"
- 6-digit input boxes (auto-focus between them)
- "تم إرسال الرمز إلى +212..."
- Resend timer: "إعادة الإرسال بعد 2:00"
- "تحقق" button

**STEP 4: PAYMENT METHOD**
- Options displayed as cards:
  - "تحويل بنكي" (Bank Transfer) - with bank logos (CIH, BMCE, etc.)
  - "بطاقة بنكية" (Credit Card) - with card icons
  - "نقدي" (Cash) - at agency
- Selected method shows details:
  - For bank: account number, account name (copy button)
  - For card: "سيتم تحويلك إلى بوابة الدفع الآمنة"
- "تم التحويل" or "الدفع الآن" button

**STEP 5: RECEIPT UPLOAD**
- Title: "أرفق إيصال التحويل"
- Drag & drop zone
- "اختر ملف" button
- Supported formats text: "JPG, PNG, PDF"
- Preview if uploaded
- "إرسال" button

**STEP 6: SUCCESS / THANK YOU**
- Large checkmark animation/icon
- "شكراً لك!"
- Donation reference number
- "سنقوم بالتحقق من التبرع وإرسال تأكيد عبر واتساب"
- Share buttons: WhatsApp, Facebook
- "العودة للرئيسية" button

---

### PAGE 5: LOGIN / AUTHENTICATION
**Route:** `/connexion`

**Purpose:** Quick, easy login for returning donors

**Design Description:**
Create a simple, frictionless login experience.

**LOGIN FORM:**
- Title: "تسجيل الدخول"
- Phone number input with country code selector
- "إرسال رمز التحقق" button

**VERIFICATION SECTION** (appears after):
- "أدخل الرمز المكون من 6 أرقام"
- 6-digit code input (auto-focus)
- Resend option
- "تأكيد" button

**NEW USER REGISTRATION:**
- If phone not found, show:
- "أنشئ حسابك"
- Name input
- Email input
- "إنشاء حساب" button

---

### PAGE 6: USER PROFILE
**Route:** `/profil`

**Purpose:** Manage account and view donation history

**Design Description:**
Create a personal dashboard for donors.

**PROFILE HEADER:**
- Large avatar with initials
- User name
- Member since date
- Total donated amount (prominent)

**PERSONAL INFO TAB:**
- Editable form:
  - Full name
  - Email
  - Phone
  - Address (optional)
- "حفظ التغييرات" button

**DONATION HISTORY TAB:**
- List of all donations
- Each row:
  - Project name
  - Amount
  - Date
  - Status (badge)
  - Download receipt link

**SETTINGS TAB:**
- Language preference
- Notification settings
- Change password
- Logout button

---

### PAGE 7: ABOUT US
**Route:** `/a-propos`

**Purpose:** Build trust and credibility

**Design Description:**
Create an inspiring page about the association's mission and impact.

**MISSION SECTION:**
- Title: "رسالتنا"
- Mission statement
- Vision statement
- Large impactful image

**HISTORY TIMELINE:**
- Founded year (2018) highlighted
- Key milestones with dates
- Achievements over the years

**VALUES SECTION:**
- 3-4 core values with icons:
  - الشفافية (Transparency)
  - الرحمة (Compassion)
  - الأمانة (Integrity)
  - التأثير (Impact)

**STATISTICS:**
- Large numbers:
  - Years of service
  - Total projects
  - Total beneficiaries
  - Total donations

**TEAM SECTION** (Optional):
- Key team members with photos

---

### PAGE 8: CONTACT
**Route:** `/contact`

**Purpose:** Allow visitors to reach the association

**Design Description:**
Create a friendly, accessible contact page.

**CONTACT INFO CARD:**
- Address
- Phone numbers
- Email
- WhatsApp number (clickable)
- Social media icons (Facebook, Instagram, etc.)

**CONTACT FORM:**
- Name input
- Email input
- Subject dropdown:
  - استفسار عام (General inquiry)
  - تبرع (Donation)
  - تعاون (Partnership)
  - أخرى (Other)
- Message textarea
- "إرسال" button

**MAP SECTION:**
- Embedded Google Map
- Office location marker

---

## 🧩 Shared User Components

### COMPONENT: Header (Global)
**Usage:** All public pages

**Elements:**
- Logo (left in LTR, right in RTL)
- Navigation: الرئيسية, المشاريع, من نحن, اتصل بنا
- Language switcher (AR / FR / EN)
- "تبرع الآن" button (prominent)
- Mobile hamburger menu
- Sticky on scroll with blur effect

### COMPONENT: Footer (Global)
**Usage:** All public pages

**Elements:**
- 4 columns:
  1. Logo + description + social icons
  2. روابط سريعة (Quick links)
  3. قانوني (Legal links)
  4. تواصل معنا (Contact info)
- Copyright bar at bottom

### COMPONENT: Project Card
**Usage:** Home, Projects List

**Elements:**
- Image (top)
- Category badge
- Title
- Description (2 lines max)
- Progress bar
- Amount raised / Goal
- Clickable to project detail

### COMPONENT: Progress Bar
**Usage:** Project Card, Project Detail

**Elements:**
- Fill bar showing percentage
- Percentage text
- Color based on progress

### COMPONENT: Empty State
**Usage:** Lists with no data

**Elements:**
- Icon
- Title
- Description
- Optional action button

---

## 📐 Design Principles

**Emotional but Respectful:**
- Show hope and dignity, not pity
- Happy children photos, not sad ones
- Uplifting messaging

**Trust Signals:**
- "جمعية معتمدة" badge prominently displayed
- Clear contact information
- Transparent project progress
- Receipt/verification system

**Cultural Sensitivity:**
- Islamic dua/hadith where appropriate
- RTL support throughout
- Arabic-first content
- Ramadan/religious event considerations

**Accessibility:**
- Large touch targets
- Clear contrast
- Screen reader support
- Reduced motion option

---

## ✅ Design Checklist

**Priority 1 - Core Pages:**
- [ ] Home Page (Hero, Stats, Projects, How it Works, Dua, CTA)
- [ ] Project Detail (Hero, Progress, Info, Gallery, Donate CTA)
- [ ] Donation Flow (6 steps)

**Priority 2 - Browse & Learn:**
- [ ] Projects List
- [ ] About Page
- [ ] Contact Page

**Priority 3 - User Account:**
- [ ] Login/Register
- [ ] User Profile

**Priority 4 - Shared Components:**
- [ ] Header
- [ ] Footer
- [ ] Project Card
- [ ] Progress Bar

---

*Ready for your designs! Share each page and I'll implement them.*

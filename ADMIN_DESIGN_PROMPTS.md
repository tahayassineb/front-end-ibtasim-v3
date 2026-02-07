# Admin Panel - User Stories & Design Prompts

---

## 👤 Admin User Persona

**Name:** Fatima, Operations Manager at Association Espoir
**Role:** Manages projects, tracks donations, verifies payments
**Goals:**
- Create and manage charity projects efficiently
- Monitor donation flow and verify receipts
- Verify bank transfer receipts and approve donations
- Communicate with donors via WhatsApp
- Generate reports for stakeholders

---

## 📊 Admin User Story with Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ADMIN USER JOURNEY FLOW                              │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌──────────┐
    │  LOGIN   │
    │  Enter   │
    │  Email + │
    │  Password│
    └────┬─────┘
         │
         ▼
    ┌──────────┐     ┌────────────────────────────────────────────────────────┐
    │ DASHBOARD│────▶│  QUICK OVERVIEW                                       │
    │          │     │  • Today's donations & total amount                   │
    │  ─────── │     │  • Active projects count                              │
    │  Stats   │     │  • Pending verifications (urgent)                     │
    │  Charts  │     │  • Recent activity feed                               │
    │  Actions │     └────────────────────────────────────────────────────────┘
    └────┬─────┘
         │
    ┌────┴─────┬─────────────┬─────────────┬─────────────┐
    │          │             │             │             │
    ▼          ▼             ▼             ▼             ▼
┌───────┐ ┌────────┐  ┌──────────┐  ┌─────────┐  ┌──────────┐
│PROJECT│ │PROJECT │  │DONATIONS │  │ DONORS  │  │SETTINGS  │
│ LIST  │ │ FORM   │  │  LIST    │  │  LIST   │  │          │
│       │ │(Create/│  │          │  │         │  │          │
│       │ │ Edit)  │  │          │  │         │  │          │
└───┬───┘ └────┬───┘  └────┬─────┘  └────┬────┘  └────┬─────┘
    │          │           │             │            │
    ▼          ▼           ▼             ▼            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         COMMON ACTIONS                               │
│  • View Details  • Edit  • Delete  • Export  • Filter  • Search     │
└─────────────────────────────────────────────────────────────────────┘

FLOW 1: Create New Project
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Dashboard → Projects → New Project → Fill Form → Upload Images →
Set Goal & Dates → Publish → Project Live

FLOW 2: VERIFY DONATION (Critical Flow)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Dashboard → Donations → See URGENT Alert → Filter "Pending" →
Click "Verify" Button → Opens VERIFICATION MODAL →
├─ View Donor Info (Name, WhatsApp, Project, Amount, Date)
├─ View Submitted Receipt Image
├─ Check Verification Checklist:
│   □ Amount matches declaration
│   □ Reference is visible
│   □ Date is recent
│   □ Recipient account is correct
└─ Action: APPROVE or REJECT

FLOW 3: View Donor History
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Dashboard → Donors → Search Name → Click Donor →
View Profile → See All Donations → Contact via WhatsApp

FLOW 4: Edit Existing Project
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Dashboard → Projects → Search Project → Click Edit →
Modify Fields → Save Changes → Update Live
```

---

## 🎯 CRITICAL FEATURE: Donation Verification Modal

This is the MOST IMPORTANT admin feature. Design a detailed verification modal that includes:

**LEFT SIDE - Donation Information:**
- Donor name
- WhatsApp number (clickable to open chat)
- Project name
- Declared amount (large, prominent)
- Submission date

**RIGHT SIDE - Receipt & Checklist:**
- Receipt image viewer (can be empty/null)
- 4-point verification checklist with checkboxes:
  1. Amount matches declaration
  2. Reference is visible
  3. Date is recent
  4. Recipient account is correct

**BOTTOM ACTIONS:**
- Cancel button
- Reject button (with reason input)
- Approve Donation button (primary action)

---

## 🎨 Design Prompts for Each Admin Page

---

### PAGE 1: ADMIN LOGIN
**Route:** `/admin/login`

**Purpose:** Secure authentication for admin staff

**Design Description:**
Create a clean, focused login screen with centered layout. Include email input field, password input with visibility toggle, "Remember me" checkbox, and prominent login button. Add forgot password link. The page should feel secure and professional - no distractions, just the essentials. Include the association logo at top for branding. Error states should be clear but non-intrusive.

**Key Elements:**
- Centered card layout
- Email input
- Password input with show/hide toggle
- Login button (primary action)
- Forgot password link
- Error message area

---

### PAGE 2: ADMIN DASHBOARD
**Route:** `/admin`

**Purpose:** Overview of association activity and quick access to all functions

**Design Description:**
Design an executive dashboard with key metrics at the top - show 4 stat cards displaying: total donations (with amount), active projects count, total donors, and pending verifications (highlighted if >0). Below, place a line chart showing donation trends over the last 30 days. Add a "Recent Donations" table showing last 5-10 donations with donor name, project, amount, and status. Include "Quick Actions" buttons for "New Project" and "Add Donation". The sidebar should be collapsible and show navigation to all admin sections.

**Key Elements:**
- 4 stat cards (row layout)
- Line chart (donations over time)
- Recent donations table (5-10 rows)
- Quick action buttons
- Sidebar navigation
- Welcome message with admin name

---

### PAGE 3: PROJECTS MANAGEMENT LIST
**Route:** `/admin/projets`

**Purpose:** View, search, and manage all charity projects

**Design Description:**
Create a data table view for managing projects. Top section has page title, "New Project" button, and search input. Add filter pills/buttons for: All, Active, Completed, Draft, Cancelled. The main table shows columns: thumbnail image, project title, category badge, goal amount, raised amount with progress bar, status badge, and action buttons (Edit, View, Delete). Include pagination at bottom. Empty state should show "No projects found" with illustration. Each row should be hoverable for better UX.

**Key Elements:**
- Page header with title + "New Project" CTA
- Search bar
- Status filter tabs/pills
- Data table with:
  - Thumbnail column
  - Title column
  - Category badge
  - Goal amount
  - Progress column (bar + percentage)
  - Status badge (color-coded)
  - Action buttons (edit, view, delete)
- Pagination
- Empty state design

---

### PAGE 4: PROJECT CREATE/EDIT FORM
**Route:** `/admin/projets/nouveau` or `/admin/projets/:id/edit`

**Purpose:** Create new projects or edit existing ones

**Design Description:**
Design a multi-section form with clear visual hierarchy. Organize into tabs or sections: Basic Info (title in 3 languages, description in 3 languages, category dropdown), Financial (goal amount, minimum donation), Media (main image upload with preview, gallery images with multiple upload, drag-drop zone), Details (beneficiary count, location, start/end dates with date pickers), and Settings (status dropdown: Draft/Active/Completed, featured toggle switch). Show form validation inline. Bottom sticky bar with "Save", "Save as Draft", and "Cancel" buttons. Progress indicator showing required fields completion.

**Key Elements:**
- Multi-section form layout
- Language tabs (AR, FR, EN) for text fields
- Image upload with preview
- Gallery multiple upload
- Date pickers
- Toggle switches
- Dropdown selects
- Rich text editor (optional)
- Validation messages
- Action bar (Save, Draft, Cancel)

---

### PAGE 5: DONATIONS MANAGEMENT ⭐ MOST USED PAGE
**Route:** `/admin/donations`

**Purpose:** View all donations, verify bank transfer receipts, approve/reject donations

**Design Description:**
This is THE MOST IMPORTANT admin page. The admin spends most of their time here verifying donations.

**URGENT ALERT:** At the top, show a banner when donations need verification: "⚠️ X donations pending verification" with warning styling.

**Filter Bar:**
- Status filter pills with counts: "All (50)", "Pending (5)", "Verified (43)", "Failed (2)"
- Project dropdown filter (all projects)
- Search input for donor name or reference

**Mobile View:** Cards showing:
- Donor name + status badge
- Project name
- Amount
- Payment method (card/bank transfer)
- Date
- "Verify" button (only for pending)

**Desktop Table:**
- Donor name (with "Anonymous" label if applicable)
- Project name
- Amount (bold)
- Payment method
- Reference number
- Status badge with icon (Pending=clock, Verified=check, Failed=x)
- Date
- Actions: "Verify" link for pending, eye icon for others

**Highlight pending rows** with orange background.

---

### PAGE 5B: DONATION VERIFICATION MODAL ⭐ CRITICAL FEATURE
**Route:** Modal opened when clicking "Verify" on pending donation

**Purpose:** View donor info, see receipt, verify and approve/reject donation

**Design Description - Two Column Modal:**

**LEFT COLUMN - Donation Information:**
- Header: "Verify Donation" + Reference number
- Donor Name (heading style)
- WhatsApp Number (clickable)
- Project Name
- Declared Amount (large, prominent)
- Submission Date

**RIGHT COLUMN - Receipt & Verification:**
- Section: "Submitted Receipt"
  - If receipt uploaded: show image preview
  - If no receipt: "No receipt attached" placeholder
- Section: "Verification Checklist"
  - 4 checkboxes:
    □ Amount matches declaration
    □ Reference is visible
    □ Date is recent
    □ Recipient account is correct

**BOTTOM ACTIONS:**
- Cancel button
- Reject button (with reason input option)
- Approve Donation button (primary action)

**Key Elements:**
- Two-column layout
- Receipt image viewer
- 4-point verification checklist
- Approve/Reject actions

---

### PAGE 6: DONORS LIST
**Route:** `/admin/donateurs`

**Purpose:** Manage donor database and view donor activity

**Design Description:**
Design a donor directory with search and filter capabilities. Header has title and search bar. Table columns: donor name, phone number, email, total donated amount, number of donations, first donation date, last donation date, and "View" action button. Add sortable columns with arrow indicators. Clicking a row opens donor detail. Show donor tier badges (Bronze, Silver, Gold) based on total donated. Empty state for no donors. Pagination at bottom.

**Key Elements:**
- Search bar
- Sortable table columns
- Donor info columns
- Donation statistics
- Date columns
- Tier/badge indicators
- "View Details" action
- Pagination

---

### PAGE 7: DONOR DETAIL PAGE
**Route:** `/admin/donateurs/:id`

**Purpose:** View complete profile and history of individual donor

**Design Description:**
Create a profile view with two main sections. Top section: donor info card showing large avatar with initials, full name, phone, email, address, member since date, total donated amount (large number), and donation count. Bottom section: donation history table with all donations by this donor, showing: project name, amount, date, payment method, status, and receipt download link. Include "Export History" button. Add "Send Message" button for WhatsApp/email communication.

**Key Elements:**
- Profile header card
- Avatar with initials
- Contact information
- Statistics display
- Donation history table
- Receipt download links
- Export button
- Communication buttons

---

### PAGE 8: ADMIN SETTINGS
**Route:** `/admin/parametres`

**Purpose:** Configure association information and system settings

**Design Description:**
Design a settings page organized in tabs or sections: Association Info (name, description in 3 languages, founded year, logo upload with preview), Contact Details (address, phones, email, WhatsApp number, social media links with icons), Bank Accounts (multiple bank entries with bank name, account number, account holder name - add/remove capability), Payment Integration (Whop payment link input), and Notifications (email toggle, WhatsApp toggle). Each section should have its own save button. Show success message on save.

**Key Elements:**
- Tabbed or sectioned layout
- Logo upload with preview
- Text inputs (single and multi-language)
- Phone inputs
- Social media link inputs
- Bank account repeater (add/remove)
- Toggle switches
- Save buttons per section
- Success notification

---

## 🧩 Shared Admin Components

### COMPONENT: Admin Sidebar
**Usage:** All admin pages

**Design Description:**
Create a vertical navigation sidebar with the association logo at top. Menu items: Dashboard (home icon), Projects (folder icon), Donations (heart icon), Donors (users icon), Settings (gear icon). Active item should be highlighted. Include logout button at bottom. Collapsible on mobile with hamburger menu. RTL support for Arabic layout.

**Items:**
- Logo header
- Navigation links with icons
- Active state indicator
- Logout button
- Collapse/expand toggle

### COMPONENT: Admin Header Bar
**Usage:** All admin pages

**Design Description:**
Top bar showing page title/breadcrumb, notification bell icon with badge count, user profile dropdown with avatar and name. Sticky positioning. Clean, minimal design that doesn't compete with content.

**Items:**
- Page title
- Breadcrumb
- Notification icon with badge
- User profile dropdown

### COMPONENT: Data Table
**Usage:** Projects, Donations, Donors lists

**Design Description:**
Reusable table component with consistent styling. Header row with column titles and sort indicators. Alternating row colors or hover states. Action buttons column at end. Pagination footer. Empty state handling. Responsive horizontal scroll on mobile.

### COMPONENT: Status Badge
**Usage:** Throughout admin

**Design Description:**
Small pill/badge showing status. Different variants: Pending (warning style), Confirmed/Active (success style), Rejected/Cancelled (error style), Draft (neutral style).

### COMPONENT: Stat Card
**Usage:** Dashboard

**Design Description:**
Card showing single metric with icon, large number value, label, and optional trend indicator (up/down arrow with percentage).

### COMPONENT: Filter Bar
**Usage:** List pages

**Design Description:**
Horizontal bar containing search input, filter dropdowns, and action buttons. Clean separation from content below.

---

## 📐 Design Principles (No Colors)

**Layout:**
- Sidebar + Main content structure
- Generous whitespace
- Clear visual hierarchy
- Consistent spacing system

**Typography:**
- Clear headings hierarchy
- Readable body text
- Monospace for numbers/IDs

**Components:**
- Rounded corners on cards/buttons
- Subtle shadows for elevation
- Clear focus states
- Hover effects on interactive elements

**Tables:**
- Clear header separation
- Alternating row backgrounds or hover states
- Action buttons grouped
- Responsive horizontal scroll

**Forms:**
- Clear labels
- Inline validation
- Section grouping
- Progress indicators for multi-step

---

*Ready for your designs! Share each page design and I'll implement them.*

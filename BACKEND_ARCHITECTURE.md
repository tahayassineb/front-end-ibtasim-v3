# Ibtasim - Backend Architecture

## Overview

This document outlines the complete backend architecture for the Ibtasim charity platform using **Convex** as the serverless backend platform.

---

## Table of Contents

1. [Tech Stack Overview](#1-tech-stack-overview)
2. [Convex Architecture](#2-convex-architecture)
3. [Database Schema](#3-database-schema)
4. [Convex Functions (APIs)](#4-convex-functions-apis)
5. [Payment Flow with Whop](#5-payment-flow-with-whop)
6. [WhatsApp Integration (Wasender)](#6-whatsapp-integration-wasender)
7. [Frontend Integration](#7-frontend-integration)
8. [Security Model](#8-security-model)
9. [User Language Preference System](#9-user-language-preference-system)
10. [Deployment Plan](#10-deployment-plan)
11. [Development Phases](#11-development-phases)
12. [GDPR and Data Retention](#12-gdpr-and-data-retention)
13. [Backup & Disaster Recovery](#13-backup--disaster-recovery)
14. [Optional Enhancements](#14-optional-enhancements)

---

## 1. Tech Stack Overview

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Database** | Convex | Serverless real-time database |
| **File Storage** | Convex Storage | Receipt uploads, project images |
| **Payments** | Whop | Card payment processing |
| **Notifications** | Wasender API | WhatsApp notifications |
| **Frontend Hosting** | Vercel | React application deployment |
| **Backend** | Convex | Serverless functions (automatically deployed) |

---

## 2. Convex Architecture

### 2.1 How Convex Works

Convex combines a real-time database with serverless functions in a single platform:

```
┌─────────────────────────────────────────────────────────────┐
│                      CONVEX PLATFORM                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐      ┌──────────────────┐            │
│  │   QUERY FUNCTIONS │      │ MUTATION FUNCTIONS│            │
│  │   (Read-only)     │      │   (Write + Read)  │            │
│  │                   │      │                   │            │
│  │  • getProjects()  │      │  • createDonation()│            │
│  │  • getDonations() │      │  • updateProject() │            │
│  │  • getUser()      │      │  • verifyDonation()│            │
│  └─────────┬─────────┘      └─────────┬─────────┘            │
│            │                          │                      │
│            ▼                          ▼                      │
│  ┌──────────────────────────────────────────┐               │
│  │         CONVEX DATABASE                  │               │
│  │  • Documents (JSON-like)                 │               │
│  │  • Real-time subscriptions               │               │
│  │  • Automatic caching                     │               │
│  │  • Optimistic updates                    │               │
│  └──────────────────────────────────────────┘               │
│            │                                                 │
│            ▼                                                 │
│  ┌──────────────────────────────────────────┐               │
│  │         CONVEX STORAGE                   │               │
│  │  • File uploads (receipts, images)       │               │
│  │  • Signed URLs for secure access         │               │
│  └──────────────────────────────────────────┘               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Key Concepts

| Concept | Description | Example |
|---------|-------------|---------|
| **Queries** | Read-only functions that automatically re-run when data changes | [`getProjects()`](convex/projects.ts:1) |
| **Mutations** | Write operations that modify data | [`createDonation()`](convex/donations.ts:1) |
| **Actions** | Functions that can call external APIs | [`sendWhatsAppNotification()`](convex/actions.ts:1) |
| **Schema** | Type-safe database definitions | [`schema.ts`](convex/schema.ts:1) |

### 2.3 Project Structure

```
convex/
├── _generated/           # Auto-generated code (don't edit)
│   ├── api.d.ts
│   └── server.d.ts
├── schema.ts             # Database schema definition
├── auth.ts               # Authentication functions
├── users.ts              # User-related queries/mutations
├── projects.ts           # Project CRUD operations
├── donations.ts          # Donation management
├── payments.ts           # Payment processing
├── verifications.ts      # Verification workflow
├── admin.ts              # Admin dashboard functions
├── notifications.ts      # WhatsApp notification functions
├── storage.ts            # File upload handlers
├── http.ts               # HTTP actions (webhooks)
├── rateLimiter.ts        # Rate limiting utilities
├── retry.ts              # API retry logic
├── sanitization.ts       # Input sanitization
└── webhooks.ts           # Webhook signature verification
```

---

## 3. Database Schema

### 3.1 Schema Definition

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ============================================
  // USERS TABLE (Donors)
  // ============================================
  users: defineTable({
    // Profile
    fullName: v.string(),
    email: v.string(),
    phoneNumber: v.string(), // International format: +2126XXXXXXXX
    
    // Authentication
    isVerified: v.boolean(),
    verificationCode: v.optional(v.string()),
    codeExpiresAt: v.optional(v.number()), // Unix timestamp
    
    // Rate limiting for OTP
    otpRequestCount: v.optional(v.number()),      // Requests in current window
    otpWindowStart: v.optional(v.number()),       // Window start timestamp
    lastOtpRequestAt: v.optional(v.number()),     // Last request timestamp
    
    // Metadata
    createdAt: v.number(),
    lastLoginAt: v.number(),
    
    // Preferences
    preferredLanguage: v.union(v.literal("ar"), v.literal("fr"), v.literal("en")), // 'ar' (Arabic), 'fr' (French), 'en' (English)
    notificationsEnabled: v.boolean(),
    
    // Totals for quick access
    totalDonated: v.number(), // In cents (MAD)
    donationCount: v.number(),
    
    // GDPR / Data retention
    dataRetentionConsent: v.boolean(),
    consentGivenAt: v.optional(v.number()),
    dataDeletionRequestedAt: v.optional(v.number()),
  })
    .index("by_phone", ["phoneNumber"])
    .index("by_email", ["email"]),

  // ============================================
  // ADMINS TABLE (Simplified - Single Role)
  // ============================================
  admins: defineTable({
    userId: v.id("users"), // Reference to users table
    email: v.string(),
    passwordHash: v.string(), // bcrypt hashed password
    
    // Status
    isActive: v.boolean(),
    lastLoginAt: v.number(),
    createdAt: v.number(),
    createdBy: v.optional(v.id("admins")), // null for initial admin
  })
    .index("by_user", ["userId"])
    .index("by_email", ["email"]),

  // ============================================
  // PROJECTS TABLE
  // ============================================
  projects: defineTable({
    // Basic Info
    title: v.object({
      ar: v.string(),
      fr: v.string(),
      en: v.string(),
    }),
    description: v.object({
      ar: v.string(),
      fr: v.string(),
      en: v.string(),
    }),
    
    // Categorization
    category: v.union(
      v.literal("education"),
      v.literal("health"),
      v.literal("housing"),
      v.literal("emergency"),
      v.literal("food"),
      v.literal("water"),
      v.literal("orphan_care")
    ),
    
    // Financial
    goalAmount: v.number(), // In cents
    raisedAmount: v.number(), // In cents
    currency: v.literal("MAD"),
    
    // Media
    mainImage: v.string(), // Storage URL
    gallery: v.array(v.string()), // Additional images
    
    // Status
    status: v.union(
      v.literal("draft"),
      v.literal("active"),
      v.literal("funded"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    
    // Timeline
    startDate: v.number(),
    endDate: v.optional(v.number()),
    
    // Metadata
    createdBy: v.id("admins"),
    createdAt: v.number(),
    updatedAt: v.number(),
    
    // Feature flags
    isFeatured: v.boolean(),
    featuredOrder: v.optional(v.number()),
    
    // Location
    location: v.optional(v.string()),
    beneficiaries: v.optional(v.number()),
  })
    .index("by_status", ["status"])
    .index("by_category", ["category"])
    .index("by_featured", ["isFeatured", "featuredOrder"]),

  // ============================================
  // DONATIONS TABLE
  // ============================================
  donations: defineTable({
    // References
    userId: v.id("users"),
    projectId: v.id("projects"),
    
    // Amount
    amount: v.number(), // In cents
    currency: v.literal("MAD"),
    coversFees: v.boolean(), // User opted to cover transaction fees
    
    // Payment
    paymentMethod: v.union(
      v.literal("bank_transfer"),
      v.literal("card_whop"),
      v.literal("cash_agency")
    ),
    
    // Status workflow
    status: v.union(
      v.literal("pending"),       // Just created
      v.literal("awaiting_receipt"), // Bank transfer - needs receipt
      v.literal("awaiting_verification"), // Receipt uploaded
      v.literal("verified"),      // Admin verified
      v.literal("rejected"),      // Admin rejected
      v.literal("completed")      // Fully processed
    ),
    
    // Verification
    verifiedBy: v.optional(v.id("admins")),
    verifiedAt: v.optional(v.number()),
    verificationNotes: v.optional(v.string()),
    
    // Receipt (for bank transfers)
    receiptUrl: v.optional(v.string()),
    receiptUploadedAt: v.optional(v.number()),
    
    // Whop payment (for card payments)
    whopPaymentId: v.optional(v.string()),
    whopPaymentStatus: v.optional(v.string()),
    
    // Bank transfer details
    bankName: v.optional(v.string()),
    transactionReference: v.optional(v.string()),
    
    // Metadata
    isAnonymous: v.boolean(),
    message: v.optional(v.string()),
    
    createdAt: v.number(),
    updatedAt: v.number(),
    
    // Data retention
    canBeDeletedAfter: v.optional(v.number()), // Timestamp when donation can be anonymized
  })
    .index("by_user", ["userId"])
    .index("by_project", ["projectId"])
    .index("by_status", ["status"])
    .index("by_created", ["createdAt"]),

  // ============================================
  // PAYMENTS TABLE (Whop Integration)
  // ============================================
  payments: defineTable({
    // References
    donationId: v.id("donations"),
    userId: v.id("users"),
    
    // Whop-specific
    whopPaymentId: v.string(),
    whopProductId: v.optional(v.string()),
    
    // Amount breakdown
    amount: v.number(),
    platformFee: v.number(),
    processingFee: v.number(),
    netAmount: v.number(),
    
    // Status
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("refunded")
    ),
    
    // Timeline
    initiatedAt: v.number(),
    completedAt: v.optional(v.number()),
    failedAt: v.optional(v.number()),
    
    // Metadata
    failureReason: v.optional(v.string()),
    refundReason: v.optional(v.string()),
    
    // Webhook tracking
    lastWebhookAt: v.optional(v.number()),
    webhookEvents: v.optional(v.array(v.string())),
  })
    .index("by_donation", ["donationId"])
    .index("by_whop_id", ["whopPaymentId"])
    .index("by_status", ["status"]),

  // ============================================
  // VERIFICATIONS TABLE
  // ============================================
  verifications: defineTable({
    // Reference
    donationId: v.id("donations"),
    
    // Verification type
    type: v.union(
      v.literal("receipt"),
      v.literal("admin_override")
    ),
    
    // Status
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected")
    ),
    
    // Who verified
    verifiedBy: v.optional(v.id("admins")),
    
    // Evidence
    receiptUrl: v.optional(v.string()),
    notes: v.optional(v.string()),
    rejectionReason: v.optional(v.string()),
    
    // Timeline
    requestedAt: v.number(),
    reviewedAt: v.optional(v.number()),
  })
    .index("by_donation", ["donationId"])
    .index("by_status", ["status"]),

  // ============================================
  // SETTINGS TABLE
  // ============================================
  settings: defineTable({
    key: v.string(),
    value: v.any(),
    updatedBy: v.id("admins"),
    updatedAt: v.number(),
  })
    .index("by_key", ["key"]),

  // ============================================
  // TEAM MEMBERS TABLE
  // ============================================
  teamMembers: defineTable({
    name: v.object({
      ar: v.string(),
      fr: v.string(),
      en: v.string(),
    }),
    role: v.object({
      ar: v.string(),
      fr: v.string(),
      en: v.string(),
    }),
    bio: v.object({
      ar: v.string(),
      fr: v.string(),
      en: v.string(),
    }),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    isActive: v.boolean(),
    displayOrder: v.number(),
    createdAt: v.number(),
  })
    .index("by_active", ["isActive", "displayOrder"]),

  // ============================================
  // NOTIFICATION LOGS
  // ============================================
  notificationLogs: defineTable({
    userId: v.id("users"),
    donationId: v.optional(v.id("donations")),
    
    // Notification details
    type: v.union(
      v.literal("donation_received"),
      v.literal("donation_verified"),
      v.literal("receipt_uploaded"),
      v.literal("payment_confirmed"),
      v.literal("verification_reminder")
    ),
    
    // Language used for this notification (user's preference)
    language: v.union(v.literal("ar"), v.literal("fr"), v.literal("en")),
    
    // Wasender
    wasenderMessageId: v.optional(v.string()),
    wasenderStatus: v.optional(v.string()),
    
    // Retry tracking
    retryCount: v.optional(v.number()),
    maxRetriesReached: v.optional(v.boolean()),
    
    // Content
    phoneNumber: v.string(),
    message: v.string(),
    
    // Status
    status: v.union(
      v.literal("pending"),
      v.literal("sent"),
      v.literal("delivered"),
      v.literal("failed")
    ),
    
    // Timeline
    sentAt: v.number(),
    deliveredAt: v.optional(v.number()),
    failedAt: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
    
    // Manual retry
    requiresManualRetry: v.optional(v.boolean()),
    manualRetryAttemptedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_donation", ["donationId"])
    .index("by_status", ["status"])
    .index("by_manual_retry", ["requiresManualRetry"])
    .index("by_language", ["language"]),

  // ============================================
  // AUDIT LOGS
  // ============================================
  auditLogs: defineTable({
    actorId: v.union(v.id("users"), v.id("admins")),
    actorType: v.union(v.literal("user"), v.literal("admin")),
    
    action: v.string(), // e.g., "donation.created", "project.updated"
    resourceType: v.string(), // e.g., "donation", "project"
    resourceId: v.string(),
    
    // Details
    metadata: v.optional(v.any()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    
    createdAt: v.number(),
  })
    .index("by_actor", ["actorType", "actorId"])
    .index("by_resource", ["resourceType", "resourceId"])
    .index("by_created", ["createdAt"]),
    
  // ============================================
  // FAILED NOTIFICATIONS QUEUE (for retry)
  // ============================================
  failedNotifications: defineTable({
    notificationLogId: v.id("notificationLogs"),
    type: v.string(),
    phoneNumber: v.string(),
    message: v.string(),
    donationId: v.optional(v.id("donations")),
    retryCount: v.number(),
    lastError: v.string(),
    lastAttemptAt: v.number(),
    nextRetryAt: v.number(),
    status: v.union(v.literal("pending"), v.literal("processing"), v.literal("permanently_failed")),
  })
    .index("by_status_retry", ["status", "nextRetryAt"])
    .index("by_notification_log", ["notificationLogId"]),
});
```

---

## 4. Convex Functions (APIs)

### 4.1 Authentication Functions

```typescript
// convex/auth.ts

import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { generateOTP, sendWhatsAppOTP } from "./notifications";
import { checkRateLimit, recordOtpRequest } from "./rateLimiter";
import { sanitizeString } from "./sanitization";

/**
 * Register a new user
 * Creates user record and sends verification OTP
 */
export const register = mutation({
  args: {
    fullName: v.string(),
    email: v.string(),
    phoneNumber: v.string(),
    preferredLanguage: v.union(v.literal("ar"), v.literal("fr"), v.literal("en")),
  },
  returns: v.object({
    userId: v.id("users"),
    requiresVerification: v.boolean(),
  }),
  handler: async (ctx, args) => {
    // Sanitize inputs
    const sanitizedFullName = sanitizeString(args.fullName);
    const sanitizedEmail = sanitizeString(args.email.toLowerCase().trim());
    const sanitizedPhone = sanitizeString(args.phoneNumber.trim());
    
    // Check if phone already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_phone", q => q.eq("phoneNumber", sanitizedPhone))
      .first();
    
    if (existing) {
      throw new Error("Phone number already registered");
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Create user
    const userId = await ctx.db.insert("users", {
      fullName: sanitizedFullName,
      email: sanitizedEmail,
      phoneNumber: sanitizedPhone,
      isVerified: false,
      verificationCode: otp,
      codeExpiresAt: expiresAt,
      preferredLanguage: args.preferredLanguage,
      notificationsEnabled: true,
      totalDonated: 0,
      donationCount: 0,
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
      dataRetentionConsent: true,
      consentGivenAt: Date.now(),
    });

    // Schedule OTP send
    await ctx.scheduler.runAfter(0, api.notifications.sendVerificationOTP, {
      phoneNumber: sanitizedPhone,
      code: otp,
      language: args.preferredLanguage,
    });

    return { userId, requiresVerification: true };
  },
});

/**
 * Request login OTP with rate limiting
 * Max 3 requests per phone number per hour
 */
export const requestLoginOTP = mutation({
  args: {
    phoneNumber: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    userExists: v.boolean(),
    cooldownSeconds: v.optional(v.number()),
  }),
  handler: async (ctx, args) => {
    const sanitizedPhone = sanitizeString(args.phoneNumber.trim());
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_phone", q => q.eq("phoneNumber", sanitizedPhone))
      .first();

    if (!user) {
      return { success: false, userExists: false };
    }

    // Check rate limit: Max 3 OTP requests per hour
    const now = Date.now();
    const ONE_HOUR = 60 * 60 * 1000;
    const MAX_REQUESTS = 3;
    
    let requestCount = user.otpRequestCount || 0;
    let windowStart = user.otpWindowStart || now;
    
    // Reset window if expired
    if (now - windowStart > ONE_HOUR) {
      requestCount = 0;
      windowStart = now;
    }
    
    // Check if limit exceeded
    if (requestCount >= MAX_REQUESTS) {
      const cooldownSeconds = Math.ceil((windowStart + ONE_HOUR - now) / 1000);
      return { 
        success: false, 
        userExists: true, 
        cooldownSeconds 
      };
    }
    
    // Check cooldown between requests (30 seconds minimum)
    const MIN_COOLDOWN = 30 * 1000; // 30 seconds
    if (user.lastOtpRequestAt && (now - user.lastOtpRequestAt) < MIN_COOLDOWN) {
      const cooldownSeconds = Math.ceil((user.lastOtpRequestAt + MIN_COOLDOWN - now) / 1000);
      return { 
        success: false, 
        userExists: true, 
        cooldownSeconds 
      };
    }

    // Generate new OTP
    const otp = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000;

    await ctx.db.patch(user._id, {
      verificationCode: otp,
      codeExpiresAt: expiresAt,
      otpRequestCount: requestCount + 1,
      otpWindowStart: windowStart,
      lastOtpRequestAt: now,
    });

    // Send OTP
    await ctx.scheduler.runAfter(0, api.notifications.sendVerificationOTP, {
      phoneNumber: sanitizedPhone,
      code: otp,
      language: user.preferredLanguage,
    });

    return { success: true, userExists: true };
  },
});

/**
 * Verify OTP and complete login
 */
export const verifyOTP = mutation({
  args: {
    phoneNumber: v.string(),
    code: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    user: v.optional(v.any()),
  }),
  handler: async (ctx, args) => {
    const sanitizedPhone = sanitizeString(args.phoneNumber.trim());
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_phone", q => q.eq("phoneNumber", sanitizedPhone))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Validate OTP
    if (user.verificationCode !== args.code) {
      throw new Error("Invalid verification code");
    }

    if (user.codeExpiresAt && user.codeExpiresAt < Date.now()) {
      throw new Error("Verification code expired");
    }

    // Update user
    await ctx.db.patch(user._id, {
      isVerified: true,
      verificationCode: undefined,
      codeExpiresAt: undefined,
      lastLoginAt: Date.now(),
    });

    // Log audit
    await ctx.db.insert("auditLogs", {
      actorId: user._id,
      actorType: "user",
      action: "user.login",
      resourceType: "user",
      resourceId: user._id,
      createdAt: Date.now(),
    });

    return { 
      success: true, 
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        preferredLanguage: user.preferredLanguage,
        totalDonated: user.totalDonated,
        donationCount: user.donationCount,
      }
    };
  },
});

/**
 * Get current user
 */
export const getCurrentUser = query({
  args: {
    userId: v.id("users"),
  },
  returns: v.optional(v.any()),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;
    
    return {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      preferredLanguage: user.preferredLanguage,
      notificationsEnabled: user.notificationsEnabled,
      totalDonated: user.totalDonated,
      donationCount: user.donationCount,
      createdAt: user.createdAt,
    };
  },
});

/**
 * Update user's preferred language
 */
export const updatePreferredLanguage = mutation({
  args: {
    userId: v.id("users"),
    preferredLanguage: v.union(v.literal("ar"), v.literal("fr"), v.literal("en")),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(args.userId, {
      preferredLanguage: args.preferredLanguage,
    });

    // Log audit
    await ctx.db.insert("auditLogs", {
      actorId: args.userId,
      actorType: "user",
      action: "user.language_changed",
      resourceType: "user",
      resourceId: args.userId,
      metadata: { oldLanguage: user.preferredLanguage, newLanguage: args.preferredLanguage },
      createdAt: Date.now(),
    });

    return true;
  },
});
```

### 4.2 Project Functions

```typescript
// convex/projects.ts

import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { sanitizeString, sanitizeObject } from "./sanitization";

/**
 * Get all active projects
 * Supports pagination and filtering
 */
export const getProjects = query({
  args: {
    category: v.optional(v.string()),
    status: v.optional(v.string()),
    featured: v.optional(v.boolean()),
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.object({
    projects: v.array(v.any()),
    nextCursor: v.optional(v.string()),
    hasMore: v.boolean(),
  }),
  handler: async (ctx, args) => {
    let queryBuilder = ctx.db
      .query("projects")
      .order("desc");

    // Apply filters
    if (args.status) {
      queryBuilder = queryBuilder.filter(q => q.eq(q.field("status"), args.status));
    }
    if (args.category) {
      queryBuilder = queryBuilder.filter(q => q.eq(q.field("category"), args.category));
    }
    if (args.featured) {
      queryBuilder = queryBuilder.filter(q => q.eq(q.field("isFeatured"), true));
    }

    // Pagination
    const limit = args.limit || 20;
    const projects = await queryBuilder.take(limit);

    return {
      projects: projects.map(p => ({
        _id: p._id,
        title: p.title,
        description: p.description,
        category: p.category,
        goalAmount: p.goalAmount,
        raisedAmount: p.raisedAmount,
        mainImage: p.mainImage,
        status: p.status,
        isFeatured: p.isFeatured,
        featuredOrder: p.featuredOrder,
        location: p.location,
        beneficiaries: p.beneficiaries,
        progress: Math.round((p.raisedAmount / p.goalAmount) * 100),
      })),
      hasMore: projects.length === limit,
    };
  },
});

/**
 * Get single project by ID
 */
export const getProject = query({
  args: {
    projectId: v.id("projects"),
  },
  returns: v.optional(v.any()),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) return null;

    // Get recent donations for this project
    const recentDonations = await ctx.db
      .query("donations")
      .withIndex("by_project", q => q.eq("projectId", args.projectId))
      .filter(q => q.eq(q.field("status"), "completed"))
      .order("desc")
      .take(10);

    // Get donor names
    const donorIds = [...new Set(recentDonations.map(d => d.userId))];
    const donors = await Promise.all(
      donorIds.map(id => ctx.db.get(id))
    );

    return {
      ...project,
      progress: Math.round((project.raisedAmount / project.goalAmount) * 100),
      donorsCount: recentDonations.length,
      recentDonations: recentDonations.map(d => ({
        amount: d.amount,
        isAnonymous: d.isAnonymous,
        donorName: d.isAnonymous ? null : donors.find(u => u?._id === d.userId)?.fullName,
        createdAt: d.createdAt,
      })),
    };
  },
});

/**
 * Create new project (Admin only)
 */
export const createProject = mutation({
  args: {
    adminId: v.id("admins"),
    title: v.object({ ar: v.string(), fr: v.string(), en: v.string() }),
    description: v.object({ ar: v.string(), fr: v.string(), en: v.string() }),
    category: v.string(),
    goalAmount: v.number(),
    mainImage: v.string(),
    gallery: v.optional(v.array(v.string())),
    startDate: v.number(),
    endDate: v.optional(v.number()),
    location: v.optional(v.string()),
    beneficiaries: v.optional(v.number()),
  },
  returns: v.id("projects"),
  handler: async (ctx, args) => {
    // Verify admin (single role check)
    const admin = await ctx.db.get(args.adminId);
    if (!admin || !admin.isActive) {
      throw new Error("Unauthorized");
    }

    // Sanitize text inputs
    const sanitizedTitle = {
      ar: sanitizeString(args.title.ar),
      fr: sanitizeString(args.title.fr),
      en: sanitizeString(args.title.en),
    };
    
    const sanitizedDescription = {
      ar: sanitizeString(args.description.ar),
      fr: sanitizeString(args.description.fr),
      en: sanitizeString(args.description.en),
    };
    
    const sanitizedLocation = args.location ? sanitizeString(args.location) : undefined;

    const projectId = await ctx.db.insert("projects", {
      title: sanitizedTitle,
      description: sanitizedDescription,
      category: args.category,
      goalAmount: args.goalAmount,
      raisedAmount: 0,
      currency: "MAD",
      mainImage: args.mainImage,
      gallery: args.gallery || [],
      status: "draft",
      startDate: args.startDate,
      endDate: args.endDate,
      location: sanitizedLocation,
      beneficiaries: args.beneficiaries,
      createdBy: args.adminId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isFeatured: false,
    });

    // Log audit
    await ctx.db.insert("auditLogs", {
      actorId: args.adminId,
      actorType: "admin",
      action: "project.created",
      resourceType: "project",
      resourceId: projectId,
      createdAt: Date.now(),
    });

    return projectId;
  },
});

/**
 * Update project (Admin only)
 */
export const updateProject = mutation({
  args: {
    adminId: v.id("admins"),
    projectId: v.id("projects"),
    updates: v.any(), // Partial project fields
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminId);
    if (!admin || !admin.isActive) {
      throw new Error("Unauthorized");
    }

    // Sanitize text fields if present
    const sanitizedUpdates = { ...args.updates };
    if (args.updates.title) {
      sanitizedUpdates.title = {
        ar: sanitizeString(args.updates.title.ar),
        fr: sanitizeString(args.updates.title.fr),
        en: sanitizeString(args.updates.title.en),
      };
    }
    if (args.updates.description) {
      sanitizedUpdates.description = {
        ar: sanitizeString(args.updates.description.ar),
        fr: sanitizeString(args.updates.description.fr),
        en: sanitizeString(args.updates.description.en),
      };
    }
    if (args.updates.location) {
      sanitizedUpdates.location = sanitizeString(args.updates.location);
    }

    await ctx.db.patch(args.projectId, {
      ...sanitizedUpdates,
      updatedAt: Date.now(),
    });

    return true;
  },
});

/**
 * Update featured projects order
 */
export const updateFeaturedOrder = mutation({
  args: {
    adminId: v.id("admins"),
    featuredIds: v.array(v.id("projects")),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminId);
    if (!admin || !admin.isActive) {
      throw new Error("Unauthorized");
    }

    // Update order for each featured project
    for (let i = 0; i < args.featuredIds.length; i++) {
      await ctx.db.patch(args.featuredIds[i], {
        isFeatured: true,
        featuredOrder: i + 1,
        updatedAt: Date.now(),
      });
    }

    return true;
  },
});
```

### 4.3 Donation Functions

```typescript
// convex/donations.ts

import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { sanitizeString } from "./sanitization";

/**
 * Create a new donation
 * Initiates the donation flow
 */
export const createDonation = mutation({
  args: {
    userId: v.id("users"),
    projectId: v.id("projects"),
    amount: v.number(),
    paymentMethod: v.union(
      v.literal("bank_transfer"),
      v.literal("card_whop"),
      v.literal("cash_agency")
    ),
    coversFees: v.boolean(),
    isAnonymous: v.boolean(),
    message: v.optional(v.string()),
  },
  returns: v.object({
    donationId: v.id("donations"),
    nextStep: v.string(),
    whopCheckoutUrl: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    // Verify project exists and is active
    const project = await ctx.db.get(args.projectId);
    if (!project || project.status !== "active") {
      throw new Error("Project not available for donations");
    }

    // Sanitize message
    const sanitizedMessage = args.message ? sanitizeString(args.message) : undefined;

    // Create donation record
    const donationId = await ctx.db.insert("donations", {
      userId: args.userId,
      projectId: args.projectId,
      amount: args.amount,
      currency: "MAD",
      coversFees: args.coversFees,
      paymentMethod: args.paymentMethod,
      status: "pending",
      isAnonymous: args.isAnonymous,
      message: sanitizedMessage,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    let nextStep = "awaiting_receipt";
    let whopCheckoutUrl;

    // Handle different payment methods
    if (args.paymentMethod === "card_whop") {
      // Initiate Whop payment
      const paymentResult = await ctx.scheduler.runAfter(0, api.payments.initiateWhopPayment, {
        donationId,
        userId: args.userId,
        amount: args.amount,
      });
      
      nextStep = "whop_checkout";
      whopCheckoutUrl = paymentResult.url;
    } else if (args.paymentMethod === "bank_transfer") {
      // Update status to await receipt
      await ctx.db.patch(donationId, {
        status: "awaiting_receipt",
      });

      // Send notification with bank details
      const user = await ctx.db.get(args.userId);
      await ctx.scheduler.runAfter(0, api.notifications.sendBankTransferInstructions, {
        phoneNumber: user.phoneNumber,
        amount: args.amount,
        donationId,
        language: user.preferredLanguage,
      });
    }

    // Log audit
    await ctx.db.insert("auditLogs", {
      actorId: args.userId,
      actorType: "user",
      action: "donation.created",
      resourceType: "donation",
      resourceId: donationId,
      metadata: { amount: args.amount, method: args.paymentMethod },
      createdAt: Date.now(),
    });

    return { donationId, nextStep, whopCheckoutUrl };
  },
});

/**
 * Upload receipt for bank transfer
 */
export const uploadReceipt = mutation({
  args: {
    donationId: v.id("donations"),
    userId: v.id("users"),
    receiptUrl: v.string(),
    bankName: v.optional(v.string()),
    transactionReference: v.optional(v.string()),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const donation = await ctx.db.get(args.donationId);
    
    if (!donation || donation.userId !== args.userId) {
      throw new Error("Donation not found");
    }

    if (donation.status !== "awaiting_receipt") {
      throw new Error("Invalid donation status for receipt upload");
    }

    // Sanitize inputs
    const sanitizedBankName = args.bankName ? sanitizeString(args.bankName) : undefined;
    const sanitizedRef = args.transactionReference ? sanitizeString(args.transactionReference) : undefined;

    // Update donation
    await ctx.db.patch(args.donationId, {
      status: "awaiting_verification",
      receiptUrl: args.receiptUrl,
      receiptUploadedAt: Date.now(),
      bankName: sanitizedBankName,
      transactionReference: sanitizedRef,
      updatedAt: Date.now(),
    });

    // Create verification record
    await ctx.db.insert("verifications", {
      donationId: args.donationId,
      type: "receipt",
      status: "pending",
      receiptUrl: args.receiptUrl,
      requestedAt: Date.now(),
    });

    // Notify admins
    await ctx.scheduler.runAfter(0, api.notifications.notifyAdminsNewReceipt, {
      donationId: args.donationId,
      amount: donation.amount,
    });

    // Notify user
    const user = await ctx.db.get(args.userId);
    await ctx.scheduler.runAfter(0, api.notifications.sendReceiptReceivedConfirmation, {
      phoneNumber: user.phoneNumber,
      language: user.preferredLanguage,
    });

    return true;
  },
});

/**
 * Get user's donations
 */
export const getUserDonations = query({
  args: {
    userId: v.id("users"),
    status: v.optional(v.string()),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    let queryBuilder = ctx.db
      .query("donations")
      .withIndex("by_user", q => q.eq("userId", args.userId))
      .order("desc");

    if (args.status) {
      queryBuilder = queryBuilder.filter(q => q.eq(q.field("status"), args.status));
    }

    const donations = await queryBuilder.take(50);

    // Get project info for each donation
    const donationsWithProjects = await Promise.all(
      donations.map(async (d) => {
        const project = await ctx.db.get(d.projectId);
        return {
          ...d,
          projectTitle: project?.title,
          projectImage: project?.mainImage,
        };
      })
    );

    return donationsWithProjects;
  },
});

/**
 * Get all donations (Admin)
 */
export const getAllDonations = query({
  args: {
    adminId: v.id("admins"),
    status: v.optional(v.string()),
    projectId: v.optional(v.id("projects")),
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.object({
    donations: v.array(v.any()),
    hasMore: v.boolean(),
  }),
  handler: async (ctx, args) => {
    // Verify admin (single role check)
    const admin = await ctx.db.get(args.adminId);
    if (!admin || !admin.isActive) {
      throw new Error("Unauthorized");
    }

    let queryBuilder = ctx.db
      .query("donations")
      .withIndex("by_created")
      .order("desc");

    if (args.status) {
      queryBuilder = queryBuilder.filter(q => q.eq(q.field("status"), args.status));
    }
    if (args.projectId) {
      queryBuilder = queryBuilder.filter(q => q.eq(q.field("projectId"), args.projectId));
    }

    const limit = args.limit || 50;
    const donations = await queryBuilder.take(limit);

    // Enrich with user and project info
    const enrichedDonations = await Promise.all(
      donations.map(async (d) => {
        const [user, project] = await Promise.all([
          ctx.db.get(d.userId),
          ctx.db.get(d.projectId),
        ]);
        return {
          ...d,
          donorName: user?.fullName,
          donorPhone: user?.phoneNumber,
          projectTitle: project?.title,
        };
      })
    );

    return { donations: enrichedDonations, hasMore: donations.length === limit };
  },
});
```

### 4.4 Admin Functions

```typescript
// convex/admin.ts

import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

/**
 * Verify donation (mark as complete)
 */
export const verifyDonation = mutation({
  args: {
    adminId: v.id("admins"),
    donationId: v.id("donations"),
    approved: v.boolean(),
    notes: v.optional(v.string()),
    rejectionReason: v.optional(v.string()),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    // Verify admin (single role check)
    const admin = await ctx.db.get(args.adminId);
    if (!admin || !admin.isActive) {
      throw new Error("Unauthorized");
    }

    const donation = await ctx.db.get(args.donationId);
    if (!donation) {
      throw new Error("Donation not found");
    }

    const newStatus = args.approved ? "completed" : "rejected";

    // Update donation
    await ctx.db.patch(args.donationId, {
      status: newStatus,
      verifiedBy: args.adminId,
      verifiedAt: Date.now(),
      verificationNotes: args.notes,
      updatedAt: Date.now(),
    });

    // Update verification record
    const verification = await ctx.db
      .query("verifications")
      .withIndex("by_donation", q => q.eq("donationId", args.donationId))
      .first();

    if (verification) {
      await ctx.db.patch(verification._id, {
        status: args.approved ? "approved" : "rejected",
        verifiedBy: args.adminId,
        reviewedAt: Date.now(),
        notes: args.notes,
        rejectionReason: args.rejectionReason,
      });
    }

    // If approved, update project raised amount
    if (args.approved) {
      const project = await ctx.db.get(donation.projectId);
      await ctx.db.patch(donation.projectId, {
        raisedAmount: project.raisedAmount + donation.amount,
        updatedAt: Date.now(),
      });

      // Update user total
      const user = await ctx.db.get(donation.userId);
      await ctx.db.patch(donation.userId, {
        totalDonated: user.totalDonated + donation.amount,
        donationCount: user.donationCount + 1,
      });

      // Send confirmation
      await ctx.scheduler.runAfter(0, api.notifications.sendDonationVerifiedNotification, {
        phoneNumber: user.phoneNumber,
        amount: donation.amount,
        language: user.preferredLanguage,
      });
    }

    // Log audit
    await ctx.db.insert("auditLogs", {
      actorId: args.adminId,
      actorType: "admin",
      action: args.approved ? "donation.verified" : "donation.rejected",
      resourceType: "donation",
      resourceId: args.donationId,
      metadata: { approved: args.approved, notes: args.notes },
      createdAt: Date.now(),
    });

    return true;
  },
});

/**
 * Get admin dashboard stats
 */
export const getDashboardStats = query({
  args: {
    adminId: v.id("admins"),
  },
  returns: v.object({
    totalDonations: v.number(),
    totalRaised: v.number(),
    activeProjects: v.number(),
    totalDonors: v.number(),
    pendingVerifications: v.number(),
    recentDonations: v.array(v.any()),
  }),
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminId);
    if (!admin || !admin.isActive) {
      throw new Error("Unauthorized");
    }

    // Get counts
    const allDonations = await ctx.db.query("donations").collect();
    const completedDonations = allDonations.filter(d => d.status === "completed");
    
    const projects = await ctx.db.query("projects").collect();
    const activeProjects = projects.filter(p => p.status === "active");

    const users = await ctx.db.query("users").collect();
    
    const pendingVerifications = allDonations.filter(
      d => d.status === "awaiting_verification"
    );

    // Get recent donations
    const recentDonations = await ctx.db
      .query("donations")
      .withIndex("by_created")
      .order("desc")
      .take(10);

    const enrichedRecent = await Promise.all(
      recentDonations.map(async (d) => {
        const [user, project] = await Promise.all([
          ctx.db.get(d.userId),
          ctx.db.get(d.projectId),
        ]);
        return {
          _id: d._id,
          amount: d.amount,
          status: d.status,
          donorName: user?.fullName,
          projectTitle: project?.title?.ar,
          createdAt: d.createdAt,
        };
      })
    );

    return {
      totalDonations: completedDonations.length,
      totalRaised: completedDonations.reduce((sum, d) => sum + d.amount, 0),
      activeProjects: activeProjects.length,
      totalDonors: users.length,
      pendingVerifications: pendingVerifications.length,
      recentDonations: enrichedRecent,
    };
  },
});

/**
 * Admin login - Uses action for password verification (runs in Node.js environment)
 * Convex mutations don't support bcrypt natively, so we use an action
 */
export const adminLogin = action({
  args: {
    email: v.string(),
    password: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    admin: v.optional(v.any()),
  }),
  handler: async (ctx, args) => {
    // Find admin by email
    const admin = await ctx.runQuery(internal.admin.getAdminByEmailInternal, {
      email: args.email.toLowerCase().trim(),
    });

    if (!admin || !admin.isActive) {
      return { success: false };
    }

    // Verify password using bcrypt in Node.js environment
    const bcrypt = await import("bcryptjs");
    const valid = await bcrypt.compare(args.password, admin.passwordHash);
    
    if (!valid) {
      return { success: false };
    }
    
    // Update last login
    await ctx.runMutation(internal.admin.updateAdminLoginInternal, {
      adminId: admin._id,
    });

    return {
      success: true,
      admin: {
        _id: admin._id,
        email: admin.email,
        isAdmin: true,
      },
    };
  },
});

/**
 * Create initial admin (for setup only)
 * Should be disabled after initial setup
 * Uses action for password hashing (runs in Node.js environment)
 */
export const createInitialAdmin = action({
  args: {
    setupKey: v.string(),
    email: v.string(),
    password: v.string(),
    fullName: v.string(),
    phoneNumber: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    adminId: v.optional(v.id("admins")),
  }),
  handler: async (ctx, args) => {
    // Verify setup key matches environment variable
    if (args.setupKey !== process.env.INITIAL_ADMIN_SETUP_KEY) {
      throw new Error("Invalid setup key");
    }

    // Check if any admin already exists
    const existingAdmins = await ctx.runQuery(internal.admin.checkAnyAdminExistsInternal);
    if (existingAdmins) {
      throw new Error("Initial admin already created. Use admin panel to add more admins.");
    }

    // Hash password in Node.js environment (bcrypt requires Node.js crypto)
    const bcrypt = await import("bcryptjs");
    const passwordHash = await bcrypt.hash(args.password, 10);

    // Create user and admin records via internal mutation
    const adminId = await ctx.runMutation(internal.admin.createAdminInternal, {
      email: args.email.toLowerCase().trim(),
      passwordHash,
      fullName: args.fullName,
      phoneNumber: args.phoneNumber,
      createdBy: undefined, // Initial admin has no creator
    });

    return { success: true, adminId };
  },
});

/**
 * Create additional admin (existing admin only)
 * Uses action for password hashing (runs in Node.js environment)
 */
export const createAdmin = action({
  args: {
    adminId: v.id("admins"),
    email: v.string(),
    password: v.string(),
    fullName: v.string(),
    phoneNumber: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    newAdminId: v.optional(v.id("admins")),
  }),
  handler: async (ctx, args) => {
    // Verify requesting admin exists
    const admin = await ctx.runQuery(internal.admin.getAdminInternal, {
      adminId: args.adminId,
    });
    if (!admin || !admin.isActive) {
      throw new Error("Unauthorized");
    }

    // Check if email already exists as admin
    const existing = await ctx.runQuery(internal.admin.getAdminByEmailInternal, {
      email: args.email.toLowerCase().trim(),
    });
    
    if (existing) {
      throw new Error("Admin with this email already exists");
    }

    // Hash password in Node.js environment (bcrypt requires Node.js crypto)
    const bcrypt = await import("bcryptjs");
    const passwordHash = await bcrypt.hash(args.password, 10);

    // Create user and admin records via internal mutation
    const newAdminId = await ctx.runMutation(internal.admin.createAdminInternal, {
      email: args.email.toLowerCase().trim(),
      passwordHash,
      fullName: args.fullName,
      phoneNumber: args.phoneNumber,
      createdBy: args.adminId,
    });

    // Log audit
    await ctx.runMutation(internal.audit.logAdminCreated, {
      actorId: args.adminId,
      newAdminId,
    });

    return { success: true, newAdminId };
  },
});
```

---

## 5. Payment Flow with Whop

### 5.1 Whop Integration Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                     WHOP PAYMENT FLOW                         │
└────────────────────────────────────────────────────────────────┘

  DONOR                          CONVEX                        WHOP
    │                              │                             │
    │  1. Select card payment      │                             │
    │─────────────────────────────▶│                             │
    │                              │                             │
    │                              │ 2. Create payment intent    │
    │                              │────────────────────────────▶│
    │                              │                             │
    │                              │ 3. Return checkout URL      │
    │                              │◀────────────────────────────│
    │                              │                             │
    │  4. Redirect to Whop         │                             │
    │◀─────────────────────────────│                             │
    │                              │                             │
    │════════════ WHOP CHECKOUT ═════════════════════════════════│
    │                              │                             │
    │  5. Complete payment         │                             │
    │───────────────────────────────────────────────────────────▶│
    │                              │                             │
    │                              │  6. Webhook: payment.success│
    │                              │◀────────────────────────────│
    │                              │                             │
    │                              │  7. Auto-verify donation    │
    │                              │     Update project amount   │
    │                              │                             │
    │  8. Send WhatsApp receipt    │                             │
    │◀─────────────────────────────│                             │
```

### 5.2 Whop Payment Functions

```typescript
// convex/payments.ts

import { action, mutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { retryWithBackoff } from "./retry";

const WHOP_API_BASE = "https://api.whop.com/v2";

/**
 * Initiate Whop payment with retry logic
 * Creates a checkout session
 */
export const initiateWhopPayment = action({
  args: {
    donationId: v.id("donations"),
    userId: v.id("users"),
    amount: v.number(), // in cents
  },
  returns: v.object({
    url: v.string(),
    paymentId: v.string(),
  }),
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.users.getUserInternal, {
      userId: args.userId,
    });

    // Retry configuration
    const retryConfig = {
      maxRetries: 3,
      baseDelay: 1000,    // 1 second
      maxDelay: 10000,    // 10 seconds
    };

    // Call Whop API with retry
    const response = await retryWithBackoff(async () => {
      const res = await fetch(`${WHOP_API_BASE}/checkout_sessions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.WHOP_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product_id: process.env.WHOP_PRODUCT_ID,
          amount: args.amount,
          currency: "mad",
          success_url: `${process.env.FRONTEND_URL}/donation-success?donation=${args.donationId}`,
          cancel_url: `${process.env.FRONTEND_URL}/donation/${args.donationId}?cancelled=true`,
          metadata: {
            donationId: args.donationId,
            userId: args.userId,
          },
          customer: {
            email: user.email,
            phone: user.phoneNumber,
            name: user.fullName,
          },
        }),
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(`Whop API error: ${error}`);
      }

      return res;
    }, retryConfig);

    const data = await response.json();

    // Create payment record
    await ctx.runMutation(internal.payments.createPaymentRecord, {
      donationId: args.donationId,
      userId: args.userId,
      whopPaymentId: data.id,
      amount: args.amount,
    });

    return {
      url: data.url,
      paymentId: data.id,
    };
  },
});

/**
 * Handle Whop webhook with signature verification
 * Called when payment status changes
 */
export const handleWhopWebhook = action({
  args: {
    event: v.string(),
    data: v.any(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const { event, data } = args;

    switch (event) {
      case "checkout.session.completed":
      case "payment.success": {
        const { metadata, id: whopPaymentId } = data;
        const { donationId, userId } = metadata;

        // Update payment record
        await ctx.runMutation(internal.payments.updatePaymentStatus, {
          whopPaymentId,
          status: "completed",
          completedAt: Date.now(),
        });

        // Auto-verify donation (card payments are auto-verified)
        await ctx.runMutation(internal.donations.completeDonation, {
          donationId,
          whopPaymentId,
        });

        // Send confirmation with retry
        const user = await ctx.runQuery(internal.users.getUserInternal, { userId });
        await ctx.runAction(internal.notifications.sendPaymentConfirmedWithRetry, {
          phoneNumber: user.phoneNumber,
          amount: data.amount,
          donationId,
          language: user.preferredLanguage,
        });

        break;
      }

      case "payment.failed": {
        const { id: whopPaymentId, failure_message } = data;
        
        await ctx.runMutation(internal.payments.updatePaymentStatus, {
          whopPaymentId,
          status: "failed",
          failedAt: Date.now(),
          failureReason: failure_message,
        });

        // Update donation status
        const payment = await ctx.runQuery(internal.payments.getByWhopId, { whopPaymentId });
        await ctx.runMutation(internal.donations.updateDonationStatus, {
          donationId: payment.donationId,
          status: "rejected",
        });

        break;
      }

      case "payment.refunded": {
        const { id: whopPaymentId } = data;
        
        await ctx.runMutation(internal.payments.updatePaymentStatus, {
          whopPaymentId,
          status: "refunded",
        });

        // Handle refund logic
        const payment = await ctx.runQuery(internal.payments.getByWhopId, { whopPaymentId });
        await ctx.runMutation(internal.donations.handleRefund, {
          donationId: payment.donationId,
          refundReason: data.reason,
        });

        break;
      }
    }

    return true;
  },
});

/**
 * Create payment record (internal)
 */
export const createPaymentRecord = internalMutation({
  args: {
    donationId: v.id("donations"),
    userId: v.id("users"),
    whopPaymentId: v.string(),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const platformFee = Math.round(args.amount * 0.03); // 3% platform fee
    const processingFee = Math.round(args.amount * 0.025); // 2.5% processing
    
    await ctx.db.insert("payments", {
      donationId: args.donationId,
      userId: args.userId,
      whopPaymentId: args.whopPaymentId,
      amount: args.amount,
      platformFee,
      processingFee,
      netAmount: args.amount - platformFee - processingFee,
      status: "pending",
      initiatedAt: Date.now(),
      webhookEvents: [],
    });

    // Update donation with whop reference
    await ctx.db.patch(args.donationId, {
      whopPaymentId: args.whopPaymentId,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Complete donation after successful payment
 */
export const completeDonation = internalMutation({
  args: {
    donationId: v.id("donations"),
    whopPaymentId: v.string(),
  },
  handler: async (ctx, args) => {
    const donation = await ctx.db.get(args.donationId);
    if (!donation) return;

    // Mark donation as completed
    await ctx.db.patch(args.donationId, {
      status: "completed",
      whopPaymentId: args.whopPaymentId,
      whopPaymentStatus: "completed",
      verifiedAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Update project raised amount
    const project = await ctx.db.get(donation.projectId);
    await ctx.db.patch(donation.projectId, {
      raisedAmount: project.raisedAmount + donation.amount,
      updatedAt: Date.now(),
    });

    // Update user stats
    const user = await ctx.db.get(donation.userId);
    await ctx.db.patch(donation.userId, {
      totalDonated: user.totalDonated + donation.amount,
      donationCount: user.donationCount + 1,
    });
  },
});
```

### 5.3 HTTP Route for Webhooks with Signature Verification

```typescript
// convex/http.ts

import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
import { verifyWhopSignature, verifyWasenderSignature } from "./webhooks";

const http = httpRouter();

/**
 * Whop webhook endpoint
 * URL: https://your-convex-url.convex.site/whop-webhook
 * 
 * Signature verification is CRITICAL for production security
 */
http.route({
  path: "/whop-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const signature = request.headers.get("whop-signature");
    const body = await request.text();
    
    // Verify webhook signature
    const isValid = verifyWhopSignature(
      signature, 
      body, 
      process.env.WHOP_WEBHOOK_SECRET
    );
    
    if (!isValid) {
      console.error("Invalid Whop webhook signature");
      return new Response("Invalid signature", { status: 401 });
    }

    let event;
    try {
      event = JSON.parse(body);
    } catch (e) {
      return new Response("Invalid JSON", { status: 400 });
    }

    // Process webhook
    await ctx.runAction(api.payments.handleWhopWebhook, {
      event: event.type,
      data: event.data,
    });

    return new Response("OK", { status: 200 });
  }),
});

/**
 * Wasender webhook endpoint
 * Includes signature verification for security
 */
http.route({
  path: "/wasender-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const signature = request.headers.get("x-wasender-signature");
    const body = await request.text();
    
    // Verify webhook signature
    const isValid = verifyWasenderSignature(
      signature,
      body,
      process.env.WASENDER_WEBHOOK_SECRET
    );
    
    if (!isValid) {
      console.error("Invalid Wasender webhook signature");
      return new Response("Invalid signature", { status: 401 });
    }

    const data = JSON.parse(body);
    
    // Update notification status
    if (data.messageId && data.status) {
      await ctx.runMutation(api.notifications.updateNotificationStatus, {
        wasenderMessageId: data.messageId,
        status: data.status,
      });
    }

    return new Response("OK", { status: 200 });
  }),
});

export default http;
```

---

## 6. WhatsApp Integration (Wasender) - Automated Notifications

### 6.1 Overview - Simplified Automated Approach

The WhatsApp integration uses **Wasender API** for automated donor notifications only. The system is fully automated - admin only manages the WhatsApp session, all messages are sent automatically based on predefined triggers.

```
┌─────────────────────────────────────────────────────────────────┐
│           AUTOMATED WHATSAPP NOTIFICATION SYSTEM                │
└─────────────────────────────────────────────────────────────────┘

  Admin Actions (Manual)          Automatic Triggers (System)
  ─────────────────────          ───────────────────────────
  ┌─────────────────┐            ┌──────────────────────────┐
  │ Create Session  │            │ Project Published        │
  │ Connect QR Code │            │ Project Closing Soon     │
  │ Change Phone #  │            │ Deadline Passed          │
  └────────┬────────┘            │ Donation Verified        │
           │                     │ Card Payment Received    │
           ▼                     └───────────┬──────────────┘
  ┌─────────────────┐                       │
  │  Session Ready  │◄──────────────────────┘
  └────────┬────────┘
           │
           ▼
  ┌─────────────────────────────────────────────────────────────┐
  │                    WASENDER API                              │
  │         (Automatic messages via connected session)          │
  └─────────────────────────────────────────────────────────────┘
           │
           ▼
  ┌─────────────────┐
  │  Donor WhatsApp │
  └─────────────────┘
```

---

### 6.2 Admin Capabilities (Session Management Only)

Admin can only perform **session management** - no manual message sending.

#### What Admin CAN Do:

| Action | Description | UI Location |
|--------|-------------|-------------|
| **Create Session** | Initialize new WhatsApp connection | Admin Settings → WhatsApp |
| **Connect Session** | Scan QR code to link phone | Admin Settings → WhatsApp |
| **View QR Code** | Display QR for scanning | Admin Settings → WhatsApp |
| **Change Phone** | Disconnect and reconnect with different number | Admin Settings → WhatsApp |
| **View Status** | See session status (connected/disconnected) | Admin Settings → WhatsApp |

#### What Admin CANNOT Do (Removed):

- ❌ Send manual messages to donors
- ❌ Compose custom messages
- ❌ Send OTP codes manually
- ❌ Send bank transfer instructions manually
- ❌ View message history
- ❌ Retry failed messages manually (handled automatically)

#### Admin UI - WhatsApp Section:

```
┌─────────────────────────────────────────┐
│  📱 WhatsApp Integration                │
├─────────────────────────────────────────┤
│                                         │
│  Status: 🟢 Connected                   │
│  Phone: +212 6XX XXX XXX                │
│                                         │
│  [🔄 Disconnect & Change Phone]         │
│                                         │
├─────────────────────────────────────────┤
│  Message Stats (Read-only)              │
│  ────────────────────────               │
│  Sent Today: 45                         │
│  Daily Limit: 1,000                     │
│  Success Rate: 98%                      │
│                                         │
└─────────────────────────────────────────┘
```

#### Session Setup Flow (One-time):

```typescript
// convex/wasender/session.ts

/**
 * Admin: Create new WhatsApp session
 * Called from Admin Settings UI
 */
export const createSession = action({
  args: {
    adminId: v.id("admins"),
    name: v.string(), // e.g., "Ibtasim Production"
  },
  returns: v.object({
    success: v.boolean(),
    sessionId: v.optional(v.string()),
    qrCode: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    // Verify admin
    const admin = await ctx.db.get(args.adminId);
    if (!admin?.isActive) throw new Error("Unauthorized");

    // Create session via Wasender API
    const response = await fetch(`${WASENDER_BASE_URL}/api/whatsapp-sessions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.WASENDER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: args.name,
        description: "Ibtasim Charity Platform",
      }),
    });

    if (!response.ok) {
      return { success: false, error: await response.text() };
    }

    const data = await response.json();

    // Get QR code immediately
    const qrResponse = await fetch(
      `${WASENDER_BASE_URL}/api/whatsapp-sessions/${data.id}/qrcode`,
      { headers: { "Authorization": `Bearer ${process.env.WASENDER_API_KEY}` } }
    );

    const qrData = await qrResponse.json();

    // Store session
    await ctx.runMutation(internal.wasender.storeSession, {
      sessionId: data.id,
      name: data.name,
      status: "pending",
    });

    return {
      success: true,
      sessionId: data.id,
      qrCode: qrData.qrCode, // Base64 PNG
    };
  },
});

/**
 * Admin: Check session status
 */
export const checkSessionStatus = action({
  args: {
    adminId: v.id("admins"),
  },
  returns: v.object({
    connected: v.boolean(),
    phoneNumber: v.optional(v.string()),
    messagesSentToday: v.number(),
    dailyLimit: v.number(),
  }),
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminId);
    if (!admin?.isActive) throw new Error("Unauthorized");

    const session = await ctx.runQuery(internal.wasender.getActiveSession);
    if (!session) return { connected: false, messagesSentToday: 0, dailyLimit: 1000 };

    const response = await fetch(`${WASENDER_BASE_URL}/api/status`, {
      headers: { "Authorization": `Bearer ${process.env.WASENDER_API_KEY}` },
    });

    const data = await response.json();

    return {
      connected: data.session?.status === "connected",
      phoneNumber: data.session?.phoneNumber,
      messagesSentToday: data.limits?.messagesSentToday || 0,
      dailyLimit: data.limits?.dailyLimit || 1000,
    };
  },
});
```

---

### 6.3 Automatic Notification System

Five predefined notification types sent automatically by the system. No admin action required.

#### Notification Types Summary

| # | Notification | Trigger | Recipients | Template Variables |
|---|-------------|---------|------------|-------------------|
| 1 | **New Project Published** | Admin publishes project | All opted-in donors | `{projectName}`, `{description}`, `{link}` |
| 2 | **Project Closing Soon** | 7 days before deadline | Donors who contributed to project | `{projectName}`, `{daysLeft}`, `{link}` |
| 3 | **Project Deadline Passed** | Deadline date reached | All opted-in donors | `{projectName}`, `{status}`, `{link}` |
| 4 | **Donation Verified** | Admin verifies bank transfer | Donor who made donation | `{donorName}`, `{amount}`, `{projectName}`, `{link}` |
| 5 | **Card Payment Received** | Whop webhook confirms payment | Donor who paid | `{donorName}`, `{amount}`, `{projectName}`, `{link}` |

#### Event-Based Triggers

```typescript
// convex/notifications/triggers.ts

/**
 * Trigger 1: New Project Published
 * Called when admin changes project status to "active"
 */
export const onProjectPublished = async (
  ctx: MutationCtx,
  project: Doc<"projects">
) => {
  // Get all opted-in donors
  const donors = await ctx.db
    .query("users")
    .filter(q => q.eq(q.field("notificationsEnabled"), true))
    .collect();

  // Send notification to each donor in their preferred language
  for (const donor of donors) {
    await ctx.scheduler.runAfter(0, api.notifications.sendProjectPublished, {
      phoneNumber: donor.phoneNumber,
      language: donor.preferredLanguage, // Use user's preferred language
      projectId: project._id,
      projectName: project.title,
      description: project.description,
    });
  }
};

/**
 * Trigger 2: Donation Verified (Bank Transfer)
 * Called when admin approves a donation
 */
export const onDonationVerified = async (
  ctx: MutationCtx,
  donation: Doc<"donations">,
  adminId: Id<"admins">
) => {
  const user = await ctx.db.get(donation.userId);
  const project = await ctx.db.get(donation.projectId);

  if (!user?.notificationsEnabled) return;

  // Send notification in user's preferred language only
  await ctx.scheduler.runAfter(0, api.notifications.sendDonationVerified, {
    phoneNumber: user.phoneNumber,
    language: user.preferredLanguage, // Single language based on preference
    donorName: user.fullName,
    amount: donation.amount,
    projectName: project?.title,
    projectId: project?._id,
  });
};

/**
 * Trigger 3: Card Payment Received
 * Called from Whop webhook handler
 */
export const onCardPaymentReceived = async (
  ctx: ActionCtx,
  donationId: Id<"donations">,
  userId: Id<"users">
) => {
  const user = await ctx.runQuery(internal.users.getUserInternal, { userId });
  const donation = await ctx.runQuery(internal.donations.getDonationInternal, { donationId });
  const project = await ctx.runQuery(internal.projects.getProjectInternal, {
    projectId: donation.projectId,
  });

  if (!user?.notificationsEnabled) return;

  // Send notification in user's preferred language only
  await ctx.runAction(api.notifications.sendPaymentConfirmed, {
    phoneNumber: user.phoneNumber,
    language: user.preferredLanguage, // Single language based on preference
    donorName: user.fullName,
    amount: donation.amount,
    projectName: project?.title,
    projectId: project?._id,
  });
};
```

#### Scheduled Triggers (Daily Cron Job)

```typescript
// convex/notifications/scheduled.ts

/**
 * Daily scheduled function - Check for projects closing soon
 * Runs every day at 9:00 AM Morocco time
 */
export const checkClosingSoonProjects = internalAction({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const sevenDaysFromNow = now + 7 * 24 * 60 * 60 * 1000;

    // Find projects ending in exactly 7 days
    const projects = await ctx.runQuery(internal.projects.getProjectsEndingBetween, {
      startDate: sevenDaysFromNow - 24 * 60 * 60 * 1000, // 6 days from now
      endDate: sevenDaysFromNow,
    });

    for (const project of projects) {
      // Get donors who contributed to this project
      const donorIds = await ctx.runQuery(internal.donations.getDonorsForProject, {
        projectId: project._id,
      });

      for (const userId of donorIds) {
        const user = await ctx.runQuery(internal.users.getUserInternal, { userId });
        if (!user?.notificationsEnabled) continue;

        await ctx.runAction(api.notifications.sendProjectClosingSoon, {
          phoneNumber: user.phoneNumber,
          language: user.preferredLanguage, // Use user's preferred language
          projectName: project.title,
          projectId: project._id,
          daysLeft: 7,
        });
      }
    }
  },
});

/**
 * Daily scheduled function - Check for passed deadlines
 * Runs every day at 9:00 AM Morocco time
 */
export const checkPassedDeadlines = internalAction({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const yesterday = now - 24 * 60 * 60 * 1000;

    // Find projects whose deadline passed in the last 24 hours
    const projects = await ctx.runQuery(internal.projects.getProjectsEndingBetween, {
      startDate: yesterday,
      endDate: now,
    });

    for (const project of projects) {
      // Get all opted-in donors
      const donors = await ctx.runQuery(internal.users.getOptedInDonors);

      for (const user of donors) {
        await ctx.runAction(api.notifications.sendDeadlinePassed, {
          phoneNumber: user.phoneNumber,
          language: user.preferredLanguage, // Use user's preferred language
          projectName: project.title,
          projectId: project._id,
          status: project.raisedAmount >= project.goalAmount ? "funded" : "extended",
        });
      }
    }
  },
});
```

#### Convex Cron Configuration

```typescript
// convex/crons.ts

import { cronJobs } from "convex/server";

const crons = cronJobs();

// Daily at 9:00 AM Morocco time (UTC+1)
// For UTC: 8:00 AM
 crons.daily(
  "check-closing-soon",
  { hourUTC: 8, minuteUTC: 0 },
  api.notifications.scheduled.checkClosingSoonProjects
);

crons.daily(
  "check-passed-deadlines",
  { hourUTC: 8, minuteUTC: 30 },
  api.notifications.scheduled.checkPassedDeadlines
);

export default crons;
```

---

### 6.4 Message Templates (Single Language Per User)

The notification system sends messages in the user's **preferred language only** (not all 3 languages). When a user registers or changes their language preference, all future notifications are sent in that language.

#### Language Preference Flow

```
┌─────────────────────────────────────────────────────────────────┐
│              USER LANGUAGE PREFERENCE SYSTEM                     │
└─────────────────────────────────────────────────────────────────┘

  Visitor                     Frontend                    Backend
    │                           │                           │
    │── Change language────────▶│                           │
    │   (AR/FR/EN)              │── Save to localStorage────┤
    │                           │                           │
    │── Create account─────────▶│── Send preferredLanguage──▶│
    │                           │   with registration       │── Store in users table
    │                           │                           │
    │                           │◀── Return user data───────┤
    │◀── Account created────────│                           │
    │                           │                           │
    │── Trigger event──────────▶│                           │
    │   (donation, etc.)        │── Call notification───────▶│
    │                           │                           │── Get user's preferredLanguage
    │                           │                           │── Select template in that language
    │                           │                           │── Send WhatsApp message
    │◀── Notification sent──────│                           │
```

#### Template Selector Function

```typescript
// convex/notifications/templates.ts

type Language = "ar" | "fr" | "en";
type TemplateType = 
  | "PROJECT_PUBLISHED" 
  | "PROJECT_CLOSING_SOON" 
  | "DEADLINE_PASSED_FUNDED"
  | "DEADLINE_PASSED_EXTENDED"
  | "DONATION_VERIFIED" 
  | "PAYMENT_CONFIRMED";

interface TemplateVariables {
  PROJECT_PUBLISHED: { projectName: string; description: string; link: string };
  PROJECT_CLOSING_SOON: { projectName: string; daysLeft: string; link: string };
  DEADLINE_PASSED_FUNDED: { projectName: string; link: string };
  DEADLINE_PASSED_EXTENDED: { projectName: string; link: string };
  DONATION_VERIFIED: { donorName: string; amount: string; projectName: string; link: string };
  PAYMENT_CONFIRMED: { donorName: string; amount: string; projectName: string; link: string };
}

/**
 * Get template for specific notification type and user language
 * Returns single-language message based on user's preference
 */
const getTemplate = <T extends TemplateType>(
  type: T,
  lang: Language,
  variables: TemplateVariables[T]
): string => {
  const templates: Record<TemplateType, Record<Language, string>> = {
    PROJECT_PUBLISHED: {
      ar: `🎉 مشروع جديد على ابتسام!\n\n{projectName}\n\n{description}\n\n🔗 تبرع الآن: {link}\n\nجزاكم الله خيراً 💚\nجمعية ابتسام`,
      fr: `🎉 Nouveau projet sur Ibtasim!\n\n{projectName}\n\n{description}\n\n🔗 Faites un don: {link}\n\nQue Dieu vous récompense 💚\nAssociation Ibtasim`,
      en: `🎉 New Project on Ibtasim!\n\n{projectName}\n\n{description}\n\n🔗 Donate now: {link}\n\nMay God reward you 💚\nIbtasim Association`,
    },
    PROJECT_CLOSING_SOON: {
      ar: `⏰ تبقى {daysLeft} أيام فقط!\n\nمشروع "{projectName}" على وشك الانتهاء.\n\nساهم في إنجاحه قبل فوات الأوان:\n{link}\n\nجزاكم الله خيراً 💚`,
      fr: `⏰ Plus que {daysLeft} jours!\n\nLe projet "{projectName}" se termine bientôt.\n\nContribuez avant qu'il ne soit trop tard:\n{link}\n\nQue Dieu vous récompense 💚`,
      en: `⏰ Only {daysLeft} days left!\n\nThe project "{projectName}" is ending soon.\n\nContribute before it's too late:\n{link}\n\nMay God reward you 💚`,
    },
    DEADLINE_PASSED_FUNDED: {
      ar: `✨ تم تمويل المشروع بنجاح!\n\n"{projectName}"\n\nشكراً لجميع المتبرعين على كرمكم.\nالمشروع الآن في مرحلة التنفيذ.\n\nتابعوا التقدم: {link}\n\nجزاكم الله خيراً 💚`,
      fr: `✨ Projet financé avec succès!\n\n"{projectName}"\n\nMerci à tous les donateurs pour votre générosité.\nLe projet est maintenant en phase de réalisation.\n\nSuivez les progrès: {link}\n\nQue Dieu vous récompense 💚`,
      en: `✨ Project Successfully Funded!\n\n"{projectName}"\n\nThank you to all donors for your generosity.\nThe project is now in implementation phase.\n\nFollow progress: {link}\n\nMay God reward you 💚`,
    },
    DEADLINE_PASSED_EXTENDED: {
      ar: `📅 تم تمديد المشروع\n\n"{projectName}"\n\nلم يكتمل التمويل بعد، فتم تمديد المدة.\n\nساهموا في إنجاحه:\n{link}\n\nجزاكم الله خيراً 💚`,
      fr: `📅 Projet prolongé\n\n"{projectName}"\n\nLe financement n'est pas encore complet.\nLa durée a été prolongée.\n\nContribuez au succès:\n{link}\n\nQue Dieu vous récompense 💚`,
      en: `📅 Project Extended\n\n"{projectName}"\n\nFunding is not yet complete.\nThe deadline has been extended.\n\nHelp make it happen:\n{link}\n\nMay God reward you 💚`,
    },
    DONATION_VERIFIED: {
      ar: `✅ تم التحقق من تبرعك\n\nعزيزي/عزيزتي {donorName}،\n\nتم التحقق من تبرعك بمبلغ {amount} درهم\nلمشروع "{projectName}".\n\nجزاك الله خيراً على سخائك 💚\n\nشاهد التفاصيل: {link}`,
      fr: `✅ Don vérifié\n\nCher/Chère {donorName},\n\nVotre don de {amount} MAD pour le projet\n"{projectName}" a été vérifié.\n\nQue Dieu vous récompense 💚\n\nVoir les détails: {link}`,
      en: `✅ Donation Verified\n\nDear {donorName},\n\nYour donation of {amount} MAD for the project\n"{projectName}" has been verified.\n\nMay God reward you 💚\n\nView details: {link}`,
    },
    PAYMENT_CONFIRMED: {
      ar: `🙏 شكراً لتبرعك!\n\nعزيزي/عزيزتي {donorName}،\n\nتم استلام تبرعك بمبلغ {amount} درهم\nبنجاح لمشروع "{projectName}".\n\nجزاك الله خيراً على سخائك 💚\n\nشاهد التفاصيل: {link}`,
      fr: `🙏 Merci pour votre don!\n\nCher/Chère {donorName},\n\nVotre don de {amount} MAD pour le projet\n"{projectName}" a été reçu avec succès.\n\nQue Dieu vous récompense 💚\n\nVoir les détails: {link}`,
      en: `🙏 Thank you for your donation!\n\nDear {donorName},\n\nYour donation of {amount} MAD for the project\n"{projectName}" has been successfully received.\n\nMay God reward you 💚\n\nView details: {link}`,
    },
  };

  let template = templates[type]?.[lang];
  
  // Fallback to English if translation missing
  if (!template) {
    template = templates[type]?.en;
  }

  // Replace variables
  return Object.entries(variables).reduce(
    (msg, [key, value]) => msg.replace(new RegExp(`{${key}}`, "g"), String(value)),
    template
  );
};

export { getTemplate };
export type { Language, TemplateType, TemplateVariables };
```

#### Updated Notification Actions (Using User's Preferred Language)

```typescript
// convex/notifications/actions.ts

import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { getTemplate, TemplateType } from "./templates";

const WASENDER_BASE_URL = "https://app.wasender.com";

/**
 * Send notification using user's preferred language
 */
async function sendNotification(
  ctx: ActionCtx,
  phoneNumber: string,
  templateType: TemplateType,
  variables: Record<string, string>,
  userLanguage: "ar" | "fr" | "en"
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // Get active session
  const session = await ctx.runQuery(internal.wasender.getActiveSession);
  if (!session) {
    return { success: false, error: "No active WhatsApp session" };
  }

  // Build message in user's preferred language only
  const message = getTemplate(templateType, userLanguage, variables);

  try {
    const response = await fetch(`${WASENDER_BASE_URL}/api/send-message`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.WASENDER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sessionId: session.sessionId,
        phone: phoneNumber,
        type: "text",
        message,
        priority: "normal",
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      await ctx.runMutation(internal.notifications.logNotification, {
        phoneNumber,
        message,
        language: userLanguage,
        status: "failed",
        errorMessage: error,
        templateKey: templateType,
      });
      return { success: false, error };
    }

    const data = await response.json();

    // Log successful notification
    await ctx.runMutation(internal.notifications.logNotification, {
      phoneNumber,
      message,
      language: userLanguage,
      status: "sent",
      wasenderMessageId: data.messageId,
      templateKey: templateType,
    });

    return { success: true, messageId: data.messageId };
  } catch (error) {
    await ctx.runMutation(internal.notifications.logNotification, {
      phoneNumber,
      message,
      language: userLanguage,
      status: "failed",
      errorMessage: error.message,
      templateKey: templateType,
    });
    return { success: false, error: error.message };
  }
}

// Notification 1: Project Published
export const sendProjectPublished = action({
  args: {
    phoneNumber: v.string(),
    language: v.union(v.literal("ar"), v.literal("fr"), v.literal("en")),
    projectId: v.id("projects"),
    projectName: v.object({ ar: v.string(), fr: v.string(), en: v.string() }),
    description: v.object({ ar: v.string(), fr: v.string(), en: v.string() }),
  },
  handler: async (ctx, args) => {
    const link = `${process.env.FRONTEND_URL}/projects/${args.projectId}`;

    return sendNotification(ctx, args.phoneNumber, "PROJECT_PUBLISHED", {
      projectName: args.projectName[args.language],
      description: args.description[args.language].substring(0, 100) + "...",
      link,
    }, args.language);
  },
});

// Notification 2: Project Closing Soon
export const sendProjectClosingSoon = action({
  args: {
    phoneNumber: v.string(),
    language: v.union(v.literal("ar"), v.literal("fr"), v.literal("en")),
    projectName: v.object({ ar: v.string(), fr: v.string(), en: v.string() }),
    projectId: v.id("projects"),
    daysLeft: v.number(),
  },
  handler: async (ctx, args) => {
    const link = `${process.env.FRONTEND_URL}/projects/${args.projectId}`;

    return sendNotification(ctx, args.phoneNumber, "PROJECT_CLOSING_SOON", {
      projectName: args.projectName[args.language],
      daysLeft: args.daysLeft.toString(),
      link,
    }, args.language);
  },
});

// Notification 3: Deadline Passed
export const sendDeadlinePassed = action({
  args: {
    phoneNumber: v.string(),
    language: v.union(v.literal("ar"), v.literal("fr"), v.literal("en")),
    projectName: v.object({ ar: v.string(), fr: v.string(), en: v.string() }),
    projectId: v.id("projects"),
    status: v.union(v.literal("funded"), v.literal("extended")),
  },
  handler: async (ctx, args) => {
    const link = `${process.env.FRONTEND_URL}/projects/${args.projectId}`;
    const templateType = args.status === "funded" 
      ? "DEADLINE_PASSED_FUNDED" 
      : "DEADLINE_PASSED_EXTENDED";

    return sendNotification(ctx, args.phoneNumber, templateType, {
      projectName: args.projectName[args.language],
      link,
    }, args.language);
  },
});

// Notification 4: Donation Verified
export const sendDonationVerified = action({
  args: {
    phoneNumber: v.string(),
    language: v.union(v.literal("ar"), v.literal("fr"), v.literal("en")),
    donorName: v.string(),
    amount: v.number(),
    projectName: v.object({ ar: v.string(), fr: v.string(), en: v.string() }),
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const link = `${process.env.FRONTEND_URL}/projects/${args.projectId}`;
    const amountFormatted = (args.amount / 100).toLocaleString();

    return sendNotification(ctx, args.phoneNumber, "DONATION_VERIFIED", {
      donorName: args.donorName,
      amount: amountFormatted,
      projectName: args.projectName[args.language],
      link,
    }, args.language);
  },
});

// Notification 5: Payment Confirmed (Card)
export const sendPaymentConfirmed = action({
  args: {
    phoneNumber: v.string(),
    language: v.union(v.literal("ar"), v.literal("fr"), v.literal("en")),
    donorName: v.string(),
    amount: v.number(),
    projectName: v.object({ ar: v.string(), fr: v.string(), en: v.string() }),
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const link = `${process.env.FRONTEND_URL}/projects/${args.projectId}`;
    const amountFormatted = (args.amount / 100).toLocaleString();

    return sendNotification(ctx, args.phoneNumber, "PAYMENT_CONFIRMED", {
      donorName: args.donorName,
      amount: amountFormatted,
      projectName: args.projectName[args.language],
      link,
    }, args.language);
  },
});
```

---

## 7. Frontend Integration

### 7.1 Convex React Client Setup

```typescript
// src/lib/convex.ts

import { ConvexReactClient } from "convex/react";

// Create Convex client
export const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);
```

```tsx
// src/main.tsx

import React from "react";
import ReactDOM from "react-dom/client";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import App from "./App";
import "./index.css";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConvexProvider client={convex}>
      <App />
    </ConvexProvider>
  </React.StrictMode>
);
```

### 7.2 Using Convex Hooks

```typescript
// src/hooks/useProjects.ts

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export function useProjects(category?: string) {
  return useQuery(api.projects.getProjects, { 
    category,
    status: "active",
    limit: 20,
  });
}

export function useProject(projectId: string) {
  return useQuery(api.projects.getProject, { projectId });
}
```

```typescript
// src/hooks/useDonations.ts

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export function useCreateDonation() {
  return useMutation(api.donations.createDonation);
}

export function useUploadReceipt() {
  return useMutation(api.donations.uploadReceipt);
}

export function useUserDonations(userId: string) {
  return useQuery(api.donations.getUserDonations, { userId });
}
```

```typescript
// src/hooks/useAuth.ts

import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export function useAuth() {
  const register = useMutation(api.auth.register);
  const requestLoginOTP = useMutation(api.auth.requestLoginOTP);
  const verifyOTP = useMutation(api.auth.verifyOTP);

  return {
    register,
    requestLoginOTP,
    verifyOTP,
  };
}
```

### 7.3 Real-time Updates Example

```tsx
// src/pages/AdminDonations.tsx

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function AdminDonations() {
  const adminId = useAdminId(); // Get from auth context
  
  // This automatically re-renders when new donations arrive
  const { donations, hasMore } = useQuery(
    api.donations.getAllDonations, 
    { adminId, status: "awaiting_verification" }
  ) ?? { donations: [], hasMore: false };

  return (
    <div>
      <h1>Pending Verifications ({donations.length})</h1>
      {donations.map(donation => (
        <DonationCard key={donation._id} donation={donation} />
      ))}
    </div>
  );
}
```

### 7.4 Environment Variables

```bash
# .env.local

# Convex
VITE_CONVEX_URL=https://your-app.convex.cloud

# Frontend
VITE_APP_NAME="Ibtasim"
VITE_DEFAULT_LANGUAGE=ar

# Admin Login Security - Secret URL path (do not expose publicly)
VITE_ADMIN_LOGIN_PATH=admin-login-7x9k2m
```

---

## 8. Security Model

### 8.1 Row-Level Security Patterns

```typescript
// convex/auth.ts

/**
 * Check if user owns resource
 */
export async function isOwner(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
  resourceType: "donation" | "project",
  resourceId: string
): Promise<boolean> {
  if (resourceType === "donation") {
    const donation = await ctx.db.get(resourceId as Id<"donations">);
    return donation?.userId === userId;
  }
  // Add other resource types
  return false;
}

/**
 * Check if user is admin (simplified - single role)
 */
export async function isAdmin(
  ctx: QueryCtx | MutationCtx,
  adminId: Id<"admins">
): Promise<boolean> {
  const admin = await ctx.db.get(adminId);
  return admin?.isActive === true;
}
```

### 8.2 Secure Query Patterns

```typescript
// convex/donations.ts

export const getDonation = query({
  args: {
    donationId: v.id("donations"),
    userId: v.id("users"),
  },
  returns: v.optional(v.any()),
  handler: async (ctx, args) => {
    const donation = await ctx.db.get(args.donationId);
    
    // Only allow access to own donations
    if (!donation || donation.userId !== args.userId) {
      return null;
    }
    
    return donation;
  },
});
```

### 8.3 API Key Management

```typescript
// convex/utils/secrets.ts

/**
 * Validate admin API key
 * For external integrations
 */
export async function validateApiKey(
  ctx: ActionCtx,
  apiKey: string
): Promise<boolean> {
  // In production, store hashed keys in a secrets table
  // and compare using constant-time comparison
  const validKey = process.env.ADMIN_API_KEY;
  
  if (!validKey || !apiKey) return false;
  
  // Use timing-safe comparison
  return crypto.timingSafeEqual(
    Buffer.from(validKey),
    Buffer.from(apiKey)
  );
}
```

### 8.4 File Upload Validation

```typescript
// convex/storage.ts

import { mutation } from "./_generated/server";
import { v } from "convex/values";

const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const generateUploadUrl = mutation({
  args: {
    fileType: v.string(),
    fileSize: v.number(),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(args.fileType)) {
      throw new Error("Invalid file type. Allowed: JPG, PNG, WebP, PDF");
    }
    
    // Validate file size
    if (args.fileSize > MAX_FILE_SIZE) {
      throw new Error("File too large. Max size: 5MB");
    }
    
    // Generate signed upload URL
    return await ctx.storage.generateUploadUrl();
  },
});
```

### 8.5 Retry Logic Utility

```typescript
// convex/retry.ts

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxRetries: number;      // Maximum number of retry attempts
  baseDelay: number;       // Initial delay in milliseconds
  maxDelay: number;        // Maximum delay in milliseconds
}

/**
 * Exponential backoff retry function
 * Delays: baseDelay, baseDelay * 2, baseDelay * 4, ... up to maxDelay
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on the last attempt
      if (attempt === config.maxRetries) {
        break;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        config.baseDelay * Math.pow(2, attempt),
        config.maxDelay
      );
      
      // Add jitter to prevent thundering herd
      const jitter = Math.random() * 100;
      const totalDelay = delay + jitter;
      
      console.log(`Retry attempt ${attempt + 1}/${config.maxRetries} after ${Math.round(totalDelay)}ms`);
      await sleep(totalDelay);
    }
  }
  
  throw lastError || new Error("Max retries exceeded");
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

### 8.6 Webhook Signature Verification

```typescript
// convex/webhooks.ts

import { createHmac } from "crypto";

/**
 * Verify Whop webhook signature
 * Uses HMAC-SHA256 signature verification
 */
export function verifyWhopSignature(
  signature: string | null,
  body: string,
  secret: string | undefined
): boolean {
  if (!signature || !secret) {
    console.error("Missing signature or secret");
    return false;
  }
  
  try {
    // Whop sends signature in format: "t=timestamp,v1=signature"
    const parts = signature.split(",");
    const timestampPart = parts.find(p => p.startsWith("t="));
    const signaturePart = parts.find(p => p.startsWith("v1="));
    
    if (!timestampPart || !signaturePart) {
      console.error("Invalid signature format");
      return false;
    }
    
    const timestamp = timestampPart.split("=")[1];
    const expectedSignature = signaturePart.split("=")[1];
    
    // Check timestamp (reject if older than 5 minutes)
    const now = Math.floor(Date.now() / 1000);
    if (now - parseInt(timestamp) > 300) {
      console.error("Webhook timestamp too old");
      return false;
    }
    
    // Compute signature
    const payload = `${timestamp}.${body}`;
    const computedSignature = createHmac("sha256", secret)
      .update(payload)
      .digest("hex");
    
    // Constant-time comparison
    return timingSafeEqual(expectedSignature, computedSignature);
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}

/**
 * Verify Wasender webhook signature
 */
export function verifyWasenderSignature(
  signature: string | null,
  body: string,
  secret: string | undefined
): boolean {
  if (!signature || !secret) {
    console.error("Missing signature or secret");
    return false;
  }
  
  try {
    // Compute expected signature
    const expectedSignature = createHmac("sha256", secret)
      .update(body)
      .digest("hex");
    
    // Constant-time comparison
    return timingSafeEqual(signature, expectedSignature);
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}
```

### 8.7 Input Sanitization

**Note:** DOMPurify requires a DOM environment which is not available in Convex mutations/queries.
We use a lightweight regex-based approach for basic sanitization, and move HTML sanitization to
**actions** (which run in Node.js environment) when needed.

```typescript
// convex/sanitization.ts

/**
 * Basic XSS-safe string sanitization for mutations
 * Removes HTML tags and dangerous characters
 * Works in Convex's V8 isolate environment (no DOM required)
 */
export function sanitizeString(input: string): string {
  if (!input || typeof input !== "string") {
    return "";
  }
  
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // Remove scripts
    .replace(/<[^>]+>/g, "") // Remove all HTML tags
    .replace(/[<>'"]/g, "") // Remove remaining dangerous characters
    .replace(/&[#\w]+;/g, "") // Remove HTML entities
    .trim();
}

/**
 * Sanitize object values recursively
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const result = { ...obj };
  
  for (const key in result) {
    if (typeof result[key] === "string") {
      result[key] = sanitizeString(result[key]);
    } else if (typeof result[key] === "object" && result[key] !== null) {
      result[key] = sanitizeObject(result[key]);
    }
  }
  
  return result;
}

/**
 * Validate and sanitize phone number
 * Ensures Moroccan format: +2126XXXXXXXX
 */
export function sanitizePhoneNumber(phone: string): string | null {
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, "");
  
  // Convert 06/07 format to +212 format
  if (cleaned.startsWith("0")) {
    cleaned = "+212" + cleaned.substring(1);
  }
  
  // Validate format
  const moroccanPhoneRegex = /^\+212[6-7]\d{8}$/;
  if (!moroccanPhoneRegex.test(cleaned)) {
    return null;
  }
  
  return cleaned;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * For HTML-rich sanitization (e.g., project descriptions with formatting),
 * use an action that runs in Node.js environment
 *
 * Example: Use this action for sanitizing HTML content
 */
```

```typescript
// convex/sanitizationActions.ts

import { action } from "./_generated/server";
import { v } from "convex/values";

/**
 * Sanitize HTML content using DOMPurify (runs in Node.js environment)
 * Use this for rich text content that needs HTML sanitization
 */
export const sanitizeHtmlContent = action({
  args: {
    content: v.string(),
    allowedTags: v.optional(v.array(v.string())),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    // Import DOMPurify in Node.js environment (actions run in Node.js)
    const DOMPurify = (await import("isomorphic-dompurify")).default;
    
    const sanitized = DOMPurify.sanitize(args.content, {
      ALLOWED_TAGS: args.allowedTags || ["b", "i", "em", "strong", "p", "br"],
      ALLOWED_ATTR: [], // No attributes allowed for security
      KEEP_CONTENT: true,
    });
    
    return sanitized;
  },
});

/**
 * Sanitize donation message with allowed formatting
 * Runs in Node.js environment via action
 */
export const sanitizeDonationMessage = action({
  args: {
    message: v.string(),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    if (!args.message) return "";
    
    const DOMPurify = (await import("isomorphic-dompurify")).default;
    
    // Allow some formatting but remove scripts and dangerous tags
    return DOMPurify.sanitize(args.message, {
      ALLOWED_TAGS: ["b", "i", "em", "strong"],
      ALLOWED_ATTR: [],
    });
  },
});
```

**Key Points:**
- **Mutations/Queries**: Use `sanitizeString()` for basic XSS prevention (no DOM required)
- **Actions**: Use DOMPurify for HTML-rich sanitization (runs in Node.js environment)
- **Trade-off**: Actions have higher latency (~100-300ms) vs mutations (~10-50ms)
- **Recommendation**: Use basic sanitization for most inputs; use actions only for HTML-rich content

### 8.8 Admin Login Security - Hidden Login Page

```typescript
// Admin login page should NOT be publicly linked
// Recommended approaches:

// Option A: Secret URL Path (Recommended)
// Instead of: /admin/login
// Use: /admin-login-{random-string} (configured via env)
// Example: /admin-login-7x9k2m

// Option B: IP Restriction (Additional layer)
// Implement in Convex function:

export const adminLogin = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    clientIp: v.optional(v.string()), // Pass from frontend
  },
  returns: v.object({
    success: v.boolean(),
    admin: v.optional(v.any()),
  }),
  handler: async (ctx, args) => {
    // Optional: Check IP whitelist
    const allowedIps = process.env.ADMIN_ALLOWED_IPS?.split(",") || [];
    if (allowedIps.length > 0 && !allowedIps.includes(args.clientIp || "")) {
      console.warn(`Admin login attempt from unauthorized IP: ${args.clientIp}`);
      return { success: false };
    }

    // Rest of login logic...
  },
});

// Option C: No Public Link (Bookmark Only)
// - Don't include /admin link in footer/header
// - Only accessible via direct URL bookmark
// - Add robots.txt to prevent indexing
```

**Frontend Implementation (Secret URL):**

```tsx
// src/App.tsx - Route configuration
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

function App() {
  const adminPath = import.meta.env.VITE_ADMIN_LOGIN_PATH || "admin-login-secret";
  
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/projects" element={<ProjectsList />} />
        <Route path="/donate" element={<DonationFlow />} />
        
        {/* Hidden admin route */}
        <Route path={`/${adminPath}`} element={<AdminLogin />} />
        
        {/* Protected admin routes */}
        <Route path="/admin/*" element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="donations" element={<AdminDonations />} />
          {/* ... */}
        </Route>
        
        {/* Redirect old /admin/login to home */}
        <Route path="/admin/login" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
```

**robots.txt to prevent indexing:**

```
User-agent: *
Disallow: /admin-login-*
Disallow: /admin/
Allow: /
```

---

## 9. User Language Preference System

### 9.1 Overview

The user language preference system ensures that all WhatsApp notifications are sent in the user's **preferred language only** (Arabic, French, or English). This provides a personalized experience and reduces message size by sending single-language messages instead of tri-lingual messages.

### 9.2 Language Detection & Storage Flow

```
┌─────────────────────────────────────────────────────────────────┐
│            LANGUAGE PREFERENCE DETECTION FLOW                    │
└─────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────┐
  │  VISITOR (Not Logged In)                                     │
  │  ─────────────────────                                       │
  │  1. Visit website → Detect browser language                  │
  │  2. Allow manual language switch (AR/FR/EN)                  │
  │  3. Save selection to localStorage                           │
  │                                                              │
  │  localStorage key: "ibtasim_preferred_language"              │
  └─────────────────────────────────────────────────────────────┘
                              │
                              ▼
  ┌─────────────────────────────────────────────────────────────┐
  │  USER REGISTRATION                                          │
  │  ─────────────────                                          │
  │  1. Read language from localStorage                         │
  │  2. Include in register() mutation                          │
  │  3. Store in users.preferredLanguage                        │
  │                                                              │
  │  Default: 'ar' (Arabic) if not set                          │
  └─────────────────────────────────────────────────────────────┘
                              │
                              ▼
  ┌─────────────────────────────────────────────────────────────┐
  │  NOTIFICATION TRIGGERS                                      │
  │  ─────────────────────                                      │
  │  1. Get user's preferredLanguage from users table           │
  │  2. Select template in that language                        │
  │  3. Send single-language WhatsApp message                   │
  │                                                              │
  │  Result: User receives message in their preferred language  │
  └─────────────────────────────────────────────────────────────┘
```

### 9.3 Frontend Implementation

#### Language Context & Detection

```typescript
// src/context/LanguageContext.tsx

import React, { createContext, useContext, useEffect, useState } from "react";

type Language = "ar" | "fr" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LANGUAGE_STORAGE_KEY = "ibtasim_preferred_language";
const DEFAULT_LANGUAGE: Language = "ar";

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

/**
 * Detect initial language from localStorage or browser
 */
function detectInitialLanguage(): Language {
  // Check localStorage first
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language;
  if (stored && ["ar", "fr", "en"].includes(stored)) {
    return stored;
  }
  
  // Detect from browser
  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith("ar")) return "ar";
  if (browserLang.startsWith("fr")) return "fr";
  if (browserLang.startsWith("en")) return "en";
  
  return DEFAULT_LANGUAGE;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(detectInitialLanguage);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    
    // Update HTML lang attribute for accessibility
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  };

  // Translation function (simplified - use i18n library in production)
  const t = (key: string): string => {
    // Return translation based on current language
    // In production, use react-i18next or similar
    return key;
  };

  useEffect(() => {
    // Set initial direction
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
```

#### Language Selector Component

```tsx
// src/components/LanguageSelector.tsx

import { useLanguage } from "../context/LanguageContext";

const languages = [
  { code: "ar", label: "العربية", flag: "🇲🇦" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "en", label: "English", flag: "🇬🇧" },
] as const;

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="language-selector">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => setLanguage(lang.code)}
          className={`language-btn ${language === lang.code ? "active" : ""}`}
          aria-label={`Switch to ${lang.label}`}
        >
          <span className="flag">{lang.flag}</span>
          <span className="label">{lang.label}</span>
        </button>
      ))}
    </div>
  );
}
```

#### User Registration with Language

```typescript
// src/hooks/useAuth.ts

import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useLanguage } from "../context/LanguageContext";

export function useAuth() {
  const { language } = useLanguage();
  const registerMutation = useMutation(api.auth.register);

  const register = async (userData: {
    fullName: string;
    email: string;
    phoneNumber: string;
  }) => {
    // Include user's preferred language in registration
    return await registerMutation({
      ...userData,
      preferredLanguage: language, // Send detected/saved language
    });
  };

  return { register };
}
```

### 9.4 User Profile Language Settings

#### Backend: Update Preferred Language Mutation

```typescript
// convex/auth.ts

/**
 * Update user's preferred language
 * Called from UserProfile page when user changes language
 */
export const updatePreferredLanguage = mutation({
  args: {
    userId: v.id("users"),
    preferredLanguage: v.union(v.literal("ar"), v.literal("fr"), v.literal("en")),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(args.userId, {
      preferredLanguage: args.preferredLanguage,
    });

    // Log audit
    await ctx.db.insert("auditLogs", {
      actorId: args.userId,
      actorType: "user",
      action: "user.language_changed",
      resourceType: "user",
      resourceId: args.userId,
      metadata: { oldLanguage: user.preferredLanguage, newLanguage: args.preferredLanguage },
      createdAt: Date.now(),
    });

    return true;
  },
});
```

#### Frontend: UserProfile Language Selector

```tsx
// src/pages/UserProfile.tsx

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useLanguage } from "../context/LanguageContext";
import { useUser } from "../context/UserContext";

const languages = [
  { code: "ar", label: "العربية", description: "اللغة العربية" },
  { code: "fr", label: "Français", description: "Langue française" },
  { code: "en", label: "English", description: "English language" },
] as const;

export function UserProfile() {
  const { user } = useUser();
  const { language, setLanguage } = useLanguage();
  const updateLanguage = useMutation(api.auth.updatePreferredLanguage);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleLanguageChange = async (newLanguage: "ar" | "fr" | "en") => {
    if (newLanguage === language || !user) return;
    
    setIsUpdating(true);
    try {
      // Update in backend
      await updateLanguage({
        userId: user._id,
        preferredLanguage: newLanguage,
      });
      
      // Update in frontend context
      setLanguage(newLanguage);
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to update language:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="user-profile">
      {/* ... other profile sections ... */}
      
      <section className="language-settings">
        <h2>Language / اللغة / Langue</h2>
        <p className="description">
          Choose your preferred language for WhatsApp notifications and website content.
        </p>
        
        <div className="language-options">
          {languages.map((lang) => (
            <label
              key={lang.code}
              className={`language-option ${language === lang.code ? "selected" : ""}`}
            >
              <input
                type="radio"
                name="language"
                value={lang.code}
                checked={language === lang.code}
                onChange={() => handleLanguageChange(lang.code)}
                disabled={isUpdating}
              />
              <span className="language-label">{lang.label}</span>
              <span className="language-description">{lang.description}</span>
            </label>
          ))}
        </div>
        
        {isUpdating && <p className="updating">Updating...</p>}
        {showSuccess && (
          <p className="success-message">
            Language updated successfully! Future notifications will be sent in your selected language.
          </p>
        )}
      </section>
      
      {/* ... other profile sections ... */}
    </div>
  );
}
```

### 9.5 Notification Flow Summary

```
┌─────────────────────────────────────────────────────────────────┐
│              COMPLETE NOTIFICATION FLOW                          │
│         (Using User's Preferred Language)                        │
└─────────────────────────────────────────────────────────────────┘

  1. TRIGGER EVENT
     ├─ Donation verified by admin
     ├─ Card payment confirmed by Whop
     ├─ New project published
     ├─ Project closing soon (scheduled)
     └─ Project deadline passed (scheduled)

  2. FETCH USER
     └─ Get user record from database
        └─ Include: phoneNumber, preferredLanguage, notificationsEnabled

  3. CHECK PREFERENCES
     └─ If notificationsEnabled = false → STOP
     └─ Get preferredLanguage (ar/fr/en)

  4. SELECT TEMPLATE
     └─ Call getTemplate(type, preferredLanguage, variables)
     └─ Returns message in single language

  5. SEND NOTIFICATION
     └─ Send WhatsApp message via Wasender API
     └─ Message is in user's preferred language only

  6. LOG NOTIFICATION
     └─ Store in notificationLogs with:
        ├─ userId
        ├─ language (the one used)
        ├─ message content
        └─ status (sent/delivered/failed)
```

### 9.6 Benefits of Single-Language System

| Aspect | Tri-lingual (Old) | Single-Language (New) |
|--------|-------------------|----------------------|
| **Message Size** | 3x longer | Compact |
| **User Experience** | Cluttered, hard to read | Clean, personalized |
| **WhatsApp Limits** | Hits daily limits faster | More messages per day |
| **Localization** | One-size-fits-all | Personalized per user |
| **Read Rate** | Lower (users scroll past) | Higher (relevant language) |

---

## 10. Deployment Plan

### 10.1 Deployment Steps

```
┌────────────────────────────────────────────────────────────────┐
│                    DEPLOYMENT PIPELINE                         │
└────────────────────────────────────────────────────────────────┘

Step 1: Convex Setup
├── Create Convex account (convex.dev)
├── Install Convex CLI: npm install convex
├── Initialize: npx convex dev
├── Push schema: npx convex dev (auto-deploys functions)
└── Get deployment URL: https://your-app.convex.cloud

Step 2: Environment Configuration
├── Copy .env.template to .env.local
├── Add VITE_CONVEX_URL
├── Add WHOP_API_KEY
├── Add WASENDER_API_KEY
└── Add ADMIN_API_KEY

Step 3: Vercel Frontend Deployment
├── Connect GitHub repo to Vercel
├── Set build command: npm run build
├── Set output directory: dist
├── Add environment variables in Vercel dashboard
└── Deploy!

Step 4: Webhook Configuration
├── Configure Whop webhook URL:
│   https://your-app.convex.site/whop-webhook
├── Configure Wasender webhook (optional):
│   https://your-app.convex.site/wasender-webhook
└── Set webhook secrets

Step 5: Domain Configuration
├── Add custom domain in Vercel
├── Update CORS settings in Convex
└── Update webhook URLs

Step 6: Initial Admin Creation
├── Generate secure setup key
├── Run initial admin creation mutation
├── Remove or rotate setup key after use
└── Verify admin access
```

### 10.2 Environment Variables Checklist

| Variable | Location | Description |
|----------|----------|-------------|
| `VITE_CONVEX_URL` | Vercel + Local | Convex deployment URL |
| `CONVEX_DEPLOYMENT` | Local | Local Convex dev instance |
| `WHOP_API_KEY` | Convex dashboard | Whop API key |
| `WHOP_PRODUCT_ID` | Convex dashboard | Default product for payments |
| `WHOP_WEBHOOK_SECRET` | Convex dashboard | For webhook validation |
| `WASENDER_API_KEY` | Convex dashboard | Wasender API key |
| `WASENDER_WEBHOOK_SECRET` | Convex dashboard | For Wasender webhook validation |
| `ADMIN_API_KEY` | Convex dashboard | For admin integrations |
| `FRONTEND_URL` | Convex dashboard | Production frontend URL |
| `INITIAL_ADMIN_SETUP_KEY` | Convex dashboard | One-time key for
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
    passwordHash: v.optional(v.string()), // For password-based login
    verificationCode: v.optional(v.string()),
    codeExpiresAt: v.optional(v.number()), // Unix timestamp
    
    // Rate limiting for OTP
    otpRequestCount: v.optional(v.number()),
    otpWindowStart: v.optional(v.number()),
    lastOtpRequestAt: v.optional(v.number()),
    
    // Metadata
    createdAt: v.number(),
    lastLoginAt: v.number(),
    
    // Preferences
    preferredLanguage: v.union(v.literal("ar"), v.literal("fr"), v.literal("en")),
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
    userId: v.id("users"),
    email: v.string(),
    passwordHash: v.string(), // bcrypt hashed password
    
    // Status
    isActive: v.boolean(),
    lastLoginAt: v.number(),
    createdAt: v.number(),
    createdBy: v.optional(v.id("admins")),
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
    coversFees: v.boolean(),
    
    // Payment
    paymentMethod: v.union(
      v.literal("bank_transfer"),
      v.literal("card_whop"),
      v.literal("cash_agency")
    ),
    
    // Status workflow
    status: v.union(
      v.literal("pending"),
      v.literal("awaiting_receipt"),
      v.literal("awaiting_verification"),
      v.literal("verified"),
      v.literal("rejected"),
      v.literal("completed")
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
    canBeDeletedAfter: v.optional(v.number()),
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
    .index("by_whop_payment", ["whopPaymentId"]),

  // ============================================
  // VERIFICATION LOGS TABLE
  // ============================================
  verificationLogs: defineTable({
    donationId: v.id("donations"),
    adminId: v.id("admins"),
    action: v.union(v.literal("verify"), v.literal("reject")),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_donation", ["donationId"])
    .index("by_admin", ["adminId"]),

  // ============================================
  // NOTIFICATIONS TABLE (WhatsApp + Email)
  // ============================================
  notifications: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("donation_received"),
      v.literal("donation_verified"),
      v.literal("donation_rejected"),
      v.literal("project_funded"),
      v.literal("receipt_reminder"),
      v.literal("otp_code")
    ),
    channel: v.union(v.literal("whatsapp"), v.literal("email")),
    status: v.union(
      v.literal("pending"),
      v.literal("sent"),
      v.literal("delivered"),
      v.literal("failed")
    ),
    content: v.object({
      ar: v.string(),
      fr: v.string(),
      en: v.string(),
    }),
    sentAt: v.optional(v.number()),
    deliveredAt: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  // ============================================
  // ACTIVITY LOG TABLE (Audit Trail)
  // ============================================
  activities: defineTable({
    actorId: v.optional(v.id("users")), // null for system actions
    actorType: v.union(v.literal("user"), v.literal("admin"), v.literal("system")),
    action: v.string(),
    entityType: v.union(
      v.literal("user"),
      v.literal("project"),
      v.literal("donation"),
      v.literal("payment"),
      v.literal("admin")
    ),
    entityId: v.string(),
    metadata: v.optional(v.record(v.string(), v.any())),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_actor", ["actorId", "createdAt"])
    .index("by_entity", ["entityType", "entityId"])
    .index("by_created", ["createdAt"]),
});
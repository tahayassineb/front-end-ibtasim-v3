import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ============================================
// DONATION QUERIES
// ============================================

export const getDonationsByUser = query({
  args: { 
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    _id: v.id("donations"),
    _creationTime: v.number(),
    projectId: v.id("projects"),
    amount: v.number(),
    currency: v.literal("MAD"),
    paymentMethod: v.string(),
    status: v.string(),
    isAnonymous: v.boolean(),
    message: v.optional(v.string()),
    createdAt: v.number(),
    verifiedAt: v.optional(v.number()),
    receiptUrl: v.optional(v.string()),
  })),
  handler: async (ctx, args) => {
    const donations = await ctx.db
      .query("donations")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.limit || 50);
    
    return donations.map(d => ({
      _id: d._id,
      _creationTime: d._creationTime,
      projectId: d.projectId,
      amount: d.amount,
      currency: d.currency,
      paymentMethod: d.paymentMethod,
      status: d.status,
      isAnonymous: d.isAnonymous,
      message: d.message,
      createdAt: d.createdAt,
      verifiedAt: d.verifiedAt,
      receiptUrl: d.receiptUrl,
    }));
  },
});

export const getDonationsByProject = query({
  args: { 
    projectId: v.id("projects"),
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    _id: v.id("donations"),
    userId: v.id("users"),
    amount: v.number(),
    status: v.string(),
    isAnonymous: v.boolean(),
    message: v.optional(v.string()),
    createdAt: v.number(),
  })),
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("donations")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId));
    
    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }
    
    const donations = await query.order("desc").take(args.limit || 100);
    
    return donations.map(d => ({
      _id: d._id,
      userId: d.userId,
      amount: d.amount,
      status: d.status,
      isAnonymous: d.isAnonymous,
      message: d.message,
      createdAt: d.createdAt,
    }));
  },
});

export const getDonationById = query({
  args: { donationId: v.id("donations") },
  returns: v.union(
    v.object({
      _id: v.id("donations"),
      userId: v.id("users"),
      projectId: v.id("projects"),
      amount: v.number(),
      currency: v.literal("MAD"),
      coversFees: v.boolean(),
      paymentMethod: v.string(),
      status: v.string(),
      isAnonymous: v.boolean(),
      message: v.optional(v.string()),
      receiptUrl: v.optional(v.string()),
      bankName: v.optional(v.string()),
      transactionReference: v.optional(v.string()),
      createdAt: v.number(),
      verifiedAt: v.optional(v.number()),
      verifiedBy: v.optional(v.id("admins")),
      verificationNotes: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const donation = await ctx.db.get(args.donationId);
    if (!donation) return null;
    
    return {
      _id: donation._id,
      userId: donation.userId,
      projectId: donation.projectId,
      amount: donation.amount,
      currency: donation.currency,
      coversFees: donation.coversFees,
      paymentMethod: donation.paymentMethod,
      status: donation.status,
      isAnonymous: donation.isAnonymous,
      message: donation.message,
      receiptUrl: donation.receiptUrl,
      bankName: donation.bankName,
      transactionReference: donation.transactionReference,
      createdAt: donation.createdAt,
      verifiedAt: donation.verifiedAt,
      verifiedBy: donation.verifiedBy,
      verificationNotes: donation.verificationNotes,
    };
  },
});

export const getPendingVerifications = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(v.object({
    _id: v.id("donations"),
    _creationTime: v.number(),
    userId: v.id("users"),
    projectId: v.id("projects"),
    amount: v.number(),
    paymentMethod: v.string(),
    status: v.string(),
    receiptUrl: v.optional(v.string()),
    bankName: v.optional(v.string()),
    createdAt: v.number(),
  })),
  handler: async (ctx, args) => {
    const donations = await ctx.db
      .query("donations")
      .withIndex("by_status", (q) => q.eq("status", "awaiting_verification"))
      .order("asc")
      .take(args.limit || 50);
    
    return donations.map(d => ({
      _id: d._id,
      _creationTime: d._creationTime,
      userId: d.userId,
      projectId: d.projectId,
      amount: d.amount,
      paymentMethod: d.paymentMethod,
      status: d.status,
      receiptUrl: d.receiptUrl,
      bankName: d.bankName,
      createdAt: d.createdAt,
    }));
  },
});

// ============================================
// DONATION MUTATIONS
// ============================================

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
    bankName: v.optional(v.string()),
  },
  returns: v.id("donations"),
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Determine initial status based on payment method
    let initialStatus: "pending" | "awaiting_receipt" = "pending";
    if (args.paymentMethod === "bank_transfer") {
      initialStatus = "awaiting_receipt";
    }
    
    const donationId = await ctx.db.insert("donations", {
      userId: args.userId,
      projectId: args.projectId,
      amount: args.amount,
      currency: "MAD",
      coversFees: args.coversFees,
      paymentMethod: args.paymentMethod,
      status: initialStatus,
      isAnonymous: args.isAnonymous,
      message: args.message,
      bankName: args.bankName,
      createdAt: now,
      updatedAt: now,
    });
    
    return donationId;
  },
});

export const uploadReceipt = mutation({
  args: {
    donationId: v.id("donations"),
    receiptUrl: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const donation = await ctx.db.get(args.donationId);
    if (!donation) return false;
    if (donation.status !== "awaiting_receipt") return false;
    
    await ctx.db.patch(args.donationId, {
      receiptUrl: args.receiptUrl,
      receiptUploadedAt: Date.now(),
      status: "awaiting_verification",
      updatedAt: Date.now(),
    });
    
    return true;
  },
});

export const verifyDonation = mutation({
  args: {
    donationId: v.id("donations"),
    adminId: v.id("admins"),
    verified: v.boolean(),
    notes: v.optional(v.string()),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const donation = await ctx.db.get(args.donationId);
    if (!donation) return false;
    if (donation.status !== "awaiting_verification") return false;
    
    const now = Date.now();
    const newStatus = args.verified ? "verified" : "rejected";
    
    await ctx.db.patch(args.donationId, {
      status: newStatus,
      verifiedBy: args.adminId,
      verifiedAt: now,
      verificationNotes: args.notes,
      updatedAt: now,
    });
    
    // Log the verification action
    await ctx.db.insert("verificationLogs", {
      donationId: args.donationId,
      adminId: args.adminId,
      action: args.verified ? "verify" : "reject",
      notes: args.notes,
      createdAt: now,
    });
    
    // If verified, update project raised amount
    if (args.verified) {
      const project = await ctx.db.get(donation.projectId);
      if (project) {
        await ctx.db.patch(donation.projectId, {
          raisedAmount: project.raisedAmount + donation.amount,
          updatedAt: now,
        });
      }
      
      // Update user's total donated
      const user = await ctx.db.get(donation.userId);
      if (user) {
        await ctx.db.patch(donation.userId, {
          totalDonated: user.totalDonated + donation.amount,
          donationCount: user.donationCount + 1,
        });
      }
    }
    
    return true;
  },
});

export const updateDonationStatus = mutation({
  args: {
    donationId: v.id("donations"),
    status: v.union(
      v.literal("pending"),
      v.literal("awaiting_receipt"),
      v.literal("awaiting_verification"),
      v.literal("verified"),
      v.literal("rejected"),
      v.literal("completed")
    ),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const donation = await ctx.db.get(args.donationId);
    if (!donation) return false;
    
    await ctx.db.patch(args.donationId, {
      status: args.status,
      updatedAt: Date.now(),
    });
    
    return true;
  },
});

export const updateWhopPayment = mutation({
  args: {
    donationId: v.id("donations"),
    whopPaymentId: v.string(),
    whopPaymentStatus: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const donation = await ctx.db.get(args.donationId);
    if (!donation) return false;
    
    await ctx.db.patch(args.donationId, {
      whopPaymentId: args.whopPaymentId,
      whopPaymentStatus: args.whopPaymentStatus,
      updatedAt: Date.now(),
    });
    
    return true;
  },
});
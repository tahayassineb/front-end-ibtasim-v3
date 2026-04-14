import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ============================================
// QUERIES
// ============================================

/**
 * List kafala profiles.
 * Public callers: pass status filter "active" or ["active","sponsored"].
 * Admin callers: pass no filter to get all.
 */
export const getKafalaList = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("draft"),
        v.literal("active"),
        v.literal("sponsored"),
        v.literal("inactive")
      )
    ),
  },
  handler: async (ctx, args) => {
    if (args.status) {
      return await ctx.db
        .query("kafala")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .collect();
    }
    return await ctx.db.query("kafala").order("desc").collect();
  },
});

/**
 * Get all kafala visible on the public site (active + sponsored).
 */
export const getPublicKafalaList = query({
  args: {},
  handler: async (ctx) => {
    const active = await ctx.db
      .query("kafala")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();
    const sponsored = await ctx.db
      .query("kafala")
      .withIndex("by_status", (q) => q.eq("status", "sponsored"))
      .collect();
    return [...active, ...sponsored].sort((a, b) => b.createdAt - a.createdAt);
  },
});

/**
 * Get a single kafala profile with its current active sponsorship (if any).
 */
export const getKafalaById = query({
  args: { kafalaId: v.id("kafala") },
  handler: async (ctx, args) => {
    const kafala = await ctx.db.get(args.kafalaId);
    if (!kafala) return null;

    // Fetch active sponsorship
    const sponsorship = await ctx.db
      .query("kafalaSponsorship")
      .withIndex("by_kafala", (q) => q.eq("kafalaId", args.kafalaId))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "active"),
          q.eq(q.field("status"), "pending_payment")
        )
      )
      .first();

    let sponsor = null;
    if (sponsorship) {
      const user = await ctx.db.get(sponsorship.userId);
      sponsor = user
        ? { fullName: user.fullName, isAnonymous: false }
        : null;
    }

    return { ...kafala, sponsorship, sponsor };
  },
});

/**
 * Get pending kafala donations awaiting admin verification (bank/cash).
 */
export const getPendingKafalaVerifications = query({
  args: {},
  handler: async (ctx) => {
    const donations = await ctx.db
      .query("kafalaDonations")
      .withIndex("by_status", (q) =>
        q.eq("status", "awaiting_verification")
      )
      .order("asc")
      .collect();

    return await Promise.all(
      donations.map(async (d) => {
        const kafala = await ctx.db.get(d.kafalaId);
        const user = await ctx.db.get(d.userId);
        return {
          ...d,
          kafalaName: kafala?.name ?? "—",
          donorName: user?.fullName ?? "—",
          donorPhone: user?.phoneNumber ?? "—",
        };
      })
    );
  },
});

/**
 * Get all active bank/cash sponsorships (used by renewal reminder cron).
 * Excludes card_whop sponsorships (Whop handles auto-billing).
 */
export const getActiveBankCashSponsorships = query({
  args: {},
  handler: async (ctx) => {
    const active = await ctx.db
      .query("kafalaSponsorship")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();
    return active.filter((s) => s.paymentMethod !== "card_whop");
  },
});

/**
 * Get sponsorships for a user (their kafala history).
 */
export const getUserKafalaSponsorship = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const sponsorships = await ctx.db
      .query("kafalaSponsorship")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    return await Promise.all(
      sponsorships.map(async (s) => {
        const kafala = await ctx.db.get(s.kafalaId);
        return { ...s, kafala };
      })
    );
  },
});

// ============================================
// MUTATIONS — ADMIN: PROFILE MANAGEMENT
// ============================================

export const createKafala = mutation({
  args: {
    adminId: v.id("admins"),
    name: v.string(),
    gender: v.union(v.literal("male"), v.literal("female")),
    age: v.number(),
    location: v.string(),
    bio: v.object({ ar: v.string(), fr: v.string(), en: v.string() }),
    photo: v.optional(v.string()),
    monthlyPrice: v.number(), // In cents
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("kafala", {
      name: args.name,
      gender: args.gender,
      age: args.age,
      location: args.location,
      bio: args.bio,
      photo: args.photo,
      monthlyPrice: args.monthlyPrice,
      currency: "MAD",
      status: "draft",
      createdBy: args.adminId,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateKafala = mutation({
  args: {
    kafalaId: v.id("kafala"),
    name: v.optional(v.string()),
    gender: v.optional(v.union(v.literal("male"), v.literal("female"))),
    age: v.optional(v.number()),
    location: v.optional(v.string()),
    bio: v.optional(v.object({ ar: v.string(), fr: v.string(), en: v.string() })),
    photo: v.optional(v.string()),
    monthlyPrice: v.optional(v.number()),
    status: v.optional(
      v.union(
        v.literal("draft"),
        v.literal("active"),
        v.literal("sponsored"),
        v.literal("inactive")
      )
    ),
  },
  handler: async (ctx, args) => {
    const { kafalaId, ...fields } = args;
    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    for (const [key, val] of Object.entries(fields)) {
      if (val !== undefined) updates[key] = val;
    }
    await ctx.db.patch(kafalaId, updates);
  },
});

export const publishKafala = mutation({
  args: { kafalaId: v.id("kafala") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.kafalaId, {
      status: "active",
      updatedAt: Date.now(),
    });
  },
});

export const deleteKafala = mutation({
  args: { kafalaId: v.id("kafala") },
  handler: async (ctx, args) => {
    // Remove all related donations and sponsorships first
    const sponsorships = await ctx.db
      .query("kafalaSponsorship")
      .withIndex("by_kafala", (q) => q.eq("kafalaId", args.kafalaId))
      .collect();
    for (const s of sponsorships) {
      const donations = await ctx.db
        .query("kafalaDonations")
        .withIndex("by_sponsorship", (q) => q.eq("sponsorshipId", s._id))
        .collect();
      for (const d of donations) await ctx.db.delete(d._id);
      await ctx.db.delete(s._id);
    }
    await ctx.db.delete(args.kafalaId);
  },
});

/**
 * Admin re-opens a sponsored slot — marks old sponsorship as expired.
 */
export const resetKafala = mutation({
  args: { kafalaId: v.id("kafala") },
  handler: async (ctx, args) => {
    // Expire all active sponsorships for this kafala
    const sponsorships = await ctx.db
      .query("kafalaSponsorship")
      .withIndex("by_kafala", (q) => q.eq("kafalaId", args.kafalaId))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "active"),
          q.eq(q.field("status"), "pending_payment")
        )
      )
      .collect();
    for (const s of sponsorships) {
      await ctx.db.patch(s._id, { status: "expired", updatedAt: Date.now() });
    }
    await ctx.db.patch(args.kafalaId, {
      status: "active",
      updatedAt: Date.now(),
    });
  },
});

// ============================================
// MUTATIONS — DONOR: SPONSORSHIP FLOW
// ============================================

/**
 * Create a new sponsorship record (called when donation flow begins).
 * Marks kafala as "sponsored" immediately for card_whop (optimistic lock);
 * for bank/cash, kafala stays "active" until admin verifies.
 * Returns { sponsorshipId, donationId }.
 */
export const createSponsorship = mutation({
  args: {
    kafalaId: v.id("kafala"),
    userId: v.id("users"),
    paymentMethod: v.union(
      v.literal("card_whop"),
      v.literal("bank_transfer"),
      v.literal("cash_agency")
    ),
    isAnonymous: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Guard: ensure kafala is still available
    const kafala = await ctx.db.get(args.kafalaId);
    if (!kafala) throw new Error("الكفالة غير موجودة");
    if (kafala.status !== "active") {
      throw new Error("هذا اليتيم مكفول بالفعل");
    }

    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;

    // Create sponsorship record
    const sponsorshipId = await ctx.db.insert("kafalaSponsorship", {
      kafalaId: args.kafalaId,
      userId: args.userId,
      paymentMethod: args.paymentMethod,
      startDate: now,
      nextRenewalDate: now + thirtyDays,
      status: "pending_payment",
      createdAt: now,
      updatedAt: now,
    });

    // Determine initial donation status
    const donationStatus =
      args.paymentMethod === "card_whop"
        ? "pending"
        : "awaiting_receipt";

    // Create first kafalaDonation record
    const donationId = await ctx.db.insert("kafalaDonations", {
      kafalaId: args.kafalaId,
      userId: args.userId,
      sponsorshipId,
      amount: kafala.monthlyPrice,
      currency: "MAD",
      paymentMethod: args.paymentMethod,
      status: donationStatus,
      periodStart: now,
      periodEnd: now + thirtyDays,
      isAnonymous: args.isAnonymous ?? false,
      createdAt: now,
      updatedAt: now,
    });

    // Link donation back to sponsorship
    await ctx.db.patch(sponsorshipId, { lastDonationId: donationId });

    // NOTE: kafala stays "active" until payment is confirmed via processKafalaWhopPayment
    // or admin verification. Never lock optimistically — payment can fail.

    return { sponsorshipId, donationId };
  },
});

/**
 * Cancel a pending sponsorship + donation if Whop checkout fails.
 * Restores kafala to "active" so it can be claimed again.
 */
export const cancelSponsorship = mutation({
  args: {
    sponsorshipId: v.id("kafalaSponsorship"),
    donationId: v.id("kafalaDonations"),
  },
  handler: async (ctx, args) => {
    const sponsorship = await ctx.db.get(args.sponsorshipId);
    if (!sponsorship) return;

    // Only cancel if still pending (idempotency guard)
    if (sponsorship.status !== "pending_payment") return;

    await ctx.db.patch(args.sponsorshipId, {
      status: "cancelled",
      updatedAt: Date.now(),
    });
    await ctx.db.patch(args.donationId, {
      status: "rejected",
      updatedAt: Date.now(),
    });
    // Ensure kafala is re-opened (in case it was incorrectly locked)
    await ctx.db.patch(sponsorship.kafalaId, {
      status: "active",
      updatedAt: Date.now(),
    });
  },
});

/**
 * Upload bank/cash receipt for a kafala donation.
 */
export const uploadKafalaReceipt = mutation({
  args: {
    donationId: v.id("kafalaDonations"),
    receiptUrl: v.string(),
    bankName: v.optional(v.string()),
    transactionReference: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.donationId, {
      receiptUrl: args.receiptUrl,
      bankName: args.bankName,
      transactionReference: args.transactionReference,
      status: "awaiting_verification",
      updatedAt: Date.now(),
    });
  },
});

/**
 * Admin verifies or rejects a bank/cash kafala donation.
 * On verify: sponsorship → active, kafala → sponsored, nextRenewalDate extended 30 days.
 * On reject: sponsorship → cancelled, kafala → active (slot re-opens).
 */
export const verifyKafalaDonation = mutation({
  args: {
    donationId: v.id("kafalaDonations"),
    adminId: v.id("admins"),
    verified: v.boolean(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const donation = await ctx.db.get(args.donationId);
    if (!donation) throw new Error("التبرع غير موجود");

    const now = Date.now();

    if (args.verified) {
      // Mark donation verified
      await ctx.db.patch(args.donationId, {
        status: "verified",
        verifiedBy: args.adminId,
        verifiedAt: now,
        updatedAt: now,
      });

      // Activate sponsorship + extend renewal date
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      await ctx.db.patch(donation.sponsorshipId, {
        status: "active",
        nextRenewalDate: now + thirtyDays,
        updatedAt: now,
      });

      // Mark kafala as sponsored
      await ctx.db.patch(donation.kafalaId, {
        status: "sponsored",
        updatedAt: now,
      });
    } else {
      // Reject donation
      await ctx.db.patch(args.donationId, {
        status: "rejected",
        verifiedBy: args.adminId,
        verifiedAt: now,
        updatedAt: now,
      });

      // Cancel sponsorship
      await ctx.db.patch(donation.sponsorshipId, {
        status: "cancelled",
        updatedAt: now,
      });

      // Re-open kafala slot
      await ctx.db.patch(donation.kafalaId, {
        status: "active",
        updatedAt: now,
      });
    }
  },
});

/**
 * Called by Whop webhook / /kafala/success handler after successful card payment.
 * Idempotent — skips if donation already verified.
 */
export const processKafalaWhopPayment = mutation({
  args: {
    donationId: v.id("kafalaDonations"),
    whopPaymentId: v.string(),
    whopSubscriptionId: v.optional(v.string()),
    whopPlanId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const donation = await ctx.db.get(args.donationId);
    if (!donation) throw new Error("التبرع غير موجود");

    // Idempotency guard
    if (donation.status === "verified") return;

    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;

    // Verify donation
    await ctx.db.patch(args.donationId, {
      status: "verified",
      whopPaymentId: args.whopPaymentId,
      whopSubscriptionId: args.whopSubscriptionId,
      verifiedAt: now,
      updatedAt: now,
    });

    // Activate sponsorship
    await ctx.db.patch(donation.sponsorshipId, {
      status: "active",
      whopSubscriptionId: args.whopSubscriptionId,
      whopPlanId: args.whopPlanId,
      nextRenewalDate: now + thirtyDays,
      updatedAt: now,
    });

    // Ensure kafala is marked sponsored
    await ctx.db.patch(donation.kafalaId, {
      status: "sponsored",
      updatedAt: now,
    });
  },
});

/**
 * Look up an active sponsorship by Whop subscription/membership ID.
 * Used by the webhook handler to detect recurring monthly charges.
 */
export const getSponsorshipBySubscriptionId = query({
  args: { whopSubscriptionId: v.string() },
  handler: async (ctx, args) => {
    const active = await ctx.db
      .query("kafalaSponsorship")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .filter((q) => q.eq(q.field("whopSubscriptionId"), args.whopSubscriptionId))
      .first();
    return active ?? null;
  },
});

/**
 * Extend an active Whop subscription sponsorship by one month.
 * Called on each recurring `payment.succeeded` webhook from Whop.
 * Creates a new kafalaDonation record and pushes nextRenewalDate forward 30 days.
 */
export const extendKafalaSponsorship = mutation({
  args: {
    sponsorshipId: v.id("kafalaSponsorship"),
    whopPaymentId: v.string(),
  },
  handler: async (ctx, args) => {
    const sponsorship = await ctx.db.get(args.sponsorshipId);
    if (!sponsorship) throw new Error("الاشتراك غير موجود");
    if (sponsorship.status !== "active") return; // Already expired or cancelled

    const kafala = await ctx.db.get(sponsorship.kafalaId);
    if (!kafala) throw new Error("الكفالة غير موجودة");

    // Idempotency: check if this payment ID was already processed
    const recentDonations = await ctx.db
      .query("kafalaDonations")
      .withIndex("by_sponsorship", (q) => q.eq("sponsorshipId", args.sponsorshipId))
      .order("desc")
      .take(5);
    const alreadyProcessed = recentDonations.some(
      (d) => d.whopPaymentId === args.whopPaymentId
    );
    if (alreadyProcessed) return; // Already handled — idempotent

    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;

    // Create new donation record for this renewal cycle
    const donationId = await ctx.db.insert("kafalaDonations", {
      kafalaId: sponsorship.kafalaId,
      userId: sponsorship.userId,
      sponsorshipId: args.sponsorshipId,
      amount: kafala.monthlyPrice,
      currency: "MAD",
      paymentMethod: "card_whop",
      status: "verified",
      whopPaymentId: args.whopPaymentId,
      whopSubscriptionId: sponsorship.whopSubscriptionId,
      periodStart: now,
      periodEnd: now + thirtyDays,
      isAnonymous: false,
      verifiedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    // Push the renewal date forward 30 days and link latest donation
    await ctx.db.patch(args.sponsorshipId, {
      nextRenewalDate: now + thirtyDays,
      lastDonationId: donationId,
      updatedAt: now,
    });

    // Ensure kafala stays marked as sponsored
    await ctx.db.patch(sponsorship.kafalaId, {
      status: "sponsored",
      updatedAt: now,
    });
  },
});

/**
 * Donor renews kafala for the next month (bank/cash path).
 * Creates a new kafalaDonation linked to the existing sponsorship.
 */
export const renewKafalaDonation = mutation({
  args: {
    sponsorshipId: v.id("kafalaSponsorship"),
    paymentMethod: v.union(
      v.literal("bank_transfer"),
      v.literal("cash_agency"),
      v.literal("card_whop")
    ),
    isAnonymous: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const sponsorship = await ctx.db.get(args.sponsorshipId);
    if (!sponsorship) throw new Error("الاشتراك غير موجود");
    if (sponsorship.status !== "active" && sponsorship.status !== "expired") {
      throw new Error("لا يمكن تجديد هذا الاشتراك");
    }

    const kafala = await ctx.db.get(sponsorship.kafalaId);
    if (!kafala) throw new Error("الكفالة غير موجودة");

    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;

    const donationId = await ctx.db.insert("kafalaDonations", {
      kafalaId: sponsorship.kafalaId,
      userId: sponsorship.userId,
      sponsorshipId: args.sponsorshipId,
      amount: kafala.monthlyPrice,
      currency: "MAD",
      paymentMethod: args.paymentMethod,
      status: args.paymentMethod === "card_whop" ? "pending" : "awaiting_receipt",
      periodStart: now,
      periodEnd: now + thirtyDays,
      isAnonymous: args.isAnonymous ?? false,
      createdAt: now,
      updatedAt: now,
    });

    // Update sponsorship to pending_payment until verified
    await ctx.db.patch(args.sponsorshipId, {
      status: "pending_payment",
      lastDonationId: donationId,
      updatedAt: now,
    });

    return { donationId };
  },
});

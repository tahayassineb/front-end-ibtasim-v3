import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { requireAdmin } from "./permissions";
import { excerpt, slugify } from "./seo";

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
    featured: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let list;
    if (args.featured) {
      list = await ctx.db
        .query("kafala")
        .withIndex("by_featured", (q) => q.eq("isFeatured", true))
        .take(args.limit ?? 100);
      return [...list].sort((a, b) => (a.featuredOrder ?? 9999) - (b.featuredOrder ?? 9999));
    }
    if (args.status) {
      list = await ctx.db
        .query("kafala")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .take(args.limit ?? 100);
      return list;
    }
    return await ctx.db.query("kafala").order("desc").take(args.limit ?? 200);
  },
});

/**
 * Get all kafala visible on the public site (active + sponsored).
 */
export const getPublicKafalaList = query({
  args: {
    featured: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (args.featured) {
      const featured = await ctx.db
        .query("kafala")
        .withIndex("by_featured", (q) => q.eq("isFeatured", true))
        .take(args.limit ?? 12);
      return [...featured]
        .filter((k) => k.status === "active" || k.status === "sponsored")
        .sort((a, b) => (a.featuredOrder ?? 9999) - (b.featuredOrder ?? 9999));
    }
    const active = await ctx.db
      .query("kafala")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();
    const sponsored = await ctx.db
      .query("kafala")
      .withIndex("by_status", (q) => q.eq("status", "sponsored"))
      .collect();
    return [...active, ...sponsored]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, args.limit ?? 100);
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
 * Get the active/pending sponsorship for a specific kafala + user combination.
 * Used by the sponsor's renewal page to confirm they are the current sponsor.
 */
export const getActiveSponsorshipByKafalaAndUser = query({
  args: { kafalaId: v.id("kafala"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const sponsorships = await ctx.db
      .query("kafalaSponsorship")
      .withIndex("by_kafala", (q) => q.eq("kafalaId", args.kafalaId))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();
    // Return the most recent active or pending one
    const active = sponsorships.find(
      (s) => s.status === "active" || s.status === "pending_payment" || s.status === "expired"
    );
    return active ?? null;
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
    isFeatured: v.optional(v.boolean()),
    featuredOrder: v.optional(v.number()),
    slug: v.optional(v.string()),
    metaTitle: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
    imageAlt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminId, "content:write");
    const now = Date.now();
    let featuredOrder = args.featuredOrder;
    if (args.isFeatured && !featuredOrder) {
      const existingFeatured = await ctx.db
        .query("kafala")
        .withIndex("by_featured", (q) => q.eq("isFeatured", true))
        .collect();
      featuredOrder = existingFeatured.length + 1;
    }
    const kafalaId = await ctx.db.insert("kafala", {
      name: args.name,
      gender: args.gender,
      age: args.age,
      location: args.location,
      bio: args.bio,
      photo: args.photo,
      monthlyPrice: args.monthlyPrice,
      currency: "MAD",
      status: "draft",
      isFeatured: args.isFeatured ?? false,
      featuredOrder,
      slug: args.slug || slugify(args.name),
      metaTitle: args.metaTitle || args.name,
      metaDescription: args.metaDescription || excerpt(args.bio.ar || args.bio.fr || args.bio.en),
      imageAlt: args.imageAlt || args.name,
      canonicalPath: `/kafala/${args.slug || slugify(args.name)}`,
      createdBy: args.adminId,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("activities", {
      actorId: args.adminId,
      actorType: "admin",
      action: "kafala.created",
      entityType: "kafala",
      entityId: String(kafalaId),
      createdAt: now,
    });
    return kafalaId;
  },
});

export const getKafalaBySlugOrId = query({
  args: { ref: v.string() },
  handler: async (ctx, args) => {
    const normalizedId = ctx.db.normalizeId("kafala", args.ref);
    let kafala = normalizedId ? await ctx.db.get(normalizedId) : null;

    if (!kafala) {
      const all = await ctx.db.query("kafala").collect();
      kafala = all.find((item) => item.slug === args.ref) ?? null;
    }
    if (!kafala) return null;

    const sponsorship = await ctx.db
      .query("kafalaSponsorship")
      .withIndex("by_kafala", (q) => q.eq("kafalaId", kafala._id))
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
      sponsor = user ? { fullName: user.fullName, isAnonymous: false } : null;
    }

    return { ...kafala, sponsorship, sponsor };
  },
});

export const updateKafala = mutation({
  args: {
    kafalaId: v.id("kafala"),
    adminId: v.optional(v.id("admins")),
    name: v.optional(v.string()),
    gender: v.optional(v.union(v.literal("male"), v.literal("female"))),
    age: v.optional(v.number()),
    location: v.optional(v.string()),
    bio: v.optional(v.object({ ar: v.string(), fr: v.string(), en: v.string() })),
    photo: v.optional(v.string()),
    monthlyPrice: v.optional(v.number()),
    isFeatured: v.optional(v.boolean()),
    featuredOrder: v.optional(v.number()),
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
    if (args.adminId) await requireAdmin(ctx, args.adminId, "content:write");
    const { kafalaId, adminId, ...fields } = args;
    const current = await ctx.db.get(kafalaId);
    if (!current) throw new Error("الكفالة غير موجودة");
    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    for (const [key, val] of Object.entries(fields)) {
      if (val !== undefined) updates[key] = val;
    }
    if (fields.isFeatured === true && !current.isFeatured && fields.featuredOrder === undefined) {
      const existingFeatured = await ctx.db
        .query("kafala")
        .withIndex("by_featured", (q) => q.eq("isFeatured", true))
        .collect();
      updates.featuredOrder = existingFeatured.length + 1;
    }
    await ctx.db.patch(kafalaId, updates);
    if (adminId) {
      await ctx.db.insert("activities", {
        actorId: adminId,
        actorType: "admin",
        action: "kafala.updated",
        entityType: "kafala",
        entityId: String(kafalaId),
        createdAt: Date.now(),
      });
    }
  },
});

export const publishKafala = mutation({
  args: { kafalaId: v.id("kafala"), adminId: v.optional(v.id("admins")) },
  handler: async (ctx, args) => {
    if (args.adminId) await requireAdmin(ctx, args.adminId, "content:write");
    await ctx.db.patch(args.kafalaId, {
      status: "active",
      updatedAt: Date.now(),
    });
    if (args.adminId) await ctx.db.insert("activities", {
      actorId: args.adminId,
      actorType: "admin",
      action: "kafala.published",
      entityType: "kafala",
      entityId: String(args.kafalaId),
      createdAt: Date.now(),
    });
  },
});

export const deleteKafala = mutation({
  args: { kafalaId: v.id("kafala"), adminId: v.optional(v.id("admins")) },
  handler: async (ctx, args) => {
    if (args.adminId) await requireAdmin(ctx, args.adminId, "content:write");
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
    if (args.adminId) await ctx.db.insert("activities", {
      actorId: args.adminId,
      actorType: "admin",
      action: "kafala.deleted",
      entityType: "kafala",
      entityId: String(args.kafalaId),
      createdAt: Date.now(),
    });
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

    // Guard against duplicate pending/active sponsorship for same user+kafala
    const existingSponsorship = await ctx.db
      .query("kafalaSponsorship")
      .withIndex("by_kafala", (q) => q.eq("kafalaId", args.kafalaId))
      .filter((q) =>
        q.and(
          q.eq(q.field("userId"), args.userId),
          q.or(
            q.eq(q.field("status"), "active"),
            q.eq(q.field("status"), "pending_payment")
          )
        )
      )
      .first();
    if (existingSponsorship) {
      throw new Error("لديك بالفعل كفالة نشطة أو في انتظار الدفع لهذا اليتيم");
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

    // Notify admin via WhatsApp
    try {
      await ctx.scheduler.runAfter(0, api.notifications.notifyAdminNewVerification, {
        type: "kafala",
        donationId: args.donationId as string,
      });
    } catch (e) { console.error("Admin notification failed:", e); }
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
    await requireAdmin(ctx, args.adminId, "verification:write");
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
      await ctx.db.insert("activities", {
        actorId: args.adminId,
        actorType: "admin",
        action: "verification.kafala_approved",
        entityType: "kafalaDonation",
        entityId: String(args.donationId),
        metadata: { kafalaId: String(donation.kafalaId), amount: donation.amount },
        createdAt: now,
      });

      // Activate sponsorship + extend renewal date (reset reminder tracking)
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      await ctx.db.patch(donation.sponsorshipId, {
        status: "active",
        nextRenewalDate: now + thirtyDays,
        remindersSent: [],
        updatedAt: now,
      });

      // Mark kafala as sponsored
      await ctx.db.patch(donation.kafalaId, {
        status: "sponsored",
        updatedAt: now,
      });

      // Notify user via WhatsApp
      try {
        await ctx.scheduler.runAfter(0, api.notifications.sendKafalaVerificationNotification, {
          userId: donation.userId,
          kafalaId: donation.kafalaId,
          verified: true,
        });
      } catch (e) { console.error("Kafala verify notification failed:", e); }
    } else {
      // Reject donation
      await ctx.db.patch(args.donationId, {
        status: "rejected",
        verifiedBy: args.adminId,
        verifiedAt: now,
        updatedAt: now,
      });
      await ctx.db.insert("activities", {
        actorId: args.adminId,
        actorType: "admin",
        action: "verification.kafala_rejected",
        entityType: "kafalaDonation",
        entityId: String(args.donationId),
        metadata: { kafalaId: String(donation.kafalaId), notes: args.notes },
        createdAt: now,
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

      // Notify user via WhatsApp
      try {
        await ctx.scheduler.runAfter(0, api.notifications.sendKafalaVerificationNotification, {
          userId: donation.userId,
          kafalaId: donation.kafalaId,
          verified: false,
          notes: args.notes,
        });
      } catch (e) { console.error("Kafala rejection notification failed:", e); }
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

    // Idempotency: check all records for this payment ID (not just last 5)
    const existingWithSamePayment = await ctx.db
      .query("kafalaDonations")
      .withIndex("by_sponsorship", (q) => q.eq("sponsorshipId", args.sponsorshipId))
      .filter((q) => q.eq(q.field("whopPaymentId"), args.whopPaymentId))
      .first();
    if (existingWithSamePayment) return; // Already processed this exact payment

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

    // Push the renewal date forward 30 days, link latest donation, reset reminder tracking
    await ctx.db.patch(args.sponsorshipId, {
      nextRenewalDate: now + thirtyDays,
      lastDonationId: donationId,
      remindersSent: [],
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
 * Get a single sponsorship by its ID.
 * Used by cancelKafalaSubscription action.
 */
export const getSponsorshipById = query({
  args: { sponsorshipId: v.id("kafalaSponsorship") },
  handler: async (ctx, args) => ctx.db.get(args.sponsorshipId),
});

/**
 * Expire a sponsorship and re-open the kafala slot.
 * Used by expiry cron, membership.cancelled webhook, and cancel action.
 */
export const expireSponsorship = mutation({
  args: { sponsorshipId: v.id("kafalaSponsorship") },
  handler: async (ctx, args) => {
    const s = await ctx.db.get(args.sponsorshipId);
    if (!s || s.status !== "active") return;
    const now = Date.now();
    await ctx.db.patch(args.sponsorshipId, { status: "expired", updatedAt: now });
    await ctx.db.patch(s.kafalaId, { status: "active", updatedAt: now });
  },
});

/**
 * Expire an active sponsorship by its Whop subscription ID.
 * Called when Whop fires a membership.cancelled event.
 */
export const expireSponsorshipBySubscriptionId = mutation({
  args: { whopSubscriptionId: v.string() },
  handler: async (ctx, args) => {
    const sponsorship = await ctx.db
      .query("kafalaSponsorship")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .filter((q) => q.eq(q.field("whopSubscriptionId"), args.whopSubscriptionId))
      .first();
    if (!sponsorship) return;
    const now = Date.now();
    await ctx.db.patch(sponsorship._id, { status: "expired", updatedAt: now });
    await ctx.db.patch(sponsorship.kafalaId, { status: "active", updatedAt: now });
  },
});

/**
 * Get active bank/cash sponsorships whose nextRenewalDate is before the given cutoff.
 * Used by the daily expiry cron (3-day grace period applied by caller).
 */
export const getOverdueBankCashSponsorships = query({
  args: { cutoff: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("kafalaSponsorship")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .filter((q) =>
        q.and(
          q.neq(q.field("paymentMethod"), "card_whop"),
          q.lt(q.field("nextRenewalDate"), args.cutoff)
        )
      )
      .collect();
  },
});

/**
 * Record that a reminder at a given level has been sent for this sponsorship.
 * Used by the renewal reminder cron to prevent re-sending.
 */
export const markReminderSent = mutation({
  args: { sponsorshipId: v.id("kafalaSponsorship"), reminderKey: v.string() },
  handler: async (ctx, args) => {
    const s = await ctx.db.get(args.sponsorshipId);
    if (!s) return;
    const existing = s.remindersSent ?? [];
    if (existing.includes(args.reminderKey)) return;
    await ctx.db.patch(args.sponsorshipId, {
      remindersSent: [...existing, args.reminderKey],
      updatedAt: Date.now(),
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

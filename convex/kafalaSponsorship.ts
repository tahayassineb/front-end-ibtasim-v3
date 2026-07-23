import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { requireKafalaAdminActor } from "./kafalaHelpers";

async function storageObjectExists(ctx: any, storageId: string) {
  if (!storageId || storageId.length < 16) return false;
  try {
    const url = await ctx.storage.getUrl(storageId as any);
    return Boolean(url);
  } catch {
    return false;
  }
}

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

/**
 * Create a new sponsorship record (called when donation flow begins).
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
    plan: v.optional(v.union(v.literal("monthly"), v.literal("annual"))),
  },
  handler: async (ctx, args) => {
    const kafala = await ctx.db.get(args.kafalaId);
    if (!kafala) throw new Error("Ø§Ù„ÙƒÙØ§Ù„Ø© ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯Ø©");
    if (kafala.status !== "active") {
      throw new Error("Ù‡Ø°Ø§ Ø§Ù„ÙŠØªÙŠÙ… Ù…ÙƒÙÙˆÙ„ Ø¨Ø§Ù„ÙØ¹Ù„");
    }

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
      throw new Error("Ù„Ø¯ÙŠÙƒ Ø¨Ø§Ù„ÙØ¹Ù„ ÙƒÙØ§Ù„Ø© Ù†Ø´Ø·Ø© Ø£Ùˆ ÙÙŠ Ø§Ù†ØªØ¸Ø§Ø± Ø§Ù„Ø¯ÙØ¹ Ù„Ù‡Ø°Ø§ Ø§Ù„ÙŠØªÙŠÙ…");
    }

    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const plan: "monthly" | "annual" = args.plan ?? "monthly";
    const periodMs = plan === "annual" ? 365 * dayMs : 30 * dayMs;
    const donationAmount =
      plan === "annual" ? kafala.monthlyPrice * 12 : kafala.monthlyPrice;

    const sponsorshipId = await ctx.db.insert("kafalaSponsorship", {
      kafalaId: args.kafalaId,
      userId: args.userId,
      paymentMethod: args.paymentMethod,
      plan,
      startDate: now,
      nextRenewalDate: now + periodMs,
      status: "pending_payment",
      createdAt: now,
      updatedAt: now,
    });

    const donationStatus =
      args.paymentMethod === "card_whop" ? "pending" : "awaiting_receipt";

    const donationId = await ctx.db.insert("kafalaDonations", {
      kafalaId: args.kafalaId,
      userId: args.userId,
      sponsorshipId,
      amount: donationAmount,
      currency: "MAD",
      paymentMethod: args.paymentMethod,
      plan,
      status: donationStatus,
      periodStart: now,
      periodEnd: now + periodMs,
      isAnonymous: args.isAnonymous ?? false,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.patch(sponsorshipId, { lastDonationId: donationId });

    return { sponsorshipId, donationId };
  },
});

/**
 * Cancel a pending sponsorship + donation if Whop checkout fails.
 */
export const cancelSponsorship = mutation({
  args: {
    sponsorshipId: v.id("kafalaSponsorship"),
    donationId: v.id("kafalaDonations"),
  },
  handler: async (ctx, args) => {
    const sponsorship = await ctx.db.get(args.sponsorshipId);
    if (!sponsorship) return;
    if (sponsorship.status !== "pending_payment") return;

    await ctx.db.patch(args.sponsorshipId, {
      status: "cancelled",
      updatedAt: Date.now(),
    });
    await ctx.db.patch(args.donationId, {
      status: "rejected",
      updatedAt: Date.now(),
    });
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
    const donation = await ctx.db.get(args.donationId);
    if (!donation) throw new Error("ØªØ¹Ø°Ø± Ø§Ù„Ø¹Ø«ÙˆØ± Ø¹Ù„Ù‰ ØªØ¨Ø±Ø¹ Ø§Ù„ÙƒÙØ§Ù„Ø©");
    if (donation.status !== "awaiting_receipt") throw new Error("Ù‡Ø°Ø§ Ø§Ù„ØªØ¨Ø±Ø¹ Ù„Ø§ ÙŠÙ†ØªØ¸Ø± ÙˆØµÙ„Ø§Ù‹ Ø­Ø§Ù„ÙŠØ§Ù‹");
    if (!(await storageObjectExists(ctx, args.receiptUrl))) {
      throw new Error("ØªØ¹Ø°Ø± Ø§Ù„ØªØ­Ù‚Ù‚ Ù…Ù† Ù…Ù„Ù Ø§Ù„ÙˆØµÙ„ Ø§Ù„Ù…Ø±ÙÙˆØ¹");
    }

    await ctx.db.patch(args.donationId, {
      receiptUrl: args.receiptUrl,
      bankName: args.bankName,
      transactionReference: args.transactionReference,
      status: "awaiting_verification",
      updatedAt: Date.now(),
    });

    try {
      await ctx.scheduler.runAfter(0, api.notifications.notifyAdminNewVerification, {
        type: "kafala",
        donationId: args.donationId as string,
      });
    } catch (e) {
      console.error("Admin notification failed:", e);
    }
  },
});

/**
 * Admin verifies or rejects a bank/cash kafala donation.
 */
export const verifyKafalaDonation = mutation({
  args: {
    donationId: v.id("kafalaDonations"),
    sessionToken: v.string(),
    verified: v.boolean(),
    notes: v.optional(v.string()),
    checklist: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const actor = await requireKafalaAdminActor(
      ctx,
      { sessionToken: args.sessionToken },
      "verification:write"
    );
    const donation = await ctx.db.get(args.donationId);
    if (!donation) throw new Error("Ø§Ù„ØªØ¨Ø±Ø¹ ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯");

    const now = Date.now();

    if (args.verified) {
      await ctx.db.patch(args.donationId, {
        status: "verified",
        verifiedBy: actor._id,
        verifiedAt: now,
        updatedAt: now,
      });
      await ctx.db.insert("activities", {
        actorId: actor._id,
        actorType: "admin",
        action: "verification.kafala_approved",
        entityType: "kafalaDonation",
        entityId: String(args.donationId),
        metadata: {
          kafalaId: String(donation.kafalaId),
          amount: donation.amount,
          checklist: args.checklist ?? [],
        },
        createdAt: now,
      });

      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      await ctx.db.patch(donation.sponsorshipId, {
        status: "active",
        nextRenewalDate: now + thirtyDays,
        remindersSent: [],
        updatedAt: now,
      });

      await ctx.db.patch(donation.kafalaId, {
        status: "sponsored",
        updatedAt: now,
      });

      try {
        await ctx.scheduler.runAfter(0, api.notifications.sendKafalaVerificationNotification, {
          userId: donation.userId,
          kafalaId: donation.kafalaId,
          verified: true,
        });
      } catch (e) {
        console.error("Kafala verify notification failed:", e);
      }
    } else {
      await ctx.db.patch(args.donationId, {
        status: "rejected",
        verifiedBy: actor._id,
        verifiedAt: now,
        updatedAt: now,
      });
      await ctx.db.insert("activities", {
        actorId: actor._id,
        actorType: "admin",
        action: "verification.kafala_rejected",
        entityType: "kafalaDonation",
        entityId: String(args.donationId),
        metadata: {
          kafalaId: String(donation.kafalaId),
          notes: args.notes,
          checklist: args.checklist ?? [],
        },
        createdAt: now,
      });

      await ctx.db.patch(donation.sponsorshipId, {
        status: "cancelled",
        updatedAt: now,
      });

      await ctx.db.patch(donation.kafalaId, {
        status: "active",
        updatedAt: now,
      });

      try {
        await ctx.scheduler.runAfter(0, api.notifications.sendKafalaVerificationNotification, {
          userId: donation.userId,
          kafalaId: donation.kafalaId,
          verified: false,
          notes: args.notes,
        });
      } catch (e) {
        console.error("Kafala rejection notification failed:", e);
      }
    }
  },
});

/**
 * Called by Whop webhook / /kafala/success handler after successful card payment.
 */
export const processKafalaWhopPayment = internalMutation({
  args: {
    donationId: v.id("kafalaDonations"),
    whopPaymentId: v.string(),
    whopSubscriptionId: v.optional(v.string()),
    whopPlanId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const donation = await ctx.db.get(args.donationId);
    if (!donation) throw new Error("Ø§Ù„ØªØ¨Ø±Ø¹ ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯");
    if (donation.status === "verified") return;

    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;

    await ctx.db.patch(args.donationId, {
      status: "verified",
      whopPaymentId: args.whopPaymentId,
      whopSubscriptionId: args.whopSubscriptionId,
      verifiedAt: now,
      updatedAt: now,
    });

    await ctx.db.patch(donation.sponsorshipId, {
      status: "active",
      whopSubscriptionId: args.whopSubscriptionId,
      whopPlanId: args.whopPlanId,
      nextRenewalDate: now + thirtyDays,
      updatedAt: now,
    });

    await ctx.db.patch(donation.kafalaId, {
      status: "sponsored",
      updatedAt: now,
    });
  },
});

/**
 * Look up an active sponsorship by Whop subscription/membership ID.
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
 */
export const extendKafalaSponsorship = internalMutation({
  args: {
    sponsorshipId: v.id("kafalaSponsorship"),
    whopPaymentId: v.string(),
  },
  handler: async (ctx, args) => {
    const sponsorship = await ctx.db.get(args.sponsorshipId);
    if (!sponsorship) throw new Error("Ø§Ù„Ø§Ø´ØªØ±Ø§Ùƒ ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯");
    if (sponsorship.status !== "active") return;

    const kafala = await ctx.db.get(sponsorship.kafalaId);
    if (!kafala) throw new Error("Ø§Ù„ÙƒÙØ§Ù„Ø© ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯Ø©");

    const existingWithSamePayment = await ctx.db
      .query("kafalaDonations")
      .withIndex("by_sponsorship", (q) => q.eq("sponsorshipId", args.sponsorshipId))
      .filter((q) => q.eq(q.field("whopPaymentId"), args.whopPaymentId))
      .first();
    if (existingWithSamePayment) return;

    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const plan: "monthly" | "annual" = sponsorship.plan ?? "monthly";
    const periodMs = plan === "annual" ? 365 * dayMs : 30 * dayMs;
    const donationAmount =
      plan === "annual" ? kafala.monthlyPrice * 12 : kafala.monthlyPrice;

    const donationId = await ctx.db.insert("kafalaDonations", {
      kafalaId: sponsorship.kafalaId,
      userId: sponsorship.userId,
      sponsorshipId: args.sponsorshipId,
      amount: donationAmount,
      currency: "MAD",
      paymentMethod: "card_whop",
      plan,
      status: "verified",
      whopPaymentId: args.whopPaymentId,
      whopSubscriptionId: sponsorship.whopSubscriptionId,
      periodStart: now,
      periodEnd: now + periodMs,
      isAnonymous: false,
      verifiedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.patch(args.sponsorshipId, {
      nextRenewalDate: now + periodMs,
      lastDonationId: donationId,
      remindersSent: [],
      updatedAt: now,
    });

    await ctx.db.patch(sponsorship.kafalaId, {
      status: "sponsored",
      updatedAt: now,
    });
  },
});

/**
 * Get a single sponsorship by its ID.
 */
export const getSponsorshipById = query({
  args: { sponsorshipId: v.id("kafalaSponsorship") },
  handler: async (ctx, args) => ctx.db.get(args.sponsorshipId),
});

/**
 * Donor renews kafala for the next month (bank/cash path).
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
    plan: v.optional(v.union(v.literal("monthly"), v.literal("annual"))),
  },
  handler: async (ctx, args) => {
    const sponsorship = await ctx.db.get(args.sponsorshipId);
    if (!sponsorship) throw new Error("Ø§Ù„Ø§Ø´ØªØ±Ø§Ùƒ ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯");
    if (sponsorship.status !== "active" && sponsorship.status !== "expired") {
      throw new Error("Ù„Ø§ ÙŠÙ…ÙƒÙ† ØªØ¬Ø¯ÙŠØ¯ Ù‡Ø°Ø§ Ø§Ù„Ø§Ø´ØªØ±Ø§Ùƒ");
    }

    const kafala = await ctx.db.get(sponsorship.kafalaId);
    if (!kafala) throw new Error("Ø§Ù„ÙƒÙØ§Ù„Ø© ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯Ø©");

    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const plan: "monthly" | "annual" = args.plan ?? sponsorship.plan ?? "monthly";
    const periodMs = plan === "annual" ? 365 * dayMs : 30 * dayMs;
    const donationAmount =
      plan === "annual" ? kafala.monthlyPrice * 12 : kafala.monthlyPrice;

    const donationId = await ctx.db.insert("kafalaDonations", {
      kafalaId: sponsorship.kafalaId,
      userId: sponsorship.userId,
      sponsorshipId: args.sponsorshipId,
      amount: donationAmount,
      currency: "MAD",
      paymentMethod: args.paymentMethod,
      plan,
      status: args.paymentMethod === "card_whop" ? "pending" : "awaiting_receipt",
      periodStart: now,
      periodEnd: now + periodMs,
      isAnonymous: args.isAnonymous ?? false,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.patch(args.sponsorshipId, {
      status: "pending_payment",
      lastDonationId: donationId,
      updatedAt: now,
    });

    return { donationId };
  },
});

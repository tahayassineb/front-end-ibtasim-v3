import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { getStoredPaymentAmount } from "./paymentUtils";
import { shouldIgnorePaymentAttemptStatusUpdate } from "./paymentStateRules";
import {
  buildAutoVerifiedDonationInsert,
  buildCompletedPaymentAttemptPatch,
  buildIgnoredPaymentAttemptWebhookPatch,
  buildTerminalPaymentAttemptPatch,
  buildVerifiedDonationPatch,
} from "./paymentReconciliationHelpers";

export const createCardPaymentAttempt = internalMutation({
  args: {
    userId: v.id("users"),
    projectId: v.id("projects"),
    amount: v.number(),
    coversFees: v.boolean(),
    isAnonymous: v.boolean(),
    message: v.optional(v.string()),
  },
  returns: v.id("payments"),
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("payments", {
      userId: args.userId,
      projectId: args.projectId,
      provider: "whop",
      amount: args.amount,
      currency: "MAD",
      coversFees: args.coversFees,
      isAnonymous: args.isAnonymous,
      message: args.message,
      status: "pending",
      initiatedAt: now,
      webhookEvents: [],
    });
  },
});

export const setCardPaymentAttemptCheckoutSession = internalMutation({
  args: {
    paymentAttemptId: v.id("payments"),
    checkoutSessionId: v.string(),
    whopProductId: v.optional(v.string()),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const paymentAttempt = await ctx.db.get(args.paymentAttemptId);
    if (!paymentAttempt) return false;

    await ctx.db.patch(args.paymentAttemptId, {
      checkoutSessionId: args.checkoutSessionId,
      whopProductId: args.whopProductId,
      status: paymentAttempt.status === "pending" ? "processing" : paymentAttempt.status,
    });
    return true;
  },
});

export const markCardPaymentAttemptState = internalMutation({
  args: {
    paymentAttemptId: v.optional(v.id("payments")),
    whopPaymentId: v.optional(v.string()),
    status: v.union(v.literal("failed"), v.literal("refunded"), v.literal("cancelled")),
    reason: v.optional(v.string()),
    eventName: v.optional(v.string()),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    let paymentAttempt = args.paymentAttemptId ? await ctx.db.get(args.paymentAttemptId) : null;
    if (!paymentAttempt && args.whopPaymentId) {
      paymentAttempt = await ctx.db
        .query("payments")
        .withIndex("by_whop_payment", (q) => q.eq("whopPaymentId", args.whopPaymentId!))
        .unique();
    }
    if (!paymentAttempt) return false;

    const now = Date.now();
    if (shouldIgnorePaymentAttemptStatusUpdate(paymentAttempt.status, args.status)) {
      await ctx.db.patch(
        paymentAttempt._id,
        buildIgnoredPaymentAttemptWebhookPatch({
          eventName: args.eventName,
          now,
          paymentAttempt,
          whopPaymentId: args.whopPaymentId,
        }),
      );
      return true;
    }

    await ctx.db.patch(
      paymentAttempt._id,
      buildTerminalPaymentAttemptPatch({
        eventName: args.eventName,
        now,
        paymentAttempt,
        reason: args.reason,
        status: args.status,
        whopPaymentId: args.whopPaymentId,
      }),
    );
    return true;
  },
});

export const finalizeWhopCardPayment = internalMutation({
  args: {
    paymentAttemptId: v.optional(v.id("payments")),
    whopPaymentId: v.string(),
    whopPaymentStatus: v.optional(v.string()),
    eventName: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    donationId: v.optional(v.id("donations")),
    amount: v.optional(v.number()),
  }),
  handler: async (ctx, args) => {
    let paymentAttempt = args.paymentAttemptId ? await ctx.db.get(args.paymentAttemptId) : null;
    if (!paymentAttempt) {
      paymentAttempt = await ctx.db
        .query("payments")
        .withIndex("by_whop_payment", (q) => q.eq("whopPaymentId", args.whopPaymentId))
        .unique();
    }

    if (!paymentAttempt) {
      await ctx.db.insert("errorLogs", {
        source: "payments_finalize",
        level: "error",
        message: `Payment attempt not found for Whop payment ${args.whopPaymentId}`,
        details: JSON.stringify({
          paymentAttemptId: args.paymentAttemptId ?? null,
          whopPaymentStatus: args.whopPaymentStatus ?? null,
        }),
        createdAt: Date.now(),
      });
      return { success: false };
    }

    if (paymentAttempt.status === "completed" && paymentAttempt.donationId) {
      const paymentAmount = getStoredPaymentAmount(paymentAttempt);
      await ctx.db.patch(
        paymentAttempt._id,
        buildIgnoredPaymentAttemptWebhookPatch({
          eventName: args.eventName,
          now: Date.now(),
          paymentAttempt,
          whopPaymentId: args.whopPaymentId,
        }),
      );
      return {
        success: true,
        donationId: paymentAttempt.donationId,
        amount: paymentAmount,
      };
    }

    const now = Date.now();
    const paymentAmount = getStoredPaymentAmount(paymentAttempt);
    let donation = paymentAttempt.donationId ? await ctx.db.get(paymentAttempt.donationId) : null;
    let donationId = paymentAttempt.donationId;
    let justVerified = false;

    if (!donation) {
      donationId = await ctx.db.insert(
        "donations",
        buildAutoVerifiedDonationInsert({
          now,
          paymentAmount,
          paymentAttempt,
          whopPaymentId: args.whopPaymentId,
          whopPaymentStatus: args.whopPaymentStatus,
        }),
      );
      donation = await ctx.db.get(donationId);
      justVerified = true;
    } else if (donation.status !== "verified" && donation.status !== "completed") {
      await ctx.db.patch(
        donation._id,
        buildVerifiedDonationPatch({
          donation,
          now,
          whopPaymentId: args.whopPaymentId,
          whopPaymentStatus: args.whopPaymentStatus,
        }),
      );
      donation = await ctx.db.get(donation._id);
      justVerified = true;
    }

    await ctx.db.patch(
      paymentAttempt._id,
      buildCompletedPaymentAttemptPatch({
        donationId,
        eventName: args.eventName,
        now,
        paymentAttempt,
        whopPaymentId: args.whopPaymentId,
      }),
    );

    if (justVerified && donation) {
      const project = await ctx.db.get(donation.projectId);
      if (project) {
        await ctx.db.patch(donation.projectId, {
          raisedAmount: project.raisedAmount + donation.amount,
          updatedAt: now,
        });
      }

      const user = await ctx.db.get(donation.userId);
      if (user) {
        await ctx.db.patch(donation.userId, {
          totalDonated: (user.totalDonated ?? 0) + donation.amount,
          donationCount: (user.donationCount ?? 0) + 1,
        });
      }

      await ctx.db.insert("verificationLogs", {
        donationId: donation._id,
        adminId: undefined,
        action: "verify",
        notes: `Auto-verified via Whop payment ${args.whopPaymentId}`,
        createdAt: now,
      });

      try {
        const projectForNotification = project ?? (await ctx.db.get(donation.projectId));
        if (projectForNotification) {
          await ctx.scheduler.runAfter(0, api.notifications.sendDonationVerificationNotification, {
            userId: donation.userId,
            donationId: donation._id,
            amount: donation.amount,
            projectTitle: projectForNotification.title.ar,
          });
        }
      } catch (error) {
        await ctx.db.insert("errorLogs", {
          source: "payments_finalize",
          level: "error",
          message: `Failed to schedule WhatsApp notification: ${error}`,
          donationId: donation._id,
          createdAt: Date.now(),
        });
      }
    }

    await ctx.db.insert("errorLogs", {
      source: "payments_finalize",
      level: "info",
      message: `Whop payment finalized for attempt ${paymentAttempt._id}`,
      details: JSON.stringify({
        donationId: donationId ?? null,
        whopPaymentId: args.whopPaymentId,
      }),
      donationId,
      createdAt: now,
    });

    return {
      success: true,
      donationId,
      amount: paymentAmount,
    };
  },
});

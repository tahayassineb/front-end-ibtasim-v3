import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import {
  applyVerifiedDonationEffects,
  logDonationVerification,
  scheduleDonationVerifiedNotification,
} from "./donationsHelpers";
import { shouldIgnoreDonationWebhookStatusUpdate } from "./paymentStateRules";
import { buildVerifiedDonationPatch } from "./paymentReconciliationHelpers";

export const updateDonationStatus = internalMutation({
  args: {
    donationId: v.id("donations"),
    status: v.union(
      v.literal("pending"),
      v.literal("awaiting_receipt"),
      v.literal("awaiting_verification"),
      v.literal("verified"),
      v.literal("rejected"),
      v.literal("cancelled"),
      v.literal("completed")
    ),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const donation = await ctx.db.get(args.donationId);
    if (!donation) return false;
    if (shouldIgnoreDonationWebhookStatusUpdate(donation.status, args.status)) {
      return true;
    }

    await ctx.db.patch(args.donationId, {
      status: args.status,
      updatedAt: Date.now(),
    });

    return true;
  },
});

export const updateWhopPayment = internalMutation({
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

export const processWhopPayment = internalMutation({
  args: {
    donationId: v.id("donations"),
    whopPaymentId: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    try {
      const donation = await ctx.db.get(args.donationId);
      if (!donation) {
        await ctx.db.insert("errorLogs", {
          source: "processWhopPayment",
          level: "error",
          message: `Donation not found: ${args.donationId}`,
          details: JSON.stringify({ whopPaymentId: args.whopPaymentId }),
          donationId: args.donationId,
          createdAt: Date.now(),
        });
        return false;
      }

      if (donation.status === "verified" || donation.status === "completed") {
        return true;
      }

      const now = Date.now();

      await ctx.db.patch(
        args.donationId,
        buildVerifiedDonationPatch({
          donation,
          now,
          whopPaymentId: args.whopPaymentId,
          whopPaymentStatus: "paid",
        }),
      );

      const { project } = await applyVerifiedDonationEffects(ctx, donation, now);

      await logDonationVerification(ctx, {
        donationId: args.donationId,
        adminId: undefined,
        action: "verify",
        notes: `Auto-verified via Whop payment ${args.whopPaymentId}`,
        createdAt: now,
      });

      await ctx.db.insert("errorLogs", {
        source: "processWhopPayment",
        level: "info",
        message: `Whop payment processed: donation ${args.donationId} verified`,
        details: JSON.stringify({ whopPaymentId: args.whopPaymentId, amount: donation.amount }),
        donationId: args.donationId,
        createdAt: now,
      });

      try {
        await scheduleDonationVerifiedNotification(ctx, donation, project, args.donationId);
      } catch (error) {
        await ctx.db.insert("errorLogs", {
          source: "processWhopPayment",
          level: "error",
          message: `Failed to schedule WhatsApp notification: ${error}`,
          donationId: args.donationId,
          createdAt: Date.now(),
        });
      }

      return true;
    } catch (error) {
      await ctx.db.insert("errorLogs", {
        source: "processWhopPayment",
        level: "error",
        message: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
        details: JSON.stringify({ donationId: args.donationId, whopPaymentId: args.whopPaymentId }),
        donationId: args.donationId,
        createdAt: Date.now(),
      });
      return false;
    }
  },
});

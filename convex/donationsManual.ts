import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import {
  applyVerifiedDonationEffects,
  getDonationInitialStatus,
  logDonationActivity,
  logDonationVerification,
  requireDonationAdminActor,
  scheduleDonationRejectedNotification,
  scheduleDonationVerifiedNotification,
  storageObjectExists,
} from "./donationsHelpers";

export const createDonation = mutation({
  args: {
    userId: v.optional(v.id("users")),
    projectId: v.id("projects"),
    amount: v.number(),
    paymentMethod: v.union(v.literal("bank_transfer"), v.literal("cash_agency")),
    coversFees: v.boolean(),
    isAnonymous: v.boolean(),
    message: v.optional(v.string()),
    bankName: v.optional(v.string()),
    transactionReference: v.optional(v.string()),
    donorName: v.optional(v.string()),
    donorPhone: v.optional(v.string()),
    donorEmail: v.optional(v.string()),
  },
  returns: v.id("donations"),
  handler: async (ctx, args) => {
    const now = Date.now();

    if (!args.userId && !args.donorName && !args.donorPhone && !args.donorEmail) {
      throw new Error("User or donor info required");
    }

    return ctx.db.insert("donations", {
      userId: args.userId,
      projectId: args.projectId,
      amount: args.amount,
      currency: "MAD",
      coversFees: args.coversFees,
      paymentMethod: args.paymentMethod,
      status: getDonationInitialStatus(args.paymentMethod),
      isAnonymous: args.isAnonymous,
      message: args.message,
      bankName: args.bankName,
      transactionReference: args.transactionReference,
      donorName: args.userId ? undefined : args.donorName,
      donorPhone: args.userId ? undefined : args.donorPhone,
      donorEmail: args.userId ? undefined : args.donorEmail,
      createdAt: now,
      updatedAt: now,
    });
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
    if (!(await storageObjectExists(ctx, args.receiptUrl))) return false;

    await ctx.db.patch(args.donationId, {
      receiptUrl: args.receiptUrl,
      receiptUploadedAt: Date.now(),
      status: "awaiting_verification",
      updatedAt: Date.now(),
    });

    try {
      await ctx.scheduler.runAfter(0, api.notifications.notifyAdminNewVerification, {
        type: "donation",
        donationId: args.donationId as string,
      });
    } catch (error) {
      console.error("Admin notification failed:", error);
    }

    return true;
  },
});

export const verifyDonation = mutation({
  args: {
    donationId: v.id("donations"),
    sessionToken: v.string(),
    verified: v.boolean(),
    notes: v.optional(v.string()),
    checklist: v.optional(v.array(v.string())),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const actor = await requireDonationAdminActor(ctx, args, "verification:write");
    const donation = await ctx.db.get(args.donationId);
    if (!donation) return false;
    if (donation.status !== "awaiting_verification") return false;

    const now = Date.now();
    const newStatus = args.verified ? "verified" : "rejected";

    await ctx.db.patch(args.donationId, {
      status: newStatus,
      verifiedBy: actor._id,
      verifiedAt: now,
      verificationNotes: args.notes,
      updatedAt: now,
    });

    await logDonationVerification(ctx, {
      donationId: args.donationId,
      adminId: actor._id,
      action: args.verified ? "verify" : "reject",
      notes: args.notes,
      checklist: args.checklist,
      createdAt: now,
    });
    await logDonationActivity(ctx, {
      actorId: actor._id,
      action: args.verified ? "verification.donation_approved" : "verification.donation_rejected",
      entityId: String(args.donationId),
      metadata: args.verified
        ? { amount: donation.amount, projectId: String(donation.projectId), checklist: args.checklist }
        : { reason: args.notes, checklist: args.checklist },
      createdAt: now,
    });

    if (args.verified) {
      const { project } = await applyVerifiedDonationEffects(ctx, donation, now);
      try {
        await scheduleDonationVerifiedNotification(ctx, donation, project, args.donationId);
      } catch (error) {
        console.error("Failed to schedule verification notification:", error);
      }
    } else {
      try {
        await scheduleDonationRejectedNotification(ctx, donation, args.donationId, args.notes);
      } catch (error) {
        console.error("Failed to schedule rejection notification:", error);
      }
    }

    return true;
  },
});

export const rejectDonation = mutation({
  args: {
    donationId: v.id("donations"),
    sessionToken: v.string(),
    reason: v.optional(v.string()),
    checklist: v.optional(v.array(v.string())),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const actor = await requireDonationAdminActor(ctx, args, "verification:write");
    const donation = await ctx.db.get(args.donationId);
    if (!donation) return false;
    if (donation.status !== "awaiting_verification") return false;

    const now = Date.now();

    await ctx.db.patch(args.donationId, {
      status: "rejected",
      verifiedBy: actor._id,
      verifiedAt: now,
      verificationNotes: args.reason,
      updatedAt: now,
    });

    await logDonationVerification(ctx, {
      donationId: args.donationId,
      adminId: actor._id,
      action: "reject",
      notes: args.reason,
      checklist: args.checklist,
      createdAt: now,
    });
    await logDonationActivity(ctx, {
      actorId: actor._id,
      action: "verification.donation_rejected",
      entityId: String(args.donationId),
      metadata: { reason: args.reason, checklist: args.checklist },
      createdAt: now,
    });

    return true;
  },
});

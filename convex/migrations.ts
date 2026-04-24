import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./permissions";

const LEGACY_SUCCESS_DONATION_ID = "jd72wqfzvrm2cgsdy98knw8vn185dqqp";
const LEGACY_CANCELLED_DONATION_ID = "jd74n4qa148j6tpv0wyn9a7cfs85cyat";

const VERIFIED_DONATION_STATUSES = new Set(["verified", "completed"]);

function roundMoney(amount: number): number {
  return Number((amount || 0).toFixed(2));
}

function convertStoredAmount(amount: number): number {
  return roundMoney((amount || 0) / 100);
}

function convertLegacyDonationAmount(donation: any): number {
  if (String(donation._id) === LEGACY_SUCCESS_DONATION_ID) return 100;
  if (String(donation._id) === LEGACY_CANCELLED_DONATION_ID) return 100;
  return convertStoredAmount(donation.amount || 0);
}

function getLegacyPaymentAmount(payment: any): number {
  if (typeof payment?.amountCents === "number") return convertStoredAmount(payment.amountCents);
  if (typeof payment?.amount === "number") return payment.amount;
  return 0;
}

export const migrateStoredMoneyToDirhams = mutation({
  args: {
    adminId: v.id("admins"),
    dryRun: v.boolean(),
    successfulWhopPaymentId: v.optional(v.string()),
  },
  returns: v.object({
    dryRun: v.boolean(),
    counts: v.object({
      users: v.number(),
      projects: v.number(),
      donations: v.number(),
      payments: v.number(),
      kafala: v.number(),
      kafalaDonations: v.number(),
    }),
    legacyDonations: v.array(
      v.object({
        donationId: v.string(),
        currentAmount: v.optional(v.number()),
        nextAmount: v.number(),
        currentStatus: v.optional(v.string()),
        nextStatus: v.string(),
      })
    ),
  }),
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminId, "verification:write");

    const [users, projects, donations, payments, kafalaProfiles, kafalaDonations] = await Promise.all([
      ctx.db.query("users").collect(),
      ctx.db.query("projects").collect(),
      ctx.db.query("donations").collect(),
      ctx.db.query("payments").collect(),
      ctx.db.query("kafala").collect(),
      ctx.db.query("kafalaDonations").collect(),
    ]);

    const migratedDonationAmounts = new Map<string, number>();
    const projectRaisedTotals = new Map<string, number>();
    const userDonationTotals = new Map<string, number>();
    const userDonationCounts = new Map<string, number>();

    for (const donation of donations) {
      const nextAmount = convertLegacyDonationAmount(donation);
      const donationId = String(donation._id);
      const nextStatus =
        donationId === LEGACY_SUCCESS_DONATION_ID
          ? "verified"
          : donationId === LEGACY_CANCELLED_DONATION_ID
            ? "cancelled"
            : donation.status;

      migratedDonationAmounts.set(donationId, nextAmount);

      if (VERIFIED_DONATION_STATUSES.has(nextStatus)) {
        const projectId = String(donation.projectId);
        const userId = String(donation.userId);
        projectRaisedTotals.set(projectId, roundMoney((projectRaisedTotals.get(projectId) ?? 0) + nextAmount));
        userDonationTotals.set(userId, roundMoney((userDonationTotals.get(userId) ?? 0) + nextAmount));
        userDonationCounts.set(userId, (userDonationCounts.get(userId) ?? 0) + 1);
      }
    }

    const legacyDonations = donations
      .filter((donation) =>
        String(donation._id) === LEGACY_SUCCESS_DONATION_ID || String(donation._id) === LEGACY_CANCELLED_DONATION_ID
      )
      .map((donation) => ({
        donationId: String(donation._id),
        currentAmount: donation.amount,
        nextAmount: convertLegacyDonationAmount(donation),
        currentStatus: donation.status,
        nextStatus: String(donation._id) === LEGACY_SUCCESS_DONATION_ID ? "verified" : "cancelled",
      }));

    if (args.dryRun) {
      return {
        dryRun: true,
        counts: {
          users: users.length,
          projects: projects.length,
          donations: donations.length,
          payments: payments.length,
          kafala: kafalaProfiles.length,
          kafalaDonations: kafalaDonations.length,
        },
        legacyDonations,
      };
    }

    const now = Date.now();

    for (const donation of donations) {
      const donationId = String(donation._id);
      const nextAmount = migratedDonationAmounts.get(donationId) ?? 0;
      const patch: Record<string, any> = {
        amount: nextAmount,
        updatedAt: now,
      };

      if (donationId === LEGACY_SUCCESS_DONATION_ID) {
        patch.status = "verified";
        patch.whopPaymentStatus = "paid";
        patch.whopPaymentId = args.successfulWhopPaymentId ?? donation.whopPaymentId;
        patch.transactionReference =
          args.successfulWhopPaymentId ?? donation.transactionReference ?? donation.whopPaymentId;
        patch.verifiedAt = donation.verifiedAt ?? now;
        patch.verificationNotes =
          "Money migration to MAD: preserved the successful Whop card donation at 100 MAD and marked it verified.";
      } else if (donationId === LEGACY_CANCELLED_DONATION_ID) {
        patch.status = "cancelled";
        patch.whopPaymentStatus = "cancelled";
        patch.verificationNotes =
          "Money migration to MAD: kept the abandoned Whop checkout hidden as a cancelled legacy card attempt.";
      }

      await ctx.db.patch(donation._id, patch);
    }

    for (const payment of payments) {
      const amount = getLegacyPaymentAmount(payment);
      const platformFee =
        typeof payment.platformFee === "number" ? convertStoredAmount(payment.platformFee) : payment.platformFee;
      const processingFee =
        typeof payment.processingFee === "number" ? convertStoredAmount(payment.processingFee) : payment.processingFee;
      const netAmount =
        typeof payment.netAmount === "number" ? convertStoredAmount(payment.netAmount) : payment.netAmount;

      await ctx.db.patch(payment._id, {
        amount,
        platformFee,
        processingFee,
        netAmount,
      });
    }

    for (const project of projects) {
      await ctx.db.patch(project._id, {
        goalAmount: convertStoredAmount(project.goalAmount || 0),
        raisedAmount: projectRaisedTotals.get(String(project._id)) ?? 0,
        updatedAt: now,
      });
    }

    for (const user of users) {
      const userId = String(user._id);
      await ctx.db.patch(user._id, {
        totalDonated: userDonationTotals.get(userId) ?? 0,
        donationCount: userDonationCounts.get(userId) ?? 0,
      });
    }

    for (const profile of kafalaProfiles) {
      await ctx.db.patch(profile._id, {
        monthlyPrice: convertStoredAmount(profile.monthlyPrice || 0),
        updatedAt: now,
      });
    }

    for (const donation of kafalaDonations) {
      await ctx.db.patch(donation._id, {
        amount: convertStoredAmount(donation.amount || 0),
        updatedAt: now,
      });
    }

    await ctx.db.insert("activities", {
      actorId: args.adminId,
      actorType: "admin",
      action: "migration.money_to_mad",
      entityType: "config",
      entityId: "money_contract_2026_04_24",
      metadata: {
        successfulWhopPaymentId: args.successfulWhopPaymentId,
        counts: {
          users: users.length,
          projects: projects.length,
          donations: donations.length,
          payments: payments.length,
          kafala: kafalaProfiles.length,
          kafalaDonations: kafalaDonations.length,
        },
      },
      createdAt: now,
    });

    return {
      dryRun: false,
      counts: {
        users: users.length,
        projects: projects.length,
        donations: donations.length,
        payments: payments.length,
        kafala: kafalaProfiles.length,
        kafalaDonations: kafalaDonations.length,
      },
      legacyDonations,
    };
  },
});

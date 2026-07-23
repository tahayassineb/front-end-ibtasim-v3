import { query } from "./_generated/server";
import { v } from "convex/values";
import { resolveDonationDonor } from "./donationsHelpers";
import { requireAdminSession } from "./permissions";

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
    transactionReference: v.optional(v.string()),
    whopPaymentId: v.optional(v.string()),
    projectTitle: v.optional(v.object({ ar: v.string(), fr: v.string(), en: v.string() })),
    projectPhoto: v.optional(v.union(v.string(), v.null())),
  })),
  handler: async (ctx, args) => {
    const donations = (await ctx.db
      .query("donations")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.limit || 50)).filter((donation) => donation.status !== "cancelled");

    return Promise.all(
      donations.map(async (donation) => {
        const project = await ctx.db.get(donation.projectId);
        return {
          _id: donation._id,
          _creationTime: donation._creationTime,
          projectId: donation.projectId,
          amount: donation.amount,
          currency: donation.currency,
          paymentMethod: donation.paymentMethod,
          status: donation.status,
          isAnonymous: donation.isAnonymous,
          message: donation.message,
          createdAt: donation.createdAt,
          verifiedAt: donation.verifiedAt,
          receiptUrl: donation.receiptUrl,
          transactionReference: donation.transactionReference,
          whopPaymentId: donation.whopPaymentId,
          projectTitle: project?.title ?? { ar: "مشروع", fr: "Projet", en: "Project" },
          projectPhoto: project?.mainImage ?? null,
        };
      })
    );
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
    userId: v.optional(v.id("users")),
    amount: v.number(),
    status: v.string(),
    isAnonymous: v.boolean(),
    message: v.optional(v.string()),
    createdAt: v.number(),
  })),
  handler: async (ctx, args) => {
    let donationQuery = ctx.db.query("donations").withIndex("by_project", (q) => q.eq("projectId", args.projectId));

    if (args.status) {
      donationQuery = donationQuery.filter((q) => q.eq(q.field("status"), args.status));
    }

    const donations = (await donationQuery.order("desc").take(args.limit || 100)).filter((donation) => donation.status !== "cancelled");

    return donations.map((donation) => ({
      _id: donation._id,
      userId: donation.userId,
      amount: donation.amount,
      status: donation.status,
      isAnonymous: donation.isAnonymous,
      message: donation.message,
      createdAt: donation.createdAt,
    }));
  },
});

export const getDonationById = query({
  args: {
    donationId: v.id("donations"),
    sessionToken: v.string(),
  },
  returns: v.union(
    v.object({
      _id: v.id("donations"),
      userId: v.optional(v.id("users")),
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
      whopPaymentId: v.optional(v.string()),
      createdAt: v.number(),
      verifiedAt: v.optional(v.number()),
      verifiedBy: v.optional(v.id("admins")),
      verificationNotes: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    await requireAdminSession(ctx, args.sessionToken, "verification:write");
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
      whopPaymentId: donation.whopPaymentId,
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
    userId: v.optional(v.id("users")),
    projectId: v.id("projects"),
    donorName: v.string(),
    donorPhone: v.string(),
    projectTitle: v.object({ ar: v.string(), fr: v.string(), en: v.string() }),
    amount: v.number(),
    paymentMethod: v.string(),
    status: v.string(),
    receiptUrl: v.optional(v.string()),
    bankName: v.optional(v.string()),
    transactionReference: v.optional(v.string()),
    message: v.optional(v.string()),
    createdAt: v.number(),
  })),
  handler: async (ctx, args) => {
    const donations = await ctx.db
      .query("donations")
      .withIndex("by_status", (q) => q.eq("status", "awaiting_verification"))
      .order("asc")
      .take(args.limit || 50);

    return Promise.all(
      donations.map(async (donation) => {
        const user = donation.userId ? await ctx.db.get(donation.userId) : null;
        const project = await ctx.db.get(donation.projectId);
        const donor = resolveDonationDonor(donation, user);
        return {
          _id: donation._id,
          _creationTime: donation._creationTime,
          userId: donation.userId,
          projectId: donation.projectId,
          donorName: donor.donorName,
          donorPhone: donor.donorPhone,
          projectTitle: project?.title ?? { ar: "غير محدد", fr: "Inconnu", en: "Unknown" },
          amount: donation.amount,
          paymentMethod: donation.paymentMethod,
          status: donation.status,
          receiptUrl: donation.receiptUrl ? (await ctx.storage.getUrl(donation.receiptUrl as any)) ?? undefined : undefined,
          bankName: donation.bankName,
          transactionReference: donation.transactionReference,
          message: donation.message,
          createdAt: donation.createdAt,
        };
      })
    );
  },
});

export const getAllDonations = query({
  args: {
    limit: v.optional(v.number()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  returns: v.array(v.object({
    _id: v.id("donations"),
    _creationTime: v.number(),
    userId: v.optional(v.id("users")),
    projectId: v.id("projects"),
    donorName: v.string(),
    donorPhone: v.string(),
    projectTitle: v.object({ ar: v.string(), fr: v.string(), en: v.string() }),
    amount: v.number(),
    paymentMethod: v.string(),
    status: v.string(),
    receiptUrl: v.optional(v.string()),
    bankName: v.optional(v.string()),
    transactionReference: v.optional(v.string()),
    whopPaymentId: v.optional(v.string()),
    createdAt: v.number(),
  })),
  handler: async (ctx, args) => {
    const donations = (await ctx.db.query("donations").order("desc").take(args.limit ?? 250)).filter((donation) => {
      if (donation.status === "cancelled") return false;
      if (args.startDate && donation.createdAt < args.startDate) return false;
      if (args.endDate && donation.createdAt > args.endDate) return false;
      return true;
    });

    return Promise.all(
      donations.map(async (donation) => {
        const user = donation.userId ? await ctx.db.get(donation.userId) : null;
        const project = await ctx.db.get(donation.projectId);
        const donor = resolveDonationDonor(donation, user);
        return {
          _id: donation._id,
          _creationTime: donation._creationTime,
          userId: donation.userId,
          projectId: donation.projectId,
          donorName: donor.donorName,
          donorPhone: donor.donorPhone,
          projectTitle: project?.title ?? { ar: "غير محدد", fr: "Inconnu", en: "Unknown" },
          amount: donation.amount,
          paymentMethod: donation.paymentMethod,
          status: donation.status,
          receiptUrl: donation.receiptUrl ? (await ctx.storage.getUrl(donation.receiptUrl as any)) ?? undefined : undefined,
          bankName: donation.bankName,
          transactionReference: donation.transactionReference,
          whopPaymentId: donation.whopPaymentId,
          createdAt: donation.createdAt ?? donation._creationTime,
        };
      })
    );
  },
});

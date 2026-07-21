import { query } from "./_generated/server";
import { v } from "convex/values";

export const getDonors = query({
  args: {
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  returns: v.object({
    donors: v.array(v.object({
      _id: v.id("users"),
      fullName: v.string(),
      email: v.string(),
      phoneNumber: v.string(),
      totalDonated: v.number(),
      donationCount: v.number(),
      lastLoginAt: v.number(),
      isVerified: v.boolean(),
    })),
    nextCursor: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    let users;

    if (args.search) {
      const searchLower = args.search.toLowerCase();
      const allUsers = await ctx.db.query("users").take(200);
      users = allUsers.filter((user) =>
        user.fullName.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.phoneNumber.includes(searchLower)
      ).slice(0, args.limit || 50);
    } else {
      users = await ctx.db.query("users").order("desc").take(args.limit || 50);
    }

    const donors = users.map((user) => ({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      totalDonated: user.totalDonated,
      donationCount: user.donationCount,
      lastLoginAt: user.lastLoginAt,
      isVerified: user.isVerified,
    }));

    const nextCursor = donors.length === (args.limit || 50)
      ? donors[donors.length - 1]._id
      : undefined;

    return {
      donors,
      nextCursor,
    };
  },
});

export const getDonorById = query({
  args: { userId: v.id("users") },
  returns: v.union(
    v.object({
      _id: v.id("users"),
      fullName: v.string(),
      email: v.string(),
      phoneNumber: v.string(),
      isVerified: v.boolean(),
      preferredLanguage: v.string(),
      notificationsEnabled: v.boolean(),
      totalDonated: v.number(),
      donationCount: v.number(),
      createdAt: v.number(),
      lastLoginAt: v.number(),
      donations: v.array(v.object({
        _id: v.id("donations"),
        amount: v.number(),
        status: v.string(),
        createdAt: v.number(),
        projectTitle: v.string(),
      })),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    const donations = await ctx.db
      .query("donations")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(20);

    const donationsWithTitles = await Promise.all(
      donations.map(async (donation) => {
        const project = await ctx.db.get(donation.projectId);
        return {
          _id: donation._id,
          amount: donation.amount,
          status: donation.status,
          createdAt: donation.createdAt,
          projectTitle: project?.title?.en || "Unknown Project",
        };
      })
    );

    return {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      isVerified: user.isVerified,
      preferredLanguage: user.preferredLanguage,
      notificationsEnabled: user.notificationsEnabled,
      totalDonated: user.totalDonated,
      donationCount: user.donationCount,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      donations: donationsWithTitles,
    };
  },
});

export const getVerifications = query({
  args: {
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    _id: v.id("donations"),
    _creationTime: v.number(),
    user: v.object({
      _id: v.id("users"),
      fullName: v.string(),
      phoneNumber: v.string(),
    }),
    project: v.object({
      _id: v.id("projects"),
      title: v.string(),
    }),
    amount: v.number(),
    paymentMethod: v.string(),
    status: v.string(),
    receiptUrl: v.optional(v.string()),
    bankName: v.optional(v.string()),
    transactionReference: v.optional(v.string()),
    createdAt: v.number(),
  })),
  handler: async (ctx, args) => {
    const targetStatus = args.status || "awaiting_verification";

    const donations = await ctx.db
      .query("donations")
      .withIndex("by_status", (q) => q.eq("status", targetStatus as any))
      .filter((q) => q.eq(q.field("paymentMethod"), "bank_transfer"))
      .order("asc")
      .take(args.limit || 50);

    return await Promise.all(
      donations.map(async (donation) => {
        const user = await ctx.db.get(donation.userId);
        const project = await ctx.db.get(donation.projectId);

        return {
          _id: donation._id,
          _creationTime: donation._creationTime,
          user: {
            _id: user?._id || donation.userId,
            fullName: user?.fullName || "Unknown",
            phoneNumber: user?.phoneNumber || "",
          },
          project: {
            _id: project?._id || donation.projectId,
            title: project?.title?.en || "Unknown Project",
          },
          amount: donation.amount,
          paymentMethod: donation.paymentMethod,
          status: donation.status,
          receiptUrl: donation.receiptUrl,
          bankName: donation.bankName,
          transactionReference: donation.transactionReference,
          createdAt: donation.createdAt,
        };
      })
    );
  },
});

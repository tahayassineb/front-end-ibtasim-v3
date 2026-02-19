import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ============================================
// USER QUERIES
// ============================================

export const getUserById = query({
  args: { userId: v.id("users") },
  returns: v.union(
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      fullName: v.string(),
      email: v.string(),
      phoneNumber: v.string(),
      isVerified: v.boolean(),
      preferredLanguage: v.union(v.literal("ar"), v.literal("fr"), v.literal("en")),
      notificationsEnabled: v.boolean(),
      totalDonated: v.number(),
      donationCount: v.number(),
      createdAt: v.number(),
      lastLoginAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;
    
    // Return safe user data (exclude sensitive fields)
    return {
      _id: user._id,
      _creationTime: user._creationTime,
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
    };
  },
});

export const getUserByPhone = query({
  args: { phoneNumber: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("users"),
      fullName: v.string(),
      phoneNumber: v.string(),
      isVerified: v.boolean(),
      preferredLanguage: v.union(v.literal("ar"), v.literal("fr"), v.literal("en")),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_phone", (q) => q.eq("phoneNumber", args.phoneNumber))
      .first();
    
    if (!user) return null;
    
    return {
      _id: user._id,
      fullName: user.fullName,
      phoneNumber: user.phoneNumber,
      isVerified: user.isVerified,
      preferredLanguage: user.preferredLanguage,
    };
  },
});

export const getUserProfile = query({
  args: { userId: v.id("users") },
  returns: v.union(
    v.object({
      _id: v.id("users"),
      fullName: v.string(),
      email: v.string(),
      phoneNumber: v.string(),
      preferredLanguage: v.union(v.literal("ar"), v.literal("fr"), v.literal("en")),
      notificationsEnabled: v.boolean(),
      totalDonated: v.number(),
      donationCount: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;
    
    return {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      preferredLanguage: user.preferredLanguage,
      notificationsEnabled: user.notificationsEnabled,
      totalDonated: user.totalDonated,
      donationCount: user.donationCount,
    };
  },
});

// ============================================
// USER MUTATIONS
// ============================================

export const createUser = mutation({
  args: {
    fullName: v.string(),
    email: v.string(),
    phoneNumber: v.string(),
    preferredLanguage: v.union(v.literal("ar"), v.literal("fr"), v.literal("en")),
  },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const userId = await ctx.db.insert("users", {
      fullName: args.fullName,
      email: args.email,
      phoneNumber: args.phoneNumber,
      isVerified: false,
      preferredLanguage: args.preferredLanguage,
      notificationsEnabled: true,
      totalDonated: 0,
      donationCount: 0,
      dataRetentionConsent: true,
      consentGivenAt: now,
      createdAt: now,
      lastLoginAt: now,
    });
    
    return userId;
  },
});

export const updateUser = mutation({
  args: {
    userId: v.id("users"),
    updates: v.object({
      fullName: v.optional(v.string()),
      email: v.optional(v.string()),
      preferredLanguage: v.optional(v.union(v.literal("ar"), v.literal("fr"), v.literal("en"))),
      notificationsEnabled: v.optional(v.boolean()),
    }),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return false;
    
    await ctx.db.patch(args.userId, {
      ...args.updates,
    });
    
    return true;
  },
});

export const updateLastLogin = mutation({
  args: { userId: v.id("users") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      lastLoginAt: Date.now(),
    });
    return true;
  },
});

export const verifyUser = mutation({
  args: { userId: v.id("users") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      isVerified: true,
      verificationCode: undefined,
      codeExpiresAt: undefined,
    });
    return true;
  },
});

// ============================================
// NOTIFICATION QUERIES
// ============================================

/**
 * Get all verified users with phone numbers for broadcasting notifications
 * Used by notification actions to send WhatsApp messages to all verified users
 *
 * Returns:
 *   - Array of users with _id, phoneNumber, fullName, preferredLanguage, notificationsEnabled
 */
export const getAllVerifiedUsersWithPhone = query({
  args: {},
  returns: v.array(v.object({
    _id: v.id("users"),
    phoneNumber: v.string(),
    fullName: v.string(),
    preferredLanguage: v.union(v.literal("ar"), v.literal("fr"), v.literal("en")),
    notificationsEnabled: v.boolean(),
  })),
  handler: async (ctx) => {
    const users = await ctx.db
      .query("users")
      .filter((q) =>
        q.and(
          q.eq(q.field("isVerified"), true),
          q.neq(q.field("phoneNumber"), ""),
          q.eq(q.field("notificationsEnabled"), true)
        )
      )
      .take(1000);
    
    return users.map(user => ({
      _id: user._id,
      phoneNumber: user.phoneNumber,
      fullName: user.fullName,
      preferredLanguage: user.preferredLanguage,
      notificationsEnabled: user.notificationsEnabled,
    }));
  },
});
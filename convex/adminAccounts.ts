import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { hashPassword } from "./auth";
import { adminRole, effectiveRole } from "./permissions";
import { normalizeEmail } from "./email";

export const createAdmin = mutation({
  args: {
    userId: v.id("users"),
    email: v.string(),
    passwordHash: v.string(),
    role: v.optional(adminRole),
    createdBy: v.optional(v.id("admins")),
  },
  returns: v.id("admins"),
  handler: async (ctx, args) => {
    const now = Date.now();
    const email = normalizeEmail(args.email);

    return await ctx.db.insert("admins", {
      userId: args.userId,
      email,
      passwordHash: args.passwordHash,
      role: args.role ?? "manager",
      isActive: true,
      lastLoginAt: now,
      createdAt: now,
      createdBy: args.createdBy,
    });
  },
});

export const getAdminByEmail = query({
  args: { email: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("admins"),
      userId: v.id("users"),
      email: v.string(),
      passwordHash: v.string(),
      role: adminRole,
      isActive: v.boolean(),
      lastLoginAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const email = normalizeEmail(args.email);
    const admin = await ctx.db
      .query("admins")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (!admin) return null;

    return {
      _id: admin._id,
      userId: admin.userId,
      email: admin.email,
      passwordHash: admin.passwordHash,
      role: effectiveRole(admin.role),
      isActive: admin.isActive,
      lastLoginAt: admin.lastLoginAt,
    };
  },
});

export const updateAdminLastLogin = mutation({
  args: { adminId: v.id("admins") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.adminId, {
      lastLoginAt: Date.now(),
    });
    return true;
  },
});

export const createSuperAdmin = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    fullName: v.string(),
    phoneNumber: v.string(),
  },
  returns: v.union(
    v.object({ success: v.literal(true), adminId: v.id("admins") }),
    v.object({ success: v.literal(false), message: v.string() })
  ),
  handler: async (ctx, args) => {
    const now = Date.now();
    const email = normalizeEmail(args.email);

    const existing = await ctx.db
      .query("admins")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    if (existing) {
      return { success: false, message: "Admin already exists." } as const;
    }

    const userId = await ctx.db.insert("users", {
      fullName: args.fullName,
      email,
      phoneNumber: args.phoneNumber,
      isVerified: true,
      preferredLanguage: "ar",
      notificationsEnabled: true,
      totalDonated: 0,
      donationCount: 0,
      dataRetentionConsent: true,
      consentGivenAt: now,
      createdAt: now,
      lastLoginAt: now,
    });

    const passwordHash = await hashPassword(args.password);
    const adminId = await ctx.db.insert("admins", {
      userId,
      email,
      passwordHash,
      role: "owner",
      isActive: true,
      lastLoginAt: now,
      createdAt: now,
    });

    return { success: true, adminId } as const;
  },
});

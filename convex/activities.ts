import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./permissions";

const entityType = v.union(
  v.literal("user"),
  v.literal("project"),
  v.literal("donation"),
  v.literal("payment"),
  v.literal("admin"),
  v.literal("kafala"),
  v.literal("kafalaDonation"),
  v.literal("story"),
  v.literal("receipt"),
  v.literal("contact"),
  v.literal("config")
);

export const log = mutation({
  args: {
    adminId: v.optional(v.id("admins")),
    actorType: v.optional(v.union(v.literal("admin"), v.literal("system"), v.literal("user"))),
    action: v.string(),
    entityType,
    entityId: v.string(),
    metadata: v.optional(v.record(v.string(), v.any())),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("activities", {
      actorId: args.adminId,
      actorType: args.actorType ?? (args.adminId ? "admin" : "system"),
      action: args.action,
      entityType: args.entityType,
      entityId: args.entityId,
      metadata: args.metadata,
      createdAt: Date.now(),
    });
  },
});

export const list = query({
  args: {
    adminId: v.id("admins"),
    action: v.optional(v.string()),
    entityType: v.optional(entityType),
    actorId: v.optional(v.id("admins")),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminId, "activity:read");
    const rows = await ctx.db.query("activities").withIndex("by_created").order("desc").take(500);
    const filtered = rows.filter((a) => {
      if (args.action && a.action !== args.action) return false;
      if (args.entityType && a.entityType !== args.entityType) return false;
      if (args.actorId && a.actorId !== args.actorId) return false;
      if (args.startDate && a.createdAt < args.startDate) return false;
      if (args.endDate && a.createdAt > args.endDate) return false;
      return true;
    }).slice(0, args.limit ?? 100);

    return await Promise.all(filtered.map(async (a) => {
      let actorName = a.actorType === "system" ? "System" : "Unknown";
      if (a.actorId) {
        const admin = await ctx.db.get(a.actorId as any);
        const user = admin ? await ctx.db.get(admin.userId) : null;
        actorName = user?.fullName ?? admin?.email ?? "Admin";
      }
      return { ...a, actorName };
    }));
  },
});

export const getTeamPerformance = query({
  args: {
    adminId: v.id("admins"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminId, "activity:read");
    const admins = await ctx.db.query("admins").collect();
    const activities = await ctx.db.query("activities").collect();
    const inRange = (ts: number) => {
      if (args.startDate && ts < args.startDate) return false;
      if (args.endDate && ts > args.endDate) return false;
      return true;
    };

    return await Promise.all(admins.map(async (admin) => {
      const user = await ctx.db.get(admin.userId);
      const rows = activities.filter((a) => a.actorId === admin._id && inRange(a.createdAt));
      const count = (prefix: string) => rows.filter((a) => a.action.startsWith(prefix)).length;
      const last = rows.reduce((max, row) => Math.max(max, row.createdAt), admin.lastLoginAt ?? 0);
      return {
        adminId: admin._id,
        fullName: user?.fullName ?? admin.email,
        email: admin.email,
        role: admin.role ?? "owner",
        isActive: admin.isActive,
        lastActivityAt: last,
        verifications: count("verification."),
        projects: count("project."),
        stories: count("story."),
        kafala: count("kafala."),
        receiptExports: rows.filter((a) => a.action === "receipt.export").length,
        totalActions: rows.length,
      };
    }));
  },
});


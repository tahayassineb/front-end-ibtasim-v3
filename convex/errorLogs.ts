import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ============================================
// ERROR LOG MUTATIONS
// ============================================

export const insertErrorLog = mutation({
  args: {
    source: v.string(),
    level: v.union(v.literal("error"), v.literal("warning"), v.literal("info")),
    message: v.string(),
    details: v.optional(v.string()),
    apiUrl: v.optional(v.string()),
    apiStatus: v.optional(v.number()),
    apiResponse: v.optional(v.string()),
    userId: v.optional(v.id("users")),
    donationId: v.optional(v.id("donations")),
  },
  returns: v.id("errorLogs"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("errorLogs", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const deleteErrorLog = mutation({
  args: { logId: v.id("errorLogs") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const log = await ctx.db.get(args.logId);
    if (!log) return false;
    await ctx.db.delete(args.logId);
    return true;
  },
});

export const clearAllErrorLogs = mutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const logs = await ctx.db.query("errorLogs").collect();
    await Promise.all(logs.map((log) => ctx.db.delete(log._id)));
    return logs.length;
  },
});

// ============================================
// ERROR LOG QUERIES
// ============================================

export const getErrorLogs = query({
  args: {
    limit: v.optional(v.number()),
    source: v.optional(v.string()),
    level: v.optional(v.union(v.literal("error"), v.literal("warning"), v.literal("info"))),
  },
  returns: v.array(
    v.object({
      _id: v.id("errorLogs"),
      _creationTime: v.number(),
      source: v.string(),
      level: v.union(v.literal("error"), v.literal("warning"), v.literal("info")),
      message: v.string(),
      details: v.optional(v.string()),
      apiUrl: v.optional(v.string()),
      apiStatus: v.optional(v.number()),
      apiResponse: v.optional(v.string()),
      userId: v.optional(v.id("users")),
      donationId: v.optional(v.id("donations")),
      createdAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    let logs;

    if (args.source) {
      logs = await ctx.db
        .query("errorLogs")
        .withIndex("by_source", (q) => q.eq("source", args.source!))
        .order("desc")
        .take(args.limit || 100);
    } else if (args.level) {
      logs = await ctx.db
        .query("errorLogs")
        .withIndex("by_level", (q) => q.eq("level", args.level!))
        .order("desc")
        .take(args.limit || 100);
    } else {
      logs = await ctx.db
        .query("errorLogs")
        .withIndex("by_created")
        .order("desc")
        .take(args.limit || 100);
    }

    return logs;
  },
});

export const getErrorLogCount = query({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const logs = await ctx.db.query("errorLogs").collect();
    return logs.length;
  },
});

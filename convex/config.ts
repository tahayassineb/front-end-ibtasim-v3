import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ============================================
// CONFIG QUERIES
// ============================================

export const getConfig = query({
  args: { key: v.string() },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, { key }) => {
    const row = await ctx.db
      .query("config")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();
    return row?.value ?? null;
  },
});

export const getAllConfig = query({
  args: {},
  returns: v.array(v.object({ key: v.string(), value: v.string() })),
  handler: async (ctx) => {
    const rows = await ctx.db.query("config").collect();
    return rows.map((r) => ({ key: r.key, value: r.value }));
  },
});

// ============================================
// CONFIG MUTATIONS
// ============================================

export const setConfig = mutation({
  args: { key: v.string(), value: v.string() },
  returns: v.null(),
  handler: async (ctx, { key, value }) => {
    const existing = await ctx.db
      .query("config")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { value, updatedAt: Date.now() });
    } else {
      await ctx.db.insert("config", { key, value, updatedAt: Date.now() });
    }
    return null;
  },
});

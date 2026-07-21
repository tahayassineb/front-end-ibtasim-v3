import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * List kafala profiles.
 * Public callers: pass status filter "active" or ["active","sponsored"].
 * Admin callers: pass no filter to get all.
 */
export const getKafalaList = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("draft"),
        v.literal("active"),
        v.literal("sponsored"),
        v.literal("inactive")
      )
    ),
    featured: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let list;
    if (args.featured) {
      list = await ctx.db
        .query("kafala")
        .withIndex("by_featured", (q) => q.eq("isFeatured", true))
        .take(args.limit ?? 100);
      return [...list].sort((a, b) => (a.featuredOrder ?? 9999) - (b.featuredOrder ?? 9999));
    }
    if (args.status) {
      list = await ctx.db
        .query("kafala")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .take(args.limit ?? 100);
      return list;
    }
    return await ctx.db.query("kafala").order("desc").take(args.limit ?? 200);
  },
});

/**
 * Get all kafala visible on the public site (active + sponsored).
 */
export const getPublicKafalaList = query({
  args: {
    featured: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (args.featured) {
      const featured = await ctx.db
        .query("kafala")
        .withIndex("by_featured", (q) => q.eq("isFeatured", true))
        .take(args.limit ?? 12);
      return [...featured]
        .filter((k) => k.status === "active" || k.status === "sponsored")
        .sort((a, b) => (a.featuredOrder ?? 9999) - (b.featuredOrder ?? 9999));
    }
    const active = await ctx.db
      .query("kafala")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();
    const sponsored = await ctx.db
      .query("kafala")
      .withIndex("by_status", (q) => q.eq("status", "sponsored"))
      .collect();
    return [...active, ...sponsored]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, args.limit ?? 100);
  },
});

/**
 * Get a single kafala profile with its current active sponsorship (if any).
 */
export const getKafalaById = query({
  args: { kafalaId: v.id("kafala") },
  handler: async (ctx, args) => {
    const kafala = await ctx.db.get(args.kafalaId);
    if (!kafala) return null;

    const sponsorship = await ctx.db
      .query("kafalaSponsorship")
      .withIndex("by_kafala", (q) => q.eq("kafalaId", args.kafalaId))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "active"),
          q.eq(q.field("status"), "pending_payment")
        )
      )
      .first();

    let sponsor = null;
    if (sponsorship) {
      const user = await ctx.db.get(sponsorship.userId);
      sponsor = user ? { fullName: user.fullName, isAnonymous: false } : null;
    }

    return { ...kafala, sponsorship, sponsor };
  },
});

export const getKafalaBySlugOrId = query({
  args: { ref: v.string() },
  handler: async (ctx, args) => {
    const normalizedId = ctx.db.normalizeId("kafala", args.ref);
    let kafala = normalizedId ? await ctx.db.get(normalizedId) : null;

    if (!kafala) {
      const all = await ctx.db.query("kafala").collect();
      kafala = all.find((item) => item.slug === args.ref) ?? null;
    }
    if (!kafala) return null;

    const sponsorship = await ctx.db
      .query("kafalaSponsorship")
      .withIndex("by_kafala", (q) => q.eq("kafalaId", kafala._id))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "active"),
          q.eq(q.field("status"), "pending_payment")
        )
      )
      .first();

    let sponsor = null;
    if (sponsorship) {
      const user = await ctx.db.get(sponsorship.userId);
      sponsor = user ? { fullName: user.fullName, isAnonymous: false } : null;
    }

    return { ...kafala, sponsorship, sponsor };
  },
});

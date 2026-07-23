import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { excerpt, slugify } from "./seo";
import { requireKafalaAdminActor } from "./kafalaHelpers";

const localizedTextValidator = v.object({ ar: v.string(), fr: v.string(), en: v.string() });
const localizedOrStringValidator = v.union(v.string(), localizedTextValidator);

function textFallback(value: any) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value.ar || value.fr || value.en || "";
}

/**
 * Get pending kafala donations awaiting admin verification (bank/cash).
 */
export const getPendingKafalaVerifications = query({
  args: {},
  handler: async (ctx) => {
    const donations = await ctx.db
      .query("kafalaDonations")
      .withIndex("by_status", (q) => q.eq("status", "awaiting_verification"))
      .order("asc")
      .collect();

    return await Promise.all(
      donations.map(async (d) => {
        const kafala = await ctx.db.get(d.kafalaId);
        const user = await ctx.db.get(d.userId);
        return {
          ...d,
          kafalaName: textFallback(kafala?.name) || "â€”",
          donorName: user?.fullName ?? "â€”",
          donorPhone: user?.phoneNumber ?? "â€”",
        };
      })
    );
  },
});

export const createKafala = mutation({
  args: {
    sessionToken: v.string(),
    name: localizedOrStringValidator,
    gender: v.union(v.literal("male"), v.literal("female")),
    age: v.number(),
    location: localizedOrStringValidator,
    bio: v.object({ ar: v.string(), fr: v.string(), en: v.string() }),
    photo: v.optional(v.string()),
    monthlyPrice: v.number(),
    isFeatured: v.optional(v.boolean()),
    featuredOrder: v.optional(v.number()),
    slug: v.optional(v.string()),
    metaTitle: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
    imageAlt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const actor = await requireKafalaAdminActor(
      ctx,
      { sessionToken: args.sessionToken },
      "content:write"
    );
    const now = Date.now();
    let featuredOrder = args.featuredOrder;
    if (args.isFeatured && !featuredOrder) {
      const existingFeatured = await ctx.db
        .query("kafala")
        .withIndex("by_featured", (q) => q.eq("isFeatured", true))
        .collect();
      featuredOrder = existingFeatured.length + 1;
    }
    const nameText = textFallback(args.name);
    const bioText = textFallback(args.bio);
    const slug = args.slug || slugify(nameText);
    const kafalaId = await ctx.db.insert("kafala", {
      name: args.name,
      gender: args.gender,
      age: args.age,
      location: args.location,
      bio: args.bio,
      photo: args.photo,
      monthlyPrice: args.monthlyPrice,
      currency: "MAD",
      status: "draft",
      isFeatured: args.isFeatured ?? false,
      featuredOrder,
      slug,
      metaTitle: args.metaTitle || nameText,
      metaDescription: args.metaDescription || excerpt(bioText),
      imageAlt: args.imageAlt || nameText,
      canonicalPath: `/kafala/${slug}`,
      createdBy: actor._id,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("activities", {
      actorId: actor._id,
      actorType: "admin",
      action: "kafala.created",
      entityType: "kafala",
      entityId: String(kafalaId),
      createdAt: now,
    });
    return kafalaId;
  },
});

export const updateKafala = mutation({
  args: {
    kafalaId: v.id("kafala"),
    sessionToken: v.string(),
    name: v.optional(localizedOrStringValidator),
    gender: v.optional(v.union(v.literal("male"), v.literal("female"))),
    age: v.optional(v.number()),
    location: v.optional(localizedOrStringValidator),
    bio: v.optional(v.object({ ar: v.string(), fr: v.string(), en: v.string() })),
    photo: v.optional(v.string()),
    monthlyPrice: v.optional(v.number()),
    isFeatured: v.optional(v.boolean()),
    featuredOrder: v.optional(v.number()),
    status: v.optional(
      v.union(
        v.literal("draft"),
        v.literal("active"),
        v.literal("sponsored"),
        v.literal("inactive")
      )
    ),
  },
  handler: async (ctx, args) => {
    const actor = await requireKafalaAdminActor(
      ctx,
      { sessionToken: args.sessionToken },
      "content:write"
    );
    const { kafalaId, sessionToken: _sessionToken, ...fields } = args;
    const current = await ctx.db.get(kafalaId);
    if (!current) throw new Error("Ø§Ù„ÙƒÙØ§Ù„Ø© ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯Ø©");
    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    for (const [key, val] of Object.entries(fields)) {
      if (val !== undefined) updates[key] = val;
    }
    if (fields.isFeatured === true && !current.isFeatured && fields.featuredOrder === undefined) {
      const existingFeatured = await ctx.db
        .query("kafala")
        .withIndex("by_featured", (q) => q.eq("isFeatured", true))
        .collect();
      updates.featuredOrder = existingFeatured.length + 1;
    }
    await ctx.db.patch(kafalaId, updates);
    await ctx.db.insert("activities", {
      actorId: actor._id,
      actorType: "admin",
      action: "kafala.updated",
      entityType: "kafala",
      entityId: String(kafalaId),
      createdAt: Date.now(),
    });
  },
});

export const publishKafala = mutation({
  args: {
    kafalaId: v.id("kafala"),
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const actor = await requireKafalaAdminActor(
      ctx,
      { sessionToken: args.sessionToken },
      "content:write"
    );
    await ctx.db.patch(args.kafalaId, {
      status: "active",
      updatedAt: Date.now(),
    });
    await ctx.db.insert("activities", {
      actorId: actor._id,
      actorType: "admin",
      action: "kafala.published",
      entityType: "kafala",
      entityId: String(args.kafalaId),
      createdAt: Date.now(),
    });
  },
});

export const deleteKafala = mutation({
  args: {
    kafalaId: v.id("kafala"),
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const actor = await requireKafalaAdminActor(
      ctx,
      { sessionToken: args.sessionToken },
      "content:write"
    );
    const sponsorships = await ctx.db
      .query("kafalaSponsorship")
      .withIndex("by_kafala", (q) => q.eq("kafalaId", args.kafalaId))
      .collect();
    for (const s of sponsorships) {
      const donations = await ctx.db
        .query("kafalaDonations")
        .withIndex("by_sponsorship", (q) => q.eq("sponsorshipId", s._id))
        .collect();
      for (const d of donations) await ctx.db.delete(d._id);
      await ctx.db.delete(s._id);
    }
    await ctx.db.delete(args.kafalaId);
    await ctx.db.insert("activities", {
      actorId: actor._id,
      actorType: "admin",
      action: "kafala.deleted",
      entityType: "kafala",
      entityId: String(args.kafalaId),
      createdAt: Date.now(),
    });
  },
});

/**
 * Admin re-opens a sponsored slot â€” marks old sponsorship as expired.
 */
export const resetKafala = mutation({
  args: {
    kafalaId: v.id("kafala"),
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const actor = await requireKafalaAdminActor(
      ctx,
      { sessionToken: args.sessionToken },
      "content:write"
    );
    const sponsorships = await ctx.db
      .query("kafalaSponsorship")
      .withIndex("by_kafala", (q) => q.eq("kafalaId", args.kafalaId))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "active"),
          q.eq(q.field("status"), "pending_payment")
        )
      )
      .collect();
    for (const s of sponsorships) {
      await ctx.db.patch(s._id, { status: "expired", updatedAt: Date.now() });
    }
    await ctx.db.patch(args.kafalaId, {
      status: "active",
      updatedAt: Date.now(),
    });
    await ctx.db.insert("activities", {
      actorId: actor._id,
      actorType: "admin",
      action: "kafala.reset",
      entityType: "kafala",
      entityId: String(args.kafalaId),
      createdAt: Date.now(),
    });
  },
});

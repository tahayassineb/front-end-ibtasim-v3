import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { excerpt, slugify } from "./seo";

// ── Admin: get all stories ──────────────────────────────────────────────────
export const getAllStories = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("stories")
      .order("desc")
      .collect();
  },
});

// ── Public: get published stories ───────────────────────────────────────────
export const getPublishedStories = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db
      .query("stories")
      .withIndex("by_published", (q) => q.eq("isPublished", true))
      .collect();
    return all.sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0));
  },
});

export const getPublishedStoryBySlugOrId = query({
  args: { ref: v.string() },
  handler: async (ctx, args) => {
    const normalizedId = ctx.db.normalizeId("stories", args.ref);
    if (normalizedId) {
      const byId = await ctx.db.get(normalizedId);
      if (byId?.isPublished) return byId;
    }

    const published = await ctx.db
      .query("stories")
      .withIndex("by_published", (q) => q.eq("isPublished", true))
      .collect();
    return published.find((story) => story.slug === args.ref) ?? null;
  },
});

// ── Admin: generate upload URL for story cover image ────────────────────────
export const generateStoryImageUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// ── Admin: create story ─────────────────────────────────────────────────────
export const createStory = mutation({
  args: {
    title: v.string(),
    excerpt: v.string(),
    category: v.string(),
    gradient: v.string(),
    badgeIcon: v.string(),
    badgeText: v.string(),
    catLabel: v.string(),
    catColor: v.string(),
    isPublished: v.boolean(),
    isFeatured: v.optional(v.boolean()),
    adminId: v.string(),
    coverImage: v.optional(v.string()),
    body: v.optional(v.string()),
    postType: v.optional(v.union(v.literal("story"), v.literal("activity"), v.literal("update"))),
    slug: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
    metaTitle: v.optional(v.string()),
    imageAlt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const slug = args.slug || slugify(args.title);
    return await ctx.db.insert("stories", {
      ...args,
      slug,
      metaTitle: args.metaTitle || args.title,
      metaDescription: args.metaDescription || excerpt(args.excerpt || args.body || ""),
      imageAlt: args.imageAlt || args.title,
      canonicalPath: `/stories/${slug}`,
      publishedAt: args.isPublished ? Date.now() : undefined,
    });
  },
});

// ── Admin: update story ─────────────────────────────────────────────────────
export const updateStory = mutation({
  args: {
    id: v.id("stories"),
    title: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    category: v.optional(v.string()),
    gradient: v.optional(v.string()),
    badgeIcon: v.optional(v.string()),
    badgeText: v.optional(v.string()),
    catLabel: v.optional(v.string()),
    catColor: v.optional(v.string()),
    isPublished: v.optional(v.boolean()),
    isFeatured: v.optional(v.boolean()),
    coverImage: v.optional(v.string()),
    body: v.optional(v.string()),
    postType: v.optional(v.union(v.literal("story"), v.literal("activity"), v.literal("update"))),
    slug: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
    metaTitle: v.optional(v.string()),
    imageAlt: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...fields }) => {
    if (fields.title && !fields.slug) fields.slug = slugify(fields.title);
    if (fields.slug) (fields as any).canonicalPath = `/stories/${fields.slug}`;
    if (fields.excerpt && !fields.metaDescription) fields.metaDescription = excerpt(fields.excerpt);
    await ctx.db.patch(id, fields);
  },
});

// ── Admin: delete story ─────────────────────────────────────────────────────
export const deleteStory = mutation({
  args: { id: v.id("stories") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});

// ── Admin: publish story ────────────────────────────────────────────────────
export const publishStory = mutation({
  args: { id: v.id("stories") },
  handler: async (ctx, { id }) => {
    await ctx.db.patch(id, { isPublished: true, publishedAt: Date.now() });
  },
});

// ── Admin: unpublish story ──────────────────────────────────────────────────
export const unpublishStory = mutation({
  args: { id: v.id("stories") },
  handler: async (ctx, { id }) => {
    await ctx.db.patch(id, { isPublished: false });
  },
});

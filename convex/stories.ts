import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

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
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("stories", {
      ...args,
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
  },
  handler: async (ctx, { id, ...fields }) => {
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

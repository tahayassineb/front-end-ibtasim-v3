import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { excerpt, slugify } from "./seo";
import { requireAdmin, requireAdminSession } from "./permissions";

async function requireStoryAdminActor(
  ctx: any,
  sessionToken: string,
  permission: "admin:read" | "content:write"
) {
  return await requireAdminSession(ctx, sessionToken, permission);
}

const localizedTextValidator = v.object({ ar: v.string(), fr: v.string(), en: v.string() });
const localizedOrStringValidator = v.union(v.string(), localizedTextValidator);

function textFallback(value: any) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value.ar || value.fr || value.en || "";
}

// ── Admin: get all stories ──────────────────────────────────────────────────
export const getAllStories = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    await requireStoryAdminActor(ctx, args.sessionToken, "admin:read");
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
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    await requireStoryAdminActor(ctx, args.sessionToken, "content:write");
    return await ctx.storage.generateUploadUrl();
  },
});

// ── Admin: create story ─────────────────────────────────────────────────────
export const createStory = mutation({
  args: {
    title: localizedOrStringValidator,
    excerpt: localizedOrStringValidator,
    category: v.string(),
    gradient: v.string(),
    badgeIcon: v.string(),
    badgeText: localizedOrStringValidator,
    catLabel: localizedOrStringValidator,
    catColor: v.string(),
    isPublished: v.boolean(),
    isFeatured: v.optional(v.boolean()),
    sessionToken: v.string(),
    coverImage: v.optional(v.string()),
    body: v.optional(localizedOrStringValidator),
    postType: v.optional(v.union(v.literal("story"), v.literal("activity"), v.literal("update"))),
    slug: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
    metaTitle: v.optional(v.string()),
    imageAlt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireStoryAdminActor(ctx, args.sessionToken, "content:write");
    const { sessionToken, ...storyArgs } = args;
    const titleText = textFallback(args.title);
    const excerptText = textFallback(args.excerpt);
    const bodyText = textFallback(args.body);
    const slug = args.slug || slugify(titleText);
    return await ctx.db.insert("stories", {
      ...storyArgs,
      slug,
      metaTitle: args.metaTitle || titleText,
      metaDescription: args.metaDescription || excerpt(excerptText || bodyText),
      imageAlt: args.imageAlt || titleText,
      canonicalPath: `/stories/${slug}`,
      publishedAt: args.isPublished ? Date.now() : undefined,
    });
  },
});

// ── Admin: update story ─────────────────────────────────────────────────────
export const updateStory = mutation({
  args: {
    id: v.id("stories"),
    sessionToken: v.string(),
    title: v.optional(localizedOrStringValidator),
    excerpt: v.optional(localizedOrStringValidator),
    category: v.optional(v.string()),
    gradient: v.optional(v.string()),
    badgeIcon: v.optional(v.string()),
    badgeText: v.optional(localizedOrStringValidator),
    catLabel: v.optional(localizedOrStringValidator),
    catColor: v.optional(v.string()),
    isPublished: v.optional(v.boolean()),
    isFeatured: v.optional(v.boolean()),
    coverImage: v.optional(v.string()),
    body: v.optional(localizedOrStringValidator),
    postType: v.optional(v.union(v.literal("story"), v.literal("activity"), v.literal("update"))),
    slug: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
    metaTitle: v.optional(v.string()),
    imageAlt: v.optional(v.string()),
  },
  handler: async (ctx, { id, sessionToken, ...fields }) => {
    await requireStoryAdminActor(ctx, sessionToken, "content:write");
    if (fields.title && !fields.slug) fields.slug = slugify(textFallback(fields.title));
    if (fields.slug) (fields as any).canonicalPath = `/stories/${fields.slug}`;
    if (fields.excerpt && !fields.metaDescription) fields.metaDescription = excerpt(textFallback(fields.excerpt));
    await ctx.db.patch(id, fields);
  },
});

// ── Admin: delete story ─────────────────────────────────────────────────────
export const deleteStory = mutation({
  args: { id: v.id("stories"), sessionToken: v.string() },
  handler: async (ctx, { id, sessionToken }) => {
    await requireStoryAdminActor(ctx, sessionToken, "content:write");
    await ctx.db.delete(id);
  },
});

// ── Admin: publish story ────────────────────────────────────────────────────
export const publishStory = mutation({
  args: { id: v.id("stories"), sessionToken: v.string() },
  handler: async (ctx, { id, sessionToken }) => {
    await requireStoryAdminActor(ctx, sessionToken, "content:write");
    await ctx.db.patch(id, { isPublished: true, publishedAt: Date.now() });
  },
});

// ── Admin: unpublish story ──────────────────────────────────────────────────
export const unpublishStory = mutation({
  args: { id: v.id("stories"), sessionToken: v.string() },
  handler: async (ctx, { id, sessionToken }) => {
    await requireStoryAdminActor(ctx, sessionToken, "content:write");
    await ctx.db.patch(id, { isPublished: false });
  },
});

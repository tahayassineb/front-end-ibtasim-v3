import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./permissions";

const categoryName = v.object({ ar: v.string(), fr: v.string(), en: v.string() });
const categoryIcon = v.object({
  type: v.union(v.literal("material"), v.literal("emoji"), v.literal("image")),
  value: v.string(),
});

const defaultCategories = [
  ["education", { ar: "التعليم", fr: "Éducation", en: "Education" }, { type: "material", value: "school" }],
  ["water", { ar: "الماء", fr: "Eau", en: "Water" }, { type: "material", value: "water_drop" }],
  ["health", { ar: "الصحة", fr: "Santé", en: "Health" }, { type: "material", value: "health_and_safety" }],
  ["food", { ar: "الغذاء", fr: "Alimentation", en: "Food" }, { type: "material", value: "restaurant" }],
  ["housing", { ar: "السكن", fr: "Logement", en: "Housing" }, { type: "material", value: "home" }],
  ["orphan_care", { ar: "رعاية الأيتام", fr: "Soutien aux orphelins", en: "Orphan care" }, { type: "material", value: "volunteer_activism" }],
  ["emergency", { ar: "الطوارئ", fr: "Urgences", en: "Emergency" }, { type: "material", value: "emergency" }],
] as const;

export const getPublicCategories = query({
  args: {},
  returns: v.array(v.object({
    _id: v.id("projectCategories"), slug: v.string(), name: categoryName, icon: categoryIcon, sortOrder: v.number(),
  })),
  handler: async (ctx) => {
    const categories = await ctx.db.query("projectCategories")
      .withIndex("by_active_sort", (q) => q.eq("isActive", true))
      .collect();
    return categories.map(({ _id, slug, name, icon, sortOrder }) => ({ _id, slug, name, icon, sortOrder }));
  },
});

export const getAdminCategories = query({
  args: { adminId: v.id("admins") },
  returns: v.array(v.object({
    _id: v.id("projectCategories"), slug: v.string(), name: categoryName, icon: categoryIcon,
    isActive: v.boolean(), sortOrder: v.number(), createdAt: v.number(), updatedAt: v.number(),
  })),
  handler: async (ctx, { adminId }) => {
    await requireAdmin(ctx, adminId, "content:write");
    const categories = await ctx.db.query("projectCategories").collect();
    return categories.sort((a, b) => a.sortOrder - b.sortOrder).map(({ _id, slug, name, icon, isActive, sortOrder, createdAt, updatedAt }) =>
      ({ _id, slug, name, icon, isActive, sortOrder, createdAt, updatedAt }));
  },
});

export const createCategory = mutation({
  args: { adminId: v.id("admins"), slug: v.string(), name: categoryName, icon: categoryIcon, sortOrder: v.optional(v.number()) },
  returns: v.id("projectCategories"),
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminId, "content:write");
    const slug = args.slug.trim().toLowerCase().replace(/[^a-z0-9_]+/g, "_").replace(/^_|_$/g, "");
    if (!slug) throw new Error("A category slug is required.");
    if (Object.values(args.name).some((value) => !value.trim())) throw new Error("Arabic, French, and English names are required.");
    const existing = await ctx.db.query("projectCategories").withIndex("by_slug", (q) => q.eq("slug", slug)).first();
    if (existing) throw new Error("This category slug already exists.");
    const all = await ctx.db.query("projectCategories").collect();
    const now = Date.now();
    const categoryId = await ctx.db.insert("projectCategories", {
      slug, name: args.name, icon: args.icon, isActive: true, sortOrder: args.sortOrder ?? all.length + 1,
      createdBy: args.adminId, createdAt: now, updatedAt: now,
    });
    await ctx.db.insert("activities", { actorId: args.adminId, actorType: "admin", action: "project_category.created", entityType: "config", entityId: String(categoryId), createdAt: now });
    return categoryId;
  },
});

export const updateCategory = mutation({
  args: { adminId: v.id("admins"), categoryId: v.id("projectCategories"), name: v.optional(categoryName), icon: v.optional(categoryIcon), sortOrder: v.optional(v.number()) },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminId, "content:write");
    const category = await ctx.db.get(args.categoryId);
    if (!category) return false;
    if (args.name && Object.values(args.name).some((value) => !value.trim())) throw new Error("Arabic, French, and English names are required.");
    await ctx.db.patch(args.categoryId, { ...(args.name ? { name: args.name } : {}), ...(args.icon ? { icon: args.icon } : {}), ...(args.sortOrder !== undefined ? { sortOrder: args.sortOrder } : {}), updatedAt: Date.now() });
    return true;
  },
});

export const archiveCategory = mutation({
  args: { adminId: v.id("admins"), categoryId: v.id("projectCategories") },
  returns: v.boolean(),
  handler: async (ctx, { adminId, categoryId }) => {
    await requireAdmin(ctx, adminId, "content:write");
    const category = await ctx.db.get(categoryId);
    if (!category) return false;
    await ctx.db.patch(categoryId, { isActive: false, updatedAt: Date.now() });
    return true;
  },
});

export const seedDefaultCategories = mutation({
  args: { adminId: v.id("admins") },
  returns: v.number(),
  handler: async (ctx, { adminId }) => {
    await requireAdmin(ctx, adminId, "content:write");
    let created = 0;
    const now = Date.now();
    for (const [slug, name, icon] of defaultCategories) {
      const existing = await ctx.db.query("projectCategories").withIndex("by_slug", (q) => q.eq("slug", slug)).first();
      if (!existing) {
        await ctx.db.insert("projectCategories", { slug, name, icon, isActive: true, sortOrder: created + 1, createdBy: adminId, createdAt: now, updatedAt: now });
        created += 1;
      }
    }
    return created;
  },
});

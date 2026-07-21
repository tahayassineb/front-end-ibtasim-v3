import { query } from "./_generated/server";
import { v } from "convex/values";
import { sortByFeaturedOrder } from "./projectsHelpers";

const localizedTextValidator = v.object({ ar: v.string(), fr: v.string(), en: v.string() });
const localizedOrStringValidator = v.union(v.string(), localizedTextValidator);
const benefitCardValidator = v.object({
  icon: v.string(),
  value: v.string(),
  label: localizedOrStringValidator,
});

export const getProjects = query({
  args: {
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("active"),
      v.literal("funded"),
      v.literal("completed"),
      v.literal("cancelled")
    )),
    category: v.optional(v.string()),
    featured: v.optional(v.boolean()),
    limit: v.optional(v.number()),
    includeDeleted: v.optional(v.boolean()),
  },
  returns: v.array(v.object({
    _id: v.id("projects"),
    _creationTime: v.number(),
    title: v.object({ ar: v.string(), fr: v.string(), en: v.string() }),
    description: v.object({ ar: v.string(), fr: v.string(), en: v.string() }),
    shortDescription: v.optional(v.object({ ar: v.string(), fr: v.string(), en: v.string() })),
    category: v.string(),
    goalAmount: v.number(),
    raisedAmount: v.number(),
    currency: v.literal("MAD"),
    mainImage: v.string(),
    gallery: v.array(v.string()),
    status: v.string(),
    isFeatured: v.boolean(),
    featuredOrder: v.optional(v.number()),
    location: v.optional(localizedOrStringValidator),
    beneficiaries: v.optional(v.number()),
    startDate: v.number(),
    endDate: v.optional(v.number()),
    benefitCards: v.optional(v.array(benefitCardValidator)),
  })),
  handler: async (ctx, args) => {
    const limit = args.limit || 100;
    let projects;

    if (args.status) {
      projects = await ctx.db.query("projects").withIndex("by_status", (q) => q.eq("status", args.status)).take(limit);
    } else if (args.category) {
      projects = await ctx.db.query("projects").withIndex("by_category", (q) => q.eq("category", args.category)).take(limit);
    } else if (args.featured) {
      const featuredRaw = await ctx.db.query("projects").withIndex("by_featured", (q) => q.eq("isFeatured", true)).take(limit);
      projects = sortByFeaturedOrder(featuredRaw);
    } else {
      projects = await ctx.db.query("projects").take(limit);
    }

    if (!args.includeDeleted) {
      projects = projects.filter((project: any) => project.deletedAt === undefined);
    }

    return projects.map((project: any) => ({
      _id: project._id,
      _creationTime: project._creationTime,
      title: project.title,
      description: project.description,
      shortDescription: project.shortDescription,
      category: project.category,
      goalAmount: project.goalAmount,
      raisedAmount: project.raisedAmount,
      currency: project.currency,
      mainImage: project.mainImage,
      gallery: project.gallery,
      status: project.status,
      isFeatured: project.isFeatured,
      featuredOrder: project.featuredOrder,
      location: project.location,
      beneficiaries: project.beneficiaries,
      startDate: project.startDate,
      endDate: project.endDate,
      benefitCards: project.benefitCards,
    }));
  },
});

export const getProjectById = query({
  args: { projectId: v.id("projects") },
  returns: v.union(
    v.object({
      _id: v.id("projects"),
      _creationTime: v.number(),
      title: v.object({ ar: v.string(), fr: v.string(), en: v.string() }),
      description: v.object({ ar: v.string(), fr: v.string(), en: v.string() }),
      shortDescription: v.optional(v.object({ ar: v.string(), fr: v.string(), en: v.string() })),
      category: v.string(),
      goalAmount: v.number(),
      raisedAmount: v.number(),
      currency: v.literal("MAD"),
      mainImage: v.string(),
      gallery: v.array(v.string()),
      status: v.string(),
      isFeatured: v.boolean(),
      location: v.optional(localizedOrStringValidator),
      beneficiaries: v.optional(v.number()),
      startDate: v.number(),
      endDate: v.optional(v.number()),
      benefitCards: v.optional(v.array(benefitCardValidator)),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) return null;

    return {
      _id: project._id,
      _creationTime: project._creationTime,
      title: project.title,
      description: project.description,
      shortDescription: project.shortDescription,
      category: project.category,
      goalAmount: project.goalAmount,
      raisedAmount: project.raisedAmount,
      currency: project.currency,
      mainImage: project.mainImage,
      gallery: project.gallery,
      status: project.status,
      isFeatured: project.isFeatured,
      location: project.location,
      beneficiaries: project.beneficiaries,
      startDate: project.startDate,
      endDate: project.endDate,
      benefitCards: project.benefitCards,
    };
  },
});

export const getProjectBySlugOrId = query({
  args: { ref: v.string() },
  handler: async (ctx, args) => {
    const normalizedId = ctx.db.normalizeId("projects", args.ref);
    if (normalizedId) {
      const byId = await ctx.db.get(normalizedId);
      if (byId) return byId;
    }

    const projects = await ctx.db.query("projects").collect();
    return projects.find((project: any) => project.slug === args.ref) ?? null;
  },
});

export const getFeaturedProjects = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(v.object({
    _id: v.id("projects"),
    title: v.object({ ar: v.string(), fr: v.string(), en: v.string() }),
    description: v.object({ ar: v.string(), fr: v.string(), en: v.string() }),
    shortDescription: v.optional(v.object({ ar: v.string(), fr: v.string(), en: v.string() })),
    category: v.string(),
    goalAmount: v.number(),
    raisedAmount: v.number(),
    mainImage: v.string(),
    featuredOrder: v.number(),
    benefitCards: v.optional(v.array(benefitCardValidator)),
  })),
  handler: async (ctx, args) => {
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_featured", (q) => q.eq("isFeatured", true))
      .take(args.limit || 6);

    return sortByFeaturedOrder(projects).map((project: any, index: number) => ({
      _id: project._id,
      title: project.title,
      description: project.description,
      shortDescription: project.shortDescription,
      category: project.category,
      goalAmount: project.goalAmount,
      raisedAmount: project.raisedAmount,
      mainImage: project.mainImage,
      featuredOrder: project.featuredOrder ?? index + 1,
      benefitCards: project.benefitCards,
    }));
  },
});

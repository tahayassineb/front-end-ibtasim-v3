import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ============================================
// PROJECT QUERIES
// ============================================

export const getProjects = query({
  args: {
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("active"),
      v.literal("funded"),
      v.literal("completed"),
      v.literal("cancelled")
    )),
    category: v.optional(v.union(
      v.literal("education"),
      v.literal("health"),
      v.literal("housing"),
      v.literal("emergency"),
      v.literal("food"),
      v.literal("water"),
      v.literal("orphan_care")
    )),
    featured: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    _id: v.id("projects"),
    _creationTime: v.number(),
    title: v.object({ ar: v.string(), fr: v.string(), en: v.string() }),
    description: v.object({ ar: v.string(), fr: v.string(), en: v.string() }),
    category: v.string(),
    goalAmount: v.number(),
    raisedAmount: v.number(),
    currency: v.literal("MAD"),
    mainImage: v.string(),
    gallery: v.array(v.string()),
    status: v.string(),
    isFeatured: v.boolean(),
    featuredOrder: v.optional(v.number()),
    location: v.optional(v.string()),
    beneficiaries: v.optional(v.number()),
    startDate: v.number(),
    endDate: v.optional(v.number()),
  })),
  handler: async (ctx, args) => {
    const status = args.status;
    const category = args.category;
    const featured = args.featured;
    let projects;
    
    if (status) {
      projects = await ctx.db
        .query("projects")
        .withIndex("by_status", (q) => q.eq("status", status))
        .take(args.limit || 100);
    } else if (category) {
      projects = await ctx.db
        .query("projects")
        .withIndex("by_category", (q) => q.eq("category", category))
        .take(args.limit || 100);
    } else if (featured) {
      projects = await ctx.db
        .query("projects")
        .withIndex("by_featured", (q) => 
          q.eq("isFeatured", true).gt("featuredOrder", 0)
        )
        .order("asc")
        .take(args.limit || 100);
    } else {
      projects = await ctx.db
        .query("projects")
        .take(args.limit || 100);
    }
    
    return projects.map(p => ({
      _id: p._id,
      _creationTime: p._creationTime,
      title: p.title,
      description: p.description,
      category: p.category,
      goalAmount: p.goalAmount,
      raisedAmount: p.raisedAmount,
      currency: p.currency,
      mainImage: p.mainImage,
      gallery: p.gallery,
      status: p.status,
      isFeatured: p.isFeatured,
      featuredOrder: p.featuredOrder,
      location: p.location,
      beneficiaries: p.beneficiaries,
      startDate: p.startDate,
      endDate: p.endDate,
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
      category: v.string(),
      goalAmount: v.number(),
      raisedAmount: v.number(),
      currency: v.literal("MAD"),
      mainImage: v.string(),
      gallery: v.array(v.string()),
      status: v.string(),
      isFeatured: v.boolean(),
      location: v.optional(v.string()),
      beneficiaries: v.optional(v.number()),
      startDate: v.number(),
      endDate: v.optional(v.number()),
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
    };
  },
});

export const getFeaturedProjects = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(v.object({
    _id: v.id("projects"),
    title: v.object({ ar: v.string(), fr: v.string(), en: v.string() }),
    description: v.object({ ar: v.string(), fr: v.string(), en: v.string() }),
    category: v.string(),
    goalAmount: v.number(),
    raisedAmount: v.number(),
    mainImage: v.string(),
    featuredOrder: v.number(),
  })),
  handler: async (ctx, args) => {
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_featured", (q) => 
        q.eq("isFeatured", true).gt("featuredOrder", 0)
      )
      .order("asc")
      .take(args.limit || 6);
    
    return projects.map(p => ({
      _id: p._id,
      title: p.title,
      description: p.description,
      category: p.category,
      goalAmount: p.goalAmount,
      raisedAmount: p.raisedAmount,
      mainImage: p.mainImage,
      featuredOrder: p.featuredOrder || 0,
    }));
  },
});

// ============================================
// PROJECT MUTATIONS
// ============================================

export const createProject = mutation({
  args: {
    title: v.object({ ar: v.string(), fr: v.string(), en: v.string() }),
    description: v.object({ ar: v.string(), fr: v.string(), en: v.string() }),
    category: v.union(
      v.literal("education"),
      v.literal("health"),
      v.literal("housing"),
      v.literal("emergency"),
      v.literal("food"),
      v.literal("water"),
      v.literal("orphan_care")
    ),
    goalAmount: v.number(),
    mainImage: v.string(),
    gallery: v.optional(v.array(v.string())),
    location: v.optional(v.string()),
    beneficiaries: v.optional(v.number()),
    endDate: v.optional(v.number()),
    isFeatured: v.optional(v.boolean()),
    featuredOrder: v.optional(v.number()),
    createdBy: v.id("admins"),
  },
  returns: v.id("projects"),
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const projectId = await ctx.db.insert("projects", {
      title: args.title,
      description: args.description,
      category: args.category,
      goalAmount: args.goalAmount,
      raisedAmount: 0,
      currency: "MAD",
      mainImage: args.mainImage,
      gallery: args.gallery || [],
      status: "draft",
      location: args.location,
      beneficiaries: args.beneficiaries,
      startDate: now,
      endDate: args.endDate,
      createdBy: args.createdBy,
      createdAt: now,
      updatedAt: now,
      isFeatured: args.isFeatured || false,
      featuredOrder: args.featuredOrder,
    });
    
    return projectId;
  },
});

export const updateProject = mutation({
  args: {
    projectId: v.id("projects"),
    updates: v.object({
      title: v.optional(v.object({ ar: v.string(), fr: v.string(), en: v.string() })),
      description: v.optional(v.object({ ar: v.string(), fr: v.string(), en: v.string() })),
      category: v.optional(v.union(
        v.literal("education"),
        v.literal("health"),
        v.literal("housing"),
        v.literal("emergency"),
        v.literal("food"),
        v.literal("water"),
        v.literal("orphan_care")
      )),
      goalAmount: v.optional(v.number()),
      mainImage: v.optional(v.string()),
      gallery: v.optional(v.array(v.string())),
      status: v.optional(v.union(
        v.literal("draft"),
        v.literal("active"),
        v.literal("funded"),
        v.literal("completed"),
        v.literal("cancelled")
      )),
      location: v.optional(v.string()),
      beneficiaries: v.optional(v.number()),
      endDate: v.optional(v.number()),
      isFeatured: v.optional(v.boolean()),
      featuredOrder: v.optional(v.number()),
    }),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) return false;
    
    await ctx.db.patch(args.projectId, {
      ...args.updates,
      updatedAt: Date.now(),
    });
    
    return true;
  },
});

export const deleteProject = mutation({
  args: { projectId: v.id("projects") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) return false;
    
    await ctx.db.delete(args.projectId);
    return true;
  },
});

export const updateProjectRaisedAmount = mutation({
  args: {
    projectId: v.id("projects"),
    amount: v.number(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) return false;
    
    const newAmount = project.raisedAmount + args.amount;
    
    await ctx.db.patch(args.projectId, {
      raisedAmount: Math.max(0, newAmount),
      updatedAt: Date.now(),
      status: newAmount >= project.goalAmount ? "funded" : project.status,
    });
    
    return true;
  },
});
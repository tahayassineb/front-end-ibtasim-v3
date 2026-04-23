import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { requireAdmin } from "./permissions";
import { excerpt, slugify } from "./seo";

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
      const featuredRaw = await ctx.db
        .query("projects")
        .withIndex("by_featured", (q) => q.eq("isFeatured", true))
        .take(args.limit || 100);
      // Sort by featuredOrder (undefined treated as last)
      projects = [...featuredRaw].sort(
        (a, b) => (a.featuredOrder ?? 9999) - (b.featuredOrder ?? 9999)
      );
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

export const getProjectBySlugOrId = query({
  args: { ref: v.string() },
  handler: async (ctx, args) => {
    const normalizedId = ctx.db.normalizeId("projects", args.ref);
    if (normalizedId) {
      const byId = await ctx.db.get(normalizedId);
      if (byId) return byId;
    }

    const projects = await ctx.db.query("projects").collect();
    return projects.find((project) => project.slug === args.ref) ?? null;
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
    // Query all featured projects (isFeatured=true) regardless of featuredOrder value
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_featured", (q) => q.eq("isFeatured", true))
      .take(args.limit || 6);

    // Sort by featuredOrder client-side so undefined/null orders go last
    const sorted = [...projects].sort(
      (a, b) => (a.featuredOrder ?? 9999) - (b.featuredOrder ?? 9999)
    );

    return sorted.map((p, index) => ({
      _id: p._id,
      title: p.title,
      description: p.description,
      category: p.category,
      goalAmount: p.goalAmount,
      raisedAmount: p.raisedAmount,
      mainImage: p.mainImage,
      featuredOrder: p.featuredOrder ?? index + 1,
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
    mainImageStorageId: v.string(),
    galleryStorageIds: v.optional(v.array(v.string())),
    location: v.optional(v.string()),
    beneficiaries: v.optional(v.number()),
    endDate: v.optional(v.number()),
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("active"),
      v.literal("funded"),
      v.literal("completed"),
      v.literal("cancelled")
    )),
    isFeatured: v.optional(v.boolean()),
    featuredOrder: v.optional(v.number()),
    createdBy: v.id("admins"),
    benefitCards: v.optional(v.array(v.object({ icon: v.string(), value: v.string(), label: v.string() }))),
    slug: v.optional(v.string()),
    metaTitle: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
    imageAlt: v.optional(v.string()),
  },
  returns: v.id("projects"),
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.createdBy, "content:write");
    const now = Date.now();

    // Auto-assign featuredOrder when isFeatured=true and no order is given
    let featuredOrder = args.featuredOrder;
    if (args.isFeatured && !featuredOrder) {
      const existingFeatured = await ctx.db
        .query("projects")
        .withIndex("by_featured", (q) => q.eq("isFeatured", true))
        .collect();
      featuredOrder = existingFeatured.length + 1;
    }

    const projectId = await ctx.db.insert("projects", {
      title: args.title,
      description: args.description,
      category: args.category,
      goalAmount: args.goalAmount,
      raisedAmount: 0,
      currency: "MAD",
      mainImage: args.mainImageStorageId,
      gallery: args.galleryStorageIds || [],
      status: args.status || "draft",
      location: args.location,
      beneficiaries: args.beneficiaries,
      startDate: now,
      endDate: args.endDate,
      createdBy: args.createdBy,
      createdAt: now,
      updatedAt: now,
      isFeatured: args.isFeatured || false,
      featuredOrder: featuredOrder,
      benefitCards: args.benefitCards,
      slug: args.slug || slugify(args.title.ar || args.title.fr || args.title.en),
      metaTitle: args.metaTitle || args.title.ar || args.title.fr || args.title.en,
      metaDescription: args.metaDescription || excerpt(args.description.ar || args.description.fr || args.description.en),
      imageAlt: args.imageAlt || args.title.ar || args.title.fr || args.title.en,
      canonicalPath: `/projects/${args.slug || slugify(args.title.ar || args.title.fr || args.title.en)}`,
    });
    await ctx.db.insert("activities", {
      actorId: args.createdBy,
      actorType: "admin",
      action: "project.created",
      entityType: "project",
      entityId: String(projectId),
      createdAt: now,
    });

    // Schedule notification if published directly as active
    if ((args.status || "draft") === "active") {
      await ctx.scheduler.runAfter(0, api.notifications.sendProjectPublishedNotification, {
        projectId,
        projectTitle: args.title.ar,
        notifyAll: true,
      });
    }

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
      mainImageStorageId: v.optional(v.string()),
      galleryStorageIds: v.optional(v.array(v.string())),
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
      benefitCards: v.optional(v.array(v.object({ icon: v.string(), value: v.string(), label: v.string() }))),
      slug: v.optional(v.string()),
      metaTitle: v.optional(v.string()),
      metaDescription: v.optional(v.string()),
      imageAlt: v.optional(v.string()),
    }),
    adminId: v.optional(v.id("admins")),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    if (args.adminId) await requireAdmin(ctx, args.adminId, "content:write");
    const project = await ctx.db.get(args.projectId);
    if (!project) return false;

    // Map storage IDs to database field names
    const updates: any = { ...args.updates };
    if (updates.title && !updates.slug && !project.slug) {
      updates.slug = slugify(updates.title.ar || updates.title.fr || updates.title.en);
    }
    if (updates.description && !updates.metaDescription && !project.metaDescription) {
      updates.metaDescription = excerpt(updates.description.ar || updates.description.fr || updates.description.en);
    }
    if (updates.slug) updates.canonicalPath = `/projects/${updates.slug}`;
    if (updates.mainImageStorageId !== undefined) {
      updates.mainImage = updates.mainImageStorageId;
      delete updates.mainImageStorageId;
    }
    if (updates.galleryStorageIds !== undefined) {
      updates.gallery = updates.galleryStorageIds;
      delete updates.galleryStorageIds;
    }

    // Auto-assign featuredOrder when marking a project as featured without an explicit order
    if (updates.isFeatured === true && !project.isFeatured && !updates.featuredOrder) {
      const existingFeatured = await ctx.db
        .query("projects")
        .withIndex("by_featured", (q) => q.eq("isFeatured", true))
        .collect();
      updates.featuredOrder = existingFeatured.length + 1;
    }

    await ctx.db.patch(args.projectId, {
      ...updates,
      updatedAt: Date.now(),
    });
    if (args.adminId) await ctx.db.insert("activities", {
      actorId: args.adminId,
      actorType: "admin",
      action: "project.updated",
      entityType: "project",
      entityId: String(args.projectId),
      createdAt: Date.now(),
    });

    // Schedule notification if project is being published (draft → active)
    if (updates.status === "active" && project.status !== "active") {
      const title = updates.title ?? project.title;
      await ctx.scheduler.runAfter(0, api.notifications.sendProjectPublishedNotification, {
        projectId: args.projectId,
        projectTitle: title.ar,
        notifyAll: true,
      });
    }

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

export const updateFeaturedOrder = mutation({
  args: {
    projects: v.array(v.object({
      projectId: v.id("projects"),
      order: v.number(),
    })),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    // Update each project's featuredOrder
    await Promise.all(
      args.projects.map(async ({ projectId, order }) => {
        const project = await ctx.db.get(projectId);
        if (!project) return;
        
        await ctx.db.patch(projectId, {
          featuredOrder: order,
          isFeatured: true,
          updatedAt: Date.now(),
        });
      })
    );
    
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

// ============================================
// PROJECT PUBLISH WITH NOTIFICATIONS
// ============================================

/**
 * Publish a project and optionally notify subscribers via WhatsApp
 * This mutation changes a project's status from "draft" to "active"
 * and can broadcast notifications to all verified users
 *
 * Args:
 *   - projectId: ID of the project to publish
 *   - notifySubscribers: If true, sends WhatsApp notifications to all users
 *
 * Returns:
 *   - success: boolean indicating if the operation succeeded
 *   - error: optional error message
 */
export const publishProject = mutation({
  args: {
    projectId: v.id("projects"),
    notifySubscribers: v.optional(v.boolean()),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      return { success: false, error: "Project not found" };
    }
    
    if (project.status !== "draft") {
      return { success: false, error: "Project is not in draft status" };
    }
    
    // Update project status to active
    await ctx.db.patch(args.projectId, {
      status: "active",
      updatedAt: Date.now(),
    });
    
    // Schedule WhatsApp notification if requested
    // Use scheduler (mutations cannot call ctx.runAction directly)
    if (args.notifySubscribers) {
      try {
        await ctx.scheduler.runAfter(0, api.notifications.sendProjectPublishedNotification, {
          projectId: args.projectId,
          projectTitle: project.title.ar,
          notifyAll: true,
        });
      } catch (error) {
        console.error("Failed to schedule project published notification:", error);
        // Don't fail the publish if scheduling fails
      }
    }
    
    return { success: true };
  },
});

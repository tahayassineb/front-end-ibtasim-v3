import { mutation } from "./_generated/server";
import { v } from "convex/values";
import {
  buildProjectCreateDoc,
  buildProjectUpdatePatch,
  getNextFeaturedProjectOrder,
  logProjectActivity,
  queueProjectPublishedNotification,
  requireProjectAdminActor,
} from "./projectsHelpers";

const localizedTextValidator = v.object({ ar: v.string(), fr: v.string(), en: v.string() });
const localizedOrStringValidator = v.union(v.string(), localizedTextValidator);

export const createProject = mutation({
  args: {
    title: v.object({ ar: v.string(), fr: v.string(), en: v.string() }),
    description: v.object({ ar: v.string(), fr: v.string(), en: v.string() }),
    shortDescription: v.optional(v.object({ ar: v.string(), fr: v.string(), en: v.string() })),
    category: v.string(),
    goalAmount: v.number(),
    mainImageStorageId: v.string(),
    galleryStorageIds: v.optional(v.array(v.string())),
    location: v.optional(localizedOrStringValidator),
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
    sessionToken: v.string(),
    benefitCards: v.optional(v.array(v.object({ icon: v.string(), value: v.string(), label: localizedOrStringValidator }))),
    slug: v.optional(v.string()),
    metaTitle: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
    imageAlt: v.optional(v.string()),
  },
  returns: v.id("projects"),
  handler: async (ctx, args) => {
    const actor = await requireProjectAdminActor(ctx, { sessionToken: args.sessionToken }, "content:write");
    const now = Date.now();
    let featuredOrder = args.featuredOrder;

    if (args.isFeatured && !featuredOrder) {
      featuredOrder = await getNextFeaturedProjectOrder(ctx);
    }

    const projectId = await ctx.db.insert("projects", buildProjectCreateDoc(args, actor._id, now, featuredOrder));
    await logProjectActivity(ctx, actor._id, "project.created", String(projectId), now);

    if ((args.status || "draft") === "active") {
      await queueProjectPublishedNotification(ctx, projectId, args.title.ar);
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
      shortDescription: v.optional(v.object({ ar: v.string(), fr: v.string(), en: v.string() })),
      category: v.optional(v.string()),
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
      location: v.optional(localizedOrStringValidator),
      beneficiaries: v.optional(v.number()),
      endDate: v.optional(v.number()),
      isFeatured: v.optional(v.boolean()),
      featuredOrder: v.optional(v.number()),
      benefitCards: v.optional(v.array(v.object({ icon: v.string(), value: v.string(), label: localizedOrStringValidator }))),
      slug: v.optional(v.string()),
      metaTitle: v.optional(v.string()),
      metaDescription: v.optional(v.string()),
      imageAlt: v.optional(v.string()),
    }),
    sessionToken: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const actor = await requireProjectAdminActor(ctx, { sessionToken: args.sessionToken }, "content:write");
    const project = await ctx.db.get(args.projectId);
    if (!project) return false;

    let featuredOrder;
    if (args.updates.isFeatured === true && !project.isFeatured && !args.updates.featuredOrder) {
      featuredOrder = await getNextFeaturedProjectOrder(ctx);
    }

    const updates = buildProjectUpdatePatch(project, args.updates, featuredOrder);
    const now = Date.now();

    await ctx.db.patch(args.projectId, {
      ...updates,
      updatedAt: now,
    });
    await logProjectActivity(ctx, actor._id, "project.updated", String(args.projectId), now);

    if (updates.status === "active" && project.status !== "active") {
      const title = updates.title ?? project.title;
      await queueProjectPublishedNotification(ctx, args.projectId, title.ar);
    }

    return true;
  },
});

export const deleteProject = mutation({
  args: { projectId: v.id("projects"), sessionToken: v.string() },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    await requireProjectAdminActor(ctx, { sessionToken: args.sessionToken }, "content:write");
    const project = await ctx.db.get(args.projectId);
    if (!project) return false;

    await ctx.db.delete(args.projectId);
    return true;
  },
});

export const updateFeaturedOrder = mutation({
  args: {
    sessionToken: v.string(),
    projects: v.array(v.object({
      projectId: v.id("projects"),
      order: v.number(),
    })),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    await requireProjectAdminActor(ctx, { sessionToken: args.sessionToken }, "content:write");
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

    await ctx.db.patch(args.projectId, {
      status: "active",
      updatedAt: Date.now(),
    });

    if (args.notifySubscribers) {
      try {
        await queueProjectPublishedNotification(ctx, args.projectId, project.title.ar);
      } catch (error) {
        console.error("Failed to schedule project published notification:", error);
      }
    }

    return { success: true };
  },
});

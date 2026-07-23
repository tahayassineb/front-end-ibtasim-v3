import { api } from "./_generated/api";
import { requireAdminSession } from "./permissions";
import { excerpt, slugify } from "./seo";

export async function requireProjectAdminActor(ctx: any, args: { sessionToken?: string }, permission: "content:write") {
  if (args.sessionToken) return await requireAdminSession(ctx, args.sessionToken, permission);
  throw new Error("Admin session required.");
}

export async function getNextFeaturedProjectOrder(ctx: any) {
  const existingFeatured = await ctx.db
    .query("projects")
    .withIndex("by_featured", (q: any) => q.eq("isFeatured", true))
    .collect();
  return existingFeatured.length + 1;
}

export function buildProjectCreateDoc(args: any, actorId: any, now: number, featuredOrder?: number) {
  const fallbackTitle = args.title.ar || args.title.fr || args.title.en;
  const fallbackDescription = args.description.ar || args.description.fr || args.description.en;
  const resolvedSlug = args.slug || slugify(fallbackTitle);

  return {
    title: args.title,
    description: args.description,
    shortDescription: args.shortDescription,
    category: args.category,
    goalAmount: args.goalAmount,
    raisedAmount: 0,
    currency: "MAD" as const,
    mainImage: args.mainImageStorageId,
    gallery: args.galleryStorageIds || [],
    status: args.status || "draft",
    location: args.location,
    beneficiaries: args.beneficiaries,
    startDate: now,
    endDate: args.endDate,
    createdBy: actorId,
    createdAt: now,
    updatedAt: now,
    isFeatured: args.isFeatured || false,
    featuredOrder,
    benefitCards: args.benefitCards,
    slug: resolvedSlug,
    metaTitle: args.metaTitle || fallbackTitle,
    metaDescription: args.metaDescription || excerpt(fallbackDescription),
    imageAlt: args.imageAlt || fallbackTitle,
    canonicalPath: `/projects/${resolvedSlug}`,
  };
}

export function buildProjectUpdatePatch(project: any, updatesInput: any, featuredOrder?: number) {
  const updates: any = { ...updatesInput };

  if (updates.title && !updates.slug && !project.slug) {
    updates.slug = slugify(updates.title.ar || updates.title.fr || updates.title.en);
  }
  if (updates.description && !updates.metaDescription && !project.metaDescription) {
    updates.metaDescription = excerpt(updates.description.ar || updates.description.fr || updates.description.en);
  }
  if (updates.slug) {
    updates.canonicalPath = `/projects/${updates.slug}`;
  }
  if (updates.mainImageStorageId !== undefined) {
    updates.mainImage = updates.mainImageStorageId;
    delete updates.mainImageStorageId;
  }
  if (updates.galleryStorageIds !== undefined) {
    updates.gallery = updates.galleryStorageIds;
    delete updates.galleryStorageIds;
  }
  if (featuredOrder !== undefined) {
    updates.featuredOrder = featuredOrder;
  }

  return updates;
}

export async function logProjectActivity(ctx: any, actorId: any, action: string, entityId: string, createdAt: number) {
  await ctx.db.insert("activities", {
    actorId,
    actorType: "admin",
    action,
    entityType: "project",
    entityId,
    createdAt,
  });
}

export async function queueProjectPublishedNotification(ctx: any, projectId: any, projectTitle: string) {
  await ctx.scheduler.runAfter(0, api.notifications.sendProjectPublishedNotification, {
    projectId,
    projectTitle,
    notifyAll: true,
  });
}

export function sortByFeaturedOrder<T extends { featuredOrder?: number | null }>(items: T[]) {
  return [...items].sort((a, b) => (a.featuredOrder ?? 9999) - (b.featuredOrder ?? 9999));
}

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdminSession } from "./permissions";

// ============================================
// FILE STORAGE MUTATIONS
// ============================================

/**
 * Generate a signed URL for uploading a project image.
 * Returns the upload URL. After uploading via POST to this URL,
 * the response will contain the storageId.
 */
export const generateProjectImageUploadUrl = mutation({
  args: {
    purpose: v.optional(v.union(
      v.literal("receipt"),
      v.literal("cms_image"),
      v.literal("project_image"),
      v.literal("kafala_image")
    )),
    donationId: v.optional(v.id("donations")),
    kafalaDonationId: v.optional(v.id("kafalaDonations")),
    sessionToken: v.optional(v.string()),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    if (args.purpose === "receipt") {
      if (args.donationId) {
        const donation = await ctx.db.get(args.donationId);
        if (!donation || donation.status !== "awaiting_receipt") {
          throw new Error("Receipt uploads must target a pending donation.");
        }
      } else if (args.kafalaDonationId) {
        const donation = await ctx.db.get(args.kafalaDonationId);
        if (!donation || donation.status !== "awaiting_receipt") {
          throw new Error("Receipt uploads must target a pending kafala donation.");
        }
      } else {
        throw new Error("Receipt uploads require a donation context.");
      }
    }

    if (
      args.purpose === "cms_image"
      || args.purpose === "project_image"
      || args.purpose === "kafala_image"
    ) {
      if (!args.sessionToken) throw new Error("Admin session required for CMS uploads.");
      await requireAdminSession(ctx, args.sessionToken, "content:write");
    }

    const uploadUrl = await ctx.storage.generateUploadUrl();
    return uploadUrl;
  },
});

/**
 * Delete a project image by its storageId.
 */
export const deleteProjectImage = mutation({
  args: {
    storageId: v.string(),
    sessionToken: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    await requireAdminSession(ctx, args.sessionToken, "content:write");
    try {
      await ctx.storage.delete(args.storageId as any);
      return true;
    } catch (error) {
      console.error("Failed to delete image:", error);
      return false;
    }
  },
});

/**
 * Get the URL for serving a stored image.
 * Note: This is typically done via the Convex HTTP API, not a mutation.
 * The client should use `convexFileUrl(storageId)` helper instead.
 */
export const getImageUrl = query({
  args: {
    storageId: v.string(),
  },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    try {
      const url = await ctx.storage.getUrl(args.storageId as any);
      return url || null;
    } catch (error) {
      console.error("Failed to get image URL:", error);
      return null;
    }
  },
});

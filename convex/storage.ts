import { mutation } from "./_generated/server";
import { v } from "convex/values";

// ============================================
// FILE STORAGE MUTATIONS
// ============================================

/**
 * Generate a signed URL for uploading a project image.
 * Returns the upload URL. After uploading via POST to this URL,
 * the response will contain the storageId.
 */
export const generateProjectImageUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    // Generate a signed URL for uploading the file
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
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
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
export const getImageUrl = mutation({
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

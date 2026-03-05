// ============================================
// CONVEX CLIENT SETUP
// ============================================

import { ConvexReactClient } from "convex/react";

// Get the Convex URL from environment variables
const CONVEX_URL = import.meta.env.VITE_CONVEX_URL;

// Create a Convex client instance
export const convex = new ConvexReactClient(CONVEX_URL);

// Export the client for use in the app
export default convex;

/**
 * Convert a Convex storage ID to a displayable image URL.
 * If storageId is already a URL (http/data), returns it as-is.
 *
 * Supports both standard (name.convex.cloud) and regional
 * (name.region.convex.cloud) Convex deployments.
 *
 * The HTTP route in convex/http.ts serves files at /storage/<storageId>.
 */
export const convexFileUrl = (storageId) => {
  if (!storageId) return null;
  if (storageId.startsWith('http') || storageId.startsWith('data:')) return storageId;

  // Prefer the explicit site URL env var (set in .env.local as VITE_CONVEX_SITE_URL)
  const convexSiteUrl = import.meta.env.VITE_CONVEX_SITE_URL;
  if (convexSiteUrl) {
    return `${convexSiteUrl.replace(/\/$/, '')}/storage/${storageId}`;
  }

  // Fallback: derive site URL from cloud URL by replacing domain suffix
  const convexUrl = import.meta.env.VITE_CONVEX_URL;
  if (!convexUrl) return null;
  const siteUrl = convexUrl.replace('.convex.cloud', '.convex.site');
  if (!siteUrl.includes('.convex.site')) return null;
  return `${siteUrl.replace(/\/$/, '')}/storage/${storageId}`;
};
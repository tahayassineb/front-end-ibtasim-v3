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
 */
export const convexFileUrl = (storageId) => {
  if (!storageId) return null;
  if (storageId.startsWith('http') || storageId.startsWith('data:')) return storageId;
  const convexUrl = import.meta.env.VITE_CONVEX_URL;
  if (!convexUrl) return null;
  const match = convexUrl.match(/https:\/\/([^.]+)\.convex\.cloud/);
  if (!match) return null;
  return `https://${match[1]}.convex.site/api/storage/${storageId}`;
};
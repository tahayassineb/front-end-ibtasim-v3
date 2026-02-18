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
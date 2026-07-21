import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

function toHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function hashSessionToken(token: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return toHex(new Uint8Array(digest));
}

export function generateSessionToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return toHex(bytes);
}

export async function createAdminSessionRecord(ctx: any, adminId: any) {
  const now = Date.now();
  const token = generateSessionToken();
  const tokenHash = await hashSessionToken(token);
  await ctx.db.insert("adminSessions", {
    tokenHash,
    adminId,
    expiresAt: now + 1000 * 60 * 60 * 24 * 14,
    lastSeenAt: now,
    createdAt: now,
  });
  return token;
}

export async function getAdminSessionRecord(ctx: any, sessionToken: string) {
  const tokenHash = await hashSessionToken(sessionToken);
  const session = await ctx.db
    .query("adminSessions")
    .withIndex("by_token_hash", (q: any) => q.eq("tokenHash", tokenHash))
    .unique();

  if (!session || session.revokedAt || session.expiresAt <= Date.now()) {
    return null;
  }

  const admin = await ctx.db.get(session.adminId);
  if (!admin || !admin.isActive) {
    return null;
  }

  return { session, admin };
}

export async function touchAdminSession(ctx: any, sessionId: any) {
  await ctx.db.patch(sessionId, { lastSeenAt: Date.now() });
}

export async function revokeAdminSessionRecord(ctx: any, sessionToken: string) {
  const tokenHash = await hashSessionToken(sessionToken);
  const session = await ctx.db
    .query("adminSessions")
    .withIndex("by_token_hash", (q: any) => q.eq("tokenHash", tokenHash))
    .unique();

  if (!session || session.revokedAt) return false;
  await ctx.db.patch(session._id, { revokedAt: Date.now() });
  return true;
}

export const cleanupExpiredAdminSessions = internalMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const sessions = await ctx.db.query("adminSessions").collect();
    let cleaned = 0;
    const now = Date.now();
    for (const session of sessions) {
      if (!session.revokedAt && session.expiresAt <= now) {
        await ctx.db.patch(session._id, { revokedAt: now });
        cleaned += 1;
      }
    }
    return cleaned;
  },
});

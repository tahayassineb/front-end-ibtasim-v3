import { query, mutation, internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdminSession } from "./permissions";

const PUBLIC_CONFIG_KEYS = new Set([
  "bank_info",
  "font_system",
  "org_profile",
  "project_categories",
]);

function writePermissionForKey(key: string) {
  if (key === "whatsapp_settings") return "admin:settings" as const;
  return "content:write" as const;
}

export function sanitizePublicConfigValue(key: string, value: string | null) {
  if (value === null) return null;
  if (key === "bank_info") {
    try {
      const parsed = JSON.parse(value);
      return JSON.stringify({
        accountHolder: parsed?.accountHolder ?? "",
        rib: parsed?.rib ?? "",
        bankName: parsed?.bankName ?? "",
        agency: parsed?.agency ?? "",
        associationPhone: parsed?.associationPhone ?? "",
      });
    } catch {
      return null;
    }
  }
  if (key === "org_profile") {
    try {
      const parsed = JSON.parse(value);
      return JSON.stringify({
        organizationName: parsed?.organizationName ?? "",
        email: parsed?.email ?? "",
        phone: parsed?.phone ?? "",
        address: parsed?.address ?? "",
        description: parsed?.description ?? "",
      });
    } catch {
      return null;
    }
  }
  return value;
}

// ============================================
// CONFIG QUERIES
// ============================================

export const getConfig = query({
  args: { key: v.string() },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, { key }) => {
    if (!PUBLIC_CONFIG_KEYS.has(key)) {
      return null;
    }
    const row = await ctx.db
      .query("config")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();
    return sanitizePublicConfigValue(key, row?.value ?? null);
  },
});

export const getAllConfig = query({
  args: {},
  returns: v.array(v.object({ key: v.string(), value: v.string() })),
  handler: async (ctx) => {
    const rows = await ctx.db.query("config").collect();
    return rows
      .filter((r) => PUBLIC_CONFIG_KEYS.has(r.key))
      .map((r) => ({ key: r.key, value: sanitizePublicConfigValue(r.key, r.value) ?? "" }));
  },
});

export const getPrivateConfig = query({
  args: {
    key: v.string(),
    sessionToken: v.string(),
  },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    await requireAdminSession(ctx, args.sessionToken, "admin:read");

    const row = await ctx.db
      .query("config")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();
    return row?.value ?? null;
  },
});

export const getAllPrivateConfig = query({
  args: { sessionToken: v.string() },
  returns: v.array(v.object({ key: v.string(), value: v.string() })),
  handler: async (ctx, args) => {
    await requireAdminSession(ctx, args.sessionToken, "admin:read");

    const rows = await ctx.db.query("config").collect();
    return rows.map((r) => ({ key: r.key, value: r.value }));
  },
});

export const getSystemConfig = internalQuery({
  args: { key: v.string() },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("config")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();
    return row?.value ?? null;
  },
});

export const setSystemConfig = internalMutation({
  args: {
    key: v.string(),
    value: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("config")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { value: args.value, updatedAt: Date.now() });
    } else {
      await ctx.db.insert("config", { key: args.key, value: args.value, updatedAt: Date.now() });
    }

    return null;
  },
});

// ============================================
// CONFIG MUTATIONS
// ============================================

export const deleteConfig = mutation({
  args: {
    key: v.string(),
    sessionToken: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const permission = writePermissionForKey(args.key);
    await requireAdminSession(ctx, args.sessionToken, permission);
    const existing = await ctx.db
      .query("config")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();
    if (existing) await ctx.db.delete(existing._id);
    return null;
  },
});

export const setConfig = mutation({
  args: {
    key: v.string(),
    value: v.string(),
    sessionToken: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const permission = writePermissionForKey(args.key);
    await requireAdminSession(ctx, args.sessionToken, permission);
    const existing = await ctx.db
      .query("config")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { value: args.value, updatedAt: Date.now() });
    } else {
      await ctx.db.insert("config", { key: args.key, value: args.value, updatedAt: Date.now() });
    }
    return null;
  },
});

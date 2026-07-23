import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdminSession } from "./permissions";

export const FEATURE_FLAGS = [
  "use_admin_sessions_v2",
  "use_payment_provider_abstraction",
  "lockdown_sensitive_admin_apis",
  "sanitize_rich_content",
] as const;

export type FeatureFlagKey = (typeof FEATURE_FLAGS)[number];

const featureFlagKey = v.union(
  v.literal("use_admin_sessions_v2"),
  v.literal("use_payment_provider_abstraction"),
  v.literal("lockdown_sensitive_admin_apis"),
  v.literal("sanitize_rich_content")
);

const DEFAULT_FLAGS: Record<FeatureFlagKey, boolean> = {
  use_admin_sessions_v2: true,
  use_payment_provider_abstraction: true,
  lockdown_sensitive_admin_apis: true,
  sanitize_rich_content: true,
};

function configKeyForFlag(flag: FeatureFlagKey) {
  return `feature_flag:${flag}`;
}

async function readFlag(ctx: any, flag: FeatureFlagKey) {
  const row = await ctx.db
    .query("config")
    .withIndex("by_key", (q: any) => q.eq("key", configKeyForFlag(flag)))
    .first();

  if (!row) return DEFAULT_FLAGS[flag];
  return row.value === "true";
}

export const getFeatureFlags = query({
  args: { sessionToken: v.string() },
  returns: v.object({
    use_admin_sessions_v2: v.boolean(),
    use_payment_provider_abstraction: v.boolean(),
    lockdown_sensitive_admin_apis: v.boolean(),
    sanitize_rich_content: v.boolean(),
  }),
  handler: async (ctx, args) => {
    await requireAdminSession(ctx, args.sessionToken, "admin:read");

    return {
      use_admin_sessions_v2: await readFlag(ctx, "use_admin_sessions_v2"),
      use_payment_provider_abstraction: await readFlag(ctx, "use_payment_provider_abstraction"),
      lockdown_sensitive_admin_apis: await readFlag(ctx, "lockdown_sensitive_admin_apis"),
      sanitize_rich_content: await readFlag(ctx, "sanitize_rich_content"),
    };
  },
});

export const setFeatureFlag = mutation({
  args: {
    sessionToken: v.string(),
    flag: featureFlagKey,
    enabled: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdminSession(ctx, args.sessionToken, "admin:settings");

    const key = configKeyForFlag(args.flag);
    const existing = await ctx.db
      .query("config")
      .withIndex("by_key", (q: any) => q.eq("key", key))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        value: args.enabled ? "true" : "false",
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("config", {
        key,
        value: args.enabled ? "true" : "false",
        updatedAt: Date.now(),
      });
    }

    return null;
  },
});

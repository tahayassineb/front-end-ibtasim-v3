import { v } from "convex/values";
import { getAdminSessionRecord } from "./adminSessions";

export const adminRole = v.union(
  v.literal("owner"),
  v.literal("manager"),
  v.literal("validator"),
  v.literal("viewer")
);

export const invitationRole = v.union(
  v.literal("manager"),
  v.literal("validator"),
  v.literal("viewer")
);

export type AdminRole = "owner" | "manager" | "validator" | "viewer";

const roleRank: Record<AdminRole, number> = {
  viewer: 0,
  validator: 1,
  manager: 2,
  owner: 3,
};

export const permissions: Record<string, AdminRole[]> = {
  "admin:read": ["owner", "manager", "validator", "viewer"],
  "admin:manage_team": ["owner"],
  "admin:invite": ["owner", "manager"],
  "admin:settings": ["owner"],
  "admin:error_logs": ["owner"],
  "content:write": ["owner", "manager"],
  "verification:write": ["owner", "manager", "validator"],
  "receipts:export": ["owner", "manager"],
  "activity:read": ["owner", "manager"],
};

export function effectiveRole(role?: AdminRole): AdminRole {
  return role ?? "owner";
}

export function canRole(role: AdminRole | undefined, permission: keyof typeof permissions): boolean {
  return permissions[permission].includes(effectiveRole(role));
}

export function canInviteRole(actorRole: AdminRole | undefined, targetRole: AdminRole): boolean {
  const actor = effectiveRole(actorRole);
  if (actor === "owner") return targetRole !== "owner";
  if (actor === "manager") return targetRole === "validator" || targetRole === "viewer";
  return false;
}

export function canChangeRole(actorRole: AdminRole | undefined, targetRole: AdminRole): boolean {
  const actor = effectiveRole(actorRole);
  if (actor !== "owner") return false;
  return roleRank[targetRole] < roleRank.owner;
}

export async function requireAdmin(ctx: any, adminId: any, permission?: keyof typeof permissions) {
  const admin = await ctx.db.get(adminId);
  if (!admin || !admin.isActive) {
    throw new Error("Admin session is inactive or invalid.");
  }
  if (permission && !canRole(admin.role, permission)) {
    throw new Error("You do not have permission to perform this action.");
  }
  return { ...admin, role: effectiveRole(admin.role) };
}

export async function requireAdminSession(
  ctx: any,
  sessionToken: string,
  permission?: keyof typeof permissions
) {
  const resolved = await getAdminSessionRecord(ctx, sessionToken);
  if (!resolved) {
    throw new Error("Admin session is inactive or invalid.");
  }
  if (permission && !canRole(resolved.admin.role, permission)) {
    throw new Error("You do not have permission to perform this action.");
  }

  // This guard is used by both mutations and read-only queries. Queries cannot
  // update lastSeenAt, so session validation itself must remain read-only.
  return { ...resolved.admin, role: effectiveRole(resolved.admin.role) };
}

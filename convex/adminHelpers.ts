import { requireAdminSession } from "./permissions";

export async function requireAdminActor(
  ctx: any,
  args: { sessionToken?: string },
  permission: any
) {
  if (args.sessionToken) return await requireAdminSession(ctx, args.sessionToken, permission);
  throw new Error("Admin session required.");
}

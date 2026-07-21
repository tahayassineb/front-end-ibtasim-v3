import { requireAdminSession } from "./permissions";

export async function requireKafalaAdminActor(
  ctx: any,
  args: { sessionToken?: string },
  permission: "content:write" | "verification:write"
) {
  if (args.sessionToken) return await requireAdminSession(ctx, args.sessionToken, permission);
  throw new Error("Admin authentication required");
}

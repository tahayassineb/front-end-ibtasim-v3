import { api } from "./_generated/api";

export const WASENDER_API_URL = "https://www.wasenderapi.com/api";

export function normalizeQrCode(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  if (raw.startsWith("data:") || raw.startsWith("http")) return raw;
  if (/^\d@/.test(raw)) return raw;
  if (/^[A-Za-z0-9+/]+=*$/.test(raw) && raw.length > 100) {
    return `data:image/png;base64,${raw}`;
  }
  return raw;
}

export async function requireWhatsAppAdminSession(ctx: any, sessionToken: string) {
  const admin = await ctx.runQuery(api.admin.getAdminSession, { sessionToken });
  if (!admin || admin.role !== "owner") {
    throw new Error("Unauthorized");
  }
  return admin;
}

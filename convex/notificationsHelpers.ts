import { api } from "./_generated/api";

export const WASENDER_API_URL = "https://www.wasenderapi.com/api/send-message";
export const RATE_LIMIT_DELAY_MS = 250;
export const MAX_RETRIES = 3;
export const RETRY_DELAY_MS = 1000;

export function formatPhoneNumber(phone: string): string {
  let formatted = phone.replace(/[\s\-\(\)]/g, "");
  if (!formatted.startsWith("+")) {
    formatted = `+${formatted}`;
  }
  return formatted;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function requireBroadcastAdminSession(ctx: any, sessionToken: string) {
  const session = await ctx.runQuery(api.admin.getAdminSession, { sessionToken });
  if (!session || !session.isActive || session.role !== "owner") {
    throw new Error("Only owners can broadcast WhatsApp notifications.");
  }
  return session;
}

import { api, internal } from "./_generated/api";
import { isConnectedWhatsAppWebhookEvent, timingSafeEqual } from "./httpHelpers";

declare const process: {
  env: {
    WASENDER_WEBHOOK_SECRET?: string;
  };
};

export async function handleWhatsAppWebhook(ctx: any, request: Request) {
  const webhookSecret = process.env.WASENDER_WEBHOOK_SECRET;
  if (!webhookSecret) {
    try {
      await ctx.runMutation(api.errorLogs.insertErrorLog, {
        source: "whatsapp_webhook",
        level: "error",
        message: "WASENDER_WEBHOOK_SECRET not configured",
      });
    } catch {}
    return new Response("Webhook secret not configured", { status: 503 });
  }

  const tokenHeader =
    request.headers.get("X-Webhook-Secret") ||
    request.headers.get("x-webhook-secret");
  if (!tokenHeader || !timingSafeEqual(tokenHeader, webhookSecret)) {
    console.error("WaSender webhook: invalid or missing secret token");
    return new Response("Unauthorized", { status: 401 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (isConnectedWhatsAppWebhookEvent(body)) {
    try {
      const currentSettings = await ctx.runQuery(internal.config.getSystemConfig, {
        key: "whatsapp_settings",
      });
      if (currentSettings) {
        const parsed = JSON.parse(currentSettings);
        await ctx.runMutation(internal.config.setSystemConfig, {
          key: "whatsapp_settings",
          value: JSON.stringify({
            ...parsed,
            isConnected: true,
            qrCode: null,
            lastConnected: new Date().toISOString(),
          }),
        });
      }
    } catch (e) {
      try {
        await ctx.runMutation(api.errorLogs.insertErrorLog, {
          source: "whatsapp_webhook",
          level: "error",
          message: `Error updating whatsapp_settings on connect: ${
            e instanceof Error ? e.message : String(e)
          }`,
        });
      } catch {}
    }
  }

  return new Response("OK", { status: 200 });
}

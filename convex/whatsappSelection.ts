import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { requireWhatsAppAdminSession, WASENDER_API_URL } from "./whatsappHelpers";

declare const process: {
  env: {
    WASENDER_MASTER_TOKEN?: string;
  };
};

export const listWaSenderSessions = action({
  args: { sessionToken: v.string() },
  returns: v.object({
    success: v.boolean(),
    sessions: v.optional(v.array(v.object({
      id: v.string(),
      name: v.string(),
      phoneNumber: v.optional(v.string()),
      status: v.string(),
      apiKey: v.optional(v.string()),
    }))),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    await requireWhatsAppAdminSession(ctx, args.sessionToken);
    const masterToken = process.env.WASENDER_MASTER_TOKEN;
    if (!masterToken) {
      return { success: false, error: "WASENDER_MASTER_TOKEN not configured." };
    }

    try {
      const res = await fetch(`${WASENDER_API_URL}/whatsapp-sessions`, {
        method: "GET",
        headers: { Authorization: `Bearer ${masterToken}` },
      });

      if (!res.ok) {
        const errText = await res.text();
        return { success: false, error: `WaSender error ${res.status}: ${errText}` };
      }

      const data = await res.json();
      const rawSessions: any[] = Array.isArray(data?.data) ? data.data : [];
      const sessions = rawSessions.map((session: any) => ({
        id: String(session.id ?? session._id ?? ""),
        name: String(session.name ?? session.id ?? ""),
        phoneNumber: session.phone_number ? String(session.phone_number) : undefined,
        status: String(session.status ?? session.connection ?? "unknown"),
        apiKey: session.api_key ? String(session.api_key) : undefined,
      }));

      return { success: true, sessions };
    } catch (e) {
      return { success: false, error: `Network error: ${e instanceof Error ? e.message : String(e)}` };
    }
  },
});

export const selectSessionForSending = action({
  args: { sessionId: v.string(), sessionToken: v.string() },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    await requireWhatsAppAdminSession(ctx, args.sessionToken);
    const masterToken = process.env.WASENDER_MASTER_TOKEN;
    if (!masterToken) {
      return { success: false, error: "WASENDER_MASTER_TOKEN not configured." };
    }

    try {
      const res = await fetch(`${WASENDER_API_URL}/whatsapp-sessions/${args.sessionId}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${masterToken}` },
      });

      if (!res.ok) {
        const errText = await res.text();
        return { success: false, error: `WaSender error ${res.status}: ${errText}` };
      }

      const data = await res.json();
      const apiKey = data?.data?.api_key;
      const phoneNumber = data?.data?.phone_number;
      const status = data?.data?.status ?? data?.data?.connection ?? "";

      if (!apiKey) {
        return { success: false, error: "هذه الجلسة لا تحتوي على مفتاح API — تأكد من أنها متصلة أولاً." };
      }

      const rawSettings = await ctx.runQuery(api.config.getConfig, { key: "whatsapp_settings" });
      const existing = rawSettings
        ? (() => {
            try {
              return JSON.parse(rawSettings);
            } catch {
              return {};
            }
          })()
        : {};

      await ctx.runMutation(api.config.setConfig, {
        sessionToken: args.sessionToken,
        key: "whatsapp_settings",
        value: JSON.stringify({
          ...existing,
          instanceId: args.sessionId,
          apiKey,
          phoneNumber: phoneNumber ?? existing.phoneNumber,
          isConnected: status === "connected" || status === "open",
          selectedAt: new Date().toISOString(),
        }),
      });

      return { success: true };
    } catch (e) {
      return { success: false, error: `Network error: ${e instanceof Error ? e.message : String(e)}` };
    }
  },
});

export const resyncApiKey = action({
  args: { sessionToken: v.string() },
  returns: v.object({
    success: v.boolean(),
    hasApiKey: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    await requireWhatsAppAdminSession(ctx, args.sessionToken);
    const masterToken = process.env.WASENDER_MASTER_TOKEN;
    if (!masterToken) {
      return { success: false, hasApiKey: false, error: "WASENDER_MASTER_TOKEN not configured." };
    }

    const rawSettings = await ctx.runQuery(api.config.getConfig, { key: "whatsapp_settings" });
    if (!rawSettings) {
      return { success: false, hasApiKey: false, error: "No active WhatsApp session found." };
    }

    let settings: { instanceId?: string; [key: string]: unknown };
    try {
      settings = JSON.parse(rawSettings);
    } catch {
      return { success: false, hasApiKey: false, error: "Invalid session data." };
    }

    const { instanceId } = settings;
    if (!instanceId) {
      return { success: false, hasApiKey: false, error: "No session ID found." };
    }

    try {
      const res = await fetch(`${WASENDER_API_URL}/whatsapp-sessions/${instanceId}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${masterToken}` },
      });

      if (!res.ok) {
        const errText = await res.text();
        return { success: false, hasApiKey: false, error: `WaSender error: ${errText}` };
      }

      const data = await res.json();
      const apiKey = data?.data?.api_key;

      if (!apiKey) {
        return { success: false, hasApiKey: false, error: "WaSender did not return api_key for this session." };
      }

      await ctx.runMutation(api.config.setConfig, {
        sessionToken: args.sessionToken,
        key: "whatsapp_settings",
        value: JSON.stringify({ ...settings, apiKey }),
      });

      console.log("[whatsapp] resyncApiKey: api_key updated for session", instanceId);
      return { success: true, hasApiKey: true };
    } catch (e) {
      return { success: false, hasApiKey: false, error: `Network error: ${e instanceof Error ? e.message : String(e)}` };
    }
  },
});

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { normalizeQrCode, requireWhatsAppAdminSession, WASENDER_API_URL } from "./whatsappHelpers";

declare const process: {
  env: {
    WASENDER_MASTER_TOKEN?: string;
    CONVEX_SITE_URL?: string;
  };
};

export const createAndConnectSession = action({
  args: {
    sessionToken: v.string(),
    phoneNumber: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    qrCode: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    await requireWhatsAppAdminSession(ctx, args.sessionToken);
    const masterToken = process.env.WASENDER_MASTER_TOKEN;
    if (!masterToken) {
      return { success: false, error: "WASENDER_MASTER_TOKEN not configured." };
    }

    const convexSiteUrl = process.env.CONVEX_SITE_URL || "";
    const webhookUrl = convexSiteUrl ? `${convexSiteUrl}/whatsapp-webhook` : "";

    let sessionId: string;
    let apiKey: string;
    try {
      const createRes = await fetch(`${WASENDER_API_URL}/whatsapp-sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${masterToken}`,
        },
        body: JSON.stringify({
          name: "ibtasim-platform",
          phone_number: args.phoneNumber,
          account_protection: false,
          log_messages: false,
          webhook_enabled: webhookUrl ? true : false,
          webhook_url: webhookUrl || undefined,
          auto_reject_calls: true,
        }),
      });

      if (!createRes.ok) {
        const errText = await createRes.text();
        return { success: false, error: `Failed to create session: ${errText}` };
      }

      const createData = await createRes.json();
      console.log("[whatsapp] Session create response keys:", Object.keys(createData?.data ?? {}));
      sessionId = createData?.data?.id;
      apiKey = createData?.data?.api_key;

      if (!sessionId) {
        console.error("[whatsapp] WaSender create response (no id):", JSON.stringify(createData));
        return { success: false, error: "Invalid response from WaSender (missing session id)." };
      }
      console.log("[whatsapp] Session created, id:", sessionId);

      if (!apiKey) {
        try {
          const detailRes = await fetch(`${WASENDER_API_URL}/whatsapp-sessions/${sessionId}`, {
            method: "GET",
            headers: { Authorization: `Bearer ${masterToken}` },
          });
          if (detailRes.ok) {
            const detailData = await detailRes.json();
            apiKey = detailData?.data?.api_key;
            console.log("[whatsapp] Fetched api_key from session details:", !!apiKey);
          }
        } catch (e) {
          console.error("[whatsapp] Could not fetch session details for api_key:", e);
        }
      }
    } catch (e) {
      return { success: false, error: `Network error creating session: ${e instanceof Error ? e.message : String(e)}` };
    }

    let qrCode: string | undefined;
    try {
      const connectRes = await fetch(`${WASENDER_API_URL}/whatsapp-sessions/${sessionId}/connect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${masterToken}`,
        },
      });

      if (connectRes.ok) {
        const connectData = await connectRes.json();
        console.log("[whatsapp] Connect response keys:", JSON.stringify(Object.keys(connectData?.data ?? {})));
        console.log("[whatsapp] Connect data.qr present:", !!connectData?.data?.qr, "| qr_code:", !!connectData?.data?.qr_code, "| qrCode:", !!connectData?.data?.qrCode);
        qrCode = normalizeQrCode(
          connectData?.data?.qr || connectData?.data?.qr_code || connectData?.data?.qrCode
        );
      } else {
        const errText = await connectRes.text();
        console.error("[whatsapp] Connect session error:", connectRes.status, errText);
      }
    } catch (e) {
      console.error("[whatsapp] Network error connecting session:", e);
    }

    if (!qrCode) {
      try {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const qrRes = await fetch(`${WASENDER_API_URL}/whatsapp-sessions/${sessionId}/qrcode`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${masterToken}`,
          },
        });
        if (qrRes.ok) {
          const qrData = await qrRes.json();
          console.log("[whatsapp] QRCode endpoint keys:", JSON.stringify(Object.keys(qrData?.data ?? {})));
          console.log("[whatsapp] QRCode data.qr:", !!qrData?.data?.qr, "| qr_code:", !!qrData?.data?.qr_code, "| qrCode:", !!qrData?.data?.qrCode, "| base64:", !!qrData?.data?.base64);
          qrCode = normalizeQrCode(
            qrData?.data?.qr || qrData?.data?.qr_code || qrData?.data?.qrCode || qrData?.data?.base64
          );
        } else {
          console.error("[whatsapp] QR fetch error:", qrRes.status, await qrRes.text());
        }
      } catch (e) {
        console.error("[whatsapp] Network error fetching QR code:", e);
      }
    }

    console.log(
      "[whatsapp] Final qrCode type:", qrCode ? (qrCode.startsWith("data:") ? "base64-image" : /^\d@/.test(qrCode) ? "raw-pairing-string" : "other") : "NONE",
      "| length:", qrCode?.length ?? 0
    );

    await ctx.runMutation(api.config.setConfig, {
      sessionToken: args.sessionToken,
      key: "whatsapp_settings",
      value: JSON.stringify({
        instanceId: sessionId,
        apiKey,
        phoneNumber: args.phoneNumber,
        isConnected: false,
        qrCode: qrCode || null,
        createdAt: new Date().toISOString(),
      }),
    });

    return { success: true, qrCode };
  },
});

export const refreshQrCode = action({
  args: { sessionToken: v.string() },
  returns: v.object({
    success: v.boolean(),
    qrCode: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    await requireWhatsAppAdminSession(ctx, args.sessionToken);
    const masterToken = process.env.WASENDER_MASTER_TOKEN;
    if (!masterToken) {
      return { success: false, error: "WASENDER_MASTER_TOKEN not configured." };
    }

    const rawSettings = await ctx.runQuery(api.config.getConfig, { key: "whatsapp_settings" });
    if (!rawSettings) {
      return { success: false, error: "No active WhatsApp session." };
    }

    let settings: { instanceId?: string; apiKey?: string; phoneNumber?: string; isConnected?: boolean; qrCode?: string };
    try {
      settings = JSON.parse(rawSettings);
    } catch {
      return { success: false, error: "Invalid session data." };
    }

    const { instanceId } = settings;
    if (!instanceId) {
      return { success: false, error: "No session ID found." };
    }

    let qrCode: string | undefined;
    try {
      const connectRes = await fetch(`${WASENDER_API_URL}/whatsapp-sessions/${instanceId}/connect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${masterToken}`,
        },
      });
      if (connectRes.ok) {
        const connectData = await connectRes.json();
        qrCode = normalizeQrCode(
          connectData?.data?.qr || connectData?.data?.qr_code || connectData?.data?.qrCode
        );
      }
    } catch (e) {
      console.error("Connect error during QR refresh:", e);
    }

    if (!qrCode) {
      try {
        const qrRes = await fetch(`${WASENDER_API_URL}/whatsapp-sessions/${instanceId}/qrcode`, {
          method: "GET",
          headers: { Authorization: `Bearer ${masterToken}` },
        });
        if (qrRes.ok) {
          const qrData = await qrRes.json();
          qrCode = normalizeQrCode(
            qrData?.data?.qr || qrData?.data?.qr_code || qrData?.data?.qrCode || qrData?.data?.base64
          );
        } else {
          const errText = await qrRes.text();
          console.error("QR refresh error:", errText);
        }
      } catch (e) {
        console.error("Network error fetching QR:", e);
      }
    }

    if (qrCode) {
      await ctx.runMutation(api.config.setConfig, {
        sessionToken: args.sessionToken,
        key: "whatsapp_settings",
        value: JSON.stringify({ ...settings, qrCode, isConnected: false }),
      });
    }

    return { success: true, qrCode };
  },
});

export const syncSessionStatus = action({
  args: { sessionToken: v.string() },
  returns: v.object({
    success: v.boolean(),
    isConnected: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    await requireWhatsAppAdminSession(ctx, args.sessionToken);
    const masterToken = process.env.WASENDER_MASTER_TOKEN;
    if (!masterToken) {
      return { success: false, isConnected: false, error: "WASENDER_MASTER_TOKEN not configured." };
    }

    const rawSettings = await ctx.runQuery(api.config.getConfig, { key: "whatsapp_settings" });
    if (!rawSettings) {
      return { success: false, isConnected: false, error: "No active WhatsApp session." };
    }

    let settings: { instanceId?: string; apiKey?: string; phoneNumber?: string; isConnected?: boolean; qrCode?: string; [key: string]: unknown };
    try {
      settings = JSON.parse(rawSettings);
    } catch {
      return { success: false, isConnected: false, error: "Invalid session data." };
    }

    const { instanceId } = settings;
    if (!instanceId) {
      return { success: false, isConnected: false, error: "No session ID found." };
    }

    try {
      const res = await fetch(`${WASENDER_API_URL}/whatsapp-sessions/${instanceId}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${masterToken}` },
      });

      if (!res.ok) {
        const errText = await res.text();
        return { success: false, isConnected: false, error: `WaSender API error: ${errText}` };
      }

      const data = await res.json();
      const status = data?.data?.status || data?.data?.connection || "";
      const isConnected = status === "connected" || status === "open";

      await ctx.runMutation(api.config.setConfig, {
        sessionToken: args.sessionToken,
        key: "whatsapp_settings",
        value: JSON.stringify({
          ...settings,
          isConnected,
          qrCode: isConnected ? null : settings.qrCode,
          lastSynced: new Date().toISOString(),
          ...(isConnected ? { lastConnected: new Date().toISOString() } : {}),
        }),
      });

      return { success: true, isConnected };
    } catch (e) {
      return { success: false, isConnected: false, error: `Network error: ${e instanceof Error ? e.message : String(e)}` };
    }
  },
});

export const deleteSession = action({
  args: { sessionToken: v.string() },
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

    const rawSettings = await ctx.runQuery(api.config.getConfig, { key: "whatsapp_settings" });
    if (rawSettings) {
      let instanceId: string | undefined;
      try {
        const parsed = JSON.parse(rawSettings);
        instanceId = parsed?.instanceId;
      } catch {}

      if (instanceId) {
        try {
          await fetch(`${WASENDER_API_URL}/whatsapp-sessions/${instanceId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${masterToken}` },
          });
        } catch (e) {
          console.error("WaSender delete session error:", e);
        }
      }
    }

    await ctx.runMutation(api.config.deleteConfig, {
      sessionToken: args.sessionToken,
      key: "whatsapp_settings",
    });

    return { success: true };
  },
});

export const disconnectSession = action({
  args: { sessionToken: v.string() },
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

    const rawSettings = await ctx.runQuery(api.config.getConfig, { key: "whatsapp_settings" });
    if (!rawSettings) {
      return { success: false, error: "No active WhatsApp session found." };
    }

    let settings: { instanceId?: string; apiKey?: string; phoneNumber?: string };
    try {
      settings = JSON.parse(rawSettings);
    } catch {
      return { success: false, error: "Invalid session data in config." };
    }

    const { instanceId } = settings;
    if (!instanceId) {
      return { success: false, error: "No session ID found." };
    }

    try {
      await fetch(`${WASENDER_API_URL}/whatsapp-sessions/${instanceId}/disconnect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${masterToken}`,
        },
      });
    } catch (e) {
      console.error("Error disconnecting session:", e);
    }

    await ctx.runMutation(api.config.setConfig, {
      sessionToken: args.sessionToken,
      key: "whatsapp_settings",
      value: JSON.stringify({
        ...settings,
        isConnected: false,
        qrCode: null,
        disconnectedAt: new Date().toISOString(),
      }),
    });

    return { success: true };
  },
});

export const autoRefreshQrIfNeeded = action({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const masterToken = process.env.WASENDER_MASTER_TOKEN;
    if (!masterToken) return null;

    const rawSettings = await ctx.runQuery(api.config.getConfig, { key: "whatsapp_settings" });
    if (!rawSettings) return null;

    let settings: { instanceId?: string; isConnected?: boolean; [key: string]: unknown };
    try {
      settings = JSON.parse(rawSettings);
    } catch {
      return null;
    }

    if (!settings.instanceId || settings.isConnected) return null;

    const instanceId = settings.instanceId;
    let qrCode: string | undefined;

    try {
      const connectRes = await fetch(`${WASENDER_API_URL}/whatsapp-sessions/${instanceId}/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${masterToken}` },
      });
      if (connectRes.ok) {
        const connectData = await connectRes.json();
        qrCode = normalizeQrCode(
          connectData?.data?.qr || connectData?.data?.qr_code || connectData?.data?.qrCode
        );
      }
    } catch (e) {
      console.error("autoRefreshQr /connect error:", e);
    }

    if (!qrCode) {
      try {
        const qrRes = await fetch(`${WASENDER_API_URL}/whatsapp-sessions/${instanceId}/qrcode`, {
          method: "GET",
          headers: { Authorization: `Bearer ${masterToken}` },
        });
        if (qrRes.ok) {
          const qrData = await qrRes.json();
          qrCode = normalizeQrCode(
            qrData?.data?.qr || qrData?.data?.qr_code || qrData?.data?.qrCode || qrData?.data?.base64
          );
        }
      } catch (e) {
        console.error("autoRefreshQr /qrcode error:", e);
      }
    }

    if (qrCode) {
      await ctx.runMutation(api.config.setConfig, {
        key: "whatsapp_settings",
        value: JSON.stringify({ ...settings, qrCode, isConnected: false }),
      });
    }

    return null;
  },
});

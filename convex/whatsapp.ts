import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// WaSender API base URL
const WASENDER_API_URL = "https://www.wasenderapi.com/api";

declare const process: {
  env: {
    WASENDER_MASTER_TOKEN?: string;
    CONVEX_SITE_URL?: string;
  };
};

// ============================================
// SESSION MANAGEMENT ACTIONS
// ============================================

/**
 * Create a new WaSender session and get the QR code to scan.
 * Stores session data (instanceId, apiKey) in Convex config under "whatsapp_settings".
 */
export const createAndConnectSession = action({
  args: {
    phoneNumber: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    qrCode: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const masterToken = process.env.WASENDER_MASTER_TOKEN;
    if (!masterToken) {
      return { success: false, error: "WASENDER_MASTER_TOKEN not configured." };
    }

    const convexSiteUrl = process.env.CONVEX_SITE_URL || "";
    const webhookUrl = convexSiteUrl ? `${convexSiteUrl}/whatsapp-webhook` : "";

    // Step 1: Create session
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
      sessionId = createData?.data?.id;
      apiKey = createData?.data?.api_key;

      if (!sessionId || !apiKey) {
        return { success: false, error: "Invalid response from WaSender (missing id or api_key)." };
      }
    } catch (e) {
      return { success: false, error: `Network error creating session: ${e instanceof Error ? e.message : String(e)}` };
    }

    // Step 2: Connect session to get QR code
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
        qrCode = connectData?.data?.qr_code || connectData?.data?.qrCode || connectData?.data?.qr;
      } else {
        const errText = await connectRes.text();
        console.error("Connect session error:", errText);
        // Not fatal — continue to try fetching QR directly
      }
    } catch (e) {
      console.error("Network error connecting session:", e);
    }

    // Step 2b: If QR not in connect response, fetch it explicitly from the QR endpoint
    if (!qrCode) {
      try {
        // Wait briefly for the session to initialize before fetching QR
        await new Promise((r) => setTimeout(r, 2000));
        const qrRes = await fetch(`${WASENDER_API_URL}/whatsapp-sessions/${sessionId}/qrcode`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${masterToken}`,
          },
        });
        if (qrRes.ok) {
          const qrData = await qrRes.json();
          qrCode = qrData?.data?.qrCode || qrData?.data?.qr_code || qrData?.data?.qr;
        } else {
          console.error("QR fetch error:", await qrRes.text());
        }
      } catch (e) {
        console.error("Network error fetching QR code:", e);
      }
    }

    // Step 3: Store session data in Convex config
    await ctx.runMutation(api.config.setConfig, {
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

/**
 * Refresh the QR code for the current session.
 * Calls /connect again (returns new QR) or falls back to /qrcode endpoint.
 * Stores updated QR in Convex config.
 */
export const refreshQrCode = action({
  args: {},
  returns: v.object({
    success: v.boolean(),
    qrCode: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx) => {
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

    // Try /connect first (Wasender re-generates QR on each connect call)
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
        qrCode = connectData?.data?.qr_code || connectData?.data?.qrCode || connectData?.data?.qr;
      }
    } catch (e) {
      console.error("Connect error during QR refresh:", e);
    }

    // Fallback: fetch from dedicated /qrcode endpoint
    if (!qrCode) {
      try {
        const qrRes = await fetch(`${WASENDER_API_URL}/whatsapp-sessions/${instanceId}/qrcode`, {
          method: "GET",
          headers: { Authorization: `Bearer ${masterToken}` },
        });
        if (qrRes.ok) {
          const qrData = await qrRes.json();
          qrCode = qrData?.data?.qrCode || qrData?.data?.qr_code || qrData?.data?.qr || qrData?.data?.base64;
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
        key: "whatsapp_settings",
        value: JSON.stringify({ ...settings, qrCode, isConnected: false }),
      });
    }

    return { success: true, qrCode };
  },
});

/**
 * Disconnect the active WaSender session.
 */
export const disconnectSession = action({
  args: {},
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx) => {
    const masterToken = process.env.WASENDER_MASTER_TOKEN;
    if (!masterToken) {
      return { success: false, error: "WASENDER_MASTER_TOKEN not configured." };
    }

    // Read current settings
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

    // Update config: mark as disconnected
    await ctx.runMutation(api.config.setConfig, {
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

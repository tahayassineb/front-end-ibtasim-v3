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
          webhook_enabled: webhookUrl ? true : false,
          webhook_url: webhookUrl || undefined,
          webhook_events: ["session.status"],
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
        // Not fatal — continue storing the session
      }
    } catch (e) {
      console.error("Network error connecting session:", e);
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

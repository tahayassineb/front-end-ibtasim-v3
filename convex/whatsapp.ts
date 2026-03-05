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

/**
 * Normalize the QR code value returned by WaSender.
 *
 * WaSender sometimes returns a raw base64 PNG image WITHOUT the
 * "data:image/png;base64," prefix. If we pass that string to
 * api.qrserver.com it creates a QR that encodes the base64 text
 * itself — not the WhatsApp pairing data — so scanning fails.
 *
 * Detection: pure base64 chars only + length > 100 → it's an image.
 * In that case, prefix it so <img src=...> renders it correctly.
 */
function normalizeQrCode(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  if (raw.startsWith("data:") || raw.startsWith("http")) return raw;
  // WhatsApp pairing strings always start with digit@ (e.g. "2@DfzdT...")
  // Return as-is so the frontend can render them via api.qrserver.com
  if (/^\d@/.test(raw)) return raw;
  // Pure base64 blob (rendered QR PNG from some APIs) → add image data URI prefix
  if (/^[A-Za-z0-9+/]+=*$/.test(raw) && raw.length > 100) {
    return `data:image/png;base64,${raw}`;
  }
  return raw;
}

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

      if (!sessionId) {
        return { success: false, error: "Invalid response from WaSender (missing session id)." };
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
        qrCode = normalizeQrCode(
          connectData?.data?.qr || connectData?.data?.qr_code || connectData?.data?.qrCode
        );
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
          qrCode = normalizeQrCode(
            qrData?.data?.qr || qrData?.data?.qr_code || qrData?.data?.qrCode || qrData?.data?.base64
          );
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
        qrCode = normalizeQrCode(
          connectData?.data?.qr || connectData?.data?.qr_code || connectData?.data?.qrCode
        );
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
        key: "whatsapp_settings",
        value: JSON.stringify({ ...settings, qrCode, isConnected: false }),
      });
    }

    return { success: true, qrCode };
  },
});

/**
 * Check the real-time session status from WaSender API and sync it into Convex config.
 * Useful when the webhook did not fire (e.g. after QR scan or external reconnection).
 */
export const syncSessionStatus = action({
  args: {},
  returns: v.object({
    success: v.boolean(),
    isConnected: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx) => {
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
      // WaSender returns status in data.data.status or data.data.connection
      const status = data?.data?.status || data?.data?.connection || "";
      const isConnected = status === "connected" || status === "open";

      await ctx.runMutation(api.config.setConfig, {
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

/**
 * Fully delete the WaSender session (removes from WaSender + clears Convex config).
 * After this, the admin panel will show the "Create New Session" form.
 */
export const deleteSession = action({
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

    const rawSettings = await ctx.runQuery(api.config.getConfig, { key: "whatsapp_settings" });
    if (rawSettings) {
      let instanceId: string | undefined;
      try {
        const parsed = JSON.parse(rawSettings);
        instanceId = parsed?.instanceId;
      } catch {
        // Ignore parse error — still proceed to clear config
      }

      if (instanceId) {
        try {
          await fetch(`${WASENDER_API_URL}/whatsapp-sessions/${instanceId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${masterToken}` },
          });
        } catch (e) {
          // Log but don't fail — the goal is to clear local state regardless
          console.error("WaSender delete session error:", e);
        }
      }
    }

    // Always clear the local config
    await ctx.runMutation(api.config.deleteConfig, { key: "whatsapp_settings" });

    return { success: true };
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

/**
 * Called by the Convex cron every minute.
 * If a session exists but is not connected, refresh the QR code automatically.
 * The frontend will receive the new QR via Convex's real-time reactive queries.
 */
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

    // Only refresh when a session exists but is NOT yet connected
    if (!settings.instanceId || settings.isConnected) return null;

    const instanceId = settings.instanceId;
    let qrCode: string | undefined;

    // Try /connect first
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

    // Fallback: /qrcode endpoint
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

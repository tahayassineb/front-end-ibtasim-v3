import { api, internal } from "./_generated/api";
import { action, internalAction } from "./_generated/server";
import { v } from "convex/values";
import {
  formatPhoneNumber,
  MAX_RETRIES,
  requireBroadcastAdminSession,
  RETRY_DELAY_MS,
  sleep,
  WASENDER_API_URL,
} from "./notificationsHelpers";
import { requireAdminSession } from "./permissions";

declare const process: {
  env: {
    WASENDER_MASTER_TOKEN?: string;
    FRONTEND_URL?: string;
  };
};

export async function sendWhatsAppMessage(
  to: string,
  text: string,
  retryCount: number = 0,
  token?: string,
  imageUrl?: string
): Promise<{ success: boolean; error?: string; status?: number; responseBody?: string; response?: any }> {
  if (!token) {
    return {
      success: false,
      error: "No session API key configured. Connect WhatsApp in Admin Settings first.",
    };
  }

  try {
    const formattedPhone = formatPhoneNumber(to);
    const body: Record<string, string> = { to: formattedPhone, text };
    if (imageUrl) body.imageUrl = imageUrl;

    const response = await fetch(WASENDER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const responseBody = await response.text();

    if (response.status === 429) {
      if (retryCount < MAX_RETRIES) {
        const delay = RETRY_DELAY_MS * Math.pow(2, retryCount);
        await sleep(delay);
        return sendWhatsAppMessage(to, text, retryCount + 1, token, imageUrl);
      }
      return {
        success: false,
        error: "Rate limit exceeded. Max retries reached.",
        status: 429,
        responseBody,
      };
    }

    if (!response.ok) {
      return {
        success: false,
        error: `API Error (${response.status}): ${responseBody}`,
        status: response.status,
        responseBody,
      };
    }

    let data: any;
    try {
      data = JSON.parse(responseBody);
    } catch {
      data = responseBody;
    }
    return {
      success: true,
      status: response.status,
      responseBody,
      response: data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function readSystemConfigObject(ctx: any, key: string) {
  const rawValue = await ctx.runQuery(internal.config.getSystemConfig, { key });
  if (!rawValue) return null;
  try {
    return JSON.parse(rawValue);
  } catch {
    return null;
  }
}

async function performSendWhatsApp(
  ctx: any,
  args: {
    to: string;
    text: string;
  }
) {
  const settings = await readSystemConfigObject(ctx, "whatsapp_settings");
  const apiKey = typeof settings?.apiKey === "string" ? settings.apiKey : undefined;

  const result = await sendWhatsAppMessage(args.to, args.text, 0, apiKey);
  return {
    success: result.success,
    error: result.error,
  };
}

export const sendWhatsApp = action({
  args: {
    sessionToken: v.string(),
    to: v.string(),
    text: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    await requireAdminSession(ctx, args.sessionToken, "admin:settings");
    return performSendWhatsApp(ctx, args);
  },
});

export const sendWhatsAppInternal = internalAction({
  args: {
    to: v.string(),
    text: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    return performSendWhatsApp(ctx, args);
  },
});

async function performBroadcast(
  ctx: any,
  args: {
    text: string;
    projectId?: any;
    imageUrl?: string;
  }
) {
  const settings = await readSystemConfigObject(ctx, "whatsapp_settings");
  const sessionApiKey = typeof settings?.apiKey === "string" ? settings.apiKey : undefined;

  const users = await ctx.runQuery(api.users.getAllVerifiedUsersWithPhone);

  let successful = 0;
  let failed = 0;
  const errors: string[] = [];

  for (let i = 0; i < users.length; i++) {
    const user = users[i];

    if (i > 0) {
      const randomDelay = Math.floor(Math.random() * (30000 - 2000 + 1)) + 2000;
      await sleep(randomDelay);
    }

    const firstName = user.fullName?.split(" ")[0] || "صديقي";
    const personalizedText = args.text.replace(/{name}/g, firstName);

    const result = await sendWhatsAppMessage(
      user.phoneNumber,
      personalizedText,
      0,
      sessionApiKey,
      args.imageUrl
    );

    if (result.success) {
      successful++;
    } else {
      failed++;
      const errMsg = `Failed to send to ${user.phoneNumber}: ${result.error}`;
      errors.push(errMsg);
      try {
        await ctx.runMutation(api.errorLogs.insertErrorLog, {
          source: "broadcastToAllUsers",
          level: "error",
          message: errMsg,
          apiUrl: WASENDER_API_URL,
          apiStatus: result.status,
          apiResponse: result.responseBody?.slice(0, 2000),
          userId: user._id,
        });
      } catch (logErr) {
        console.error("Failed to log notification error:", logErr);
      }
    }
  }

  try {
    await ctx.runMutation(api.errorLogs.insertErrorLog, {
      source: "broadcastToAllUsers",
      level: failed === users.length && users.length > 0 ? "error" : "info",
      message: `Broadcast complete: ${successful}/${users.length} sent, ${failed} failed`,
      details: JSON.stringify({ projectId: args.projectId, total: users.length, successful, failed }),
    });
  } catch (logErr) {
    console.error("Failed to log broadcast summary:", logErr);
  }

  return {
    total: users.length,
    successful,
    failed,
    errors: errors.length > 0 ? errors : undefined,
  };
}

export const broadcastToAllUsers = action({
  args: {
    sessionToken: v.string(),
    text: v.string(),
    projectId: v.optional(v.id("projects")),
    imageUrl: v.optional(v.string()),
  },
  returns: v.object({
    total: v.number(),
    successful: v.number(),
    failed: v.number(),
    errors: v.optional(v.array(v.string())),
  }),
  handler: async (ctx, args) => {
    await requireBroadcastAdminSession(ctx, args.sessionToken);
    return performBroadcast(ctx, args);
  },
});

export const broadcastToAllUsersInternal = internalAction({
  args: {
    text: v.string(),
    projectId: v.optional(v.id("projects")),
    imageUrl: v.optional(v.string()),
  },
  returns: v.object({
    total: v.number(),
    successful: v.number(),
    failed: v.number(),
    errors: v.optional(v.array(v.string())),
  }),
  handler: async (ctx, args) => {
    return performBroadcast(ctx, args);
  },
});

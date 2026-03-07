import { action, query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// ============================================
// WA SENDER API CONFIGURATION
// ============================================

const WASENDER_API_URL = "https://www.wasenderapi.com/api/send-message";

// Get API token from environment
// In Convex, env vars are accessed via process.env
declare const process: {
  env: {
    WASENDER_MASTER_TOKEN?: string;
  };
};

// Rate limiting: 256 requests per minute = ~234ms between requests
// Using 250ms for safety margin
const RATE_LIMIT_DELAY_MS = 250;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Format phone number to E.164 format
 * Adds + prefix if missing, removes spaces and dashes
 */
function formatPhoneNumber(phone: string): string {
  // Remove spaces, dashes, and parentheses
  let formatted = phone.replace(/[\s\-\(\)]/g, "");
  
  // Add + if missing
  if (!formatted.startsWith("+")) {
    formatted = "+" + formatted;
  }
  
  return formatted;
}

/**
 * Sleep utility for rate limiting and retries
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get WaSender API token from environment
 */
function getApiToken(): string {
  return process.env.WASENDER_MASTER_TOKEN || "";
}

/**
 * Send a single WhatsApp message via WaSender API
 * Includes retry logic for rate limiting
 * Returns status code and response body for structured error logging
 */
async function sendWhatsAppMessage(
  to: string,
  text: string,
  retryCount: number = 0,
  tokenOverride?: string,
  imageUrl?: string
): Promise<{ success: boolean; error?: string; status?: number; responseBody?: string; response?: any }> {
  const token = tokenOverride || getApiToken();

  if (!token) {
    return {
      success: false,
      error: "WaSender API token not configured",
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

    // Handle rate limiting (429 Too Many Requests)
    if (response.status === 429) {
      if (retryCount < MAX_RETRIES) {
        const delay = RETRY_DELAY_MS * Math.pow(2, retryCount);
        await sleep(delay);
        return sendWhatsAppMessage(to, text, retryCount + 1, tokenOverride, imageUrl);
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
    try { data = JSON.parse(responseBody); } catch { data = responseBody; }
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

// ============================================
// WHATSAPP ACTIONS
// ============================================

/**
 * Send a single WhatsApp message
 * Public action that can be called from the client
 * 
 * Args:
 *   - to: Phone number in any format (will be normalized to E.164)
 *   - text: Message content
 * 
 * Returns:
 *   - success: boolean indicating if the message was sent
 *   - error: optional error message if failed
 */
export const sendWhatsApp = action({
  args: {
    to: v.string(),
    text: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    // Try to get api_key from stored whatsapp_settings config (session api_key)
    let apiKey: string | undefined;
    try {
      const rawSettings = await ctx.runQuery(api.config.getConfig, { key: "whatsapp_settings" });
      if (rawSettings) {
        const settings = JSON.parse(rawSettings);
        if (settings.apiKey) apiKey = settings.apiKey;
      }
    } catch (e) {
      console.error("Could not read whatsapp_settings config:", e);
    }

    const result = await sendWhatsAppMessage(args.to, args.text, 0, apiKey);
    return {
      success: result.success,
      error: result.error,
    };
  },
});

// ============================================
// BROADCAST ACTION
// ============================================

/**
 * Broadcast a message to all users with phone numbers
 * Respects rate limits with 250ms delay between messages
 * 
 * Args:
 *   - text: Message to broadcast
 *   - projectId: Optional project ID for tracking
 * 
 * Returns:
 *   - total: Total number of users
 *   - successful: Number of successful sends
 *   - failed: Number of failed sends
 *   - errors: Optional array of error messages
 */
export const broadcastToAllUsers = action({
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
    // Import api inside handler to avoid circular dependency issues
    const { api } = await import("./_generated/api");

    // Read session API key — WaSender requires the per-session key (🔑) for sending,
    // not the master token (which is only for session management).
    let sessionApiKey: string | undefined;
    try {
      const rawSettings = await ctx.runQuery(api.config.getConfig, { key: "whatsapp_settings" });
      if (rawSettings) {
        const settings = JSON.parse(rawSettings);
        if (settings.apiKey) sessionApiKey = settings.apiKey;
      }
    } catch (e) {
      console.error("Could not read whatsapp_settings config:", e);
    }

    // Get all verified users with phone numbers
    const users = await ctx.runQuery(api.users.getAllVerifiedUsersWithPhone);
    
    let successful = 0;
    let failed = 0;
    const errors: string[] = [];
    
    for (let i = 0; i < users.length; i++) {
      const user = users[i];

      // Random delay between 2s and 30s to appear more human-like to WhatsApp
      if (i > 0) {
        const randomDelay = Math.floor(Math.random() * (30000 - 2000 + 1)) + 2000;
        await sleep(randomDelay);
      }

      // Personalize message: replace {name} placeholder with user's first name
      const firstName = user.fullName?.split(' ')[0] || 'صديقي';
      const personalizedText = args.text.replace(/{name}/g, firstName);

      const result = await sendWhatsAppMessage(user.phoneNumber, personalizedText, 0, sessionApiKey, args.imageUrl);

      if (result.success) {
        successful++;
      } else {
        failed++;
        const errMsg = `Failed to send to ${user.phoneNumber}: ${result.error}`;
        errors.push(errMsg);
        // Log each individual failure to errorLogs so admin can see it
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

    // Log broadcast summary
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
  },
});

// ============================================
// DONATION NOTIFICATION ACTIONS
// ============================================

/**
 * Send donation verification notification to user
 * Called after admin verifies a donation
 * 
 * Args:
 *   - userId: ID of the donor
 *   - donationId: ID of the verified donation
 *   - amount: Donation amount in cents
 *   - projectTitle: Title of the project donated to
 * 
 * Returns:
 *   - success: boolean indicating if the notification was sent
 *   - error: optional error message if failed
 */
export const sendDonationVerificationNotification = action({
  args: {
    userId: v.id("users"),
    donationId: v.id("donations"),
    amount: v.number(),
    projectTitle: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    // Import api inside handler to avoid circular dependency issues
    const { api } = await import("./_generated/api");
    
    // Read session API key — WaSender requires the per-session key for sending,
    // not the master token (which is only for session management).
    let sessionApiKey: string | undefined;
    try {
      const rawSettings = await ctx.runQuery(api.config.getConfig, { key: "whatsapp_settings" });
      if (rawSettings) {
        const settings = JSON.parse(rawSettings);
        if (settings.apiKey) sessionApiKey = settings.apiKey;
      }
    } catch (e) {
      console.error("Could not read whatsapp_settings config:", e);
    }

    // Get user details using the query
    const user = await ctx.runQuery(api.users.getUserById, { userId: args.userId });

    if (!user || !user.phoneNumber) {
      return {
        success: false,
        error: "User not found or has no phone number",
      };
    }

    // Amount is already in MAD
    const amountMAD = args.amount.toFixed(2);

    // Create personalized thank you message in Arabic
    const message = `بارك الله فيك ${user.fullName}! ✨\n\nتم تأكيد تبرعك بمبلغ ${amountMAD} درهم لمشروع "${args.projectTitle}".\n\nجزاك الله خيرًا على سخائك.\n\nفريق جمعية الأمل`;

    const result = await sendWhatsAppMessage(user.phoneNumber, message, 0, sessionApiKey);

    // Log result to errorLogs for admin visibility
    try {
      await ctx.runMutation(api.errorLogs.insertErrorLog, {
        source: "sendDonationVerificationNotification",
        level: result.success ? "info" : "error",
        message: result.success
          ? `Donation verification WhatsApp sent to ${user.phoneNumber}`
          : `Failed to send donation verification WhatsApp to ${user.phoneNumber}: ${result.error}`,
        apiUrl: WASENDER_API_URL,
        apiStatus: result.status,
        apiResponse: result.responseBody?.slice(0, 2000),
        userId: args.userId,
        donationId: args.donationId,
      });
    } catch (logErr) {
      console.error("Failed to log donation notification result:", logErr);
    }

    return {
      success: result.success,
      error: result.error,
    };
  },
});

// ============================================
// PROJECT NOTIFICATION ACTIONS
// ============================================

/**
 * Send notification when a new project is published
 * Can optionally broadcast to all users
 * 
 * Args:
 *   - projectId: ID of the published project
 *   - projectTitle: Title of the project
 *   - notifyAll: If true, broadcasts to all users
 * 
 * Returns:
 *   - success: boolean indicating success
 *   - broadcastResult: Stats about the broadcast (if notifyAll was true)
 *   - error: optional error message
 */
export const sendProjectPublishedNotification = action({
  args: {
    projectId: v.id("projects"),
    projectTitle: v.string(),
    notifyAll: v.boolean(),
  },
  returns: v.object({
    success: v.boolean(),
    broadcastResult: v.optional(v.object({
      total: v.number(),
      successful: v.number(),
      failed: v.number(),
    })),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    if (!args.notifyAll) {
      return {
        success: true,
        broadcastResult: {
          total: 0,
          successful: 0,
          failed: 0,
        },
      };
    }
    
    // Import api inside handler to avoid circular dependency issues
    const { api } = await import("./_generated/api");

    // Fetch project to get mainImage URL
    const project = await ctx.runQuery(api.projects.getProjectById, { projectId: args.projectId });
    const imageUrl = project?.mainImage || undefined;

    // Create announcement message in Arabic
    const message = `🌟 مشروع جديد على منصة الأمل!\n\n"${args.projectTitle}"\n\nتبرع الآن وساهم في صنع الفرق.\n\nفريق جمعية الأمل`;

    // Broadcast to all users using the broadcast action
    const result = await ctx.runAction(api.notifications.broadcastToAllUsers, {
      text: message,
      projectId: args.projectId,
      imageUrl,
    });

    // Log summary to errorLogs for admin visibility
    // (Per-message failures are already logged inside broadcastToAllUsers)
    try {
      await ctx.runMutation(api.errorLogs.insertErrorLog, {
        source: "sendProjectPublishedNotification",
        level: result.successful > 0 ? "info" : "error",
        message: `Project "${args.projectTitle}" notification: ${result.successful}/${result.total} WhatsApp messages sent`,
        details: JSON.stringify({ projectId: args.projectId, total: result.total, successful: result.successful, failed: result.failed }),
      });
    } catch (logErr) {
      console.error("Failed to log project notification summary:", logErr);
    }

    return {
      success: result.failed === 0 || result.successful > 0,
      broadcastResult: {
        total: result.total,
        successful: result.successful,
        failed: result.failed,
      },
      error: result.errors && result.errors.length > 0
        ? result.errors[0]
        : undefined,
    };
  },
});

// ============================================
// NOTIFICATION LOGGING MUTATION
// ============================================

/**
 * Log a notification to the database
 * This mutation can be called from actions or other mutations
 * 
 * Args:
 *   - userId: ID of the recipient user
 *   - type: Type of notification (donation_received, donation_verified, etc.)
 *   - channel: Channel used (whatsapp or email)
 *   - status: Status of the notification (pending, sent, delivered, failed)
 *   - content: Message content in ar, fr, en
 *   - errorMessage: Optional error message if failed
 * 
 * Returns:
 *   - notificationId: ID of the created notification record
 */
export const logNotification = mutation({
  args: {
    userId: v.id("users"),
    type: v.union(
      v.literal("donation_received"),
      v.literal("donation_verified"),
      v.literal("donation_rejected"),
      v.literal("project_funded"),
      v.literal("receipt_reminder"),
      v.literal("otp_code")
    ),
    channel: v.union(v.literal("whatsapp"), v.literal("email")),
    status: v.union(
      v.literal("pending"),
      v.literal("sent"),
      v.literal("delivered"),
      v.literal("failed")
    ),
    content: v.object({
      ar: v.string(),
      fr: v.string(),
      en: v.string(),
    }),
    errorMessage: v.optional(v.string()),
  },
  returns: v.id("notifications"),
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const notificationId = await ctx.db.insert("notifications", {
      userId: args.userId,
      type: args.type,
      channel: args.channel,
      status: args.status,
      content: args.content,
      createdAt: now,
      sentAt: args.status === "sent" ? now : undefined,
      errorMessage: args.errorMessage,
    });
    
    return notificationId;
  },
});

// ============================================
// PROJECT CLOSING SOON NOTIFICATIONS
// ============================================

/**
 * Send notifications to users about projects closing soon
 * This action is called by the daily cron job
 *
 * Finds all active projects with endDate within the next 7 days
 * and sends WhatsApp notifications to users
 *
 * Returns:
 *   - success: boolean indicating if the operation completed
 *   - projectsChecked: number of projects found
 *   - notificationsSent: number of notifications sent
 *   - error: optional error message
 */
export const sendProjectClosingSoonNotifications = action({
  args: {},
  returns: v.object({
    success: v.boolean(),
    projectsChecked: v.number(),
    notificationsSent: v.number(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx) => {
    const now = Date.now();
    const sevenDaysFromNow = now + 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    
    try {
      // Import api inside handler to avoid circular dependency issues
      const { api } = await import("./_generated/api");
      
      // Read session API key for sending messages
      let sessionApiKey: string | undefined;
      try {
        const rawSettings = await ctx.runQuery(api.config.getConfig, { key: "whatsapp_settings" });
        if (rawSettings) {
          const settings = JSON.parse(rawSettings);
          if (settings.apiKey) sessionApiKey = settings.apiKey;
        }
      } catch (e) {
        console.error("Could not read whatsapp_settings config:", e);
      }

      // Get all active projects with endDate within next 7 days
      const allProjects = await ctx.runQuery(api.projects.getProjects, { status: "active" });
      
      const closingSoonProjects = allProjects.filter(project => {
        if (!project.endDate) return false;
        const endDate = project.endDate;
        // Project ends within 7 days and hasn't ended yet
        return endDate > now && endDate <= sevenDaysFromNow;
      });
      
      if (closingSoonProjects.length === 0) {
        return {
          success: true,
          projectsChecked: 0,
          notificationsSent: 0,
        };
      }
      
      // Get all verified users with phone numbers
      const users = await ctx.runQuery(api.users.getAllVerifiedUsersWithPhone);
      
      let notificationsSent = 0;
      
      // Send notification for each closing soon project
      for (const project of closingSoonProjects) {
        const daysRemaining = Math.ceil((project.endDate! - now) / (24 * 60 * 60 * 1000));
        const projectTitle = project.title.ar; // Use Arabic title
        
        // Create notification message
        const message = `⏰ تذكير: مشروع "${projectTitle}" ينتهي خلال ${daysRemaining} أيام!\n\nساهم الآن قبل إغلاق المشروع.\n\nفريق جمعية الأمل`;
        
        // Send to all users with random 2-30s delay between each
        for (let i = 0; i < users.length; i++) {
          const user = users[i];

          if (i > 0) {
            const randomDelay = Math.floor(Math.random() * (30000 - 2000 + 1)) + 2000;
            await sleep(randomDelay);
          }

          // Personalize with user's first name
          const firstName = user.fullName?.split(' ')[0] || 'صديقي';
          const personalizedMessage = message.replace(/{name}/g, firstName);

          const result = await sendWhatsAppMessage(user.phoneNumber, personalizedMessage, 0, sessionApiKey);

          if (result.success) {
            notificationsSent++;
          } else {
            try {
              await ctx.runMutation(api.errorLogs.insertErrorLog, {
                source: "sendProjectClosingSoonNotifications",
                level: "error",
                message: `Failed to send closing-soon notification to ${user.phoneNumber}: ${result.error}`,
                apiUrl: WASENDER_API_URL,
                apiStatus: result.status,
                apiResponse: result.responseBody?.slice(0, 2000),
                userId: user._id,
              });
            } catch (logErr) {
              console.error("Failed to log closing-soon notification error:", logErr);
            }
          }
        }
      }
      
      return {
        success: true,
        projectsChecked: closingSoonProjects.length,
        notificationsSent,
      };
    } catch (error) {
      return {
        success: false,
        projectsChecked: 0,
        notificationsSent: 0,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  },
});

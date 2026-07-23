import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { sleep, WASENDER_API_URL } from "./notificationsHelpers";
import { readSystemConfigObject, sendWhatsAppMessage } from "./notificationsCore";

declare const process: {
  env: {
    FRONTEND_URL?: string;
  };
};

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
    const { api } = await import("./_generated/api");
    const settings = await readSystemConfigObject(ctx, "whatsapp_settings");
    const sessionApiKey = typeof settings?.apiKey === "string" ? settings.apiKey : undefined;

    const user = await ctx.runQuery(api.users.getUserById, { userId: args.userId });
    if (!user || !user.phoneNumber) {
      return {
        success: false,
        error: "User not found or has no phone number",
      };
    }

    const amountMAD = args.amount.toFixed(2);
    const message = `بارك الله فيك ${user.fullName}! ✨\n\nتم تأكيد تبرعك بمبلغ ${amountMAD} درهم لمشروع "${args.projectTitle}".\n\nجزاك الله خيرًا على سخائك.\n\nفريق جمعية الأمل`;
    const result = await sendWhatsAppMessage(user.phoneNumber, message, 0, sessionApiKey);

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

    const { api } = await import("./_generated/api");
    const project = await ctx.runQuery(api.projects.getProjectById, { projectId: args.projectId });
    let imageUrl: string | undefined;
    if (project?.mainImage) {
      try {
        const resolved = await ctx.storage.getUrl(project.mainImage as any);
        imageUrl = resolved || undefined;
        console.log("[notifications] Resolved project mainImage URL:", imageUrl ? "ok" : "null");
      } catch (e) {
        console.error("[notifications] Could not resolve mainImage storage URL:", e);
      }
    }

    const frontendUrl = process.env.FRONTEND_URL || "";
    const projectLink = frontendUrl ? `${frontendUrl}/projects/${args.projectId}` : "";

    const message =
      `السلام عليكم {name} 👋\n\n` +
      `🌟 مشروع جديد على منصة ابتسم!\n\n` +
      `"${args.projectTitle}"\n\n` +
      `تبرع الآن وساهم في صنع الفرق ❤️` +
      (projectLink ? `\n${projectLink}` : ``) +
      `\n\nفريق جمعية الأمل`;

    const result = await ctx.runAction(api.notifications.broadcastToAllUsersInternal, {
      text: message,
      projectId: args.projectId,
      imageUrl,
    });

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
      error: result.errors && result.errors.length > 0 ? result.errors[0] : undefined,
    };
  },
});

export const notifyAdminNewVerification = action({
  args: {
    type: v.union(v.literal("donation"), v.literal("kafala")),
    donationId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const bankInfo = await readSystemConfigObject(ctx, "bank_info");
    const adminPhone = typeof bankInfo?.adminPhone === "string" ? bankInfo.adminPhone : undefined;
    if (!adminPhone) return null;

    const settings = await readSystemConfigObject(ctx, "whatsapp_settings");
    const sessionApiKey = typeof settings?.apiKey === "string" ? settings.apiKey : undefined;

    const label = args.type === "kafala" ? "كفالة" : "تبرع";
    const message = `🔔 طلب تحقق جديد\nنوع: ${label}\nيرجى مراجعة صفحة التحقق في لوحة الإدارة.`;
    await sendWhatsAppMessage(adminPhone, message, 0, sessionApiKey);
    return null;
  },
});

export const sendDonationRejectionNotification = action({
  args: {
    userId: v.id("users"),
    donationId: v.id("donations"),
    notes: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { api } = await import("./_generated/api");
    const user = await ctx.runQuery(api.users.getUserById, { userId: args.userId });
    if (!user?.phoneNumber) return null;

    const settings = await readSystemConfigObject(ctx, "whatsapp_settings");
    const sessionApiKey = typeof settings?.apiKey === "string" ? settings.apiKey : undefined;

    const reason = args.notes ? `\nالسبب: ${args.notes}` : "";
    const message = `❌ تبرعك لم يتم قبوله${reason}\nيرجى التواصل معنا أو إعادة إرسال الوصل.`;
    await sendWhatsAppMessage(user.phoneNumber, message, 0, sessionApiKey);
    return null;
  },
});

export const sendKafalaVerificationNotification = action({
  args: {
    userId: v.id("users"),
    kafalaId: v.id("kafala"),
    verified: v.boolean(),
    notes: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { api } = await import("./_generated/api");
    const user = await ctx.runQuery(api.users.getUserById, { userId: args.userId });
    if (!user?.phoneNumber) return null;

    const kafala: any = await ctx.runQuery(api.kafala.getKafalaById, { kafalaId: args.kafalaId });
    const settings = await readSystemConfigObject(ctx, "whatsapp_settings");
    const sessionApiKey = typeof settings?.apiKey === "string" ? settings.apiKey : undefined;

    const name = kafala?.name ?? "اليتيم";
    const message = args.verified
      ? `✅ تم تأكيد كفالتك لـ ${name}. بارك الله فيك!`
      : `❌ لم يتم قبول دفع الكفالة لـ ${name}.${args.notes ? "\nالسبب: " + args.notes : ""}\nيرجى إعادة الإرسال أو التواصل معنا.`;
    await sendWhatsAppMessage(user.phoneNumber, message, 0, sessionApiKey);
    return null;
  },
});

export const notifyAdminNewContact = action({
  args: {
    name: v.string(),
    phone: v.optional(v.string()),
    subject: v.optional(v.string()),
    message: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const bankInfo = await readSystemConfigObject(ctx, "bank_info");
    const adminPhone = typeof bankInfo?.adminPhone === "string" ? bankInfo.adminPhone : undefined;
    if (!adminPhone) return null;

    const settings = await readSystemConfigObject(ctx, "whatsapp_settings");
    const sessionApiKey = typeof settings?.apiKey === "string" ? settings.apiKey : undefined;

    const text = `📩 رسالة جديدة من: ${args.name}${args.phone ? " (" + args.phone + ")" : ""}\nالموضوع: ${args.subject ?? "—"}\n\n${args.message}`;
    await sendWhatsAppMessage(adminPhone, text, 0, sessionApiKey);
    return null;
  },
});

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
    const sevenDaysFromNow = now + 7 * 24 * 60 * 60 * 1000;

    try {
      const { api } = await import("./_generated/api");
      const settings = await readSystemConfigObject(ctx, "whatsapp_settings");
      const sessionApiKey = typeof settings?.apiKey === "string" ? settings.apiKey : undefined;

      const allProjects = await ctx.runQuery(api.projects.getProjects, { status: "active" });
      const closingSoonProjects = allProjects.filter((project) => {
        if (!project.endDate) return false;
        return project.endDate > now && project.endDate <= sevenDaysFromNow;
      });

      if (closingSoonProjects.length === 0) {
        return {
          success: true,
          projectsChecked: 0,
          notificationsSent: 0,
        };
      }

      const users = await ctx.runQuery(api.users.getAllVerifiedUsersWithPhone);
      let notificationsSent = 0;

      for (const project of closingSoonProjects) {
        const daysRemaining = Math.ceil((project.endDate - now) / (24 * 60 * 60 * 1000));
        const projectTitle = project.title.ar;
        let projectImageUrl: string | undefined;
        if (project.mainImage) {
          try {
            const resolved = await ctx.storage.getUrl(project.mainImage as any);
            projectImageUrl = resolved || undefined;
          } catch {}
        }

        const frontendUrl = process.env.FRONTEND_URL || "";
        const projectLink = frontendUrl ? `${frontendUrl}/projects/${project._id}` : "";
        const message =
          `السلام عليكم {name} 👋\n\n` +
          `⏰ تذكير: مشروع "${projectTitle}" ينتهي خلال ${daysRemaining} أيام!\n\n` +
          `ساهم الآن قبل إغلاق المشروع ❤️` +
          (projectLink ? `\n${projectLink}` : ``) +
          `\n\nفريق جمعية الأمل`;

        for (let i = 0; i < users.length; i++) {
          const user = users[i];

          if (i > 0) {
            const randomDelay = Math.floor(Math.random() * (30000 - 2000 + 1)) + 2000;
            await sleep(randomDelay);
          }

          const firstName = user.fullName?.split(" ")[0] || "صديقي";
          const personalizedMessage = message.replace(/{name}/g, firstName);
          const result = await sendWhatsAppMessage(
            user.phoneNumber,
            personalizedMessage,
            0,
            sessionApiKey,
            projectImageUrl
          );

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

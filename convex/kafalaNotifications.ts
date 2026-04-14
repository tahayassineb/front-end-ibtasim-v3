import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

declare const process: {
  env: {
    WASENDER_MASTER_TOKEN?: string;
    FRONTEND_URL?: string;
  };
};

const WASENDER_API_URL = "https://www.wasenderapi.com/api/send-message";

// Days before renewal to send reminders
const REMINDER_DAYS = [10, 5, 3, 1];

function formatPhoneNumber(phone: string): string {
  let formatted = phone.replace(/[\s\-\(\)]/g, "");
  if (!formatted.startsWith("+")) formatted = "+" + formatted;
  return formatted;
}

async function sendWhatsAppMessage(
  to: string,
  text: string,
  token?: string
): Promise<void> {
  if (!token) return;
  const formattedPhone = formatPhoneNumber(to);
  await fetch(WASENDER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ to: formattedPhone, text }),
  });
}

// ============================================
// RENEWAL REMINDER MESSAGES
// ============================================

function buildReminderMessage(
  lang: "ar" | "fr" | "en",
  kafalaName: string,
  daysLeft: number,
  renewalLink: string
): string {
  if (lang === "ar") {
    return `السلام عليكم 🌙\n\nتذكير: كفالتك لـ *${kafalaName}* ستنتهي خلال *${daysLeft} ${daysLeft === 1 ? "يوم" : "أيام"}*.\n\nللتجديد وتحميل وصل الدفع، الرجاء الضغط على الرابط أدناه:\n${renewalLink}\n\nجزاكم الله خيراً على هذا العمل الصالح 🤲`;
  }
  if (lang === "fr") {
    return `Salam Aleykoum 🌙\n\nRappel: Votre kafala pour *${kafalaName}* expire dans *${daysLeft} jour${daysLeft > 1 ? "s" : ""}*.\n\nPour renouveler et télécharger votre reçu:\n${renewalLink}\n\nJazak Allah Khayran 🤲`;
  }
  return `As-salamu alaykum 🌙\n\nReminder: Your kafala for *${kafalaName}* expires in *${daysLeft} day${daysLeft > 1 ? "s" : ""}*.\n\nTo renew and upload your receipt:\n${renewalLink}\n\nJazak Allah Khayran 🤲`;
}

// ============================================
// CRON ACTION — run daily
// ============================================

/**
 * Sends WhatsApp renewal reminders to bank/cash kafala sponsors
 * whose nextRenewalDate is 10, 5, 3, or 1 day(s) away.
 * Card (Whop subscription) sponsors are excluded — Whop handles auto-billing.
 */
export const sendKafalaRenewalReminders = action({
  args: {},
  handler: async (ctx) => {
    const frontendUrl = process.env.FRONTEND_URL || "";

    // Get session API key from whatsapp_settings config
    let apiKey: string | undefined;
    try {
      const rawSettings: string | null = await ctx.runQuery(
        api.config.getConfig,
        { key: "whatsapp_settings" }
      );
      if (rawSettings) {
        const settings = JSON.parse(rawSettings);
        if (settings.apiKey) apiKey = settings.apiKey;
      }
    } catch (e) {
      console.error("Could not read whatsapp_settings:", e);
    }

    if (!apiKey) {
      console.warn("KafalaRenewalReminders: no WhatsApp API key configured, skipping.");
      return;
    }

    // Fetch all active non-Whop sponsorships
    const sponsorships: any[] = await ctx.runQuery(
      api.kafala.getActiveBankCashSponsorships,
      {}
    );

    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    let sent = 0;
    for (const s of sponsorships) {
      const msUntilRenewal = s.nextRenewalDate - now;
      const daysUntilRenewal = Math.round(msUntilRenewal / dayMs);

      if (!REMINDER_DAYS.includes(daysUntilRenewal)) continue;

      const kafala: any = await ctx.runQuery(api.kafala.getKafalaById, {
        kafalaId: s.kafalaId,
      });
      if (!kafala) continue;

      const user: any = await ctx.runQuery(api.users.getUserById, {
        userId: s.userId,
      });
      if (!user?.phoneNumber) continue;

      const lang: "ar" | "fr" | "en" = user.preferredLanguage || "ar";
      const renewalLink = `${frontendUrl}/kafala/${s.kafalaId}/renew`;
      const message = buildReminderMessage(lang, kafala.name, daysUntilRenewal, renewalLink);

      await sendWhatsAppMessage(user.phoneNumber, message, apiKey);

      // Rate limit: 250ms between messages
      await new Promise((r) => setTimeout(r, 250));
      sent++;
    }

    console.log(`KafalaRenewalReminders: sent ${sent} reminder(s).`);
  },
});

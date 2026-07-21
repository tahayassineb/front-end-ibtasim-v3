import { action } from "./_generated/server";
import { api, internal } from "./_generated/api";

declare const process: {
  env: {
    FRONTEND_URL?: string;
  };
};

// ============================================
// DAY-BUCKET MATH
// ============================================

/**
 * Map a number of days remaining until renewal to the reminder bucket key
 * that should be sent for that distance. Returns `null` if the value falls
 * outside any reminder window (e.g. >10 days away, or already overdue —
 * overdue is handled separately by the catch-up path).
 */
function bucketFor(daysLeft: number): number | null {
  if (daysLeft <= 1 && daysLeft >= 0) return 1;
  if (daysLeft <= 3 && daysLeft > 1) return 3;
  if (daysLeft <= 5 && daysLeft > 3) return 5;
  if (daysLeft <= 10 && daysLeft > 5) return 10;
  return null;
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

/**
 * Overdue reminder — sent once when the renewal date has already passed.
 */
function buildOverdueMessage(
  lang: "ar" | "fr" | "en",
  kafalaName: string,
  renewalLink: string
): string {
  if (lang === "ar") {
    return `السلام عليكم 🌙\n\nكفالتك لـ *${kafalaName}* متأخرة. للتجديد:\n${renewalLink}\n\nجزاكم الله خيراً 🤲`;
  }
  if (lang === "fr") {
    return `Salam Aleykoum 🌙\n\nVotre kafala pour *${kafalaName}* est en retard. Pour renouveler:\n${renewalLink}\n\nJazak Allah Khayran 🤲`;
  }
  return `As-salamu alaykum 🌙\n\nYour kafala for *${kafalaName}* is overdue. To renew:\n${renewalLink}\n\nJazak Allah Khayran 🤲`;
}

// ============================================
// CRON ACTION — run daily
// ============================================

/**
 * Sends WhatsApp renewal reminders to bank/cash kafala sponsors
 * whose nextRenewalDate is approaching (10, 5, 3, 1 days) or has already
 * passed (overdue catch-up). Card (Whop subscription) sponsors are excluded —
 * Whop handles auto-billing.
 */
export const sendKafalaRenewalReminders = action({
  args: {},
  handler: async (ctx) => {
    const frontendUrl = process.env.FRONTEND_URL || "";

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

      const remindersSent: string[] = s.remindersSent ?? [];

      let reminderKey: string | null = null;
      let message: string | null = null;

      const bucket = bucketFor(daysUntilRenewal);

      if (bucket !== null) {
        const keyStr = String(bucket);
        if (remindersSent.includes(keyStr)) continue;
        reminderKey = keyStr;
      } else if (daysUntilRenewal < 0) {
        // Catch-up: overdue — send once
        if (remindersSent.includes("overdue")) continue;
        reminderKey = "overdue";
      } else {
        // Outside any window (e.g. >10 days away) — nothing to do
        continue;
      }

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

      if (reminderKey === "overdue") {
        message = buildOverdueMessage(lang, kafala.name, renewalLink);
      } else {
        message = buildReminderMessage(lang, kafala.name, daysUntilRenewal, renewalLink);
      }

      // Send via central WhatsApp action (gives unified failure visibility)
      await ctx.runAction(internal.notifications.sendWhatsAppInternal, {
        to: user.phoneNumber,
        text: message,
      });

      // Record that this reminder level was sent
      await ctx.runMutation(api.kafala.markReminderSent, {
        sponsorshipId: s._id,
        reminderKey,
      });

      // Rate limit: 250ms between messages
      await new Promise((r) => setTimeout(r, 250));
      sent++;
    }

    console.log(`KafalaRenewalReminders: sent ${sent} reminder(s).`);
  },
});

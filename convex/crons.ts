import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

// ============================================
// CRON JOBS
// ============================================

const crons = cronJobs();

// Daily at 9:00 AM UTC — send notifications for projects closing within 7 days
crons.daily(
  "checkClosingSoonProjects",
  { hourUTC: 9, minuteUTC: 0 },
  api.notifications.sendProjectClosingSoonNotifications,
  {}
);

// Daily at 7:00 AM UTC — send WhatsApp renewal reminders for bank/cash kafala sponsors
crons.daily(
  "kafalaRenewalReminders",
  { hourUTC: 7, minuteUTC: 0 },
  api.kafalaNotifications.sendKafalaRenewalReminders,
  {}
);

// Daily at 8:00 AM UTC — expire overdue bank/cash sponsorships (3-day grace period)
crons.daily(
  "expireOverdueSponsorships",
  { hourUTC: 8, minuteUTC: 0 },
  api.kafalaExpiry.expireOverdueSponsorships,
  {}
);

// Auto-refresh disabled: QR is only fetched when the user explicitly clicks "Connect/Reconnect".
// crons.interval(
//   "autoRefreshWhatsAppQr",
//   { minutes: 1 },
//   api.whatsapp.autoRefreshQrIfNeeded,
//   {}
// );

export default crons;

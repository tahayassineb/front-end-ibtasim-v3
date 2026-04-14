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

// Auto-refresh disabled: QR is only fetched when the user explicitly clicks "Connect/Reconnect".
// crons.interval(
//   "autoRefreshWhatsAppQr",
//   { minutes: 1 },
//   api.whatsapp.autoRefreshQrIfNeeded,
//   {}
// );

export default crons;

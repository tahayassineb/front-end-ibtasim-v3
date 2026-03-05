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

// Every minute — refresh WhatsApp QR code if a session exists but is not yet connected.
// The new QR is stored in Convex DB; the frontend picks it up automatically via real-time queries.
crons.interval(
  "autoRefreshWhatsAppQr",
  { minutes: 1 },
  api.whatsapp.autoRefreshQrIfNeeded,
  {}
);

export default crons;

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

export default crons;

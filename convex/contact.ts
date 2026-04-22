import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const submitContactMessage = mutation({
  args: {
    name: v.string(),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    subject: v.optional(v.string()),
    message: v.string(),
  },
  returns: v.id("contactMessages"),
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("contactMessages", {
      ...args,
      status: "new",
      createdAt: Date.now(),
    });

    try {
      await ctx.scheduler.runAfter(0, api.notifications.notifyAdminNewContact, {
        name: args.name,
        phone: args.phone,
        subject: args.subject,
        message: args.message,
      });
    } catch (e) { console.error("Contact notification failed:", e); }

    return id;
  },
});

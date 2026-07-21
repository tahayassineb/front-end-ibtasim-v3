import { mutation } from "./_generated/server";
import { v } from "convex/values";

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

    return await ctx.db.insert("notifications", {
      userId: args.userId,
      type: args.type,
      channel: args.channel,
      status: args.status,
      content: args.content,
      createdAt: now,
      sentAt: args.status === "sent" ? now : undefined,
      errorMessage: args.errorMessage,
    });
  },
});

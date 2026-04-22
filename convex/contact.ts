import { mutation, query } from "./_generated/server";
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

export const getContactStats = query({
  args: {},
  returns: v.object({
    new: v.number(),
    read: v.number(),
    replied: v.number(),
    total: v.number(),
  }),
  handler: async (ctx) => {
    const messages = await ctx.db.query("contactMessages").collect();
    return {
      new: messages.filter((m) => m.status === "new").length,
      read: messages.filter((m) => m.status === "read").length,
      replied: messages.filter((m) => m.status === "replied").length,
      total: messages.length,
    };
  },
});

export const getContactMessages = query({
  args: {
    status: v.optional(v.union(v.literal("new"), v.literal("read"), v.literal("replied"))),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    _id: v.id("contactMessages"),
    _creationTime: v.number(),
    name: v.string(),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    subject: v.optional(v.string()),
    message: v.string(),
    status: v.union(v.literal("new"), v.literal("read"), v.literal("replied")),
    createdAt: v.number(),
  })),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;
    const messages = args.status
      ? await ctx.db
          .query("contactMessages")
          .withIndex("by_status", (q) => q.eq("status", args.status!))
          .order("desc")
          .take(limit)
      : await ctx.db.query("contactMessages").order("desc").take(limit);

    return messages.map((m) => ({
      _id: m._id,
      _creationTime: m._creationTime,
      name: m.name,
      phone: m.phone,
      email: m.email,
      subject: m.subject,
      message: m.message,
      status: m.status,
      createdAt: m.createdAt,
    }));
  },
});

export const updateContactStatus = mutation({
  args: {
    messageId: v.id("contactMessages"),
    status: v.union(v.literal("new"), v.literal("read"), v.literal("replied")),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.messageId, { status: args.status });
    return true;
  },
});

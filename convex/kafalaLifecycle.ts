import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get all active bank/cash sponsorships (used by renewal reminder cron).
 * Excludes card_whop sponsorships (Whop handles auto-billing).
 */
export const getActiveBankCashSponsorships = query({
  args: {},
  handler: async (ctx) => {
    const active = await ctx.db
      .query("kafalaSponsorship")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();
    return active.filter((s) => s.paymentMethod !== "card_whop");
  },
});

/**
 * Expire a sponsorship and re-open the kafala slot.
 */
export const expireSponsorship = mutation({
  args: { sponsorshipId: v.id("kafalaSponsorship") },
  handler: async (ctx, args) => {
    const s = await ctx.db.get(args.sponsorshipId);
    if (!s || s.status !== "active") return;
    const now = Date.now();
    await ctx.db.patch(args.sponsorshipId, { status: "expired", updatedAt: now });
    await ctx.db.patch(s.kafalaId, { status: "active", updatedAt: now });
  },
});

/**
 * Expire an active sponsorship by its Whop subscription ID.
 */
export const expireSponsorshipBySubscriptionId = internalMutation({
  args: { whopSubscriptionId: v.string() },
  handler: async (ctx, args) => {
    const sponsorship = await ctx.db
      .query("kafalaSponsorship")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .filter((q) => q.eq(q.field("whopSubscriptionId"), args.whopSubscriptionId))
      .first();
    if (!sponsorship) return;
    const now = Date.now();
    await ctx.db.patch(sponsorship._id, { status: "expired", updatedAt: now });
    await ctx.db.patch(sponsorship.kafalaId, { status: "active", updatedAt: now });
  },
});

/**
 * Get active bank/cash sponsorships whose nextRenewalDate is before the given cutoff.
 */
export const getOverdueBankCashSponsorships = query({
  args: { cutoff: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("kafalaSponsorship")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .filter((q) =>
        q.and(
          q.neq(q.field("paymentMethod"), "card_whop"),
          q.lt(q.field("nextRenewalDate"), args.cutoff)
        )
      )
      .collect();
  },
});

/**
 * Record that a reminder at a given level has been sent for this sponsorship.
 */
export const markReminderSent = mutation({
  args: { sponsorshipId: v.id("kafalaSponsorship"), reminderKey: v.string() },
  handler: async (ctx, args) => {
    const s = await ctx.db.get(args.sponsorshipId);
    if (!s) return;
    const existing = s.remindersSent ?? [];
    if (existing.includes(args.reminderKey)) return;
    await ctx.db.patch(args.sponsorshipId, {
      remindersSent: [...existing, args.reminderKey],
      updatedAt: Date.now(),
    });
  },
});

/**
 * Mark a sponsorship as having a pending cancel request that failed at Whop.
 */
export const markSponsorshipCancelPending = mutation({
  args: { sponsorshipId: v.id("kafalaSponsorship") },
  handler: async (ctx, args) => {
    const s = await ctx.db.get(args.sponsorshipId);
    if (!s) return;
    await ctx.db.patch(args.sponsorshipId, { cancelPending: true, updatedAt: Date.now() });
  },
});

/**
 * Clear the cancelPending flag on a sponsorship after a successful retry.
 */
export const clearSponsorshipCancelPending = mutation({
  args: { sponsorshipId: v.id("kafalaSponsorship") },
  handler: async (ctx, args) => {
    const s = await ctx.db.get(args.sponsorshipId);
    if (!s) return;
    await ctx.db.patch(args.sponsorshipId, { cancelPending: false, updatedAt: Date.now() });
  },
});

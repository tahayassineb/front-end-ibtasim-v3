import { action } from "./_generated/server";
import { api } from "./_generated/api";

/**
 * Expires overdue bank/cash kafala sponsorships.
 * Run daily — applies a 3-day grace period beyond the nextRenewalDate.
 * Card (Whop) sponsorships are excluded; Whop handles those via membership.cancelled webhook.
 */
export const expireOverdueSponsorships = action({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const gracePeriod = 3 * 24 * 60 * 60 * 1000; // 3 days
    const cutoff = now - gracePeriod;

    const overdue: any[] = await ctx.runQuery(
      api.kafala.getOverdueBankCashSponsorships,
      { cutoff }
    );

    let expired = 0;
    for (const s of overdue) {
      await ctx.runMutation(api.kafala.expireSponsorship, { sponsorshipId: s._id });
      expired++;
    }

    console.log(`expireOverdueSponsorships: expired ${expired} sponsorship(s).`);
  },
});

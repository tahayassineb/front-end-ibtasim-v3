import { action } from "./_generated/server";
import { v } from "convex/values";

// ============================================
// WHOP PAYMENT INTEGRATION
// Creates a checkout session and returns the purchase URL
// ============================================

export const createWhopCheckout = action({
  args: {
    donationId: v.id("donations"),
    amountMAD: v.number(), // Amount in MAD (not cents)
  },
  returns: v.object({
    purchaseUrl: v.string(),
  }),
  handler: async (_ctx, args) => {
    const apiKey = process.env.WHOP_API_KEY;
    const productId = process.env.WHOP_PRODUCT_ID;
    const siteUrl = process.env.CONVEX_SITE_URL ?? "";

    if (!apiKey || !productId) {
      throw new Error("Whop API credentials not configured. Set WHOP_API_KEY and WHOP_PRODUCT_ID in Convex environment variables.");
    }

    // Whop uses cents for amount
    const amountCents = Math.round(args.amountMAD * 100);

    const response = await fetch("https://api.whop.com/api/v2/checkout_sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        price: {
          product_id: productId,
          initial_price: amountCents,
          plan_type: "one_time",
          currency: "usd",
        },
        redirect_url: `${siteUrl}/donate/success`,
        metadata: {
          donationId: args.donationId,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.message ?? `Whop checkout failed: ${response.status}`);
    }

    if (!data.purchase_url) {
      throw new Error("No purchase_url in Whop response");
    }

    return { purchaseUrl: data.purchase_url };
  },
});

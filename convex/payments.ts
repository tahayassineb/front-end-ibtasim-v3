import { action } from "./_generated/server";
import { v } from "convex/values";

declare const process: {
  env: {
    WHOP_API_KEY?: string;
    WHOP_COMPANY_ID?: string;
    WHOP_PRODUCT_ID?: string;
    CONVEX_SITE_URL?: string;
  };
};

// ============================================
// WHOP PAYMENT INTEGRATION
// Creates a checkout session and returns the purchase URL
// ============================================

export const createWhopCheckout = action({
  args: {
    donationId: v.id("donations"),
    amountMAD: v.number(), // Amount in MAD
  },
  returns: v.object({
    purchaseUrl: v.string(),
  }),
  handler: async (_ctx, args) => {
    const apiKey = process.env.WHOP_API_KEY;
    const companyId = process.env.WHOP_COMPANY_ID;
    const productId = process.env.WHOP_PRODUCT_ID;
    const siteUrl = process.env.CONVEX_SITE_URL ?? "";

    if (!apiKey || !companyId) {
      throw new Error("Whop API credentials not configured. Set WHOP_API_KEY and WHOP_COMPANY_ID in Convex environment variables.");
    }

    // Whop uses minor currency units (centimes for MAD: 1 MAD = 100 centimes)
    const amountCentimes = Math.round(args.amountMAD * 100);

    const response = await fetch("https://api.whop.com/api/v1/checkout_configurations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        plan: {
          company_id: companyId,
          product_id: productId || undefined,
          initial_price: amountCentimes,
          plan_type: "one_time",
          currency: "mad",
          visibility: "hidden",
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

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// ============================================
// WHOP API CONFIGURATION
// ============================================

declare const process: {
  env: {
    WHOP_API_KEY?: string;
    WHOP_COMPANY_ID?: string;
    WHOP_PRODUCT_ID?: string;
    CONVEX_SITE_URL?: string;
    FRONTEND_URL?: string;
  };
};

const WHOP_API_BASE = "https://api.whop.com";
const DEFAULT_PRODUCT_ID = "prod_1khGq1pY0YRXM";
const DEFAULT_COMPANY_ID = "biz_bMROFFVg1qyi39";

// ============================================
// CREATE KAFALA WHOP SUBSCRIPTION CHECKOUT
// ============================================

/**
 * Create a monthly recurring Whop checkout for kafala sponsorship.
 * Returns the purchase_url to redirect the donor to Whop.
 *
 * Flow:
 * 1. Fetch kafala to get monthlyPrice
 * 2. Create a hidden recurring plan (billing_period: 30 days, stock: 1)
 * 3. Create a checkout session with metadata { kafalaId, donationId, type: "kafala" }
 * 4. Return purchase_url
 */
export const createKafalaWhopCheckout = action({
  args: {
    kafalaId: v.id("kafala"),
    donationId: v.id("kafalaDonations"),
  },
  handler: async (ctx, args): Promise<string> => {
    const apiKey = process.env.WHOP_API_KEY;
    const companyId = process.env.WHOP_COMPANY_ID || DEFAULT_COMPANY_ID;
    const productId = process.env.WHOP_PRODUCT_ID || DEFAULT_PRODUCT_ID;
    const siteUrl = process.env.CONVEX_SITE_URL || "";

    if (!apiKey) throw new Error("WHOP_API_KEY not configured");

    // Fetch kafala profile
    const kafala: any = await ctx.runQuery(api.kafala.getKafalaById, {
      kafalaId: args.kafalaId,
    });
    if (!kafala) throw new Error("الكفالة غير موجودة");

    // monthlyPrice is in cents — Whop initial_price is actual MAD amount
    const priceInMAD = Math.round(kafala.monthlyPrice / 100);

    // Step 1: Create a hidden recurring plan (stock: 1 so only one person can subscribe)
    const planRes = await fetch(`${WHOP_API_BASE}/api/v2/plans`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        company_id: companyId,
        access_pass_id: productId,
        initial_price: priceInMAD,
        base_currency: "mad",
        plan_type: "recurring",
        billing_period: 30,
        visibility: "hidden",
        unlimited_stock: false,
        stock: 1,
      }),
    });

    if (!planRes.ok) {
      const errBody = await planRes.text();
      throw new Error(`Failed to create Whop plan: ${planRes.status} — ${errBody}`);
    }

    const planData = await planRes.json();
    const planId: string = planData.id;
    if (!planId) throw new Error("Whop plan creation returned no plan ID");

    // Step 2: Create checkout session
    const redirectUrl = `${siteUrl}/kafala/success`;
    const checkoutRes = await fetch(`${WHOP_API_BASE}/api/v2/checkout_sessions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        plan_id: planId,
        redirect_url: redirectUrl,
        metadata: {
          kafalaId: args.kafalaId,
          donationId: args.donationId,
          type: "kafala",
        },
      }),
    });

    if (!checkoutRes.ok) {
      const errBody = await checkoutRes.text();
      throw new Error(
        `Failed to create Whop checkout session: ${checkoutRes.status} — ${errBody}`
      );
    }

    const checkoutData = await checkoutRes.json();
    const purchaseUrl: string = checkoutData.purchase_url;
    if (!purchaseUrl) throw new Error("Whop checkout returned no purchase_url");

    return purchaseUrl;
  },
});

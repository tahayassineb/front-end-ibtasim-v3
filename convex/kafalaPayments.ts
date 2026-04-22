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

// Fallback MAD→USD rate (Morocco has a managed peg, fairly stable)
const FALLBACK_MAD_TO_USD = 0.0991; // 1 MAD ≈ $0.099

// ============================================
// CREATE KAFALA WHOP SUBSCRIPTION CHECKOUT
// ============================================

/**
 * Create a monthly recurring Whop checkout for kafala sponsorship.
 * Returns the purchase_url to redirect the donor to Whop.
 *
 * Currency logic:
 * - Morocco (MA) or unknown: price in MAD
 * - Other countries: price converted MAD→USD via live exchange rate API
 */
export const createKafalaWhopCheckout = action({
  args: {
    kafalaId: v.id("kafala"),
    donationId: v.id("kafalaDonations"),
    userCountry: v.optional(v.string()),
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

    // monthlyPrice is in cents → convert to actual MAD amount
    const priceInMAD = Math.round(kafala.monthlyPrice / 100);

    // ── Determine currency and amount ────────────────────────────────────────
    const isMorocco = !args.userCountry || args.userCountry === "MA";

    let planCurrency: string;
    let renewalPrice: number;

    if (isMorocco) {
      planCurrency = "mad";
      renewalPrice = priceInMAD;
    } else {
      planCurrency = "usd";
      let madToUsd = FALLBACK_MAD_TO_USD;
      try {
        const rateRes = await fetch("https://api.exchangerate-api.com/v4/latest/MAD");
        if (rateRes.ok) {
          const rateData = await rateRes.json();
          if (rateData?.rates?.USD) madToUsd = rateData.rates.USD;
        }
      } catch { /* use fallback */ }
      renewalPrice = Math.round(priceInMAD * madToUsd * 100) / 100;
    }

    // ── Step 1: Create hidden recurring plan ─────────────────────────────────
    // Uses product_id (renewal plans) + base_currency (raw Whop v2 field).
    // Only renewal_price — no initial_price — so day-1 charge = one month only.
    const planBody = {
      company_id: companyId,
      product_id: productId,
      plan_type: "renewal",
      billing_period: 30,
      renewal_price: renewalPrice,
      base_currency: planCurrency,
      visibility: "hidden",
      unlimited_stock: true,
    };

    const planRes = await fetch(`${WHOP_API_BASE}/api/v2/plans`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(planBody),
    });

    if (!planRes.ok) {
      const errBody = await planRes.text();
      // Log the exact Whop error for debugging
      try {
        await ctx.runMutation(api.errorLogs.insertErrorLog, {
          source: "kafala_whop_plan",
          level: "error",
          message: `Whop plan creation failed: HTTP ${planRes.status}`,
          apiUrl: `${WHOP_API_BASE}/api/v2/plans`,
          apiStatus: planRes.status,
          apiResponse: errBody.slice(0, 2000),
          details: JSON.stringify({ planBody, userCountry: args.userCountry }),
        });
      } catch {}
      throw new Error(`فشل إنشاء خطة الدفع: ${planRes.status} — ${errBody.slice(0, 200)}`);
    }

    const planData = await planRes.json();
    const planId: string = planData.id;
    if (!planId) throw new Error("Whop plan creation returned no plan ID");

    // ── Step 2: Create checkout session ─────────────────────────────────────
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
      try {
        await ctx.runMutation(api.errorLogs.insertErrorLog, {
          source: "kafala_whop_checkout",
          level: "error",
          message: `Whop checkout session failed: HTTP ${checkoutRes.status}`,
          apiUrl: `${WHOP_API_BASE}/api/v2/checkout_sessions`,
          apiStatus: checkoutRes.status,
          apiResponse: errBody.slice(0, 2000),
          details: JSON.stringify({ planId, userCountry: args.userCountry }),
        });
      } catch {}
      throw new Error(
        `فشل إنشاء جلسة الدفع: ${checkoutRes.status} — ${errBody.slice(0, 200)}`
      );
    }

    const checkoutData = await checkoutRes.json();
    const purchaseUrl: string = checkoutData.purchase_url;
    if (!purchaseUrl) throw new Error("Whop checkout returned no purchase_url");

    return purchaseUrl;
  },
});

// ============================================
// CANCEL KAFALA SUBSCRIPTION
// ============================================

/**
 * Cancel an active kafala sponsorship.
 * For card_whop: calls Whop API to void the subscription first.
 * For bank/cash: marks expired immediately.
 * Returns { success, error }.
 */
export const cancelKafalaSubscription = action({
  args: {
    sponsorshipId: v.id("kafalaSponsorship"),
  },
  returns: v.object({ success: v.boolean(), error: v.optional(v.string()) }),
  handler: async (ctx, args): Promise<{ success: boolean; error?: string }> => {
    const sponsorship: any = await ctx.runQuery(api.kafala.getSponsorshipById, {
      sponsorshipId: args.sponsorshipId,
    });
    if (!sponsorship) return { success: false, error: "الكفالة غير موجودة" };

    // For card_whop — cancel Whop subscription first
    if (sponsorship.paymentMethod === "card_whop" && sponsorship.whopSubscriptionId) {
      const apiKey = process.env.WHOP_API_KEY;
      if (!apiKey) return { success: false, error: "WHOP_API_KEY not configured" };

      const res = await fetch(
        `${WHOP_API_BASE}/api/v2/memberships/${sponsorship.whopSubscriptionId}/cancel`,
        { method: "POST", headers: { Authorization: `Bearer ${apiKey}` } }
      );
      if (!res.ok) {
        const body = await res.text();
        console.error("Whop cancel failed:", res.status, body);
        return { success: false, error: `Whop cancel failed: HTTP ${res.status}` };
      }
    }

    // Mark expired in DB regardless of payment method
    await ctx.runMutation(api.kafala.expireSponsorship, { sponsorshipId: args.sponsorshipId });
    return { success: true };
  },
});

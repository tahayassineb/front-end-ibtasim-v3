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
    plan: v.union(v.literal("monthly"), v.literal("annual")),
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

    const priceInMAD = kafala.monthlyPrice;
    const isAnnual = args.plan === "annual";
    // For annual: NO discount — straight 12x monthly price (kafala, not a product).
    const periodMultiplier = isAnnual ? 12 : 1;
    const billingPeriodDays = isAnnual ? 365 : 30;
    const periodPriceMAD = priceInMAD * periodMultiplier;

    // ── Determine currency and amount ────────────────────────────────────────
    const isMorocco = !args.userCountry || args.userCountry === "MA";

    let planCurrency: string;
    let renewalPrice: number;

    if (isMorocco) {
      planCurrency = "mad";
      renewalPrice = periodPriceMAD;
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
      renewalPrice = Math.round(periodPriceMAD * madToUsd * 100) / 100;
    }

    // ── Step 1: Create hidden recurring plan ─────────────────────────────────
    // Uses product_id (renewal plans) + base_currency (raw Whop v2 field).
    // Only renewal_price — no initial_price — so day-1 charge = one period only.
    const planBody = {
      company_id: companyId,
      product_id: productId,
      plan_type: "renewal",
      billing_period: billingPeriodDays,
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
          plan: args.plan,
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

export const startKafalaCheckout = action({
  args: {
    kafalaId: v.id("kafala"),
    donationId: v.id("kafalaDonations"),
    userCountry: v.optional(v.string()),
    plan: v.union(v.literal("monthly"), v.literal("annual")),
    provider: v.optional(v.literal("whop")),
  },
  returns: v.object({
    provider: v.literal("whop"),
    purchaseUrl: v.string(),
  }),
  handler: async (ctx, args) => {
    const purchaseUrl = await ctx.runAction(api.kafalaPayments.createKafalaWhopCheckout, args);
    return { provider: "whop", purchaseUrl };
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
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
    retryable: v.optional(v.boolean()),
  }),
  handler: async (
    ctx,
    args
  ): Promise<{ success: boolean; error?: string; retryable?: boolean }> => {
    const sponsorship: any = await ctx.runQuery(api.kafala.getSponsorshipById, {
      sponsorshipId: args.sponsorshipId,
    });
    if (!sponsorship) return { success: false, error: "الكفالة غير موجودة" };

    // For card_whop — cancel Whop subscription first
    if (sponsorship.paymentMethod === "card_whop" && sponsorship.whopSubscriptionId) {
      const apiKey = process.env.WHOP_API_KEY;
      if (!apiKey) return { success: false, error: "WHOP_API_KEY not configured" };

      let res: Response;
      try {
        res = await fetch(
          `${WHOP_API_BASE}/api/v2/memberships/${sponsorship.whopSubscriptionId}/cancel`,
          { method: "POST", headers: { Authorization: `Bearer ${apiKey}` } }
        );
      } catch (e: any) {
        // Network error — DO NOT flip DB. Mark cancelPending so it can be retried.
        console.error("Whop cancel network error:", e);
        await ctx.runMutation(api.kafala.markSponsorshipCancelPending, {
          sponsorshipId: args.sponsorshipId,
        });
        return {
          success: false,
          error: `Whop cancel network error: ${e?.message ?? "unknown"}`,
          retryable: true,
        };
      }

      if (res.status === 404) {
        // Already cancelled / membership not found on Whop side — safe to flip DB.
        await ctx.runMutation(api.kafala.expireSponsorship, {
          sponsorshipId: args.sponsorshipId,
        });
        return { success: true };
      }

      if (!res.ok) {
        const body = await res.text();
        console.error("Whop cancel failed:", res.status, body);
        // Non-OK and non-404 — flag for retry, leave DB untouched.
        await ctx.runMutation(api.kafala.markSponsorshipCancelPending, {
          sponsorshipId: args.sponsorshipId,
        });
        return {
          success: false,
          error: `Whop cancel failed: HTTP ${res.status}`,
          retryable: true,
        };
      }

      // Whop cancel succeeded — clear cancelPending if it was set, then flip DB.
      if (sponsorship.cancelPending) {
        await ctx.runMutation(api.kafala.clearSponsorshipCancelPending, {
          sponsorshipId: args.sponsorshipId,
        });
      }
    }

    // Bank/cash path or successful Whop cancel — expire in DB.
    await ctx.runMutation(api.kafala.expireSponsorship, { sponsorshipId: args.sponsorshipId });
    return { success: true };
  },
});

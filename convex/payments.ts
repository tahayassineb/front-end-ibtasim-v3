import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

declare const process: {
  env: {
    WHOP_API_KEY?: string;
    WHOP_COMPANY_ID?: string;
    WHOP_PRODUCT_ID?: string;
    CONVEX_SITE_URL?: string;
    FRONTEND_URL?: string;
  };
};

// Whop v1 API — these endpoints work with standard API keys
// (v2/checkout_configurations requires special scopes that most keys don't have)
const WHOP_PLANS_URL      = "https://api.whop.com/api/v2/plans";
const WHOP_CHECKOUT_URL   = "https://api.whop.com/api/v2/checkout_sessions";

// ============================================
// Pre-created hidden plans in MAD (stable IDs, created once)
// Using pre-created plans avoids creating a new plan on every checkout
// for the common donation amounts.
// ============================================
const PRESET_PLAN_IDS: Record<number, string> = {
  200:  "plan_FX2nfOyGnmaCf",
  500:  "plan_KCTR7FdaRv4rv",
  1000: "plan_6Ed3nRvJGJ8cO",
};

// Extract a readable error string from any Whop API error shape
function extractWhopError(data: any, status: number): string {
  if (typeof data?.message === "string") return data.message;
  if (typeof data?.error === "string") return data.error;
  if (typeof data?.error?.message === "string") return data.error.message;
  if (Array.isArray(data?.errors) && typeof data.errors[0]?.message === "string")
    return data.errors[0].message;
  return `Whop API failed with HTTP ${status}`;
}

// ============================================
// WHOP PAYMENT INTEGRATION
// 1. For preset amounts (200/500/1000 MAD): use pre-created plan_id directly
// 2. For custom amounts: create a new hidden plan first, then create checkout session
// Both paths use /api/v2/checkout_sessions which works with standard API keys.
// ============================================

export const createWhopCheckout = action({
  args: {
    donationId: v.id("donations"),
    amountMAD: v.number(),
  },
  returns: v.object({
    purchaseUrl: v.string(),
  }),
  handler: async (ctx, args) => {
    const apiKey = process.env.WHOP_API_KEY;
    const companyId = process.env.WHOP_COMPANY_ID;
    const productId = process.env.WHOP_PRODUCT_ID ?? "prod_1khGq1pY0YRXM";
    const siteUrl =
      process.env.FRONTEND_URL ??
      process.env.CONVEX_SITE_URL ??
      "";

    if (!apiKey || !companyId) {
      const msg =
        "Whop API credentials not configured. Set WHOP_API_KEY and WHOP_COMPANY_ID in Convex environment variables.";
      console.error("[payments]", msg);
      try {
        await ctx.runMutation(api.errorLogs.insertErrorLog, {
          source: "payments", level: "error", message: msg,
          details: JSON.stringify({ donationId: args.donationId }),
        });
      } catch {}
      throw new Error(msg);
    }

    const redirectUrl = siteUrl ? `${siteUrl}/donate/success` : undefined;

    // ── Step 1: Get or create a plan ─────────────────────────────────────
    let planId: string;

    const presetPlanId = PRESET_PLAN_IDS[args.amountMAD];
    if (presetPlanId) {
      // Use pre-created plan for common amounts (200/500/1000 MAD)
      planId = presetPlanId;
      console.log("[payments] Using preset plan", planId, "for", args.amountMAD, "MAD");
    } else {
      // Custom amount — create a new hidden one-time plan
      console.log("[payments] Creating plan for custom amount:", args.amountMAD, "MAD");
      let planRes: Response;
      let planText: string;
      let planData: any;
      try {
        planRes = await fetch(WHOP_PLANS_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            company_id: companyId,
            access_pass_id: productId,
            initial_price: args.amountMAD,
            base_currency: "mad",
            plan_type: "one_time",
            visibility: "hidden",
            unlimited_stock: true,
          }),
        });
        planText = await planRes.text();
        try { planData = JSON.parse(planText); } catch { planData = { raw: planText }; }
      } catch (err: any) {
        const msg = `Network error creating Whop plan: ${err.message ?? String(err)}`;
        console.error("[payments]", msg);
        await ctx.runMutation(api.errorLogs.insertErrorLog, {
          source: "payments", level: "error", message: msg,
          details: JSON.stringify({ donationId: args.donationId, amountMAD: args.amountMAD }),
          apiUrl: WHOP_PLANS_URL, donationId: args.donationId,
        }).catch(() => {});
        throw new Error(msg);
      }

      if (!planRes.ok || !planData?.id) {
        const errorMsg = extractWhopError(planData, planRes.status);
        console.error("[payments] Plan creation failed:", errorMsg, planText);
        await ctx.runMutation(api.errorLogs.insertErrorLog, {
          source: "payments", level: "error",
          message: `Whop plan creation error: ${errorMsg}`,
          details: JSON.stringify({ donationId: args.donationId, amountMAD: args.amountMAD }),
          apiUrl: WHOP_PLANS_URL, apiStatus: planRes.status,
          apiResponse: planText.slice(0, 4000), donationId: args.donationId,
        }).catch(() => {});
        throw new Error(`Whop plan creation error: ${errorMsg}`);
      }

      planId = planData.id;
      await ctx.runMutation(api.errorLogs.insertErrorLog, {
        source: "payments", level: "info",
        message: `Whop plan created: ${planId} for ${args.amountMAD} MAD`,
        apiUrl: WHOP_PLANS_URL, apiStatus: planRes.status,
        apiResponse: planText.slice(0, 2000), donationId: args.donationId,
      }).catch(() => {});
    }

    // ── Step 2: Create checkout session ──────────────────────────────────
    console.log("[payments] Creating checkout session, plan:", planId, "donationId:", args.donationId);

    let checkoutRes: Response;
    let checkoutText: string;
    let checkoutData: any;

    try {
      checkoutRes = await fetch(WHOP_CHECKOUT_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan_id: planId,
          redirect_url: redirectUrl,
          metadata: { donationId: args.donationId },
        }),
      });
      checkoutText = await checkoutRes.text();
      try { checkoutData = JSON.parse(checkoutText); } catch { checkoutData = { raw: checkoutText }; }
    } catch (err: any) {
      const msg = `Network error creating Whop checkout: ${err.message ?? String(err)}`;
      console.error("[payments]", msg);
      await ctx.runMutation(api.errorLogs.insertErrorLog, {
        source: "payments", level: "error", message: msg,
        details: JSON.stringify({ donationId: args.donationId }),
        apiUrl: WHOP_CHECKOUT_URL, donationId: args.donationId,
      }).catch(() => {});
      throw new Error(msg);
    }

    console.log("[payments] Checkout response:", checkoutRes.status, JSON.stringify(checkoutData));

    if (!checkoutRes.ok) {
      const errorMsg = extractWhopError(checkoutData, checkoutRes.status);
      console.error("[payments] Checkout error:", errorMsg);
      await ctx.runMutation(api.errorLogs.insertErrorLog, {
        source: "payments", level: "error",
        message: `Whop checkout error: ${errorMsg}`,
        details: JSON.stringify({
          donationId: args.donationId, amountMAD: args.amountMAD,
          planId, redirectUrl,
        }),
        apiUrl: WHOP_CHECKOUT_URL, apiStatus: checkoutRes.status,
        apiResponse: checkoutText.slice(0, 4000), donationId: args.donationId,
      }).catch(() => {});
      throw new Error(`Whop checkout error: ${errorMsg}`);
    }

    if (!checkoutData?.purchase_url) {
      const msg = "Whop checkout returned no purchase_url";
      console.error("[payments]", msg, checkoutText);
      await ctx.runMutation(api.errorLogs.insertErrorLog, {
        source: "payments", level: "error", message: msg,
        apiUrl: WHOP_CHECKOUT_URL, apiStatus: checkoutRes.status,
        apiResponse: checkoutText.slice(0, 4000), donationId: args.donationId,
      }).catch(() => {});
      throw new Error(msg);
    }

    await ctx.runMutation(api.errorLogs.insertErrorLog, {
      source: "payments", level: "info",
      message: `Whop checkout created successfully for donation ${args.donationId}`,
      apiUrl: WHOP_CHECKOUT_URL, apiStatus: checkoutRes.status,
      apiResponse: checkoutText.slice(0, 2000), donationId: args.donationId,
    }).catch(() => {});
    return { purchaseUrl: checkoutData.purchase_url };
  },
});

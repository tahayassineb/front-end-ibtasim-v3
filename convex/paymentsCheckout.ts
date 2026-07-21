import { action } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import {
  extractWhopError,
  normalizeBaseUrl,
  validateAmountMAD,
} from "./paymentUtils";

declare const process: {
  env: {
    WHOP_API_KEY?: string;
    WHOP_COMPANY_ID?: string;
    WHOP_PRODUCT_ID?: string;
    WHOP_WEBHOOK_SECRET?: string;
    CONVEX_SITE_URL?: string;
    FRONTEND_URL?: string;
  };
};

const WHOP_PLANS_URL = "https://api.whop.com/api/v2/plans";
const WHOP_CHECKOUT_URL = "https://api.whop.com/api/v2/checkout_sessions";

const PRESET_PLAN_IDS: Record<number, string> = {
  200: "plan_FX2nfOyGnmaCf",
  500: "plan_KCTR7FdaRv4rv",
  1000: "plan_6Ed3nRvJGJ8cO",
};

async function logAction(
  ctx: any,
  payload: {
    source: string;
    level: "error" | "warning" | "info";
    message: string;
    details?: string;
    apiUrl?: string;
    apiStatus?: number;
    apiResponse?: string;
    donationId?: any;
    userId?: any;
  }
) {
  try {
    await ctx.runMutation(api.errorLogs.insertErrorLog, payload);
  } catch {}
}

export const startWhopCheckout = action({
  args: {
    userId: v.id("users"),
    projectId: v.id("projects"),
    amount: v.number(),
    coversFees: v.boolean(),
    isAnonymous: v.boolean(),
    message: v.optional(v.string()),
  },
  returns: v.object({
    purchaseUrl: v.string(),
  }),
  handler: async (ctx, args) => {
    const apiKey = process.env.WHOP_API_KEY;
    const companyId = process.env.WHOP_COMPANY_ID;
    const productId = process.env.WHOP_PRODUCT_ID ?? "prod_1khGq1pY0YRXM";
    const webhookSecret = process.env.WHOP_WEBHOOK_SECRET;
    const convexSiteUrl = normalizeBaseUrl(process.env.CONVEX_SITE_URL);

    if (!apiKey || !companyId || !convexSiteUrl || !webhookSecret) {
      const missing = [
        !apiKey ? "WHOP_API_KEY" : null,
        !companyId ? "WHOP_COMPANY_ID" : null,
        !convexSiteUrl ? "CONVEX_SITE_URL" : null,
        !webhookSecret ? "WHOP_WEBHOOK_SECRET" : null,
      ].filter(Boolean);
      const msg = `Whop checkout is blocked until required environment variables are configured: ${missing.join(", ")}`;
      await logAction(ctx, {
        source: "payments",
        level: "error",
        message: msg,
        userId: args.userId,
      });
      throw new Error(msg);
    }

    const amountMAD = validateAmountMAD(args.amount);
    const redirectUrl = `${convexSiteUrl}/donate/success`;
    const paymentAttemptId = await ctx.runMutation(internal.payments.createCardPaymentAttempt, args);

    let planId = PRESET_PLAN_IDS[amountMAD];
    if (!planId) {
      let planRes: Response;
      let planText = "";
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
            initial_price: amountMAD,
            base_currency: "mad",
            plan_type: "one_time",
            visibility: "hidden",
            unlimited_stock: true,
          }),
        });
        planText = await planRes.text();
        try {
          planData = JSON.parse(planText);
        } catch {
          planData = { raw: planText };
        }
      } catch (err: any) {
        await ctx.runMutation(internal.payments.markCardPaymentAttemptState, {
          paymentAttemptId,
          status: "failed",
          reason: `Network error creating Whop plan: ${err.message ?? String(err)}`,
        });
        throw err;
      }

      if (!planRes.ok || !planData?.id) {
        const errorMsg = extractWhopError(planData, planRes.status);
        await logAction(ctx, {
          source: "payments",
          level: "error",
          message: `Whop plan creation error: ${errorMsg}`,
          details: JSON.stringify({ paymentAttemptId, amountMAD }),
          apiUrl: WHOP_PLANS_URL,
          apiStatus: planRes.status,
          apiResponse: planText.slice(0, 4000),
          userId: args.userId,
        });
        await ctx.runMutation(internal.payments.markCardPaymentAttemptState, {
          paymentAttemptId,
          status: "failed",
          reason: errorMsg,
        });
        throw new Error(`Whop plan creation error: ${errorMsg}`);
      }

      planId = planData.id;
      await logAction(ctx, {
        source: "payments",
        level: "info",
        message: `Whop plan created: ${planId} for ${amountMAD} MAD`,
        details: JSON.stringify({ paymentAttemptId }),
        apiUrl: WHOP_PLANS_URL,
        apiStatus: planRes.status,
        apiResponse: planText.slice(0, 2000),
        userId: args.userId,
      });
    }

    let checkoutRes: Response;
    let checkoutText = "";
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
          metadata: {
            paymentAttemptId,
            type: "donation",
          },
        }),
      });
      checkoutText = await checkoutRes.text();
      try {
        checkoutData = JSON.parse(checkoutText);
      } catch {
        checkoutData = { raw: checkoutText };
      }
    } catch (err: any) {
      const message = `Network error creating Whop checkout: ${err.message ?? String(err)}`;
      await ctx.runMutation(internal.payments.markCardPaymentAttemptState, {
        paymentAttemptId,
        status: "failed",
        reason: message,
      });
      await logAction(ctx, {
        source: "payments",
        level: "error",
        message,
        details: JSON.stringify({ paymentAttemptId, redirectUrl }),
        apiUrl: WHOP_CHECKOUT_URL,
        userId: args.userId,
      });
      throw new Error(message);
    }

    if (!checkoutRes.ok) {
      const errorMsg = extractWhopError(checkoutData, checkoutRes.status);
      await ctx.runMutation(internal.payments.markCardPaymentAttemptState, {
        paymentAttemptId,
        status: "failed",
        reason: errorMsg,
      });
      await logAction(ctx, {
        source: "payments",
        level: "error",
        message: `Whop checkout error: ${errorMsg}`,
        details: JSON.stringify({ paymentAttemptId, amountMAD, planId, redirectUrl }),
        apiUrl: WHOP_CHECKOUT_URL,
        apiStatus: checkoutRes.status,
        apiResponse: checkoutText.slice(0, 4000),
        userId: args.userId,
      });
      throw new Error(`Whop checkout error: ${errorMsg}`);
    }

    if (!checkoutData?.purchase_url || !checkoutData?.id) {
      const msg = "Whop checkout returned no purchase_url or session id";
      await ctx.runMutation(internal.payments.markCardPaymentAttemptState, {
        paymentAttemptId,
        status: "failed",
        reason: msg,
      });
      await logAction(ctx, {
        source: "payments",
        level: "error",
        message: msg,
        details: JSON.stringify({ paymentAttemptId, amountMAD, planId }),
        apiUrl: WHOP_CHECKOUT_URL,
        apiStatus: checkoutRes.status,
        apiResponse: checkoutText.slice(0, 4000),
        userId: args.userId,
      });
      throw new Error(msg);
    }

    await ctx.runMutation(internal.payments.setCardPaymentAttemptCheckoutSession, {
      paymentAttemptId,
      checkoutSessionId: checkoutData.id,
      whopProductId: productId,
    });

    await logAction(ctx, {
      source: "payments",
      level: "info",
      message: `Whop checkout created for payment attempt ${paymentAttemptId}`,
      details: JSON.stringify({
        paymentAttemptId,
        checkoutSessionId: checkoutData.id,
        redirectUrl,
      }),
      apiUrl: WHOP_CHECKOUT_URL,
      apiStatus: checkoutRes.status,
      apiResponse: checkoutText.slice(0, 2000),
      userId: args.userId,
    });

    return { purchaseUrl: checkoutData.purchase_url };
  },
});

export const startDonationCheckout = action({
  args: {
    userId: v.id("users"),
    projectId: v.id("projects"),
    amount: v.number(),
    coversFees: v.boolean(),
    isAnonymous: v.boolean(),
    message: v.optional(v.string()),
    provider: v.optional(v.literal("whop")),
  },
  returns: v.object({
    provider: v.literal("whop"),
    purchaseUrl: v.string(),
  }),
  handler: async (ctx, args) => {
    const { purchaseUrl } = await ctx.runAction(api.payments.startWhopCheckout, args);
    return { provider: "whop", purchaseUrl };
  },
});

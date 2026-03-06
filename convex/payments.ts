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

const WHOP_API_URL = "https://api.whop.com/v2/checkout_configurations";

// ============================================
// Pre-created hidden plans in MAD (created via Whop MCP, stable IDs)
// Using plan_id avoids needing plan:create permission on the API key.
// ============================================
const PRESET_PLAN_IDS: Record<number, string> = {
  200:  "plan_FX2nfOyGnmaCf", // Donation 200 MAD
  500:  "plan_KCTR7FdaRv4rv", // Donation 500 MAD
  1000: "plan_6Ed3nRvJGJ8cO", // Donation 1000 MAD
};

// Extract a readable error string from a Whop API error response.
// Whop returns: { error: { status: 401, message: "..." } } or { message: "..." }
function extractWhopError(data: any, status: number): string {
  if (typeof data?.message === "string") return data.message;
  if (typeof data?.error === "string") return data.error;
  if (typeof data?.error?.message === "string") return data.error.message;
  if (Array.isArray(data?.errors) && typeof data.errors[0]?.message === "string")
    return data.errors[0].message;
  return `Whop checkout failed with HTTP ${status}`;
}

// ============================================
// WHOP PAYMENT INTEGRATION
// Creates a checkout session and returns the purchase URL.
// For preset amounts (200/500/1000 MAD) uses a pre-created plan_id.
// For custom amounts creates a plan inline.
// ============================================

export const createWhopCheckout = action({
  args: {
    donationId: v.id("donations"),
    amountMAD: v.number(), // Amount in MAD
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

    // ── Validate credentials ────────────────────────────────────────────
    if (!apiKey || !companyId) {
      const msg =
        "Whop API credentials not configured. Set WHOP_API_KEY and WHOP_COMPANY_ID in Convex environment variables.";
      console.error("[payments]", msg);
      try {
        await ctx.runMutation(api.errorLogs.insertErrorLog, {
          source: "payments",
          level: "error",
          message: msg,
          details: JSON.stringify({ donationId: args.donationId }),
        });
      } catch (logErr) {
        console.error("[payments] Failed to write error log:", logErr);
      }
      throw new Error(msg);
    }

    // ── Build request payload ────────────────────────────────────────────
    // For preset amounts: use a pre-created plan_id (no plan:create needed).
    // For custom amounts: create the plan inline.
    const redirectUrl = siteUrl ? `${siteUrl}/donate/success` : undefined;
    const presetPlanId = PRESET_PLAN_IDS[args.amountMAD];

    let requestBody: Record<string, unknown>;
    if (presetPlanId) {
      // Preset amount — just reference existing plan
      requestBody = {
        plan_id: presetPlanId,
        redirect_url: redirectUrl,
        metadata: { donationId: args.donationId },
      };
      console.log("[payments] Using preset plan_id", presetPlanId, "for", args.amountMAD, "MAD");
    } else {
      // Custom amount — create plan inline
      requestBody = {
        plan: {
          company_id: companyId,
          product_id: productId,
          initial_price: args.amountMAD,
          plan_type: "one_time",
          currency: "mad",
          visibility: "hidden",
        },
        redirect_url: redirectUrl,
        metadata: { donationId: args.donationId },
      };
      console.log("[payments] Creating inline plan for custom amount", args.amountMAD, "MAD");
    }

    console.log("[payments] Calling Whop API:", WHOP_API_URL, {
      amountMAD: args.amountMAD,
      companyId,
      presetPlanId: presetPlanId ?? "(custom)",
      redirectUrl,
    });

    // ── Call Whop API ────────────────────────────────────────────────────
    let responseStatus: number;
    let responseText: string;
    let data: any;

    try {
      const response = await fetch(WHOP_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      responseStatus = response.status;
      responseText = await response.text();

      try {
        data = JSON.parse(responseText);
      } catch {
        data = { raw: responseText };
      }

      console.log("[payments] Whop API response:", responseStatus, JSON.stringify(data));

      // ── Handle non-2xx response ─────────────────────────────────────
      if (!response.ok) {
        const errorMsg = extractWhopError(data, responseStatus);

        console.error("[payments] Whop error:", errorMsg, "| Full response:", responseText);

        // Log the raw 401 hint for easier diagnosis
        if (responseStatus === 401) {
          console.error(
            "[payments] 401 HINT: Your WHOP_API_KEY is missing permissions. " +
            "The key needs: checkout_configuration:create, access_pass:create, " +
            "access_pass:update, checkout_configuration:basic:read. " +
            "(Also plan:create if using custom amounts.) " +
            "Go to Whop Dashboard → Developer → API Keys and add these scopes."
          );
        }

        try {
          await ctx.runMutation(api.errorLogs.insertErrorLog, {
            source: "payments",
            level: "error",
            message: `Whop API error: ${errorMsg}`,
            details: JSON.stringify({
              donationId: args.donationId,
              amountMAD: args.amountMAD,
              companyId,
              presetPlanId: presetPlanId ?? null,
              redirectUrl,
            }),
            apiUrl: WHOP_API_URL,
            apiStatus: responseStatus,
            apiResponse: responseText.slice(0, 4000),
            donationId: args.donationId,
          });
        } catch (logErr) {
          console.error("[payments] Failed to write error log:", logErr);
        }

        throw new Error(`Whop API error (${responseStatus}): ${errorMsg}`);
      }

      // ── Validate purchase_url in response ───────────────────────────
      if (!data.purchase_url) {
        const errorMsg = "Whop API returned no purchase_url in response";
        console.error("[payments]", errorMsg, "| Full response:", responseText);

        try {
          await ctx.runMutation(api.errorLogs.insertErrorLog, {
            source: "payments",
            level: "error",
            message: errorMsg,
            apiUrl: WHOP_API_URL,
            apiStatus: responseStatus,
            apiResponse: responseText.slice(0, 4000),
            donationId: args.donationId,
          });
        } catch (logErr) {
          console.error("[payments] Failed to write error log:", logErr);
        }

        throw new Error(errorMsg);
      }

      console.log("[payments] Checkout created successfully:", data.purchase_url);
      return { purchaseUrl: data.purchase_url };
    } catch (err: any) {
      // Re-throw errors already handled above (they all include "Whop" or "purchase_url")
      if (
        err.message?.startsWith("Whop") ||
        err.message?.includes("purchase_url") ||
        err.message?.includes("credentials")
      ) {
        throw err;
      }

      // True network/fetch error
      const errorMsg = `Network error calling Whop API: ${err.message ?? String(err)}`;
      console.error("[payments]", errorMsg);

      try {
        await ctx.runMutation(api.errorLogs.insertErrorLog, {
          source: "payments",
          level: "error",
          message: errorMsg,
          details: JSON.stringify({ donationId: args.donationId }),
          apiUrl: WHOP_API_URL,
          donationId: args.donationId,
        });
      } catch (logErr) {
        console.error("[payments] Failed to write error log:", logErr);
      }

      throw new Error(errorMsg);
    }
  },
});

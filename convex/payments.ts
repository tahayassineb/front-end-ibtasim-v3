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
  handler: async (ctx, args) => {
    const apiKey = process.env.WHOP_API_KEY;
    const companyId = process.env.WHOP_COMPANY_ID;
    const productId = process.env.WHOP_PRODUCT_ID;
    // Support both CONVEX_SITE_URL and FRONTEND_URL env vars
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
    // Whop uses the actual currency amount (MAD), NOT centimes.
    // e.g. for 5 MAD, send initial_price: 5 (not 500).
    const effectiveProductId = productId ?? "prod_1khGq1pY0YRXM"; // ibtasimm product (fallback)

    const requestBody = {
      plan: {
        company_id: companyId,
        product_id: effectiveProductId,
        initial_price: args.amountMAD,
        plan_type: "one_time",
        currency: "mad",
        visibility: "hidden",
      },
      redirect_url: siteUrl ? `${siteUrl}/donate/success` : undefined,
      metadata: {
        donationId: args.donationId,
      },
    };

    console.log("[payments] Calling Whop API:", WHOP_API_URL, {
      amountMAD: args.amountMAD,
      companyId,
      productId: effectiveProductId,
      redirectUrl: requestBody.redirect_url,
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
        const errorMsg =
          data?.message ??
          data?.error ??
          (Array.isArray(data?.errors) ? data.errors[0]?.message : undefined) ??
          `Whop checkout failed with status ${responseStatus}`;

        console.error("[payments] Whop error:", errorMsg, "| Full response:", responseText);

        try {
          await ctx.runMutation(api.errorLogs.insertErrorLog, {
            source: "payments",
            level: "error",
            message: `Whop API error: ${errorMsg}`,
            details: JSON.stringify({
              donationId: args.donationId,
              amountMAD: args.amountMAD,
              companyId,
              productId: effectiveProductId,
              redirectUrl: requestBody.redirect_url,
            }),
            apiUrl: WHOP_API_URL,
            apiStatus: responseStatus,
            apiResponse: responseText.slice(0, 4000), // cap at 4 KB
            donationId: args.donationId,
          });
        } catch (logErr) {
          console.error("[payments] Failed to write error log:", logErr);
        }

        throw new Error(errorMsg);
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
      // Re-throw Whop errors already handled above
      if (
        err.message?.includes("Whop") ||
        err.message?.includes("purchase_url") ||
        err.message?.includes("credentials")
      ) {
        throw err;
      }

      // Network or unexpected error
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

import { action, internalMutation, mutation } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { requireAdmin } from "./permissions";

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

const LEGACY_SUCCESS_DONATION_ID = "jd72wqfzvrm2cgsdy98knw8vn185dqqp";
const LEGACY_CANCELLED_DONATION_ID = "jd74n4qa148j6tpv0wyn9a7cfs85cyat";

function normalizeBaseUrl(value?: string): string | undefined {
  if (!value) return undefined;
  return value.trim().replace(/\/+$/, "");
}

function extractWhopError(data: any, status: number): string {
  if (typeof data?.message === "string") return data.message;
  if (typeof data?.error === "string") return data.error;
  if (typeof data?.error?.message === "string") return data.error.message;
  if (Array.isArray(data?.errors) && typeof data.errors[0]?.message === "string") {
    return data.errors[0].message;
  }
  return `Whop API failed with HTTP ${status}`;
}

function appendUnique(values: string[] | undefined, nextValue: string): string[] {
  return Array.from(new Set([...(values ?? []), nextValue]));
}

function getStoredPaymentAmount(paymentAttempt: any): number {
  if (typeof paymentAttempt?.amount === "number") return paymentAttempt.amount;
  if (typeof paymentAttempt?.amountCents === "number") return paymentAttempt.amountCents / 100;
  return 0;
}

function validateAmountMAD(amount: number): number {
  if (amount <= 0) {
    throw new Error("Donation amount must be greater than zero.");
  }
  return amount;
}

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

export const createCardPaymentAttempt = internalMutation({
  args: {
    userId: v.id("users"),
    projectId: v.id("projects"),
    amount: v.number(),
    coversFees: v.boolean(),
    isAnonymous: v.boolean(),
    message: v.optional(v.string()),
  },
  returns: v.id("payments"),
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("payments", {
      userId: args.userId,
      projectId: args.projectId,
      provider: "whop",
      amount: args.amount,
      currency: "MAD",
      coversFees: args.coversFees,
      isAnonymous: args.isAnonymous,
      message: args.message,
      status: "pending",
      initiatedAt: now,
      webhookEvents: [],
    });
  },
});

export const setCardPaymentAttemptCheckoutSession = internalMutation({
  args: {
    paymentAttemptId: v.id("payments"),
    checkoutSessionId: v.string(),
    whopProductId: v.optional(v.string()),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const paymentAttempt = await ctx.db.get(args.paymentAttemptId);
    if (!paymentAttempt) return false;

    await ctx.db.patch(args.paymentAttemptId, {
      checkoutSessionId: args.checkoutSessionId,
      whopProductId: args.whopProductId,
      status: paymentAttempt.status === "pending" ? "processing" : paymentAttempt.status,
    });
    return true;
  },
});

export const markCardPaymentAttemptState = internalMutation({
  args: {
    paymentAttemptId: v.optional(v.id("payments")),
    whopPaymentId: v.optional(v.string()),
    status: v.union(v.literal("failed"), v.literal("refunded"), v.literal("cancelled")),
    reason: v.optional(v.string()),
    eventName: v.optional(v.string()),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    let paymentAttempt = args.paymentAttemptId ? await ctx.db.get(args.paymentAttemptId) : null;
    if (!paymentAttempt && args.whopPaymentId) {
      paymentAttempt = await ctx.db
        .query("payments")
        .withIndex("by_whop_payment", (q) => q.eq("whopPaymentId", args.whopPaymentId!))
        .unique();
    }
    if (!paymentAttempt) return false;

    const now = Date.now();
    await ctx.db.patch(paymentAttempt._id, {
      whopPaymentId: args.whopPaymentId ?? paymentAttempt.whopPaymentId,
      status: args.status,
      failureReason: args.reason ?? paymentAttempt.failureReason,
      failedAt: args.status === "failed" || args.status === "cancelled" ? now : paymentAttempt.failedAt,
      completedAt: args.status === "refunded" ? now : paymentAttempt.completedAt,
      lastWebhookAt: now,
      webhookEvents: args.eventName
        ? appendUnique(paymentAttempt.webhookEvents, args.eventName)
        : paymentAttempt.webhookEvents,
    });
    return true;
  },
});

export const finalizeWhopCardPayment = internalMutation({
  args: {
    paymentAttemptId: v.optional(v.id("payments")),
    whopPaymentId: v.string(),
    whopPaymentStatus: v.optional(v.string()),
    eventName: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    donationId: v.optional(v.id("donations")),
    amount: v.optional(v.number()),
  }),
  handler: async (ctx, args) => {
    let paymentAttempt = args.paymentAttemptId ? await ctx.db.get(args.paymentAttemptId) : null;
    if (!paymentAttempt) {
      paymentAttempt = await ctx.db
        .query("payments")
        .withIndex("by_whop_payment", (q) => q.eq("whopPaymentId", args.whopPaymentId))
        .unique();
    }

    if (!paymentAttempt) {
      await ctx.db.insert("errorLogs", {
        source: "payments_finalize",
        level: "error",
        message: `Payment attempt not found for Whop payment ${args.whopPaymentId}`,
        details: JSON.stringify({
          paymentAttemptId: args.paymentAttemptId ?? null,
          whopPaymentStatus: args.whopPaymentStatus ?? null,
        }),
        createdAt: Date.now(),
      });
      return { success: false };
    }

    if (paymentAttempt.status === "completed" && paymentAttempt.donationId) {
      const paymentAmount = getStoredPaymentAmount(paymentAttempt);
      const webhookEvents = args.eventName
        ? appendUnique(paymentAttempt.webhookEvents, args.eventName)
        : paymentAttempt.webhookEvents;
      await ctx.db.patch(paymentAttempt._id, {
        whopPaymentId: args.whopPaymentId,
        lastWebhookAt: Date.now(),
        webhookEvents,
      });
      return {
        success: true,
        donationId: paymentAttempt.donationId,
        amount: paymentAmount,
      };
    }

    const now = Date.now();
    const paymentAmount = getStoredPaymentAmount(paymentAttempt);
    let donation = paymentAttempt.donationId ? await ctx.db.get(paymentAttempt.donationId) : null;
    let donationId = paymentAttempt.donationId;
    let justVerified = false;

    if (!donation) {
      donationId = await ctx.db.insert("donations", {
        userId: paymentAttempt.userId,
        projectId: paymentAttempt.projectId,
        amount: paymentAmount,
        currency: "MAD",
        coversFees: paymentAttempt.coversFees,
        paymentMethod: "card_whop",
        status: "verified",
        isAnonymous: paymentAttempt.isAnonymous,
        message: paymentAttempt.message,
        whopPaymentId: args.whopPaymentId,
        whopPaymentStatus: args.whopPaymentStatus ?? "paid",
        transactionReference: args.whopPaymentId,
        verifiedAt: now,
        verificationNotes: `Whop card payment auto-verified. Payment ID: ${args.whopPaymentId}`,
        createdAt: now,
        updatedAt: now,
      });
      donation = await ctx.db.get(donationId);
      justVerified = true;
    } else if (donation.status !== "verified" && donation.status !== "completed") {
      await ctx.db.patch(donation._id, {
        whopPaymentId: args.whopPaymentId,
        whopPaymentStatus: args.whopPaymentStatus ?? "paid",
        transactionReference: args.whopPaymentId,
        status: "verified",
        verifiedAt: donation.verifiedAt ?? now,
        verificationNotes: `Whop card payment auto-verified. Payment ID: ${args.whopPaymentId}`,
        updatedAt: now,
      });
      donation = await ctx.db.get(donation._id);
      justVerified = true;
    }

    const webhookEvents = args.eventName
      ? appendUnique(paymentAttempt.webhookEvents, args.eventName)
      : paymentAttempt.webhookEvents;

    await ctx.db.patch(paymentAttempt._id, {
      donationId,
      whopPaymentId: args.whopPaymentId,
      status: "completed",
      completedAt: now,
      lastWebhookAt: now,
      webhookEvents,
    });

    if (justVerified && donation) {
      const project = await ctx.db.get(donation.projectId);
      if (project) {
        await ctx.db.patch(donation.projectId, {
          raisedAmount: project.raisedAmount + donation.amount,
          updatedAt: now,
        });
      }

      const user = await ctx.db.get(donation.userId);
      if (user) {
        await ctx.db.patch(donation.userId, {
          totalDonated: (user.totalDonated ?? 0) + donation.amount,
          donationCount: (user.donationCount ?? 0) + 1,
        });
      }

      await ctx.db.insert("verificationLogs", {
        donationId: donation._id,
        adminId: undefined,
        action: "verify",
        notes: `Auto-verified via Whop payment ${args.whopPaymentId}`,
        createdAt: now,
      });

      try {
        const projectForNotification = project ?? (await ctx.db.get(donation.projectId));
        if (projectForNotification) {
          await ctx.scheduler.runAfter(0, api.notifications.sendDonationVerificationNotification, {
            userId: donation.userId,
            donationId: donation._id,
            amount: donation.amount,
            projectTitle: projectForNotification.title.ar,
          });
        }
      } catch (error) {
        await ctx.db.insert("errorLogs", {
          source: "payments_finalize",
          level: "error",
          message: `Failed to schedule WhatsApp notification: ${error}`,
          donationId: donation._id,
          createdAt: Date.now(),
        });
      }
    }

    await ctx.db.insert("errorLogs", {
      source: "payments_finalize",
      level: "info",
      message: `Whop payment finalized for attempt ${paymentAttempt._id}`,
      details: JSON.stringify({
        donationId: donationId ?? null,
        whopPaymentId: args.whopPaymentId,
      }),
      donationId,
      createdAt: now,
    });

    return {
      success: true,
      donationId,
      amount: paymentAmount,
    };
  },
});

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

export const repairLegacyWhopCardDonations = mutation({
  args: {
    adminId: v.id("admins"),
    dryRun: v.boolean(),
    successfulWhopPaymentId: v.optional(v.string()),
  },
  returns: v.object({
    dryRun: v.boolean(),
    targets: v.array(
      v.object({
        donationId: v.string(),
        exists: v.boolean(),
        currentStatus: v.optional(v.string()),
        currentAmount: v.optional(v.number()),
        nextStatus: v.optional(v.string()),
        nextAmount: v.optional(v.number()),
        action: v.string(),
      })
    ),
  }),
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminId, "verification:write");

    const successfulDonation = await ctx.db.get(LEGACY_SUCCESS_DONATION_ID as any);
    const cancelledDonation = await ctx.db.get(LEGACY_CANCELLED_DONATION_ID as any);

    const targets = [
      {
        donationId: LEGACY_SUCCESS_DONATION_ID,
        exists: !!successfulDonation,
        currentStatus: successfulDonation?.status,
        currentAmount: successfulDonation?.amount,
        nextStatus: "verified",
        nextAmount: 100,
        action: successfulDonation ? "repair_successful_card_payment" : "missing",
      },
      {
        donationId: LEGACY_CANCELLED_DONATION_ID,
        exists: !!cancelledDonation,
        currentStatus: cancelledDonation?.status,
        currentAmount: cancelledDonation?.amount,
        nextStatus: "cancelled",
        nextAmount: 100,
        action: cancelledDonation ? "mark_abandoned_card_attempt_cancelled" : "missing",
      },
    ];

    if (args.dryRun) {
      return { dryRun: true, targets };
    }

    const now = Date.now();

    if (successfulDonation) {
      const correctedAmount = 100;
      const wasVerified =
        successfulDonation.status === "verified" || successfulDonation.status === "completed";
      const deltaAmount = wasVerified
        ? correctedAmount - successfulDonation.amount
        : correctedAmount;

      await ctx.db.patch(successfulDonation._id, {
        amount: correctedAmount,
        status: "verified",
        whopPaymentId: args.successfulWhopPaymentId ?? successfulDonation.whopPaymentId,
        whopPaymentStatus: "paid",
        transactionReference:
          args.successfulWhopPaymentId ??
          successfulDonation.transactionReference ??
          successfulDonation.whopPaymentId,
        verifiedAt: successfulDonation.verifiedAt ?? now,
        verificationNotes:
          "Legacy Whop repair: finalized the successful card donation as 100 MAD and verified it.",
        updatedAt: now,
      });

      if (deltaAmount !== 0) {
        const project = await ctx.db.get(successfulDonation.projectId);
        if (project) {
          await ctx.db.patch(successfulDonation.projectId, {
            raisedAmount: project.raisedAmount + deltaAmount,
            updatedAt: now,
          });
        }

        const user = await ctx.db.get(successfulDonation.userId);
        if (user) {
          await ctx.db.patch(successfulDonation.userId, {
            totalDonated: (user.totalDonated ?? 0) + deltaAmount,
            donationCount: (user.donationCount ?? 0) + (wasVerified ? 0 : 1),
          });
        }
      } else if (!wasVerified) {
        const user = await ctx.db.get(successfulDonation.userId);
        if (user) {
          await ctx.db.patch(successfulDonation.userId, {
            donationCount: (user.donationCount ?? 0) + 1,
          });
        }
      }

      if (!wasVerified) {
        await ctx.db.insert("verificationLogs", {
          donationId: successfulDonation._id,
          adminId: args.adminId,
          action: "verify",
          notes: "Legacy Whop repair completed.",
          createdAt: now,
        });
      }
    }

    if (cancelledDonation) {
      await ctx.db.patch(cancelledDonation._id, {
        amount: 100,
        status: "cancelled",
        whopPaymentStatus: "cancelled",
        verificationNotes:
          "Legacy Whop repair: abandoned pre-checkout card donation hidden from admin/public surfaces.",
        updatedAt: now,
      });
    }

    await ctx.db.insert("activities", {
      actorId: args.adminId,
      actorType: "admin",
      action: "payments.legacy_whop_repair",
      entityType: "payment",
      entityId: "legacy_whop_2026_04_23",
      metadata: {
        successfulDonationId: LEGACY_SUCCESS_DONATION_ID,
        cancelledDonationId: LEGACY_CANCELLED_DONATION_ID,
        successfulWhopPaymentId: args.successfulWhopPaymentId,
      },
      createdAt: now,
    });

    return { dryRun: false, targets };
  },
});

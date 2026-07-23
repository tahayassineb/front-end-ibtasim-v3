import { api, internal } from "./_generated/api";
import { verifySvixSignature } from "./httpHelpers";
import { getWhopWebhookDispatch } from "./whopWebhookRules";

declare const process: {
  env: {
    WHOP_WEBHOOK_SECRET?: string;
  };
};

export async function handleWhopWebhook(ctx: any, request: Request) {
  const svixId = request.headers.get("svix-id");
  const svixTimestamp = request.headers.get("svix-timestamp");
  const svixSignature = request.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing Svix headers", { status: 400 });
  }

  const rawBody = await request.text();
  const secret = process.env.WHOP_WEBHOOK_SECRET;
  if (!secret) {
    console.error("WHOP_WEBHOOK_SECRET not configured");
    try {
      await ctx.runMutation(api.errorLogs.insertErrorLog, {
        source: "whop_webhook",
        level: "error",
        message: "WHOP_WEBHOOK_SECRET not configured",
        details: JSON.stringify({ path: "/webhooks/whop" }),
      });
    } catch {}
    return new Response("Webhook secret not configured", { status: 500 });
  }

  const isValid = await verifySvixSignature(
    svixId,
    svixTimestamp,
    rawBody,
    secret,
    svixSignature
  );
  if (!isValid) {
    return new Response("Invalid signature", { status: 401 });
  }

  try {
    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const data = payload.data;

    const paymentAttemptId = data?.metadata?.paymentAttemptId;
    const donationId = data?.metadata?.donationId;
    const paymentType = data?.metadata?.type;

    if (paymentType === "kafala") {
      const dispatch = getWhopWebhookDispatch({
        event,
        paymentType,
        donationId,
        membershipId: event === "membership.cancelled" ? data?.id ?? data?.membership_id : data?.membership_id,
        paymentId: data?.id,
      });

      switch (dispatch.action) {
        case "extend_or_process": {
          const sponsorship = await ctx.runQuery(
            api.kafala.getSponsorshipBySubscriptionId,
            { whopSubscriptionId: dispatch.membershipId }
          );

          if (sponsorship) {
            await ctx.runMutation(internal.kafala.extendKafalaSponsorship, {
              sponsorshipId: sponsorship._id,
              whopPaymentId: dispatch.paymentId,
            });
          } else if (dispatch.donationId) {
            await ctx.runMutation(internal.kafala.processKafalaWhopPayment, {
              donationId: dispatch.donationId as any,
              whopPaymentId: dispatch.paymentId,
              whopSubscriptionId: dispatch.membershipId,
            });
          }
          break;
        }
        case "process_donation":
          await ctx.runMutation(internal.kafala.processKafalaWhopPayment, {
            donationId: dispatch.donationId as any,
            whopPaymentId: dispatch.paymentId,
          });
          break;
        case "expire_membership":
          try {
            await ctx.runMutation(internal.kafala.expireSponsorshipBySubscriptionId, {
              whopSubscriptionId: dispatch.membershipId,
            });
          } catch (e) {
            console.error("membership.cancelled handler failed:", e);
          }
          break;
        default:
          console.log(`Unhandled Whop kafala event: ${event}`);
      }

      return new Response("OK", { status: 200 });
    }

    const dispatch = getWhopWebhookDispatch({
      event,
      paymentAttemptId,
      donationId,
      paymentId: data?.id,
      failureReason: data?.failure_reason,
    });

    if (dispatch.domain === "ignore" && dispatch.reason === "missing_metadata") {
      console.error("Missing paymentAttemptId/donationId in webhook metadata");
      return new Response("OK", { status: 200 });
    }

    switch (dispatch.action) {
      case "finalize_attempt":
        await ctx.runMutation(internal.payments.finalizeWhopCardPayment, {
          paymentAttemptId: dispatch.paymentAttemptId as any,
          whopPaymentId: dispatch.paymentId,
          whopPaymentStatus: "paid",
          eventName: event,
        });
        break;
      case "process_donation":
        await ctx.runMutation(internal.donations.processWhopPayment, {
          donationId: dispatch.donationId as any,
          whopPaymentId: dispatch.paymentId,
        });
        break;
      case "mark_attempt_failed":
        await ctx.runMutation(internal.payments.markCardPaymentAttemptState, {
          paymentAttemptId: dispatch.paymentAttemptId as any,
          whopPaymentId: dispatch.paymentId,
          status: "failed",
          reason: dispatch.reason,
          eventName: event,
        });
        break;
      case "mark_attempt_refunded":
        await ctx.runMutation(internal.payments.markCardPaymentAttemptState, {
          paymentAttemptId: dispatch.paymentAttemptId as any,
          whopPaymentId: dispatch.paymentId,
          status: "refunded",
          reason: dispatch.reason,
          eventName: event,
        });
        break;
      case "reject_donation":
        await ctx.runMutation(internal.donations.updateDonationStatus, {
          donationId: dispatch.donationId as any,
          status: "rejected",
        });
        break;
      default:
        if (event !== "payment.succeeded" && event !== "payment.failed" && event !== "payment.refunded") {
          console.log(`Unhandled Whop event: ${event}`);
        }
        break;
    }
  } catch (err) {
    try {
      await ctx.runMutation(api.errorLogs.insertErrorLog, {
        source: "whop_webhook",
        level: "error",
        message: `Whop webhook processing error: ${
          err instanceof Error ? err.message : String(err)
        }`,
        details: JSON.stringify({ rawBody: rawBody?.slice(0, 1000) }),
      });
    } catch {}
  }

  return new Response("OK", { status: 200 });
}

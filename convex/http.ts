import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

// Svix signature verification helper
// Svix payload format: "${svixId}.${svixTimestamp}.${rawBody}"
// Signature header format: "v1,<base64>" — strip the "v1," prefix before comparing
async function verifySvixSignature(
  svixId: string,
  svixTimestamp: string,
  body: string,
  secret: string,
  signatureHeader: string
): Promise<boolean> {
  const payload = `${svixId}.${svixTimestamp}.${body}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signed = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  const expected = btoa(String.fromCharCode(...new Uint8Array(signed)));
  // Strip "v1," prefix from header value before comparing
  const actual = signatureHeader.replace(/^v1,/, "");
  return actual === expected;
}

// Whop Payment Webhook Handler
http.route({
  path: "/webhooks/whop",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // Get Svix headers
    const svixId = request.headers.get("svix-id");
    const svixTimestamp = request.headers.get("svix-timestamp");
    const svixSignature = request.headers.get("svix-signature");

    if (!svixId || !svixTimestamp || !svixSignature) {
      return new Response("Missing Svix headers", { status: 400 });
    }

    // Get raw request body
    const rawBody = await request.text();

    // Verify webhook signature using Svix
    const secret = process.env.WHOP_WEBHOOK_SECRET;
    if (!secret) {
      console.error("WHOP_WEBHOOK_SECRET not configured");
      return new Response("Webhook secret not configured", { status: 500 });
    }

    // For Svix, the signature header contains the signature
    // The payload to verify is the raw body
    const isValid = await verifySvixSignature(svixId, svixTimestamp, rawBody, secret, svixSignature);
    if (!isValid) {
      return new Response("Invalid signature", { status: 401 });
    }

    // Parse the payload and process event — wrapped in try-catch to prevent Whop retries
    try {
      const payload = JSON.parse(rawBody);
      const event = payload.event;
      const data = payload.data;

      // Get donationId from metadata
      const donationId = data?.metadata?.donationId;
      if (!donationId) {
        console.error("Missing donationId in webhook metadata");
        return new Response("OK", { status: 200 }); // Return 200 to stop Whop retries
      }

      switch (event) {
        case "payment.succeeded": {
          await ctx.runMutation(api.donations.verifyDonation, {
            donationId: donationId,
            verified: true,
            notes: `Whop payment completed. Payment ID: ${data.id}`,
          });
          break;
        }

        case "payment.failed": {
          await ctx.runMutation(api.donations.verifyDonation, {
            donationId: donationId,
            verified: false,
            notes: `Whop payment failed. Payment ID: ${data.id}`,
          });
          break;
        }

        case "payment.refunded": {
          await ctx.runMutation(api.donations.verifyDonation, {
            donationId: donationId,
            verified: false,
            notes: `Whop payment refunded. Payment ID: ${data.id}`,
          });
          break;
        }

        default:
          console.log(`Unhandled Whop event: ${event}`);
      }
    } catch (err) {
      console.error("Whop webhook processing error:", err);
      // Return 200 to prevent Whop from retrying indefinitely
    }

    return new Response("OK", { status: 200 });
  }),
});

// WaSender Session Status Webhook Handler
http.route({
  path: "/whatsapp-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // Verify webhook secret token if configured
    const webhookSecret = process.env.WASENDER_WEBHOOK_SECRET;
    if (webhookSecret) {
      const tokenHeader =
        request.headers.get("X-Webhook-Secret") ||
        request.headers.get("x-webhook-secret");
      if (tokenHeader !== webhookSecret) {
        console.error("WaSender webhook: invalid or missing secret token");
        return new Response("Unauthorized", { status: 401 });
      }
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    // WaSender fires session.status when QR is scanned and session connects
    if (body?.event === "session.status" && body?.data?.status === "connected") {
      try {
        const currentSettings = await ctx.runQuery(api.config.getConfig, { key: "whatsapp_settings" });
        if (currentSettings) {
          const parsed = JSON.parse(currentSettings);
          await ctx.runMutation(api.config.setConfig, {
            key: "whatsapp_settings",
            value: JSON.stringify({
              ...parsed,
              isConnected: true,
              qrCode: null,
              lastConnected: new Date().toISOString(),
            }),
          });
        }
      } catch (e) {
        console.error("Error updating whatsapp_settings on connect:", e);
      }
    }

    return new Response("OK", { status: 200 });
  }),
});

// Default export is required
export default http;

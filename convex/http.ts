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

    // WaSender fires connection.update when QR is scanned and session connects
    // data.status can be "connected", "open", or similar depending on Wasender version
    const isConnectedEvent =
      (body?.event === "connection.update" || body?.event === "session.status") &&
      (body?.data?.status === "connected" || body?.data?.status === "open" ||
       body?.data?.connection === "open");
    if (isConnectedEvent) {
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

// Public file serving endpoint
// Usage: https://bold-lemming-266.eu-west-1.convex.site/storage/<storageId>
http.route({
  pathPrefix: "/storage/",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const storageId = url.pathname.replace("/storage/", "");

    if (!storageId) {
      return new Response("Missing storage ID", { status: 400 });
    }

    const fileUrl = await ctx.storage.getUrl(storageId as any);
    if (!fileUrl) {
      return new Response("File not found", { status: 404 });
    }

    return Response.redirect(fileUrl, 302);
  }),
});

// ============================================
// Whop Payment Success Redirect Handler
// Whop redirects here after checkout: /donate/success?payment_id=pay_xxx&checkout_status=success
// We verify the payment, mark the donation as paid, then show a success page.
// ============================================

declare const process: { env: { WHOP_API_KEY?: string; FRONTEND_URL?: string; CONVEX_SITE_URL?: string } };

http.route({
  path: "/donate/success",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const paymentId = url.searchParams.get("payment_id") || url.searchParams.get("receipt_id");
    const checkoutStatus = url.searchParams.get("checkout_status") || url.searchParams.get("status");

    // If clearly a failed payment, show error page
    if (checkoutStatus && checkoutStatus !== "success") {
      return new Response(renderPaymentPage({ success: false, amount: 0, paymentId: "" }), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    let donationId: string | undefined;
    let amount = 0;
    let currency = "MAD";

    if (paymentId) {
      try {
        const apiKey = process.env.WHOP_API_KEY;
        const res = await fetch(`https://api.whop.com/api/v2/payments/${paymentId}`, {
          headers: { Authorization: `Bearer ${apiKey}` },
        });

        if (res.ok) {
          const payment = await res.json();
          donationId = payment.metadata?.donationId;
          amount = payment.final_amount ?? 0;
          currency = (payment.currency ?? "mad").toUpperCase();

          // Mark donation as paid + auto-verify
          if (donationId) {
            try {
              await ctx.runMutation(api.donations.processWhopPayment, {
                donationId: donationId as any,
                whopPaymentId: paymentId,
              });
            } catch (err) {
              console.error("[donate/success] processWhopPayment error:", err);
            }
          }
        } else {
          console.error("[donate/success] Payment lookup failed:", res.status, await res.text());
        }
      } catch (err) {
        console.error("[donate/success] Error fetching payment:", err);
      }
    }

    // If FRONTEND_URL is configured, redirect there (with params for the React success page)
    const frontendUrl = process.env.FRONTEND_URL;
    if (frontendUrl) {
      const params = new URLSearchParams({ paid: "true" });
      if (donationId) params.set("donationId", donationId);
      if (amount) params.set("amount", String(amount));
      return Response.redirect(`${frontendUrl}/donate/success?${params}`, 302);
    }

    // No frontend URL configured → render the success page inline from Convex
    return new Response(renderPaymentPage({ success: true, amount, currency, paymentId: paymentId ?? "" }), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }),
});

function renderPaymentPage({
  success,
  amount,
  currency = "MAD",
  paymentId,
}: {
  success: boolean;
  amount: number;
  currency?: string;
  paymentId: string;
}): string {
  if (!success) {
    return `<!DOCTYPE html><html dir="rtl" lang="ar">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>فشل الدفع</title>
<style>body{font-family:system-ui,sans-serif;background:#fff5f5;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}.card{background:white;border-radius:20px;padding:48px 32px;text-align:center;box-shadow:0 4px 40px rgba(0,0,0,.08);max-width:420px;width:90%}.icon{font-size:64px;margin-bottom:16px}.title{color:#dc2626;font-size:28px;font-weight:700;margin-bottom:8px}.sub{color:#6b7280;font-size:16px;margin-bottom:32px}.btn{background:#1d4ed8;color:white;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:600;display:inline-block}</style>
</head><body><div class="card"><div class="icon">❌</div><div class="title">فشل الدفع</div><div class="sub">لم يتم معالجة دفعتك. يمكنك المحاولة مرة أخرى.</div><a href="javascript:history.back()" class="btn">المحاولة مرة أخرى</a></div></body></html>`;
  }

  return `<!DOCTYPE html><html dir="rtl" lang="ar">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>تم الدفع بنجاح</title>
<style>
*{box-sizing:border-box}
body{font-family:system-ui,-apple-system,sans-serif;background:linear-gradient(135deg,#f0fdf4,#ecfdf5);display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:16px}
.card{background:white;border-radius:24px;padding:48px 36px;text-align:center;box-shadow:0 8px 48px rgba(0,0,0,.08);max-width:440px;width:100%}
.icon-wrap{width:96px;height:96px;background:linear-gradient(135deg,#22c55e,#16a34a);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 28px;box-shadow:0 8px 24px rgba(34,197,94,.3)}
.icon{color:white;font-size:48px}
.title{color:#111827;font-size:30px;font-weight:800;margin:0 0 6px}
.subtitle{color:#6b7280;font-size:17px;margin:0 0 28px}
.amount-box{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:16px;padding:20px;margin-bottom:28px}
.amount-label{color:#16a34a;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px}
.amount-value{color:#111827;font-size:36px;font-weight:800;direction:ltr}
.ref-box{background:#f9fafb;border-radius:12px;padding:16px;margin-bottom:28px}
.ref-label{color:#9ca3af;font-size:12px;font-weight:600;letter-spacing:.05em;margin-bottom:4px}
.ref-value{color:#374151;font-size:14px;font-weight:600;word-break:break-all;direction:ltr}
.notice{color:#6b7280;font-size:14px;line-height:1.6;margin-bottom:28px;padding:16px;background:#fffbeb;border-radius:12px;border:1px solid #fde68a}
.btn{background:linear-gradient(135deg,#22c55e,#16a34a);color:white;padding:16px 40px;border-radius:14px;text-decoration:none;font-weight:700;font-size:16px;display:inline-block;box-shadow:0 4px 16px rgba(34,197,94,.3);transition:opacity .2s}
.btn:hover{opacity:.9}
</style>
</head>
<body>
<div class="card">
  <div class="icon-wrap"><div class="icon">✓</div></div>
  <div class="title">تم الدفع بنجاح!</div>
  <div class="subtitle">شكراً لك على تبرعك الكريم</div>

  ${amount > 0 ? `
  <div class="amount-box">
    <div class="amount-label">المبلغ المدفوع</div>
    <div class="amount-value">${amount} ${currency}</div>
  </div>` : ""}

  ${paymentId ? `
  <div class="ref-box">
    <div class="ref-label">رقم المرجع</div>
    <div class="ref-value">${paymentId}</div>
  </div>` : ""}

  <div class="notice">
    📱 ستتلقى رسالة واتساب للتأكيد قريباً. تبرعك سيُغيّر حياة أسرة محتاجة.
  </div>

  <a href="/" class="btn">العودة إلى الموقع</a>
</div>
</body></html>`;
}

// Default export is required
export default http;

import { api, internal } from "./_generated/api";
import { isSuccessfulCheckoutStatus, normalizeBaseUrl } from "./httpHelpers";

declare const process: {
  env: {
    WHOP_API_KEY?: string;
    FRONTEND_URL?: string;
  };
};

export async function handleDonationSuccess(ctx: any, request: Request) {
  const url = new URL(request.url);
  const paymentId =
    url.searchParams.get("payment_id") || url.searchParams.get("receipt_id");
  const checkoutStatus =
    url.searchParams.get("checkout_status") || url.searchParams.get("status");

  if (!isSuccessfulCheckoutStatus(checkoutStatus)) {
    return new Response(
      renderPaymentPage({ success: false, amount: 0, paymentId: "" }),
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  let donationId: string | undefined;
  let amountMAD = 0;
  let currency = "MAD";
  let paid = false;

  if (paymentId) {
    try {
      const apiKey = process.env.WHOP_API_KEY;
      const res = await fetch(`https://api.whop.com/api/v2/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      if (res.ok) {
        const payment = await res.json();
        const paymentAttemptId = payment.metadata?.paymentAttemptId;
        const legacyDonationId = payment.metadata?.donationId;
        amountMAD = payment.final_amount ?? 0;
        currency = (payment.currency ?? "mad").toUpperCase();

        if (paymentAttemptId) {
          try {
            const result = await ctx.runMutation(
              internal.payments.finalizeWhopCardPayment,
              {
                paymentAttemptId: paymentAttemptId as any,
                whopPaymentId: paymentId,
                whopPaymentStatus: "paid",
                eventName: "success_redirect",
              }
            );
            donationId = result.donationId ? String(result.donationId) : undefined;
            paid = result.success;
          } catch (err) {
            try {
              await ctx.runMutation(api.errorLogs.insertErrorLog, {
                source: "donate_success",
                level: "error",
                message: `finalizeWhopCardPayment failed: ${
                  err instanceof Error ? err.message : String(err)
                }`,
                details: JSON.stringify({ paymentId, paymentAttemptId }),
              });
            } catch {}
          }
        } else if (legacyDonationId) {
          donationId = legacyDonationId;
          try {
            await ctx.runMutation(internal.donations.processWhopPayment, {
              donationId: legacyDonationId as any,
              whopPaymentId: paymentId,
            });
            paid = true;
          } catch (err) {
            try {
              await ctx.runMutation(api.errorLogs.insertErrorLog, {
                source: "donate_success",
                level: "error",
                message: `processWhopPayment failed: ${
                  err instanceof Error ? err.message : String(err)
                }`,
                details: JSON.stringify({ paymentId, donationId: legacyDonationId }),
              });
            } catch {}
          }
        }
      } else {
        const errBody = await res.text();
        try {
          await ctx.runMutation(api.errorLogs.insertErrorLog, {
            source: "donate_success",
            level: "error",
            message: `Whop payment lookup failed: HTTP ${res.status}`,
            apiUrl: `https://api.whop.com/api/v2/payments/${paymentId}`,
            apiStatus: res.status,
            apiResponse: errBody.slice(0, 2000),
          });
        } catch {}
      }
    } catch (err) {
      try {
        await ctx.runMutation(api.errorLogs.insertErrorLog, {
          source: "donate_success",
          level: "error",
          message: `Error fetching Whop payment: ${
            err instanceof Error ? err.message : String(err)
          }`,
          details: JSON.stringify({ paymentId }),
        });
      } catch {}
    }
  }

  const frontendUrl = normalizeBaseUrl(process.env.FRONTEND_URL);
  if (frontendUrl) {
    const params = new URLSearchParams({ paid: paid ? "true" : "false" });
    if (donationId) params.set("donationId", donationId);
    if (amountMAD) params.set("amount", String(amountMAD));
    params.set("paymentId", paymentId ?? "");
    return Response.redirect(`${frontendUrl}/donate/success?${params}`, 302);
  }

  return new Response(
    renderPaymentPage({
      success: paid,
      amount: amountMAD,
      currency,
      paymentId: paymentId ?? "",
    }),
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

export async function handleKafalaSuccess(ctx: any, request: Request) {
  const url = new URL(request.url);
  const paymentId =
    url.searchParams.get("payment_id") || url.searchParams.get("receipt_id");
  const checkoutStatus =
    url.searchParams.get("checkout_status") || url.searchParams.get("status");

  if (!isSuccessfulCheckoutStatus(checkoutStatus)) {
    return new Response(
      renderPaymentPage({ success: false, amount: 0, paymentId: paymentId ?? "" }),
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  let kafalaId: string | null = null;
  let donationId: string | null = null;
  let amount = 0;

  if (paymentId) {
    const apiKey = process.env.WHOP_API_KEY;
    if (apiKey) {
      try {
        const res = await fetch(`https://api.whop.com/api/v2/payments/${paymentId}`, {
          headers: { Authorization: `Bearer ${apiKey}` },
        });

        if (res.ok) {
          const data = await res.json();
          kafalaId = data?.metadata?.kafalaId ?? null;
          donationId = data?.metadata?.donationId ?? null;
          amount = data?.final_amount ?? 0;

          if (donationId && kafalaId) {
            try {
              await ctx.runMutation(internal.kafala.processKafalaWhopPayment, {
                donationId: donationId as any,
                whopPaymentId: paymentId,
                whopSubscriptionId: data?.membership_id ?? undefined,
              });
            } catch (mutErr) {
              try {
                await ctx.runMutation(api.errorLogs.insertErrorLog, {
                  source: "kafala_success",
                  level: "error",
                  message: `processKafalaWhopPayment error: ${
                    mutErr instanceof Error ? mutErr.message : String(mutErr)
                  }`,
                  details: JSON.stringify({ paymentId, donationId, kafalaId }),
                });
              } catch {}
            }
          }
        } else {
          const errBody = await res.text();
          try {
            await ctx.runMutation(api.errorLogs.insertErrorLog, {
              source: "kafala_success",
              level: "error",
              message: `Whop payment lookup failed: HTTP ${res.status}`,
              apiUrl: `https://api.whop.com/api/v2/payments/${paymentId}`,
              apiStatus: res.status,
              apiResponse: errBody.slice(0, 2000),
            });
          } catch {}
        }
      } catch (err) {
        try {
          await ctx.runMutation(api.errorLogs.insertErrorLog, {
            source: "kafala_success",
            level: "error",
            message: `Error fetching Whop payment: ${
              err instanceof Error ? err.message : String(err)
            }`,
            details: JSON.stringify({ paymentId }),
          });
        } catch {}
      }
    }
  }

  const frontendUrl = normalizeBaseUrl(process.env.FRONTEND_URL);
  if (frontendUrl && kafalaId) {
    const params = new URLSearchParams({ sponsored: "true" });
    if (amount) params.set("amount", String(amount));
    return Response.redirect(`${frontendUrl}/kafala/${kafalaId}?${params}`, 302);
  }
  if (frontendUrl) {
    return Response.redirect(`${frontendUrl}/kafala?sponsored=true`, 302);
  }

  return new Response(
    renderPaymentPage({ success: true, amount, paymentId: paymentId ?? "" }),
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

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

  ${
    amount > 0
      ? `
  <div class="amount-box">
    <div class="amount-label">المبلغ المدفوع</div>
    <div class="amount-value">${amount} ${currency}</div>
  </div>`
      : ""
  }

  ${
    paymentId
      ? `
  <div class="ref-box">
    <div class="ref-label">رقم المرجع</div>
    <div class="ref-value">${paymentId}</div>
  </div>`
      : ""
  }

  <div class="notice">
    📱 ستتلقى رسالة واتساب للتأكيد قريباً. تبرعك سيُغيّر حياة أسرة محتاجة.
  </div>

  <a href="/" class="btn">العودة إلى الموقع</a>
</div>
</body></html>`;
}

import { httpRouter } from "convex/server";
import { api } from "./_generated/api";

const http = httpRouter();

// Whop Payment Webhook Handler
http.route({
  path: "/webhooks/whop",
  method: "POST",
  handler: async (ctx, request) => {
    const payload = await request.json();
    const signature = request.headers.get("x-whop-signature");
    
    // TODO: Verify webhook signature
    // const isValid = verifyWhopSignature(payload, signature);
    // if (!isValid) return new Response("Invalid signature", { status: 401 });
    
    const event = payload.event;
    const data = payload.data;
    
    switch (event) {
      case "payment.success":
        // Update donation status to verified
        await ctx.runMutation(api.donations.updateWhopPayment, {
          donationId: data.metadata.donationId,
          whopPaymentId: data.id,
          whopPaymentStatus: "completed",
        });
        
        // Update donation status to verified
        await ctx.runMutation(api.donations.updateDonationStatus, {
          donationId: data.metadata.donationId,
          status: "verified",
        });
        break;
        
      case "payment.failed":
        await ctx.runMutation(api.donations.updateWhopPayment, {
          donationId: data.metadata.donationId,
          whopPaymentId: data.id,
          whopPaymentStatus: "failed",
        });
        break;
        
      case "payment.refunded":
        await ctx.runMutation(api.donations.updateWhopPayment, {
          donationId: data.metadata.donationId,
          whopPaymentId: data.id,
          whopPaymentStatus: "refunded",
        });
        break;
        
      default:
        console.log(`Unhandled Whop event: ${event}`);
    }
    
    return new Response("OK", { status: 200 });
  },
});

// Default export is required
export default http;
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { handleStorageRequest } from "./httpStorage";
import { handleDonationSuccess, handleKafalaSuccess } from "./httpSuccessPages";
import { handleWhatsAppWebhook } from "./httpWhatsAppWebhook";
import { handleWhopWebhook } from "./httpWhopWebhook";

const http = httpRouter();

http.route({
  path: "/webhooks/whop",
  method: "POST",
  handler: httpAction(handleWhopWebhook),
});

http.route({
  path: "/whatsapp-webhook",
  method: "POST",
  handler: httpAction(handleWhatsAppWebhook),
});

http.route({
  pathPrefix: "/storage/",
  method: "GET",
  handler: httpAction(handleStorageRequest),
});

http.route({
  path: "/donate/success",
  method: "GET",
  handler: httpAction(handleDonationSuccess),
});

http.route({
  path: "/kafala/success",
  method: "GET",
  handler: httpAction(handleKafalaSuccess),
});

export default http;

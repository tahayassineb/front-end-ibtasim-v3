import { describe, expect, it } from "vitest";
import { isConnectedWhatsAppWebhookEvent, isSuccessfulCheckoutStatus, timingSafeEqual } from "./httpHelpers";

describe("httpHelpers", () => {
  it("matches timing-safe strings only when they are identical", () => {
    expect(timingSafeEqual("abc123", "abc123")).toBe(true);
    expect(timingSafeEqual("abc123", "abc124")).toBe(false);
    expect(timingSafeEqual("short", "longer")).toBe(false);
  });

  it("recognizes the connected WhatsApp webhook shapes we rely on", () => {
    expect(isConnectedWhatsAppWebhookEvent({
      event: "connection.update",
      data: { status: "connected" },
    })).toBe(true);

    expect(isConnectedWhatsAppWebhookEvent({
      event: "session.status",
      data: { connection: "open" },
    })).toBe(true);

    expect(isConnectedWhatsAppWebhookEvent({
      event: "session.status",
      data: { status: "qr" },
    })).toBe(false);
  });

  it("treats only expected checkout statuses as successful", () => {
    expect(isSuccessfulCheckoutStatus(undefined)).toBe(true);
    expect(isSuccessfulCheckoutStatus(null)).toBe(true);
    expect(isSuccessfulCheckoutStatus("success")).toBe(true);
    expect(isSuccessfulCheckoutStatus("complete")).toBe(true);
    expect(isSuccessfulCheckoutStatus("completed")).toBe(true);
    expect(isSuccessfulCheckoutStatus("failed")).toBe(false);
    expect(isSuccessfulCheckoutStatus("cancelled")).toBe(false);
  });
});

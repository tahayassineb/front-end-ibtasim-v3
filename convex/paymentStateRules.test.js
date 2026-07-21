import { describe, expect, it } from "vitest";
import {
  shouldIgnoreDonationWebhookStatusUpdate,
  shouldIgnorePaymentAttemptStatusUpdate,
} from "./paymentStateRules";

describe("paymentStateRules", () => {
  it("ignores late failed or cancelled events after a completed card payment", () => {
    expect(shouldIgnorePaymentAttemptStatusUpdate("completed", "failed")).toBe(true);
    expect(shouldIgnorePaymentAttemptStatusUpdate("completed", "cancelled")).toBe(true);
    expect(shouldIgnorePaymentAttemptStatusUpdate("completed", "refunded")).toBe(false);
  });

  it("keeps refunded attempts terminal for later failure-like events", () => {
    expect(shouldIgnorePaymentAttemptStatusUpdate("refunded", "failed")).toBe(true);
    expect(shouldIgnorePaymentAttemptStatusUpdate("refunded", "cancelled")).toBe(true);
    expect(shouldIgnorePaymentAttemptStatusUpdate("refunded", "refunded")).toBe(false);
  });

  it("prevents legacy donation webhooks from rejecting an already verified donation", () => {
    expect(shouldIgnoreDonationWebhookStatusUpdate("verified", "rejected")).toBe(true);
    expect(shouldIgnoreDonationWebhookStatusUpdate("completed", "rejected")).toBe(true);
    expect(shouldIgnoreDonationWebhookStatusUpdate("pending", "rejected")).toBe(false);
  });
});

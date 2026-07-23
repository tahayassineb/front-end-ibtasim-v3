import { describe, expect, it } from "vitest";
import { getWhopWebhookDispatch } from "./whopWebhookRules";

describe("whopWebhookRules", () => {
  it("routes donation card success through attempt finalization when a payment attempt exists", () => {
    expect(
      getWhopWebhookDispatch({
        event: "payment.succeeded",
        paymentAttemptId: "attempt_123",
        donationId: "legacy_456",
        paymentId: "pay_1",
      })
    ).toEqual({
      domain: "card",
      action: "finalize_attempt",
      paymentAttemptId: "attempt_123",
      paymentId: "pay_1",
    });
  });

  it("routes legacy donation failures to rejection when there is no payment attempt", () => {
    expect(
      getWhopWebhookDispatch({
        event: "payment.failed",
        donationId: "don_1",
        paymentId: "pay_1",
      })
    ).toEqual({
      domain: "donation",
      action: "reject_donation",
      donationId: "don_1",
    });
  });

  it("routes kafala success with membership id to extend-or-process flow", () => {
    expect(
      getWhopWebhookDispatch({
        event: "payment.succeeded",
        paymentType: "kafala",
        donationId: "kdon_1",
        membershipId: "member_1",
        paymentId: "pay_1",
      })
    ).toEqual({
      domain: "kafala",
      action: "extend_or_process",
      membershipId: "member_1",
      donationId: "kdon_1",
      paymentId: "pay_1",
    });
  });

  it("ignores non-kafala payment events that do not carry payment metadata", () => {
    expect(
      getWhopWebhookDispatch({
        event: "payment.succeeded",
        paymentId: "pay_1",
      })
    ).toEqual({
      domain: "ignore",
      action: "noop",
      reason: "missing_metadata",
    });
  });
});

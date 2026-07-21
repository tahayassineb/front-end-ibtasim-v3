import { describe, expect, it } from "vitest";
import {
  buildAutoVerifiedDonationInsert,
  buildCompletedPaymentAttemptPatch,
  buildIgnoredPaymentAttemptWebhookPatch,
  buildTerminalPaymentAttemptPatch,
  buildVerifiedDonationPatch,
  getWhopVerificationNote,
} from "./paymentReconciliationHelpers";

describe("paymentReconciliationHelpers", () => {
  it("builds consistent Whop verification notes and verified donation patches", () => {
    expect(getWhopVerificationNote("pay_123")).toBe("Whop card payment auto-verified. Payment ID: pay_123");

    expect(
      buildVerifiedDonationPatch({
        donation: { verifiedAt: 10 },
        now: 20,
        whopPaymentId: "pay_123",
      }),
    ).toEqual({
      whopPaymentId: "pay_123",
      whopPaymentStatus: "paid",
      transactionReference: "pay_123",
      status: "verified",
      verifiedAt: 10,
      verificationNotes: "Whop card payment auto-verified. Payment ID: pay_123",
      updatedAt: 20,
    });
  });

  it("builds an auto-verified donation insert from a payment attempt", () => {
    expect(
      buildAutoVerifiedDonationInsert({
        now: 50,
        paymentAmount: 200,
        paymentAttempt: {
          userId: "user_1",
          projectId: "project_1",
          coversFees: true,
          isAnonymous: false,
          message: "Baraka",
        },
        whopPaymentId: "pay_123",
        whopPaymentStatus: "paid",
      }),
    ).toMatchObject({
      userId: "user_1",
      projectId: "project_1",
      amount: 200,
      paymentMethod: "card_whop",
      status: "verified",
      whopPaymentId: "pay_123",
      whopPaymentStatus: "paid",
      transactionReference: "pay_123",
      verificationNotes: "Whop card payment auto-verified. Payment ID: pay_123",
      createdAt: 50,
      updatedAt: 50,
    });
  });

  it("builds replay-safe completed and ignored payment attempt patches", () => {
    const paymentAttempt = {
      whopPaymentId: "old_pay",
      webhookEvents: ["payment.succeeded"],
    };

    expect(
      buildCompletedPaymentAttemptPatch({
        donationId: "don_1",
        eventName: "payment.completed",
        now: 100,
        paymentAttempt,
        whopPaymentId: "pay_123",
      }),
    ).toEqual({
      donationId: "don_1",
      whopPaymentId: "pay_123",
      status: "completed",
      completedAt: 100,
      lastWebhookAt: 100,
      webhookEvents: ["payment.succeeded", "payment.completed"],
    });

    expect(
      buildIgnoredPaymentAttemptWebhookPatch({
        eventName: "payment.failed",
        now: 120,
        paymentAttempt,
        whopPaymentId: "pay_123",
      }),
    ).toEqual({
      whopPaymentId: "pay_123",
      lastWebhookAt: 120,
      webhookEvents: ["payment.succeeded", "payment.failed"],
    });
  });

  it("builds terminal failure, cancellation, and refund patches without clobbering unrelated timestamps", () => {
    const paymentAttempt = {
      whopPaymentId: "old_pay",
      webhookEvents: [],
      failureReason: "Old reason",
      failedAt: 5,
      completedAt: 6,
    };

    expect(
      buildTerminalPaymentAttemptPatch({
        eventName: "payment.failed",
        now: 200,
        paymentAttempt,
        reason: "Declined",
        status: "failed",
        whopPaymentId: "pay_123",
      }),
    ).toEqual({
      whopPaymentId: "pay_123",
      status: "failed",
      failureReason: "Declined",
      failedAt: 200,
      completedAt: 6,
      lastWebhookAt: 200,
      webhookEvents: ["payment.failed"],
    });

    expect(
      buildTerminalPaymentAttemptPatch({
        now: 220,
        paymentAttempt,
        status: "refunded",
      }),
    ).toEqual({
      whopPaymentId: "old_pay",
      status: "refunded",
      failureReason: "Old reason",
      failedAt: 5,
      completedAt: 220,
      lastWebhookAt: 220,
      webhookEvents: [],
    });
  });
});

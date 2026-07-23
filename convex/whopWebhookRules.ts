export function getWhopWebhookDispatch(input: {
  event?: string;
  paymentType?: string;
  paymentAttemptId?: string;
  donationId?: string;
  membershipId?: string;
  paymentId?: string;
  failureReason?: string;
}) {
  const event = input.event;
  const paymentId = input.paymentId ?? "";

  if (input.paymentType === "kafala") {
    if (event === "payment.succeeded") {
      if (input.membershipId) {
        return {
          domain: "kafala",
          action: "extend_or_process",
          membershipId: input.membershipId,
          donationId: input.donationId,
          paymentId,
        } as const;
      }

      if (input.donationId) {
        return {
          domain: "kafala",
          action: "process_donation",
          donationId: input.donationId,
          paymentId,
        } as const;
      }
    }

    if (event === "membership.cancelled" && input.membershipId) {
      return {
        domain: "kafala",
        action: "expire_membership",
        membershipId: input.membershipId,
      } as const;
    }

    return { domain: "ignore", action: "noop", reason: "unhandled_kafala_event" } as const;
  }

  if (!input.paymentAttemptId && !input.donationId) {
    return { domain: "ignore", action: "noop", reason: "missing_metadata" } as const;
  }

  if (event === "payment.succeeded") {
    if (input.paymentAttemptId) {
      return {
        domain: "card",
        action: "finalize_attempt",
        paymentAttemptId: input.paymentAttemptId,
        paymentId,
      } as const;
    }

    return {
      domain: "donation",
      action: "process_donation",
      donationId: input.donationId!,
      paymentId,
    } as const;
  }

  if (event === "payment.failed") {
    if (input.paymentAttemptId) {
      return {
        domain: "card",
        action: "mark_attempt_failed",
        paymentAttemptId: input.paymentAttemptId,
        paymentId,
        reason: input.failureReason ?? "Whop reported payment.failed",
      } as const;
    }

    return {
      domain: "donation",
      action: "reject_donation",
      donationId: input.donationId!,
    } as const;
  }

  if (event === "payment.refunded") {
    if (input.paymentAttemptId) {
      return {
        domain: "card",
        action: "mark_attempt_refunded",
        paymentAttemptId: input.paymentAttemptId,
        paymentId,
        reason: "Whop reported payment.refunded",
      } as const;
    }

    return {
      domain: "donation",
      action: "reject_donation",
      donationId: input.donationId!,
    } as const;
  }

  return { domain: "ignore", action: "noop", reason: "unhandled_event" } as const;
}

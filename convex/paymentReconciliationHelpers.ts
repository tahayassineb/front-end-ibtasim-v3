import { appendUnique } from "./paymentUtils";

export function getWhopVerificationNote(whopPaymentId: string) {
  return `Whop card payment auto-verified. Payment ID: ${whopPaymentId}`;
}

export function buildVerifiedDonationPatch({
  donation,
  now,
  whopPaymentId,
  whopPaymentStatus,
}: {
  donation: any;
  now: number;
  whopPaymentId: string;
  whopPaymentStatus?: string;
}) {
  return {
    whopPaymentId,
    whopPaymentStatus: whopPaymentStatus ?? "paid",
    transactionReference: whopPaymentId,
    status: "verified",
    verifiedAt: donation?.verifiedAt ?? now,
    verificationNotes: getWhopVerificationNote(whopPaymentId),
    updatedAt: now,
  };
}

export function buildAutoVerifiedDonationInsert({
  now,
  paymentAmount,
  paymentAttempt,
  whopPaymentId,
  whopPaymentStatus,
}: {
  now: number;
  paymentAmount: number;
  paymentAttempt: any;
  whopPaymentId: string;
  whopPaymentStatus?: string;
}) {
  return {
    userId: paymentAttempt.userId,
    projectId: paymentAttempt.projectId,
    amount: paymentAmount,
    currency: "MAD",
    coversFees: paymentAttempt.coversFees,
    paymentMethod: "card_whop",
    status: "verified",
    isAnonymous: paymentAttempt.isAnonymous,
    message: paymentAttempt.message,
    whopPaymentId,
    whopPaymentStatus: whopPaymentStatus ?? "paid",
    transactionReference: whopPaymentId,
    verifiedAt: now,
    verificationNotes: getWhopVerificationNote(whopPaymentId),
    createdAt: now,
    updatedAt: now,
  };
}

export function buildCompletedPaymentAttemptPatch({
  donationId,
  eventName,
  now,
  paymentAttempt,
  whopPaymentId,
}: {
  donationId: any;
  eventName?: string;
  now: number;
  paymentAttempt: any;
  whopPaymentId: string;
}) {
  return {
    donationId,
    whopPaymentId,
    status: "completed",
    completedAt: now,
    lastWebhookAt: now,
    webhookEvents: eventName
      ? appendUnique(paymentAttempt.webhookEvents, eventName)
      : paymentAttempt.webhookEvents,
  };
}

export function buildIgnoredPaymentAttemptWebhookPatch({
  eventName,
  now,
  paymentAttempt,
  whopPaymentId,
}: {
  eventName?: string;
  now: number;
  paymentAttempt: any;
  whopPaymentId?: string;
}) {
  return {
    whopPaymentId: whopPaymentId ?? paymentAttempt.whopPaymentId,
    lastWebhookAt: now,
    webhookEvents: eventName
      ? appendUnique(paymentAttempt.webhookEvents, eventName)
      : paymentAttempt.webhookEvents,
  };
}

export function buildTerminalPaymentAttemptPatch({
  eventName,
  now,
  paymentAttempt,
  reason,
  status,
  whopPaymentId,
}: {
  eventName?: string;
  now: number;
  paymentAttempt: any;
  reason?: string;
  status: "failed" | "refunded" | "cancelled";
  whopPaymentId?: string;
}) {
  return {
    whopPaymentId: whopPaymentId ?? paymentAttempt.whopPaymentId,
    status,
    failureReason: reason ?? paymentAttempt.failureReason,
    failedAt: status === "failed" || status === "cancelled" ? now : paymentAttempt.failedAt,
    completedAt: status === "refunded" ? now : paymentAttempt.completedAt,
    lastWebhookAt: now,
    webhookEvents: eventName
      ? appendUnique(paymentAttempt.webhookEvents, eventName)
      : paymentAttempt.webhookEvents,
  };
}

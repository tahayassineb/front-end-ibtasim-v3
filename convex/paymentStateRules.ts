export function shouldIgnorePaymentAttemptStatusUpdate(
  currentStatus: "pending" | "processing" | "completed" | "failed" | "refunded" | "cancelled",
  nextStatus: "failed" | "refunded" | "cancelled"
) {
  if (currentStatus === "completed") {
    return nextStatus === "failed" || nextStatus === "cancelled";
  }

  if (currentStatus === "refunded") {
    return nextStatus === "failed" || nextStatus === "cancelled";
  }

  return false;
}

export function shouldIgnoreDonationWebhookStatusUpdate(
  currentStatus:
    | "pending"
    | "awaiting_receipt"
    | "awaiting_verification"
    | "verified"
    | "rejected"
    | "cancelled"
    | "completed",
  nextStatus: "rejected"
) {
  return (currentStatus === "verified" || currentStatus === "completed") && nextStatus === "rejected";
}

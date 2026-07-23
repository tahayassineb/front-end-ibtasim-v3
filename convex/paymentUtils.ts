export function normalizeBaseUrl(value?: string): string | undefined {
  if (!value) return undefined;
  return value.trim().replace(/\/+$/, "");
}

export function extractWhopError(data: any, status: number): string {
  if (typeof data?.message === "string") return data.message;
  if (typeof data?.error === "string") return data.error;
  if (typeof data?.error?.message === "string") return data.error.message;
  if (Array.isArray(data?.errors) && typeof data.errors[0]?.message === "string") {
    return data.errors[0].message;
  }
  return `Whop API failed with HTTP ${status}`;
}

export function appendUnique(values: string[] | undefined, nextValue: string): string[] {
  return Array.from(new Set([...(values ?? []), nextValue]));
}

export function getStoredPaymentAmount(paymentAttempt: any): number {
  if (typeof paymentAttempt?.amount === "number") return paymentAttempt.amount;
  if (typeof paymentAttempt?.amountCents === "number") return paymentAttempt.amountCents / 100;
  return 0;
}

export function validateAmountMAD(amount: number): number {
  if (amount <= 0) {
    throw new Error("Donation amount must be greater than zero.");
  }
  return amount;
}

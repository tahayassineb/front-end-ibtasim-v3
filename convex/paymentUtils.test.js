import { describe, expect, it } from "vitest";
import { appendUnique, extractWhopError, getStoredPaymentAmount, normalizeBaseUrl, validateAmountMAD } from "./paymentUtils";

describe("paymentUtils", () => {
  it("deduplicates repeated webhook event names for idempotency tracking", () => {
    expect(appendUnique(["payment.succeeded"], "payment.succeeded")).toEqual(["payment.succeeded"]);
    expect(appendUnique(["payment.failed"], "payment.refunded")).toEqual(["payment.failed", "payment.refunded"]);
  });

  it("reads stored amounts from current and legacy payment shapes", () => {
    expect(getStoredPaymentAmount({ amount: 125 })).toBe(125);
    expect(getStoredPaymentAmount({ amountCents: 12500 })).toBe(125);
    expect(getStoredPaymentAmount({})).toBe(0);
  });

  it("normalizes base urls and validates MAD amounts", () => {
    expect(normalizeBaseUrl("https://example.com///")).toBe("https://example.com");
    expect(validateAmountMAD(50)).toBe(50);
    expect(() => validateAmountMAD(0)).toThrow(/greater than zero/i);
  });

  it("extracts the most useful Whop error message", () => {
    expect(extractWhopError({ error: { message: "bad request" } }, 400)).toBe("bad request");
    expect(extractWhopError({}, 502)).toBe("Whop API failed with HTTP 502");
  });
});

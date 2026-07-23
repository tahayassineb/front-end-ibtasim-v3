import { describe, expect, it } from "vitest";
import { normalizeEmail } from "./email";

describe("normalizeEmail", () => {
  it("trims whitespace and normalizes casing", () => {
    expect(normalizeEmail("  TahaBusiness@gmail.com  ")).toBe("tahabusiness@gmail.com");
  });

  it("leaves an already normalized email unchanged", () => {
    expect(normalizeEmail("association.ibtassim@gmail.com")).toBe("association.ibtassim@gmail.com");
  });
});

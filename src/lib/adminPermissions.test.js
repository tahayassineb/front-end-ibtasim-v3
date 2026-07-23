import { describe, expect, it } from "vitest";
import { can, canAccessPath, normalizeAdminRole } from "./adminPermissions";

describe("adminPermissions", () => {
  it("normalizes legacy roles to owner", () => {
    expect(normalizeAdminRole("admin")).toBe("owner");
    expect(normalizeAdminRole("super_admin")).toBe("owner");
  });

  it("keeps receipt center restricted to export-capable roles", () => {
    expect(can("owner", "receipts:export")).toBe(true);
    expect(can("manager", "receipts:export")).toBe(true);
    expect(can("validator", "receipts:export")).toBe(false);
    expect(can("viewer", "receipts:export")).toBe(false);
  });

  it("uses the stricter receipt access gate for /admin/receipts", () => {
    expect(canAccessPath("owner", "/admin/receipts")).toBe(true);
    expect(canAccessPath("manager", "/admin/receipts")).toBe(true);
    expect(canAccessPath("validator", "/admin/receipts")).toBe(false);
    expect(canAccessPath("viewer", "/admin/receipts")).toBe(false);
  });
});

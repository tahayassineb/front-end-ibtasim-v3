import { describe, expect, it } from "vitest";
import { canChangeRole, canInviteRole, canRole, effectiveRole } from "./permissions";
import { sanitizePublicConfigValue } from "./config";

describe("permissions RBAC helpers", () => {
  it("grants admin read to all roles", () => {
    expect(canRole("owner", "admin:read")).toBe(true);
    expect(canRole("manager", "admin:read")).toBe(true);
    expect(canRole("validator", "admin:read")).toBe(true);
    expect(canRole("viewer", "admin:read")).toBe(true);
  });

  it("restricts dangerous permissions to the intended roles", () => {
    expect(canRole("owner", "admin:settings")).toBe(true);
    expect(canRole("manager", "admin:settings")).toBe(false);
    expect(canRole("validator", "verification:write")).toBe(true);
    expect(canRole("viewer", "verification:write")).toBe(false);
  });

  it("enforces invitation and role-change boundaries", () => {
    expect(canInviteRole("owner", "manager")).toBe(true);
    expect(canInviteRole("owner", "owner")).toBe(false);
    expect(canInviteRole("manager", "validator")).toBe(true);
    expect(canInviteRole("manager", "manager")).toBe(false);
    expect(canChangeRole("owner", "manager")).toBe(true);
    expect(canChangeRole("manager", "viewer")).toBe(false);
  });

  it("defaults missing roles to owner compatibility", () => {
    expect(effectiveRole(undefined)).toBe("owner");
  });

  it("sanitizes public config responses so admin-only fields do not leak", () => {
    const bankInfo = sanitizePublicConfigValue("bank_info", JSON.stringify({
      accountHolder: "Association Ibtasim",
      rib: "123",
      bankName: "Example Bank",
      agency: "Main",
      associationPhone: "+212600000000",
      adminPhone: "+212611111111",
      apiKey: "secret",
    }));

    expect(bankInfo).toBe(JSON.stringify({
      accountHolder: "Association Ibtasim",
      rib: "123",
      bankName: "Example Bank",
      agency: "Main",
      associationPhone: "+212600000000",
    }));
  });
});

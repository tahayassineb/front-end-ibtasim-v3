import { describe, expect, it } from "vitest";
import { buildAdminUser, normalizeAdminEmail } from "./adminLoginHelpers";

describe("adminLoginHelpers", () => {
  it("normalizes admin email before authentication", () => {
    expect(normalizeAdminEmail("  TahaBusiness@gmail.com  ")).toBe("tahabusiness@gmail.com");
  });

  it("preserves the issued session token in the stored admin user", () => {
    expect(buildAdminUser({
      adminId: "admin_1",
      sessionToken: "session_1",
      userId: "user_1",
      email: "tahabusiness@gmail.com",
      fullName: "Taha Business",
      phoneNumber: "+212600000000",
      role: "owner",
    })).toEqual({
      id: "admin_1",
      sessionToken: "session_1",
      userId: "user_1",
      email: "tahabusiness@gmail.com",
      name: "Taha Business",
      phone: "+212600000000",
      role: "owner",
      isAdmin: true,
    });
  });
});

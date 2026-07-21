import { describe, expect, it } from "vitest";
import {
  buildAdminUserUpdate,
  getCurrentAdminLabel,
  getVisibleAdminSections,
  hydrateAdminUser,
  isActiveAdminItem,
  shouldSyncAdminUser,
} from "./adminLayoutHelpers";

describe("adminLayoutHelpers", () => {
  it("filters visible sections based on admin role permissions", () => {
    const viewerSections = getVisibleAdminSections("viewer");
    const viewerPaths = viewerSections.flatMap((section) => section.items.map((item) => item.path));

    expect(viewerPaths).toContain("/admin");
    expect(viewerPaths).not.toContain("/admin/settings");
    expect(viewerPaths).not.toContain("/admin/verification");
  });

  it("hydrates the admin user from the latest session payload", () => {
    const hydrated = hydrateAdminUser(
      { role: "viewer", name: "Old", email: "old@test", phone: "123", isActive: false },
      { role: "manager", fullName: "New Name", email: "new@test", phoneNumber: "999", isActive: true },
    );

    expect(hydrated.role).toBe("manager");
    expect(hydrated.name).toBe("New Name");
    expect(hydrated.phone).toBe("999");
    expect(hydrated.isActive).toBe(true);
  });

  it("builds the sync payload and detects when a user update is needed", () => {
    const user = { role: "viewer", name: "Old", email: "old@test", phone: "123", isActive: false };
    const nextUser = buildAdminUserUpdate(user, {
      role: "owner",
      fullName: "Owner",
      email: "owner@test",
      phoneNumber: "456",
      isActive: true,
    });

    expect(nextUser.role).toBe("owner");
    expect(shouldSyncAdminUser(user, nextUser)).toBe(true);
    expect(shouldSyncAdminUser(nextUser, nextUser)).toBe(false);
  });

  it("matches active admin items and resolves the current header title", () => {
    expect(isActiveAdminItem({ path: "/admin", exact: true }, "/admin/dashboard")).toBe(true);
    expect(isActiveAdminItem({ path: "/admin/projects" }, "/admin/projects/123")).toBe(true);
    expect(getCurrentAdminLabel("/admin/stories")).toBe("القصص");
    expect(getCurrentAdminLabel("/admin/unknown")).toBe("لوحة التحكم");
  });
});

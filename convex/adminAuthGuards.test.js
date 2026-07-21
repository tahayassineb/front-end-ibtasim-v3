import { beforeEach, describe, expect, it, vi } from "vitest";

const getAdminSessionRecord = vi.fn();
const touchAdminSession = vi.fn();

vi.mock("./adminSessions", () => ({
  getAdminSessionRecord,
  touchAdminSession,
}));

describe("admin auth guards", () => {
  beforeEach(() => {
    getAdminSessionRecord.mockReset();
    touchAdminSession.mockReset();
  });

  it("requires a valid admin session and refreshes last-seen state", async () => {
    const { requireAdminSession } = await import("./permissions");
    const ctx = {};
    const resolved = {
      session: { _id: "session_1" },
      admin: { _id: "admin_1", role: "manager", isActive: true },
    };

    getAdminSessionRecord.mockResolvedValue(resolved);
    touchAdminSession.mockResolvedValue(undefined);

    const actor = await requireAdminSession(ctx, "token_1", "content:write");

    expect(getAdminSessionRecord).toHaveBeenCalledWith(ctx, "token_1");
    expect(touchAdminSession).toHaveBeenCalledWith(ctx, "session_1");
    expect(actor).toMatchObject({ _id: "admin_1", role: "manager" });
  });

  it("rejects missing or inactive admin sessions", async () => {
    const { requireAdminSession } = await import("./permissions");
    getAdminSessionRecord.mockResolvedValue(null);

    await expect(requireAdminSession({}, "bad_token", "admin:read")).rejects.toThrow(
      /inactive or invalid/i
    );
    expect(touchAdminSession).not.toHaveBeenCalled();
  });

  it("rejects authenticated admins who lack the requested permission", async () => {
    const { requireAdminSession } = await import("./permissions");
    getAdminSessionRecord.mockResolvedValue({
      session: { _id: "session_2" },
      admin: { _id: "admin_2", role: "viewer", isActive: true },
    });

    await expect(requireAdminSession({}, "viewer_token", "admin:settings")).rejects.toThrow(
      /do not have permission/i
    );
    expect(touchAdminSession).not.toHaveBeenCalled();
  });

  it("requires a session token in higher-level admin actor helpers", async () => {
    const { requireAdminActor } = await import("./adminHelpers");

    await expect(requireAdminActor({}, {}, "admin:read")).rejects.toThrow(/session required/i);
  });
});

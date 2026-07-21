import { describe, expect, it } from "vitest";
import {
  getAdminSessionQueryArgs,
  isMissingAdminSession,
  isMissingUserSession,
  resolveAdminRouteState,
  resolveFontSystem,
} from "./routeGuardHelpers";

describe("routeGuardHelpers", () => {
  it("builds admin session query args only when an authenticated admin token exists", () => {
    expect(getAdminSessionQueryArgs(true, { sessionToken: "token_1" })).toEqual({
      sessionToken: "token_1",
    });
    expect(getAdminSessionQueryArgs(false, { sessionToken: "token_1" })).toBe("skip");
    expect(getAdminSessionQueryArgs(true, {})).toBe("skip");
  });

  it("detects missing user and admin sessions", () => {
    expect(isMissingUserSession(false)).toBe(true);
    expect(isMissingUserSession(true)).toBe(false);
    expect(isMissingAdminSession(true, { id: "admin_1", sessionToken: "token_1" })).toBe(false);
    expect(isMissingAdminSession(true, { id: "admin_1" })).toBe(true);
  });

  it("resolves admin route states for redirect, loading, and allowed branches", () => {
    expect(resolveAdminRouteState({ isAuthenticated: false, user: null, isAdmin: undefined })).toBe("redirect");
    expect(resolveAdminRouteState({
      isAuthenticated: true,
      user: { id: "admin_1", sessionToken: "token_1" },
      isAdmin: undefined,
    })).toBe("loading");
    expect(resolveAdminRouteState({
      isAuthenticated: true,
      user: { id: "admin_1", sessionToken: "token_1" },
      isAdmin: false,
    })).toBe("redirect");
    expect(resolveAdminRouteState({
      isAuthenticated: true,
      user: { id: "admin_1", sessionToken: "token_1" },
      isAdmin: true,
    })).toBe("allowed");
  });

  it("normalizes the font system flag to supported values", () => {
    expect(resolveFontSystem("legacy")).toBe("legacy");
    expect(resolveFontSystem("anything_else")).toBe("thmanyah");
    expect(resolveFontSystem(undefined)).toBe("thmanyah");
  });
});

import { describe, expect, it, vi } from "vitest";
import { handleStorageRequest } from "./httpStorage";

const requestFor = (storageId = "storageObject123456") =>
  new Request(`https://example.convex.site/storage/${storageId}`);

describe("handleStorageRequest", () => {
  it("checks references through an internal query before redirecting", async () => {
    const runQuery = vi.fn().mockResolvedValue(true);
    const getUrl = vi.fn().mockResolvedValue("https://example.convex.cloud/api/storage/object");

    const response = await handleStorageRequest({ runQuery, storage: { getUrl } }, requestFor());

    expect(runQuery).toHaveBeenCalledWith(expect.anything(), {
      storageId: "storageObject123456",
    });
    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe(
      "https://example.convex.cloud/api/storage/object"
    );
  });

  it("does not expose unreferenced storage objects", async () => {
    const getUrl = vi.fn();
    const response = await handleStorageRequest(
      { runQuery: vi.fn().mockResolvedValue(false), storage: { getUrl } },
      requestFor()
    );

    expect(response.status).toBe(404);
    expect(getUrl).not.toHaveBeenCalled();
  });
});

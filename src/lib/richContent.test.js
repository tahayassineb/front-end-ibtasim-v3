import { describe, expect, it } from "vitest";
import { sanitizeRichHtml } from "./richContent";

describe("sanitizeRichHtml", () => {
  it("removes script-like tags", () => {
    const dirty = '<p>Hello</p><script>alert(1)</script><style>body{display:none}</style>';
    expect(sanitizeRichHtml(dirty)).toBe("<p>Hello</p>");
  });

  it("removes inline event handlers", () => {
    const dirty = '<img src="/x.png" onerror="alert(1)" /><p onclick="hack()">Hi</p>';
    const clean = sanitizeRichHtml(dirty);
    expect(clean).toContain('<img src="/x.png"');
    expect(clean).not.toContain("onerror");
    expect(clean).not.toContain("onclick");
  });

  it("removes javascript urls but keeps safe markup", () => {
    const dirty = '<a href="javascript:alert(1)">Click</a><p>Safe</p>';
    const clean = sanitizeRichHtml(dirty);
    expect(clean).not.toContain("javascript:");
    expect(clean).toContain("<p>Safe</p>");
  });
});

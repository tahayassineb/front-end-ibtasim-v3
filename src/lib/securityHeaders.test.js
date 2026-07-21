import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  APP_ASSET_SECURITY_HEADERS,
  APP_BASE_SECURITY_HEADERS,
} from "./securityHeaders";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "../..");
const netlifyToml = fs.readFileSync(path.join(projectRoot, "netlify.toml"), "utf8");
const vercelJson = JSON.parse(fs.readFileSync(path.join(projectRoot, "vercel.json"), "utf8"));

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

describe("deployment security headers", () => {
  it("keeps Netlify base and asset headers aligned with the canonical security policy", () => {
    for (const [key, value] of Object.entries(APP_BASE_SECURITY_HEADERS)) {
      expect(netlifyToml).toMatch(new RegExp(`${escapeRegExp(key)}\\s*=\\s*"${escapeRegExp(value)}"`));
    }

    for (const [key, value] of Object.entries(APP_ASSET_SECURITY_HEADERS)) {
      expect(netlifyToml).toMatch(new RegExp(`${escapeRegExp(key)}\\s*=\\s*"${escapeRegExp(value)}"`));
    }
  });

  it("keeps Vercel base and asset headers aligned with the canonical security policy", () => {
    const rootHeaders = Object.fromEntries(
      vercelJson.headers.find((entry) => entry.source === "/(.*)").headers.map((header) => [header.key, header.value]),
    );
    const assetHeaders = Object.fromEntries(
      vercelJson.headers.find((entry) => entry.source === "/assets/(.*)").headers.map((header) => [header.key, header.value]),
    );

    expect(rootHeaders).toMatchObject(APP_BASE_SECURITY_HEADERS);
    expect(assetHeaders).toMatchObject(APP_ASSET_SECURITY_HEADERS);
  });
});

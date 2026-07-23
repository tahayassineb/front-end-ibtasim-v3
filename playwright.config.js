import process from "node:process";
import { defineConfig } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:4173";
const previewCommand =
  process.env.PLAYWRIGHT_WEB_SERVER_COMMAND || "npm run dev:smoke";
const channel = process.env.PLAYWRIGHT_CHROME_CHANNEL || undefined;
const executablePath = process.env.PLAYWRIGHT_EXECUTABLE_PATH || undefined;

const browserLaunch = {
  browserName: "chromium",
  ...(channel ? { channel } : {}),
  ...(executablePath ? { executablePath } : {}),
};

export default defineConfig({
  testDir: "./tests/smoke",
  timeout: 30_000,
  webServer: {
    command: previewCommand,
    url: baseURL,
    reuseExistingServer: true,
    timeout: 240_000,
  },
  use: {
    baseURL,
    headless: true,
    viewport: { width: 1440, height: 960 },
  },
  projects: [
    { name: "desktop-chromium", use: browserLaunch },
    { name: "mobile-chromium", use: { ...browserLaunch, viewport: { width: 390, height: 844 } } },
  ],
});

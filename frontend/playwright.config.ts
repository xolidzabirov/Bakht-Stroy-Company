import { defineConfig, devices } from "@playwright/test";
import { E2E_API, E2E_API_PORT, E2E_SITE, E2E_SITE_PORT } from "./e2e/config";

/**
 * End-to-end tests (npm run e2e): a real browser goes through the shop like a customer and the admin.
 * Playwright starts its own API (port 8001, test database, codes in the log) and a production build
 * of the site (port 3002), so the developer's servers and data are not touched.
 * Uses the installed Google Chrome — no browser download.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 120_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: {
    baseURL: E2E_SITE,
    locale: "ru-RU",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], channel: "chrome" } },
    { name: "phone", use: { ...devices["Pixel 7"], channel: "chrome" }, testMatch: /pages\.spec\.ts/ },
  ],
  webServer: [
    {
      command: "node e2e/backend.mjs",
      // A real API answer (a broken PHP router would still return 200 on /up).
      url: `http://127.0.0.1:${E2E_API_PORT}/api/v1/health`,
      // The first run seeds the demo catalog with pictures (up to ~20 minutes on Windows); later runs start at once.
      timeout: 1_800_000,
      reuseExistingServer: !process.env.CI,
      stdout: "pipe",
    },
    {
      command: `npx next build && npx next start -p ${E2E_SITE_PORT}`,
      url: `${E2E_SITE}/robots.txt`,
      timeout: 600_000,
      reuseExistingServer: !process.env.CI,
      env: { API_URL: E2E_API, NEXT_PUBLIC_API_URL: E2E_API, NEXT_PUBLIC_SITE_URL: E2E_SITE, NEXT_PUBLIC_REVERB_KEY: "" },
    },
  ],
});

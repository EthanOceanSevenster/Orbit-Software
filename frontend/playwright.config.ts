import { defineConfig, devices } from "@playwright/test";

/**
 * Browser tests against the running dev servers.
 *
 * It does not start them. Both the Django API and this site have to be up,
 * and the owner's password comes from the environment, so a password is never
 * committed:
 *
 *   E2E_OWNER_PASSWORD=... npx playwright test
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  timeout: 45_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});

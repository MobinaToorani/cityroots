import { defineConfig, devices } from "@playwright/test";
import { E2E_OUTBOX, E2E_WEBHOOK_SECRET } from "./tests/e2e/constants";

const PORT = Number(process.env.E2E_PORT ?? 3100);

/** Runs against a production build (`npm run build` first). */
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: { baseURL: `http://localhost:${PORT}`, trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] }, grep: /@mobile/ },
  ],
  webServer: {
    command: `npx next start -p ${PORT}`,
    port: PORT,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: {
      EMAIL_LOG_ONLY: "true",
      // Sign-in links land here so tests can follow them (see tests/e2e/helpers.ts).
      EMAIL_OUTBOX_FILE: E2E_OUTBOX,
      // Webhook tests sign their own events; checkout itself is never called.
      STRIPE_SECRET_KEY: "sk_test_e2e_not_a_real_key",
      STRIPE_WEBHOOK_SECRET: E2E_WEBHOOK_SECRET,
    },
  },
});

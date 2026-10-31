/** Shared by playwright.config.ts (server env) and the tests that rely on it. */
export const E2E_OUTBOX = ".data/e2e-outbox.jsonl";
export const E2E_WEBHOOK_SECRET = "whsec_e2e_local_only";
/** ADMIN_EMAILS in the test server, so admin flows can sign in as this address. */
export const E2E_ADMIN = "e2e-admin@example.com";

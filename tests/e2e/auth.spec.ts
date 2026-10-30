import { expect, test } from "@playwright/test";

test("account requires sign-in and returns there afterwards", async ({ page }) => {
  await page.goto("/account");
  await expect(page).toHaveURL(/\/signin\?callbackUrl=%2Faccount/);
  await expect(page.getByRole("heading", { name: "Sign in to CityRoots" })).toBeVisible();
});

test("invalid email shows an inline error wired to the field", async ({ page }) => {
  await page.goto("/signin");
  const field = page.getByLabel("Email address");
  await field.fill("not-an-email");
  await page.getByRole("button", { name: "Email me a sign-in link" }).click();
  await expect(page.getByText("Enter an email address like name@example.com")).toBeVisible();
  await expect(field).toHaveAttribute("aria-invalid", "true");
  const describedBy = await field.getAttribute("aria-describedby");
  expect(describedBy).toMatch(/-error/);
});

test("valid email lands on the check-your-email page", async ({ page }) => {
  await page.goto("/signin");
  await page.getByLabel("Email address").fill(`e2e-${Date.now()}@example.com`);
  await page.getByRole("button", { name: "Email me a sign-in link" }).click();
  await expect(page).toHaveURL(/\/signin\/check-email/);
  await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible();
});

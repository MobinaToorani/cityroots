import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const PAGES = [
  { name: "home", path: "/" },
  { name: "city", path: "/city/oakville" },
  { name: "explorer", path: "/explore?city=markham" },
  { name: "about", path: "/about" },
  { name: "sign in", path: "/signin" },
  { name: "events", path: "/events" },
  { name: "submit", path: "/submit" },
  { name: "explorer map", path: "/explore?city=newmarket&view=map" },
  { name: "pricing", path: "/pricing" },
  { name: "planner intro", path: "/planner" },
  { name: "privacy", path: "/privacy" },
  { name: "terms", path: "/terms" },
];

test("an open filter menu has no WCAG 2.2 AA violations @mobile", async ({ page }) => {
  await page.goto("/explore?city=markham");
  await page.locator("summary", { hasText: /^Category/ }).click();
  await expect(page.getByRole("group", { name: "Category" })).toBeVisible();
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.nodes.length} (${v.help})`)).toEqual([]);
});

for (const { name, path } of PAGES) {
  test(`${name} has no WCAG 2.2 AA violations @mobile`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.length} (${v.help})`)).toEqual([]);
  });
}

test("place detail has no WCAG 2.2 AA violations", async ({ page }) => {
  await page.goto("/explore?city=burlington");
  await page.locator("main article a").first().click();
  await page.waitForURL(/\/places\//);
  // Audit the settled page, not the moment of the route swap.
  await expect(page).toHaveTitle(/\| CityRoots$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.nodes.length} (${v.help})`)).toEqual([]);
});

test("skip link moves focus to main content", async ({ page }) => {
  await page.goto("/explore");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to content" });
  await expect(skip).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main")).toBeFocused();
});

test("command palette has no WCAG 2.2 AA violations", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("ControlOrMeta+k");
  await page.getByRole("combobox").fill("park");
  await expect(page.getByRole("option").first()).toBeVisible();
  const results = await new AxeBuilder({ page })
    .include("dialog")
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.nodes.length} (${v.help})`)).toEqual([]);
});

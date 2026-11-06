import { expect, test } from "@playwright/test";
import { openMenu } from "./helpers";

test.describe("explorer with JavaScript", () => {
  test("filters update in place, without a full page load", async ({ page }) => {
    await page.goto("/explore?city=markham");
    await page.evaluate(() => ((window as unknown as { marker: number }).marker = 1));
    const before = (await page.getByRole("status").first().textContent()) ?? "";
    await openMenu(page, "Budget");
    await page.getByRole("group", { name: "Budget" }).getByRole("link", { name: /^Free/ }).click();
    await expect(page).toHaveURL(/cost=free/);
    await expect(page.getByRole("status").first()).not.toHaveText(before);
    await expect(page.locator("main [aria-busy='true']")).toHaveCount(0);
    const badges = await page
      .locator("main article")
      .evaluateAll((cards) => cards.map((c) => /Free/.test(c.textContent ?? "")));
    expect(badges.every(Boolean)).toBe(true);
    // Same document: the marker survives because this was not a full navigation.
    expect(await page.evaluate(() => (window as unknown as { marker?: number }).marker)).toBe(1);
  });

  test("filter menus open one at a time and close with Escape", async ({ page }) => {
    await page.goto("/explore");
    await openMenu(page, "Category");
    await expect(page.getByRole("group", { name: "Category" })).toBeVisible();
    await openMenu(page, "Budget");
    await expect(page.getByRole("group", { name: "Category" })).toBeHidden();
    await expect(page.getByRole("group", { name: "Budget" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("group", { name: "Budget" })).toBeHidden();
    await expect(page.locator("summary", { hasText: /^Budget/ })).toBeFocused();
  });

  test("the header city picker changes the city in place", async ({ page }) => {
    await page.goto("/explore");
    await openMenu(page, "All cities");
    await page
      .getByRole("group", { name: "Your city" })
      .getByRole("link", { name: "Oakville" })
      .click();
    await expect(page).toHaveURL(/\/explore\?.*city=oakville/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Things to do in Oakville");
    await expect(page.getByRole("group", { name: "Your city" })).toBeHidden();
  });

  test("one-tap filters and Surprise me respect the city", async ({ page }) => {
    await page.goto("/explore?city=oakville");
    await page.getByRole("link", { name: "Free", exact: true }).click();
    await expect(page).toHaveURL(/cost=free/);
    await page.getByRole("link", { name: "Surprise me" }).click();
    await page.waitForURL(/\/places\//);
  });

  test("search as you type narrows results", async ({ page }) => {
    await page.goto("/explore");
    await page.getByRole("searchbox", { name: "Search places" }).fill("library");
    await expect(page).toHaveURL(/q=library/);
    await expect(page.getByRole("status").first()).toContainText("library");
  });

  test("map view shows pins and a card for the selected place", async ({ page }) => {
    await page.goto("/explore?city=newmarket&cat=physical");
    const href = await page.locator("main article a").first().getAttribute("href");
    const id = href?.split("/").pop() ?? "";
    await page.goto(`/explore?city=newmarket&view=map&place=${id}`);
    await expect(page.locator(".maplibregl-canvas")).toBeVisible();
    await expect(page.getByText(/on the map/)).toBeVisible();
    await expect(page.getByRole("link", { name: "View details" })).toHaveAttribute(
      "href",
      `/places/${id}`,
    );
    await page.getByRole("button", { name: "Close place card" }).click();
    await expect(page).not.toHaveURL(/place=/);
  });

  test("switching to the map keeps the filters", async ({ page }) => {
    await page.goto("/explore?city=oakville&cost=free");
    await page.getByRole("radio", { name: "Map" }).click();
    await expect(page).toHaveURL(/view=map/);
    await expect(page).toHaveURL(/cost=free/);
    await expect(page.locator(".maplibregl-canvas")).toBeVisible();
  });
});

test.describe("command palette", () => {
  test("finds a place despite a typo and opens it from the keyboard", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("ControlOrMeta+k");
    const box = page.getByRole("combobox", { name: "Search places, cities, and categories" });
    await expect(box).toBeFocused();
    await box.fill("libray");
    await expect(page.getByRole("dialog").getByRole("option").first()).toContainText(/Library/);
    await page.keyboard.press("Enter");
    await page.waitForURL(/\/places\//);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Library");

    // The pick shows up under recent searches next time.
    await page.keyboard.press("ControlOrMeta+k");
    await expect(page.getByRole("group", { name: "Recent" }).getByRole("option")).toHaveCount(1);
  });

  test("the trigger is a working link without JavaScript", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/about");
    await page.getByRole("link", { name: "Search" }).first().click();
    await expect(page).toHaveURL(/\/explore/);
    await context.close();
  });
});

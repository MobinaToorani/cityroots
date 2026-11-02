import { expect, test } from "@playwright/test";

test.describe("explorer with JavaScript", () => {
  test("filters update in place, without a full page load", async ({ page }) => {
    await page.goto("/explore?city=markham");
    await page.evaluate(() => ((window as unknown as { marker: number }).marker = 1));
    const before = (await page.getByRole("status").first().textContent()) ?? "";
    await page
      .getByRole("group", { name: "Cost and type" })
      .getByRole("link", { name: "Free" })
      .click();
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

  test("search as you type narrows results", async ({ page }) => {
    await page.goto("/explore");
    await page.getByRole("searchbox", { name: "Search places" }).fill("library");
    await expect(page).toHaveURL(/q=library/);
    await expect(page.getByRole("status").first()).toContainText("library");
  });

  test("map view shows pins and a card for the selected place", async ({ page }) => {
    await page.goto("/explore?city=newmarket");
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
    await expect(page.getByRole("option").first()).toContainText(/Library/);
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

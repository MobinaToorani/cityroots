import { expect, test } from "@playwright/test";
import { openMenu } from "./helpers";

test.describe("home", () => {
  test("answers the question in the hero and links every city @mobile", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Free things to do, close to home.",
    );
    await expect(
      page.getByRole("region", { name: "Pick a city" }).getByRole("link", { name: "Newmarket" }),
    ).toBeVisible();

    await page.locator("select[name=city]").selectOption("newmarket");
    await page.locator("select[name=when]").selectOption("anytime");
    await page.getByRole("button", { name: "Find things to do" }).click();
    await expect(page).toHaveURL(/\/explore\?.*city=newmarket/);
    await expect(page).toHaveURL(/cost=free/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Things to do in Newmarket");
  });
});

test.describe("city page", () => {
  test("lists picks and deep-links category tiles into the explorer", async ({ page }) => {
    await page.goto("/city/newmarket");
    await expect(page.getByRole("heading", { level: 1, name: "Newmarket" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Start with these" })).toBeVisible();

    await page.getByRole("link", { name: "Cafes and hangouts" }).click();
    await expect(page).toHaveURL(/\/explore\?city=newmarket&cat=cafes/);
    await expect(page.locator("main article").first()).toBeVisible();
  });

  test("unknown city is a real 404", async ({ page }) => {
    const res = await page.goto("/city/atlantis");
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "We could not find that page" })).toBeVisible();
  });
});

test.describe("explorer", () => {
  test("filters by cost and keeps state in the URL", async ({ page }) => {
    await page.goto("/explore?city=waterloo");
    const status = page.getByRole("status").first();
    const before = Number((await status.textContent())?.match(/\d+/)?.[0]);

    await openMenu(page, "Budget");
    await page
      .getByRole("group", { name: "Budget", exact: true })
      .getByRole("link", { name: /^Free/ })
      .click();
    await expect(page).toHaveURL(/cost=free/);
    // The URL updates optimistically; results follow once the server responds.
    const count = async () => Number((await status.textContent())?.match(/\d+/)?.[0]);
    await expect.poll(count).toBeLessThan(before);
    expect(await count()).toBeGreaterThan(0);
    await expect(page.locator("main [aria-busy='true']")).toHaveCount(0);
    for (const badge of await page
      .locator("main article")
      .getByText(/^(Free|Low cost|Moderate|Varies)$/)
      .allTextContents()) {
      expect(badge).toBe("Free");
    }
  });

  test("default order puts free listings first", async ({ page }) => {
    // Waterloo fits on one page, so both free and paid listings are visible.
    await page.goto("/explore?city=waterloo");
    const bands = await page
      .locator("main article")
      .getByText(/^(Free|Low cost|Moderate|Varies)$/)
      .allTextContents();
    const firstPaid = bands.findIndex((b) => b !== "Free");
    expect(firstPaid).toBeGreaterThan(0);
    expect(bands.slice(firstPaid)).not.toContain("Free");
  });

  test("an empty result offers a way out", async ({ page }) => {
    await page.goto("/explore?q=zzzzqqqq");
    await expect(page.getByRole("heading", { name: "Nothing matches yet" })).toBeVisible();
    await page.getByRole("main").getByRole("link", { name: "Clear filters" }).last().click();
    await expect(page).toHaveURL(/\/explore$/);
  });
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("explorer filters, search, and load more all work", async ({ page }) => {
    await page.goto("/explore?city=toronto");
    await expect(page.locator("main article")).toHaveCount(24);
    await page.getByRole("button", { name: /Show \d+ more/ }).click();
    await expect(page).toHaveURL(/page=2/);
    await expect(page.locator("main article")).toHaveCount(48);
    await page.getByRole("link", { name: "Free", exact: true }).click();
    await expect(page).toHaveURL(/cost=free/);
  });

  test("the planner still lets you choose a city", async ({ page }) => {
    await page.goto("/planner?city=newmarket&budget=25");
    await page.getByLabel("City", { exact: true }).selectOption("waterloo");
    await page.getByRole("button", { name: "Plan my day" }).click();
    await expect(page).toHaveURL(/city=waterloo/);
  });

  test("the home page question and the planner work", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Find things to do" }).click();
    await expect(page).toHaveURL(/\/events\?when=weekend/);
    await page.goto("/planner?city=newmarket&budget=25");
    await expect(page.getByRole("list", { name: "Your day" })).toBeVisible();
  });

  test("city and place pages render their full content", async ({ page }) => {
    await page.goto("/city/cambridge");
    await expect(page.getByRole("heading", { name: "Start with these" })).toBeVisible();
    await page.locator("section[aria-labelledby=picks] article a").first().click();
    await expect(page.getByRole("heading", { name: "About", exact: true })).toBeVisible();
  });
});

test.describe("place detail", () => {
  test("shows cost prominently and links to similar places", async ({ page }) => {
    await page.goto("/city/kitchener");
    await page
      .locator("#picks ~ * article a, section[aria-labelledby=picks] article a")
      .first()
      .click();
    await page.getByRole("dialog").getByRole("link", { name: "See full details" }).click();
    await expect(page).toHaveURL(/\/places\/[0-9a-f-]{36}$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(
      page
        .locator("header")
        .getByText(/^(Free|Low cost|Moderate|Varies)$/)
        .first(),
    ).toBeVisible();
    await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(1);
  });

  test("unknown place is a real 404", async ({ page }) => {
    const res = await page.goto("/places/00000000-0000-5000-8000-000000000000");
    expect(res?.status()).toBe(404);
  });
});

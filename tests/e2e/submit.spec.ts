import { expect, test } from "@playwright/test";

// A fresh client address per test, so repeated local runs stay under the rate limit.
test.use({
  extraHTTPHeaders: { "x-forwarded-for": `198.51.100.${Math.floor(Math.random() * 250) + 1}` },
});

test.describe("submit", () => {
  test("explains what to fix and focuses the first problem @mobile", async ({ page }) => {
    await page.goto("/submit");
    await page.getByRole("button", { name: "Send for review" }).click();
    await expect(page.getByRole("alert").first()).toContainText("A few things need fixing");
    await expect(page.getByLabel("Name")).toBeFocused();
    await expect(page.getByText("Choose what it costs")).toBeVisible();
  });

  test("a valid suggestion lands on the thank-you page", async ({ page }) => {
    await page.goto("/submit?city=waterloo");
    await page.getByLabel("Name").fill(`E2E test garden ${Date.now()}`);
    await page.getByLabel("Category").selectOption("physical");
    await page
      .getByRole("group", { name: "What does it cost?" })
      .getByText("Free", { exact: true })
      .click();
    await page.getByLabel("Address or area").fill("Uptown Waterloo");
    await page
      .getByLabel("Why it belongs on CityRoots")
      .fill("A community garden with free plots and open weekend workdays for anyone.");
    await page.getByRole("button", { name: "Send for review" }).click();
    await page.waitForURL(/\/submit\/thanks\?type=new_place/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Thanks, your suggestion is in",
    );
  });

  test("place pages link to a correction form for that place", async ({ page }) => {
    await page.goto("/explore?city=vaughan");
    await page.locator("main article a").first().click();
    await page.waitForURL(/\/places\//);
    const name = (await page.getByRole("heading", { level: 1 }).textContent()) ?? "";
    await page.getByRole("link", { name: "Suggest a correction" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Suggest a correction");
    await expect(page.getByText(`Correcting ${name}`)).toBeVisible();
    await expect(page.getByRole("group", { name: "What needs fixing?" })).toBeVisible();
  });

  test("works without JavaScript", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/submit");
    await page.getByRole("button", { name: "Send for review" }).click();
    await expect(page.getByText("Add the place's name")).toBeVisible();
    await context.close();
  });
});

test.describe("events", () => {
  test("opens on the soonest day with something on, and tabs change the day", async ({ page }) => {
    await page.goto("/events?city=toronto");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("What's on in Toronto");
    await expect(page.locator("main article").first()).toBeVisible();
    await page.getByRole("link", { name: "This weekend" }).click();
    await expect(page).toHaveURL(/when=weekend/);
    await expect(page.getByRole("link", { name: "This weekend" })).toHaveAttribute(
      "aria-current",
      "true",
    );
  });

  test("seasonal events never claim an exact day", async ({ page }) => {
    await page.goto("/events?city=richmond-hill&when=later");
    await expect(page.getByRole("heading", { name: /later in the year/ })).toBeVisible();
  });

  test("filters to free events in one city", async ({ page }) => {
    await page.goto("/events?city=richmond-hill&when=later");
    await page.getByRole("link", { name: "Free only" }).click();
    await expect(page).toHaveURL(/city=richmond-hill/);
    await expect(page).toHaveURL(/cost=free/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("What's on in Richmond Hill");
  });
});

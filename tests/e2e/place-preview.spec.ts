import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const LIST = "/explore?city=toronto&cost=free";

test.describe("place preview", () => {
  test("opens over the list and closing leaves the list as it was", async ({ page }) => {
    await page.goto(LIST);
    const card = page.locator("main article a").nth(11);
    await card.scrollIntoViewIfNeeded();
    const scrolled = await page.evaluate(() => window.scrollY);
    expect(scrolled).toBeGreaterThan(200);
    const name = (await card.textContent()) ?? "";

    await card.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name })).toBeVisible();
    await expect(page).toHaveURL(/cost=free.*preview=/);
    const audit = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(audit.violations.map((v) => `${v.id}: ${v.nodes.length} (${v.help})`)).toEqual([]);

    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(page).not.toHaveURL(/preview=/);
    await expect(page).toHaveURL(/cost=free/);
    expect(await page.evaluate(() => window.scrollY)).toBe(scrolled);
    await expect(card).toBeFocused();

    await card.click();
    await expect(dialog).toBeVisible();
    await page.goBack();
    await expect(dialog).toHaveCount(0);
    expect(await page.evaluate(() => window.scrollY)).toBe(scrolled);
    await expect(card).toBeFocused();
  });

  test("Back closes it, and Back again leaves the list", async ({ page }) => {
    await page.goto("/");
    await page.goto(LIST);
    await page.locator("main article a").first().click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.goBack();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page).toHaveURL(/cost=free/);
    await expect(page).not.toHaveURL(/preview=/);
    await page.goBack();
    await expect(page).not.toHaveURL(/explore/);
  });

  test("closing with the button or the backdrop works, and a reload keeps it open", async ({
    page,
  }) => {
    await page.goto(LIST);
    await page.locator("main article a").first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("link", { name: "See full details" })).toBeVisible();

    await page.reload();
    await expect(dialog.getByRole("link", { name: "See full details" })).toBeVisible();
    await dialog.getByRole("button", { name: "Close" }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page).toHaveURL(/cost=free/);
    await expect(page).not.toHaveURL(/preview=/);

    await page.locator("main article a").first().click();
    await expect(dialog).toBeVisible();
    await page.mouse.click(20, 300);
    await expect(dialog).toHaveCount(0);
  });

  test("saving works from inside, and the toast is usable", async ({ page }) => {
    await page.goto(LIST);
    await page.locator("main article a").first().click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: "Save", exact: true }).click();
    await expect(dialog.getByRole("button", { name: "Saved" })).toBeVisible();
    await dialog.getByRole("link", { name: "View saved" }).click();
    await expect(page).toHaveURL(/\/saved/);
    await expect(dialog).toHaveCount(0);
  });

  test("it is still a real link for new tabs and without JavaScript", async ({ page, context }) => {
    await page.goto(LIST);
    const card = page.locator("main article a").first();
    await expect(card).toHaveAttribute("href", /^\/places\/[0-9a-f-]{36}$/);
    const [tab] = await Promise.all([
      context.waitForEvent("page"),
      card.click({ modifiers: ["Control"] }),
    ]);
    await expect(tab).toHaveURL(/\/places\/[0-9a-f-]{36}$/);
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("a bad id says so instead of hanging", async ({ page }) => {
    await page.goto(`${LIST}&preview=00000000-0000-5000-8000-000000000000`);
    await expect(page.getByRole("dialog").getByRole("heading")).toHaveText("This did not load");
  });

  test("opens as a sheet on phones @mobile", async ({ page }) => {
    await page.goto(LIST);
    await page.locator("main article a").first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("link", { name: "See full details" })).toBeVisible();
    await expect
      .poll(async () => {
        const box = await dialog.boundingBox();
        const viewport = page.viewportSize();
        return box && viewport ? Math.round(box.y + box.height) === viewport.height : false;
      })
      .toBe(true);
  });
});

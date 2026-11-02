import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

async function axe(page: import("@playwright/test").Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  return results.violations.map((v) => `${v.id}: ${v.nodes.length} (${v.help})`);
}

test.describe("guides", () => {
  test("the index lists six guides and each opens with numbered stops @mobile", async ({
    page,
  }) => {
    await page.goto("/guides");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("A day out, already planned.");
    const links = page.locator("main ol h2 a");
    await expect(links).toHaveCount(6);
    expect(await axe(page)).toEqual([]);

    await page.getByRole("link", { name: "A rainy Sunday in Waterloo under $15" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "A rainy Sunday in Waterloo under $15",
    );
    await expect(page.getByText("Under $15", { exact: true })).toBeVisible();
    await expect(page.getByText(/^Stop \d$/)).toHaveCount(5);
    expect(await axe(page)).toEqual([]);

    await page.getByRole("link", { name: "Smile Tiger Coffee" }).click();
    await page.waitForURL(/\/places\//);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Smile Tiger");
  });

  test("city pages link to their guide", async ({ page }) => {
    await page.goto("/city/oakville");
    await page.getByRole("link", { name: "Oakville's waterfront on foot" }).click();
    await expect(page).toHaveURL(/\/guides\/oakville-waterfront-on-foot$/);
  });

  test("unknown guides are a 404", async ({ request }) => {
    expect((await request.get("/guides/not-a-guide")).status()).toBe(404);
  });
});

test.describe("link previews", () => {
  for (const path of ["/", "/city/markham", "/guides/free-saturday-newmarket"]) {
    test(`${path} has a generated preview image`, async ({ page, request }) => {
      await page.goto(path);
      const content = await page
        .locator('meta[property="og:image"]')
        .first()
        .getAttribute("content");
      expect(content).toMatch(/opengraph-image/);
      const image = await request.get(new URL(content as string).pathname);
      expect(image.status()).toBe(200);
      expect(image.headers()["content-type"]).toBe("image/png");
    });
  }

  test("place pages have a generated preview image", async ({ page, request }) => {
    await page.goto("/explore?city=markham");
    await page.locator("main :is(h2, h3) a").first().click();
    await page.waitForURL(/\/places\//);
    const content = await page.locator('meta[property="og:image"]').first().getAttribute("content");
    const image = await request.get(new URL(content as string).pathname);
    expect(image.status()).toBe(200);
    expect((await image.body()).byteLength).toBeGreaterThan(10_000);
  });
});

test("no analytics script loads unless a Plausible domain is configured", async ({ page }) => {
  const external: string[] = [];
  page.on("request", (r) => {
    if (!r.url().startsWith("http://localhost")) external.push(r.url());
  });
  await page.goto("/pricing");
  await expect(page.locator("script[data-domain]")).toHaveCount(0);
  expect(external.filter((u) => u.includes("plausible"))).toEqual([]);
});

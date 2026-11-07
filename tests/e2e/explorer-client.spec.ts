import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { CATEGORY_SLUGS, categoryMeta } from "../../src/lib/domain/categories";
import { openMenu } from "./helpers";

async function axe(page: import("@playwright/test").Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  return results.violations.map((v) => `${v.id}: ${v.nodes.length} (${v.help})`);
}

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
    await expect(page.getByRole("link", { name: "See details" })).toHaveAttribute(
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

test.describe("list ergonomics", () => {
  test("scrolling never loads more on its own, so the footer stays reachable", async ({ page }) => {
    await page.goto("/explore");
    const cards = page.getByRole("main").getByRole("article");
    const first = await cards.count();
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect(page.getByRole("contentinfo")).toBeInViewport();
    await page.waitForTimeout(800);
    await expect(cards).toHaveCount(first);
    await page.getByRole("button", { name: /Show \d+ more/ }).click();
    await expect.poll(() => cards.count()).toBeGreaterThan(first);
  });

  test("Explore has one search box, and Ctrl K still opens the palette", async ({ page }) => {
    await page.goto("/explore");
    await expect(page.getByRole("banner").getByRole("link", { name: "Search" })).toHaveCount(0);
    await page.keyboard.press("ControlOrMeta+k");
    await expect(
      page.getByRole("combobox", { name: "Search places, cities, and categories" }),
    ).toBeFocused();
  });
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("Surprise me appears once, below the list", async ({ page }) => {
    await page.goto("/explore?city=newmarket");
    await expect(
      page.getByRole("link", { name: "Surprise me" }).locator("visible=true"),
    ).toHaveCount(1);
  });

  test("nothing from the page paints over the map, and the view switch is in reach", async ({
    page,
  }) => {
    await page.goto("/explore?city=newmarket&view=map");
    await expect(page.locator(".maplibregl-canvas")).toBeVisible();
    const onTop = await page.evaluate(() => {
      const link = [...document.querySelectorAll("footer a")].at(-1);
      const box = link?.getBoundingClientRect();
      if (!box) return null;
      return link?.contains(
        document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2),
      );
    });
    expect(onTop).not.toBe(true);
    await expect(
      page.getByRole("radiogroup", { name: "View" }).or(page.getByRole("group", { name: "View" })),
    ).toBeInViewport();
  });

  test("a filter menu says what the choice did, and closes", async ({ page }) => {
    await page.goto("/explore?city=newmarket");
    await page.locator("summary", { hasText: "Category" }).click();
    await page.getByRole("link", { name: "Meet people" }).click();
    await expect(page).toHaveURL(/cat=social/);
    const show = page.getByRole("link", { name: /^Show \d+ places?$/ });
    await expect(show).toBeVisible();
    await show.click();
    await expect(page.locator("details[open]")).toHaveCount(0);
  });
});

test.describe("a category's own look", () => {
  for (const slug of CATEGORY_SLUGS) {
    test(`${slug} has its own form, passes axe, and can still open and save`, async ({ page }) => {
      await page.goto(`/explore?cat=${slug}`);
      await expect(page.locator(`[data-look="${slug}"]`)).toBeVisible();
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(categoryMeta(slug).name);
      expect(await axe(page)).toEqual([]);

      const first = page.locator(`[data-look="${slug}"] article`).first();
      await first.getByRole("button", { name: /^Save / }).click();
      await expect(first.getByRole("button", { name: /^Save / })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await first.getByRole("heading").getByRole("link").click();
      await expect(page).toHaveURL(/preview=/);
    });
  }

  test("a mix of categories stays as cards", async ({ page }) => {
    await page.goto("/explore?city=newmarket&cat=arts,food");
    await expect(page.locator("[data-look]")).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Things to do in Newmarket");
  });

  test("a city's category counts are what their links open", async ({ page }) => {
    await page.goto("/city/newmarket");
    const tile = page
      .getByRole("region", { name: "What are you up for?" })
      .getByRole("listitem")
      .filter({ hasText: "Meet people" });
    const count = (await tile.innerText()).match(/(\d+) places?/)?.[1];
    await tile.getByRole("link").click();
    await expect(page.getByRole("status").filter({ hasText: /places?/ })).toContainText(
      `${count} place`,
    );
  });
});

test.describe("volunteering", () => {
  test("the Category menu finds volunteer listings in a city", async ({ page }) => {
    await page.goto("/explore?city=newmarket");
    await page.locator("summary", { hasText: "Category" }).click();
    await page.getByRole("link", { name: "Volunteer", exact: true }).click();
    await expect(page).toHaveURL(/cat=volunteer/);
    await expect(page.getByRole("main").getByRole("article")).toHaveCount(2);
    await expect(page.getByRole("main")).toContainText("Newmarket Health Centre");
  });
});

test.describe("what the words promise", () => {
  test("the city page's counts are what its links open", async ({ page }) => {
    await page.goto("/city/newmarket");
    for (const name of [/^\d+ free places$/, /^See all \d+$/]) {
      const link = page.getByRole("main").getByRole("link", { name });
      const count = (await link.innerText()).match(/\d+/)?.[0];
      await link.click();
      await expect(page.getByRole("status").filter({ hasText: /places?/ })).toContainText(
        `${count} place`,
      );
      await page.goBack();
    }
  });

  test("Free lights one control, not two", async ({ page }) => {
    await page.goto("/explore?city=newmarket&cost=free");
    await expect(page.locator("summary", { hasText: "Budget" })).not.toContainText("1");
  });

  test("a search with no results can widen to every city", async ({ page }) => {
    await page.goto("/explore?city=newmarket&q=zzzzqqqq");
    await expect(page.getByText("Check the spelling")).toBeVisible();
    await page.getByRole("link", { name: "Search all cities" }).click();
    await expect(page).toHaveURL(/q=zzzzqqqq/);
    await expect(page).not.toHaveURL(/city=/);
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

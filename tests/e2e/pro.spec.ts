import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { currentUserId, postSubscriptionEvent, signIn, uniqueEmail } from "./helpers";

const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

async function expectNoAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.nodes.length} (${v.help})`)).toEqual([]);
}

async function openFirstPlace(page: Page, city = "oakville") {
  await page.goto(`/explore?city=${city}`);
  const first = page.locator("main article :is(h2, h3) a").first();
  const name = (await first.textContent())?.trim() ?? "";
  await first.click();
  await page.getByRole("dialog").getByRole("link", { name: "See full details" }).click();
  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
  return name;
}

test.describe("collections", () => {
  test("the heart saves with no account, and survives a reload", async ({ page }) => {
    const name = await openFirstPlace(page);
    await page.getByRole("button", { name: /^Save/ }).first().click();
    await expect(page.getByRole("button", { name: /Saved|Remove/ }).first()).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await page.goto("/saved");
    await expect(page.getByRole("heading", { level: 2, name })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("heading", { level: 2, name })).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test("signed-out collection asks to sign in", async ({ page }) => {
    await openFirstPlace(page);
    await page.getByRole("link", { name: "Add to a collection" }).click();
    const dialog = page.getByRole("dialog", { name: "Save to a collection" });
    await expect(dialog.getByRole("link", { name: "Sign in to save" })).toBeVisible();
  });

  test("save a place to a new collection, then reorder and share it", async ({ page, browser }) => {
    await signIn(page, uniqueEmail("collections"));
    const name = await openFirstPlace(page);

    await page.getByRole("link", { name: "Add to a collection" }).click();
    const dialog = page.getByRole("dialog", { name: "Save to a collection" });
    await dialog.getByLabel("New collection name").fill("Weekend list");
    await dialog.getByRole("button", { name: "Create" }).click();
    await expect(dialog.getByRole("status")).toHaveText("Saved to Weekend list");
    await expect(dialog.getByRole("checkbox", { name: /Weekend list/ })).toBeChecked();
    await expectNoAxeViolations(page);
    await dialog.getByRole("button", { name: "Done" }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByRole("link", { name: "Add to a collection" })).toBeFocused();

    // A second place, added from its own page.
    await page.goto("/explore?city=oakville");
    const second = page.locator("main article").nth(1);
    const secondName = (await second.locator(":is(h2, h3) a").textContent())?.trim() ?? "";
    await second.locator(":is(h2, h3) a").click();
    await page.getByRole("dialog").getByRole("link", { name: "See full details" }).click();
    await page.waitForURL(/\/places\//);
    await page.getByRole("link", { name: "Add to a collection" }).click();
    const saveDialog = page.getByRole("dialog", { name: "Save to a collection" });
    await saveDialog.locator("label", { hasText: "Weekend list" }).click();
    await expect(saveDialog.getByRole("status")).toHaveText("Saved to Weekend list");
    await page.keyboard.press("Escape");

    await page.goto("/collections");
    await page.getByRole("link", { name: "Weekend list" }).click();
    const items = page.getByRole("listitem").getByRole("heading", { level: 2 });
    await expect(items).toHaveText([name, secondName]);
    await page.getByRole("button", { name: `Move ${secondName} up` }).click();
    await expect(items).toHaveText([secondName, name]);
    await expectNoAxeViolations(page);

    await page.getByRole("button", { name: "Share with a link" }).click();
    const shareUrl = await page.getByLabel("Share link").inputValue();
    const anon = await browser.newContext();
    const other = await anon.newPage();
    // Share links use the configured site URL; follow the path on the test server.
    await other.goto(new URL(shareUrl).pathname);
    await expect(other.getByRole("heading", { level: 1, name: "Weekend list" })).toBeVisible();
    await anon.close();
  });

  test("free accounts stop at three collections", async ({ page }) => {
    await signIn(page, uniqueEmail("limit"), "/collections");
    for (const title of ["One", "Two", "Three"]) {
      await page.goto("/collections");
      await page.getByLabel("New collection name").fill(title);
      await page.getByRole("button", { name: "Create collection" }).click();
      await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
    }
    await page.goto("/collections");
    await expect(page.getByText("You are using all 3 free collections")).toBeVisible();
    await expect(page.getByLabel("New collection name")).toHaveCount(0);
  });
});

test.describe("Stripe webhooks", () => {
  test("rejects a forged signature", async ({ request }) => {
    const res = await request.post("/api/stripe/webhook", {
      data: JSON.stringify({ id: "evt_forged", type: "customer.subscription.updated" }),
      headers: { "stripe-signature": "t=1,v1=deadbeef" },
    });
    expect(res.status()).toBe(400);
  });

  test("turns Pro on, ignores retries and stale events, and turns it off", async ({ page }) => {
    await signIn(page, uniqueEmail("pro"), "/account");
    const userId = await currentUserId(page);
    await expect(page.getByText("Free", { exact: true })).toBeVisible();

    const first = await postSubscriptionEvent(page.request, {
      userId,
      status: "active",
      type: "customer.subscription.created",
    });
    expect(first.res.ok()).toBe(true);
    expect(await first.res.json()).toMatchObject({ outcome: "applied" });

    // Stripe retries deliver the same event id again.
    const retry = await postSubscriptionEvent(page.request, {
      userId,
      status: "active",
      eventId: first.event.id,
      type: "customer.subscription.created",
    });
    expect(await retry.res.json()).toMatchObject({ outcome: "duplicate" });

    // An older event arriving late must not undo a newer one.
    await postSubscriptionEvent(page.request, {
      userId,
      status: "canceled",
      created: first.event.created - 600,
    });
    await page.reload();
    await expect(page.getByText(/^Pro, monthly, renews/)).toBeVisible();

    await postSubscriptionEvent(page.request, {
      userId,
      status: "canceled",
      type: "customer.subscription.deleted",
      created: first.event.created + 5,
    });
    await page.goto("/planner");
    await expect(page.getByRole("link", { name: "Save with Pro" })).toBeVisible();
  });
});

test("anyone can plan a day, and Pro is what keeps the edits", async ({ page }) => {
  await page.goto("/planner?city=newmarket");
  const stops = page.getByRole("list", { name: "Your day" }).getByRole("listitem");
  expect(await stops.count()).toBeGreaterThanOrEqual(3);
  await expect(page.getByRole("button", { name: "Share this plan" })).toBeVisible();
  await page.getByRole("link", { name: "Shuffle" }).click();
  await expect(page).toHaveURL(/seed=1/);
  await page
    .getByRole("button", { name: /^Remove / })
    .first()
    .click();
  await expect(page.getByRole("button", { name: "Share this plan" })).toBeHidden();
  await expect(page.getByText("Your changes last until you leave this page.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Keep your changes with Pro" })).toHaveAttribute(
    "href",
    "/pricing",
  );
});

test("removing a stop can be undone", async ({ page }) => {
  await page.goto("/planner?city=newmarket");
  const stops = page.getByRole("list", { name: "Your day" }).getByRole("listitem");
  const count = await stops.count();
  await page
    .getByRole("button", { name: /^Remove / })
    .first()
    .click();
  await expect(stops).toHaveCount(count - 1);
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(stops).toHaveCount(count);
  await expect(page.getByRole("button", { name: "Share this plan" })).toBeVisible();
});

test("undoing a removal keeps edits made since", async ({ page }) => {
  await page.goto("/planner?city=newmarket");
  const stops = page.getByRole("list", { name: "Your day" }).getByRole("listitem");
  const count = await stops.count();
  await page
    .getByRole("button", { name: /^Remove / })
    .first()
    .click();
  // The last stop's place changes, then the removal is undone. Its time moves back, so compare names.
  const lastName = stops.last().getByRole("heading");
  const before = await lastName.innerText();
  await page
    .getByRole("button", { name: /^Try another place instead of / })
    .last()
    .click();
  await expect(lastName).not.toHaveText(before);
  const edited = await lastName.innerText();
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(stops).toHaveCount(count);
  await expect(lastName).toHaveText(edited);
  await expect(page.getByRole("button", { name: "Undo" })).toHaveCount(0);
});

test("Pro member plans a day, edits it, and shares it", async ({ page, browser }) => {
  await signIn(page, uniqueEmail("planner"), "/planner");
  const userId = await currentUserId(page);
  await postSubscriptionEvent(page.request, { userId, status: "active" });

  await page.goto("/planner");
  await expect(page.getByRole("heading", { level: 1, name: "Plan a day" })).toBeVisible();
  await expectNoAxeViolations(page);
  // The header's picker is the one place to change city, and the plan follows it.
  await page.getByRole("banner").locator("summary").click();
  await page
    .getByRole("group", { name: "Your city" })
    .getByRole("link", { name: "Newmarket" })
    .click();
  await expect(page).toHaveURL(/city=newmarket/);

  await expect(page.getByRole("heading", { level: 2, name: /in Newmarket$/ })).toBeVisible();
  const stops = page.getByRole("list", { name: "Your day" }).getByRole("listitem");
  const count = await stops.count();
  expect(count).toBeGreaterThanOrEqual(3);
  const meter = page.getByRole("meter", { name: "Spend against budget" });
  expect(Number(await meter.getAttribute("aria-valuenow"))).toBeLessThanOrEqual(25);
  await expectNoAxeViolations(page);

  // Move the second stop earlier and drop the last one.
  const secondName = (await stops.nth(1).getByRole("heading").textContent())?.trim() ?? "";
  await page.getByRole("button", { name: `Move ${secondName} earlier` }).click();
  await expect(stops.first().getByRole("heading")).toHaveText(secondName);
  const lastName = (await stops.last().getByRole("heading").textContent())?.trim() ?? "";
  await page.getByRole("button", { name: `Remove ${lastName}` }).click();
  await expect(stops).toHaveCount(count - 1);

  await page.getByRole("button", { name: "Save and get a share link" }).click();
  await expect(page).toHaveURL(/\/plans\/[\w-]+\?saved=1/);
  await expect(page.getByRole("status")).toContainText("Plan saved");
  const shared = page.getByRole("listitem").getByRole("heading", { level: 2 });
  await expect(shared).toHaveCount(count - 1);
  await expect(shared.first()).toHaveText(secondName);

  // The share link works for anyone, with no account.
  const url = await page.getByLabel("Share link").inputValue();
  const anon = await browser.newContext();
  const viewer = await anon.newPage();
  await viewer.goto(new URL(url).pathname);
  await expect(viewer.getByRole("heading", { level: 1, name: /in Newmarket$/ })).toBeVisible();
  await expect(viewer.getByRole("button", { name: "Delete this plan" })).toHaveCount(0);
  await expect(viewer.getByRole("link", { name: "Plan your own day" })).toBeVisible();
  await expectNoAxeViolations(viewer);
  await anon.close();
});

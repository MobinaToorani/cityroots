import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Browser, type Page } from "@playwright/test";
import { E2E_ADMIN } from "./constants";
import { emailLinkFor, signIn, uniqueEmail } from "./helpers";

// A fresh client address per test, so repeated local runs stay under the submit rate limit.
test.use({
  extraHTTPHeaders: { "x-forwarded-for": `198.51.100.${Math.floor(Math.random() * 250) + 1}` },
});

async function signedIn(browser: Browser, email: string, callbackUrl: string): Promise<Page> {
  const context = await browser.newContext();
  const page = await context.newPage();
  await signIn(page, email, callbackUrl);
  return page;
}

async function axe(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  return results.violations.map((v) => `${v.id}: ${v.nodes.length} (${v.help})`);
}

test.describe("staff access", () => {
  test("signed-out visitors are sent to sign in", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/signin\?callbackUrl=%2Fadmin/);
  });

  test("members without a staff role get a 404", async ({ browser }) => {
    const page = await signedIn(browser, uniqueEmail("member"), "/account");
    await expect(page.getByRole("link", { name: "Admin" })).toHaveCount(0);
    for (const path of ["/admin", "/admin/submissions", "/admin/claims", "/admin/partners"]) {
      expect((await page.goto(path))?.status(), path).toBe(404);
    }
    await page.context().close();
  });
});

test("a suggestion is published, emailed back, claimed, and verified", async ({
  page,
  browser,
}) => {
  test.setTimeout(90_000);
  const name = `E2E community fridge ${Date.now()}`;
  const contributor = uniqueEmail("contributor");

  // 1. A visitor suggests a place.
  await page.goto("/submit?city=newmarket");
  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Category").selectOption("food");
  await page
    .getByRole("group", { name: "What does it cost?" })
    .getByText("Free", { exact: true })
    .click();
  await page.getByLabel("Address or area").fill("Main Street South");
  await page
    .getByLabel("Why it belongs on CityRoots")
    .fill("A free community fridge stocked by neighbours. Take what you need, leave what you can.");
  await page.getByLabel("Your email").fill(contributor);
  await page.getByRole("button", { name: "Send for review" }).click();
  await page.waitForURL(/\/submit\/thanks/);

  // 2. A curator publishes it from the queue.
  const admin = await signedIn(browser, E2E_ADMIN, "/admin");
  await expect(admin.getByRole("heading", { level: 1 })).toHaveText("Waiting for review");
  expect(await axe(admin)).toEqual([]);
  await admin.getByRole("link", { name: "Suggestions" }).click();
  await admin.getByRole("link", { name }).click();
  await expect(admin.getByLabel("Name")).toHaveValue(name);
  await expect(admin.getByLabel("Neighborhood")).toHaveValue("Main Street South");
  expect(await axe(admin)).toEqual([]);
  await admin.getByRole("button", { name: "Publish this place" }).click();
  await admin.waitForURL(/\/admin\/submissions\?done=published/);
  await expect(admin.getByRole("status")).toContainText("Published");

  // 3. The contributor's email links to the live listing.
  let link: string | null = null;
  await expect
    .poll(async () => (link = await emailLinkFor(contributor, /Thanks for suggesting/)))
    .not.toBeNull();
  const placePath = new URL(link as unknown as string).pathname;
  await page.goto(placePath);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(name);

  // 4. Someone who runs it claims it.
  const owner = await signedIn(browser, uniqueEmail("owner"), placePath);
  await owner.getByRole("link", { name: "Run this place? Claim it" }).click();
  await expect(owner.getByRole("heading", { level: 1 })).toContainText(name);
  expect(await axe(owner)).toEqual([]);
  await owner
    .getByRole("group", { name: "How are you connected to this place?" })
    .getByText("Manager")
    .click();
  await owner.getByLabel("Hours").fill("Mon to Sun 8am to 8pm");
  await owner.getByRole("group", { name: "Step-free entrance?" }).getByText("Yes").click();
  await owner.getByRole("button", { name: "Send my claim" }).click();
  await expect(owner.getByRole("heading", { level: 1 })).toHaveText("Your claim is in");

  // 5. A curator verifies it, applying the details.
  await admin.goto("/admin/claims");
  const claim = admin.getByRole("article", { name: new RegExp(name) });
  await expect(claim).toContainText("Manager");
  await expect(claim.getByLabel(/Hours: Mon to Sun 8am to 8pm/)).toBeChecked();
  expect(await axe(admin)).toEqual([]);
  await claim.getByRole("button", { name: `Verify ${name}` }).click();
  await admin.waitForURL(/\/admin\/claims\?done=verified/);

  // 6. The listing shows the confirmed details and no longer offers a claim.
  await page.goto(placePath);
  await expect(page.getByText("Details confirmed by the people who run it.")).toBeVisible();
  await expect(page.getByText("Mon to Sun 8am to 8pm")).toBeVisible();
  await expect(page.getByRole("link", { name: "Run this place? Claim it" })).toHaveCount(0);

  await admin.context().close();
  await owner.context().close();
});

test("partner keys work until they are revoked", async ({ browser, request }) => {
  const admin = await signedIn(browser, E2E_ADMIN, "/admin/partners");
  const org = `E2E Library ${Date.now()}`;
  await admin.getByLabel("Organization").fill(org);
  await admin.getByRole("button", { name: "Create a key" }).click();
  const keyField = admin.getByLabel("New partner key");
  await expect(keyField).toHaveValue(/^cr_live_/);
  const key = await keyField.inputValue();
  expect(await axe(admin)).toEqual([]);

  const auth = { Authorization: `Bearer ${key}` };
  const places = await request.get("/api/v1/places?city=newmarket&cost=free&per_page=5", {
    headers: auth,
  });
  expect(places.status()).toBe(200);
  const body = (await places.json()) as {
    data: { cost: string; url: string }[];
    meta: { total: number };
    attribution: { license: string };
  };
  expect(body.data).toHaveLength(5);
  expect(body.data.every((p) => p.cost === "free")).toBe(true);
  expect(body.attribution.license).toBe("CC BY 4.0");

  expect((await request.get("/api/v1/events?free=true", { headers: auth })).status()).toBe(200);
  expect((await request.get("/api/v1/cities", { headers: auth })).status()).toBe(200);
  expect((await request.get("/api/v1/places?category=casinos", { headers: auth })).status()).toBe(
    400,
  );
  expect((await request.get("/api/v1/places")).status()).toBe(401);
  expect(
    (
      await request.get("/api/v1/places", {
        headers: { Authorization: "Bearer cr_live_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" },
      })
    ).status(),
  ).toBe(401);

  await admin.reload();
  await admin.getByRole("button", { name: `Revoke the key for ${org}` }).click();
  await admin.waitForURL(/done=revoked/);
  const revoked = await request.get("/api/v1/places", { headers: auth });
  expect(revoked.status()).toBe(401);
  expect(((await revoked.json()) as { error: { code: string } }).error.code).toBe("invalid_key");
  await admin.context().close();
});

test.describe("embed widget", () => {
  test("can be framed by any site and has no site chrome", async ({ page, request }) => {
    const res = await request.get("/embed/newmarket?cost=free&limit=3");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-security-policy"]).toBe("frame-ancestors *");
    expect(res.headers()["x-frame-options"]).toBeUndefined();

    await page.goto("/embed/newmarket?cost=free&limit=3");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Things to do in Newmarket");
    await expect(page.getByRole("navigation")).toHaveCount(0);
    await expect(page.locator("main li")).toHaveCount(3);
    const first = page.locator("main li a").first();
    await expect(first).toHaveAttribute("target", "_blank");
    expect(await axe(page)).toEqual([]);
  });

  test("site pages still refuse framing", async ({ request }) => {
    const res = await request.get("/partners");
    expect(res.headers()["x-frame-options"]).toBe("DENY");
  });
});

test.describe("public pages", () => {
  for (const path of ["/partners", "/business", "/business?q=library"]) {
    test(`${path} has no WCAG 2.2 AA violations @mobile`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      expect(await axe(page)).toEqual([]);
    });
  }
});

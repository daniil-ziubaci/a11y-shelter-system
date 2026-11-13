import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const LOCALES = ["ru", "ro", "en"];
const PAGES = ["", "/about", "/needs", "/projects", "/catalog", "/catalog?mode=treatment", "/privacy", "/net-takogo"];

for (const locale of LOCALES) {
  test(`${locale}: pages pass axe and have unique titles`, async ({ page }) => {
    const titles = new Map<string, string>();
    for (const path of [...PAGES, "pet"]) {
      if (path === "pet") {
        await page.goto(`/${locale}/catalog`);
        const href = await page.locator('a[href*="/catalog/"]').first().getAttribute("href");
        expect(href, "the catalog links to an animal").toBeTruthy();
        await page.goto(href ?? "");
      } else {
        await page.goto(`/${locale}${path}`);
      }
      const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
      expect(
        results.violations.map((v) => `${path}: ${v.id} (${v.impact}) ${v.nodes[0].target.join(" ")}`),
      ).toEqual([]);
      const title = await page.title();
      expect(titles.get(title), `title "${title}" of ${path} is also used by ${titles.get(title)}`).toBeUndefined();
      titles.set(title, path);
      expect(await page.locator("html").getAttribute("lang")).toBe(locale);
    }
  });
}

test("site is not indexed while ALLOW_INDEXING is off", async ({ request }) => {
  const response = await request.get("/ru");
  expect(response.headers()["x-robots-tag"]).toBe("noindex, nofollow");
});

test("external links open in a new tab and say so", async ({ page }) => {
  await page.goto("/ru/needs");
  for (const link of await page.locator('a[href^="http"]').all()) {
    expect(await link.getAttribute("target")).toBe("_blank");
    expect(await link.getAttribute("rel")).toContain("noopener");
    const name = (await link.getAttribute("aria-label")) ?? (await link.innerText());
    expect(name).toMatch(/вкладк/);
  }
});

test("repeated links name the animal of their card", async ({ page }) => {
  await page.goto("/ru/catalog");
  const cards = await page.locator("article").evaluateAll((items) =>
    items.map((item) => ({
      name: item.querySelector("h2, h3")?.textContent?.trim() ?? "",
      label: item.querySelector("a")?.getAttribute("aria-label") ?? "",
    })),
  );
  expect(cards.length).toBeGreaterThan(1);
  for (const card of cards) {
    expect(card.label).toBe(`Подробнее: ${card.name}`);
  }
});

test("old addresses with the shelter slug redirect permanently", async ({ request }) => {
  const cases: [string, number, string][] = [
    ["/ru/shelter/live-life", 301, "/ru"],
    ["/ro/shelter/live-life/catalog?mode=treatment", 301, "/ro/catalog?mode=treatment"],
    ["/en/shelter/live-life/needs?urgent=1", 301, "/en/needs?urgent=1"],
    ["/shelter/live-life/about", 301, "/ru/about"],
    ["/privacy", 307, "/ru/privacy"],
  ];
  for (const [from, status, to] of cases) {
    const response = await request.get(from, { maxRedirects: 0 });
    expect(response.status(), from).toBe(status);
    expect(new URL(response.headers().location, "http://x").pathname + new URL(response.headers().location, "http://x").search).toBe(to);
  }
  expect((await request.get("/ru/shelter/other-shelter", { maxRedirects: 0 })).status()).toBe(404);
});

test("mobile menu opens, closes with Escape and returns focus", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/ru");
  const button = page.getByRole("button", { name: "Меню" });
  await expect(button).toHaveAttribute("aria-expanded", "false");
  await button.click();
  await expect(button).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("link", { name: "Каталог" }).first()).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(button).toHaveAttribute("aria-expanded", "false");
  await expect(button).toBeFocused();
});

test("gallery serves a smaller photo to phones and switches photos", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/ru/about");
  const main = page.locator("[data-main]");
  await expect.poll(() => main.evaluate((img: HTMLImageElement) => img.currentSrc)).toMatch(/\/01-(480|800)\.webp$/);
  await page.getByRole("link", { name: "Показать фото 2 из 6" }).click();
  await expect.poll(() => main.evaluate((img: HTMLImageElement) => img.currentSrc)).toMatch(/\/02(-480|-800)?\.webp$/);
  await expect(main).toHaveAttribute("alt", "Фото приюта 02");
  await expect(page.getByText("Фото 2 из 6")).toBeAttached();
});

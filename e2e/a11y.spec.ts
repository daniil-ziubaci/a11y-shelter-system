import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const LOCALES = ["ru", "ro", "en"];
const SHELTER = "/shelter/test-shelter";
const PAGES = [
  SHELTER,
  `${SHELTER}/about`,
  `${SHELTER}/needs`,
  `${SHELTER}/projects`,
  `${SHELTER}/catalog`,
  `${SHELTER}/catalog?mode=treatment`,
  "/privacy",
  "/net-takogo",
];

async function scan(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  return results.violations.map(
    (violation) =>
      `${violation.id} (${violation.impact}): ${violation.nodes.length} шт., например ${violation.nodes[0].target.join(" ")}`,
  );
}

for (const locale of LOCALES) {
  for (const path of PAGES) {
    test(`${locale}${path}`, async ({ page }) => {
      await page.goto(`/${locale}${path}`);
      expect(await scan(page)).toEqual([]);
    });
  }

  test(`${locale}: страница животного`, async ({ page }) => {
    await page.goto(`/${locale}${SHELTER}/catalog`);
    const href = await page
      .locator('a[href*="/catalog/"]')
      .first()
      .getAttribute("href");
    if (!href) {
      throw new Error("В каталоге нет ссылки на животное");
    }
    await page.goto(href);
    expect(await scan(page)).toEqual([]);
  });
}

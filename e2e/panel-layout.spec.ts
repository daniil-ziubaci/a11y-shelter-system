import { expect, test } from "@playwright/test";
import { EMAIL, PASSWORD, SECRET, signIn } from "./support";

test.skip(!EMAIL || !PASSWORD || !SECRET, "E2E_EMAIL, E2E_PASSWORD and E2E_TOTP_SECRET are not set");

test("the animal list never scrolls sideways and has two columns from 900 px", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "the test sets its own widths");
  await signIn(page);
  for (const width of [320, 640, 768, 899, 900, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/volunteer");
    const cards = page.locator("main ul > li");
    expect(await cards.count(), `cards at ${width} px`).toBeGreaterThan(1);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `sideways scroll at ${width} px`).toBe(0);
    const [first, second] = [await cards.nth(0).boundingBox(), await cards.nth(1).boundingBox()];
    const columns = first && second && Math.abs(first.y - second.y) < 1 ? 2 : 1;
    expect(columns, `columns at ${width} px`).toBe(width >= 900 ? 2 : 1);
  }
});

import { expect, test } from "@playwright/test";
import { EMAIL, PASSWORD, SECRET, signIn } from "./support";

test.skip(!EMAIL || !PASSWORD || !SECRET, "E2E_EMAIL, E2E_PASSWORD and E2E_TOTP_SECRET are not set");
test.skip(({ viewport }) => (viewport?.width ?? 0) < 900, "limits do not depend on the screen");

const LIMITS: [string, string, number][] = [
  ["Кличка", "name", 50],
  ["Описание фото", "photoAlt", 300],
  ["Здоровье", "health", 500],
  ["Описание", "description", 3000],
];

test("the animal form limits text length, and the server checks it too", async ({ page }) => {
  await signIn(page);
  await page.goto("/volunteer/pets/new");
  for (const [, field, limit] of LIMITS) {
    await expect(page.locator(`[name="${field}"]`)).toHaveAttribute("maxlength", String(limit));
  }
  await page.goto("/volunteer");
  await page.getByRole("link", { name: /^Редактировать: / }).first().click();
  await expect(page).toHaveURL(/\/volunteer\/pets\/[0-9a-f-]+\/edit$/);
  const edit = page.url();
  for (const [label, field, limit] of LIMITS) {
    await page.goto(edit);
    const input = page.locator(`[name="${field}"]`);
    await input.evaluate((element) => element.removeAttribute("maxlength"));
    await input.fill("а".repeat(limit + 1));
    await page.getByRole("button", { name: "Сохранить изменения" }).click();
    await expect(page.getByRole("alert").filter({ hasText: `${label}: не больше ${limit} знаков.` })).toBeVisible();
  }
});

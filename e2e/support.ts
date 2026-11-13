import { expect, type Page } from "@playwright/test";
import sharp from "sharp";
import { totp } from "./totp";

export const EMAIL = process.env.E2E_EMAIL ?? "";
export const PASSWORD = process.env.E2E_PASSWORD ?? "";
export const SECRET = process.env.E2E_TOTP_SECRET ?? "";

export async function photo(color: string) {
  return {
    name: "photo.jpg",
    mimeType: "image/jpeg",
    buffer: await sharp({ create: { width: 2400, height: 1800, channels: 3, background: color } })
      .jpeg()
      .withMetadata({ exif: { IFD0: { Artist: "camera" } } })
      .toBuffer(),
  };
}

export async function signIn(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Почта").fill(EMAIL);
  await page.getByLabel("Пароль").fill(PASSWORD);
  await page.getByRole("button", { name: "Войти" }).click();
  await expect(page).toHaveURL(/\/volunteer\/2fa\/verify$/);
  await page.getByLabel("Код из приложения").fill(totp(SECRET));
  await page.getByRole("button", { name: "Подтвердить" }).click();
  await expect(page).toHaveURL(/\/volunteer\/needs$/);
}

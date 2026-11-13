import { expect, test } from "@playwright/test";
import sharp from "sharp";
import { totp } from "./totp";

const EMAIL = process.env.E2E_EMAIL ?? "";
const PASSWORD = process.env.E2E_PASSWORD ?? "";
const SECRET = process.env.E2E_TOTP_SECRET ?? "";

test.skip(!EMAIL || !PASSWORD || !SECRET, "E2E_EMAIL, E2E_PASSWORD and E2E_TOTP_SECRET are not set");

async function image(width: number, height: number, format: "jpeg" | "webp", exif: boolean) {
  const base = sharp({ create: { width, height, channels: 3, background: "#884422" } });
  const encoded = format === "jpeg" ? base.jpeg() : base.webp();
  return (exif ? encoded.withMetadata({ exif: { IFD0: { Artist: "camera" } } }) : encoded).toBuffer();
}

test("the server accepts only photos prepared in the browser", async ({ page, baseURL }) => {
  await page.goto("/login");
  await page.getByLabel("Почта").fill(EMAIL);
  await page.getByLabel("Пароль").fill(PASSWORD);
  await page.getByRole("button", { name: "Войти" }).click();
  await page.getByLabel("Код из приложения").fill(totp(SECRET));
  await page.getByRole("button", { name: "Подтвердить" }).click();
  await expect(page).toHaveURL(/\/volunteer\/needs$/);

  const fields = {
    name: `Фото-проверка ${Date.now() % 100000}`,
    species: "кошка",
    sex: "девочка",
    ageYears: "1",
    photoAlt: "Кошка",
    health: "Здорова",
    description: "Спокойная кошка.",
  };
  const cases: [string, Buffer, Buffer, Buffer][] = [
    ["camera original with EXIF", await image(1600, 1200, "jpeg", true), await image(800, 600, "jpeg", false), await image(1200, 630, "jpeg", false)],
    ["full photo larger than 1600", await image(2000, 1500, "webp", false), await image(800, 600, "webp", false), await image(1200, 630, "jpeg", false)],
    ["preview that is not JPEG", await image(1600, 1200, "webp", false), await image(800, 600, "webp", false), await image(1200, 630, "webp", false)],
    ["not an image", Buffer.from("<svg></svg>"), Buffer.from("x"), Buffer.from("x")],
  ];
  for (const [label, full, card, preview] of cases) {
    const response = await page.request.post("/volunteer/pets/new", {
      headers: { Origin: baseURL ?? "" },
      multipart: {
        ...fields,
        photo: { name: "photo.jpg", mimeType: "image/jpeg", buffer: full },
        photoCard: { name: "card.jpg", mimeType: "image/jpeg", buffer: card },
        photoPreview: { name: "preview.jpg", mimeType: "image/jpeg", buffer: preview },
      },
      maxRedirects: 0,
    });
    expect(response.status(), label).toBe(200);
    expect(await response.text(), label).toContain("Фото не подготовилось");
  }

  const prepared = await page.request.post("/volunteer/pets/new", {
    headers: { Origin: baseURL ?? "" },
    multipart: {
      ...fields,
      photo: { name: "photo.webp", mimeType: "image/webp", buffer: await image(1600, 1200, "webp", false) },
      photoCard: { name: "card.webp", mimeType: "image/webp", buffer: await image(800, 600, "webp", false) },
      photoPreview: { name: "preview.jpg", mimeType: "image/jpeg", buffer: await image(1200, 630, "jpeg", false) },
    },
    maxRedirects: 0,
  });
  expect(prepared.status(), "prepared photo is accepted").toBe(303);

  const foreign = await page.request.post("/volunteer/pets/new", {
    headers: { Origin: "https://evil.example" },
    multipart: { ...fields },
    maxRedirects: 0,
  });
  expect(foreign.status(), "a form posted from another site is refused").toBe(403);
});

import { createClient } from "@supabase/supabase-js";
import { expect, test, type Page } from "@playwright/test";
import { EMAIL, PASSWORD, photo, SECRET, signIn } from "./support";

const SUPABASE_URL = process.env.E2E_SUPABASE_URL ?? "";
const SERVICE_KEY = process.env.E2E_SERVICE_ROLE_KEY ?? "";
const BROKEN_BASE_URL = process.env.E2E_BROKEN_BASE_URL ?? "";

test.describe.configure({ mode: "serial" });
test.skip(!EMAIL || !PASSWORD || !SECRET, "E2E_EMAIL, E2E_PASSWORD and E2E_TOTP_SECRET are not set");

const copiesOf = (url: string) => [url, url.replace(/\.(webp|jpg)$/, "-card.$1"), url.replace(/\.(webp|jpg)$/, "-og.jpg")];

async function addAnimal(page: Page, name: string) {
  await page.goto("/volunteer/pets/new");
  await page.getByLabel("Кличка").fill(name);
  await page.getByRole("radio", { name: "Кошка" }).check();
  await page.getByRole("radio", { name: "Девочка" }).check();
  await page.getByLabel("Примерный возраст: полных лет").fill("3");
  await page.locator("#photo").setInputFiles(await photo("#557799"));
  await expect(page.getByText(/^Выбрано: photo\./)).toBeVisible({ timeout: 15000 });
  await page.getByLabel("Описание фото").fill(`Фото ${name}`);
  await page.getByLabel("Здоровье").fill("Здорова");
  await page.getByLabel("Описание, характер, история").fill("Спокойная кошка.");
  await page.getByRole("button", { name: "Добавить животное" }).click();
  await expect(page).toHaveURL(/\/volunteer$/);
}

async function photoOf(page: Page, name: string) {
  await page.goto("/ru/catalog");
  await page.getByRole("link", { name: `Подробнее: ${name}`, exact: true }).click();
  return (await page.getByRole("img", { name: `Фото ${name}` }).first().getAttribute("src")) ?? "";
}

async function replacePhoto(page: Page, name: string) {
  await page.goto("/volunteer");
  await page.getByLabel("Найти по имени или вольеру").fill(name);
  await page.getByRole("button", { name: "Показать" }).click();
  await page.getByRole("link", { name: `Редактировать: ${name}`, exact: true }).click();
  await page.locator("#photo").setInputFiles(await photo("#995533"));
  await expect(page.getByText(/^Выбрано: photo\./)).toBeVisible({ timeout: 15000 });
  await page.getByRole("button", { name: "Сохранить изменения" }).click();
  await expect(page).toHaveURL(/\/volunteer$/);
}

async function expectKept(page: Page, urls: string[]) {
  await page.waitForTimeout(3000);
  for (const url of urls) {
    expect((await page.request.get(url)).status(), `${url} is kept`).toBe(200);
  }
}

test("a replaced photo that another animal still uses is kept", async ({ page }) => {
  test.skip(!SUPABASE_URL || !SERVICE_KEY, "E2E_SUPABASE_URL and E2E_SERVICE_ROLE_KEY are not set");
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  const name = `Общая${Date.now() % 100000}`;
  await signIn(page);
  await addAnimal(page, name);
  const shared = await photoOf(page, name);
  const twin = crypto.randomUUID();
  const { error } = await admin.from("pets").insert({
    id: twin,
    name: `${name}-копия`,
    species: "кошка",
    sex: "девочка",
    birth_date: "2023-01-01",
    is_age_approximate: true,
    health: "Здорова",
    description: "Та же фотография.",
    photo_url: shared,
    photo_alt: "Та же фотография",
  });
  expect(error).toBeNull();
  try {
    await replacePhoto(page, name);
    expect(await photoOf(page, name)).not.toBe(shared);
    await expectKept(page, copiesOf(shared));
  } finally {
    await admin.from("pets").delete().eq("id", twin);
  }
});

test.describe("when deleting the old photo fails", () => {
  test.skip(!BROKEN_BASE_URL, "E2E_BROKEN_BASE_URL is not set");
  test.use({ baseURL: BROKEN_BASE_URL });

  test("the animal is still saved with the new photo", async ({ page }) => {
    const name = `Сбой${Date.now() % 100000}`;
    await signIn(page);
    await addAnimal(page, name);
    const before = await photoOf(page, name);
    await replacePhoto(page, name);
    const after = await photoOf(page, name);
    expect(after).not.toBe(before);
    for (const url of copiesOf(after)) {
      expect((await page.request.get(url)).status(), url).toBe(200);
    }
    await expectKept(page, copiesOf(before));
  });
});

test("replacing a photo never deletes the shelter's brand icons", async ({ page }) => {
  test.skip(!SUPABASE_URL || !SERVICE_KEY, "E2E_SUPABASE_URL and E2E_SERVICE_ROLE_KEY are not set");
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  const name = `Значок${Date.now() % 100000}`;
  const { data: shelter } = await admin.from("shelter").select("brand_path").single();
  const folder = `brand/e2e-${crypto.randomUUID()}`;
  const iconPath = `${folder}/icon-32.webp`;
  const icon = await photo("#224466");
  expect((await admin.storage.from("pet-photos").upload(iconPath, icon.buffer, { contentType: "image/webp" })).error).toBeNull();
  const iconUrl = admin.storage.from("pet-photos").getPublicUrl(iconPath).data.publicUrl;
  try {
    expect((await admin.from("shelter").update({ brand_path: folder }).eq("id", true)).error).toBeNull();
    await signIn(page);
    await addAnimal(page, name);
    expect((await admin.from("pets").update({ photo_url: iconUrl }).eq("name", name)).error).toBeNull();
    await replacePhoto(page, name);
    await expectKept(page, [iconUrl]);
  } finally {
    await admin.from("shelter").update({ brand_path: shelter?.brand_path ?? null }).eq("id", true);
    await admin.storage.from("pet-photos").remove([iconPath]);
  }
});

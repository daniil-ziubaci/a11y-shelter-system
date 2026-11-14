import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import sharp from "sharp";
import { EMAIL, PASSWORD, photo, SECRET, signIn } from "./support";
import { totp } from "./totp";

const NEW_EMAIL = process.env.E2E_NEW_EMAIL ?? "";
const CRON_SECRET = process.env.E2E_CRON_SECRET ?? "";

test.describe.configure({ mode: "serial" });
test.skip(!EMAIL || !PASSWORD || !SECRET, "E2E_EMAIL, E2E_PASSWORD and E2E_TOTP_SECRET are not set");

test("wrong password and wrong code are refused with an alert", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Почта").fill(EMAIL);
  await page.getByLabel("Пароль").fill("wrong-password-123");
  await page.getByRole("button", { name: "Войти" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Неверная почта или пароль." })).toBeVisible();
  await page.getByLabel("Пароль").fill(PASSWORD);
  await page.getByRole("button", { name: "Войти" }).click();
  await expect(page).toHaveURL(/\/volunteer\/2fa\/verify$/);
  await expect(page).toHaveTitle("Подтверждение входа");
  await page.goto("/volunteer/needs");
  await expect(page).toHaveURL(/\/volunteer\/2fa\/verify$/);
  await page.getByLabel("Код из приложения").fill("000000");
  await page.getByRole("button", { name: "Подтвердить" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Неверный код" })).toBeVisible();
});

test("a volunteer can sign out before entering the code", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Почта").fill(EMAIL);
  await page.getByLabel("Пароль").fill(PASSWORD);
  await page.getByRole("button", { name: "Войти" }).click();
  await expect(page).toHaveURL(/\/volunteer\/2fa\/verify$/);
  await page.getByText("Аккаунт").click();
  await page.getByRole("button", { name: "Выйти" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/volunteer/2fa/verify");
  await expect(page).toHaveURL(/\/login$/);
});

test("a volunteer without a second factor sets one up", async ({ page }) => {
  test.skip(!NEW_EMAIL, "E2E_NEW_EMAIL is not set");
  await page.goto("/login");
  await page.getByLabel("Почта").fill(NEW_EMAIL);
  await page.getByLabel("Пароль").fill(PASSWORD);
  await page.getByRole("button", { name: "Войти" }).click();
  if (page.url().endsWith("/volunteer/2fa/verify")) {
    test.skip(true, "this volunteer already has a second factor");
  }
  await expect(page).toHaveURL(/\/volunteer\/2fa$/);
  await page.getByRole("button", { name: "Начать настройку" }).click();
  await expect(page.getByRole("img", { name: /QR-код/ })).toBeVisible();
  await page.getByText("Показать ключ").click();
  const secret = (await page.getByText(/Ключ для ввода вручную/).innerText()).split(": ")[1].trim();
  await page.getByLabel("Код из приложения").fill("123456");
  await page.getByRole("button", { name: "Подтвердить" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Неверный код" })).toBeVisible();
  await page.getByLabel("Код из приложения").fill(totp(secret));
  await page.getByRole("button", { name: "Подтвердить" }).click();
  await expect(page).toHaveURL(/\/volunteer\/needs$/);
  await page.goto("/volunteer/2fa");
  await expect(page.getByText("Двухфакторный вход уже настроен.")).toBeVisible();
});

test("a volunteer adds and edits an animal with a photo", async ({ page }) => {
  const name = `Тестик${Date.now() % 100000}`;
  await signIn(page);
  await page.getByRole("link", { name: "Животные" }).click();
  await page.getByRole("link", { name: "Добавить животное" }).click();
  await expect(page).toHaveTitle("Добавить животное");
  await page.getByLabel("Кличка").fill(name);
  await page.getByLabel("Вольер").fill("Тест-1");
  await page.getByRole("radio", { name: "Собака" }).check();
  await page.getByRole("radio", { name: "Мальчик" }).check();
  await page.getByRole("radio", { name: "Средняя" }).check();
  await page.getByLabel("Примерный возраст: полных лет").fill("2");
  await page.locator("#photo").setInputFiles(await photo("#aa6633"));
  await expect(page.getByText(/^Выбрано: photo\.(webp|jpg)/)).toBeVisible({ timeout: 15000 });
  await page.getByLabel("Описание фото").fill("Рыжий пёс на траве");
  await page.getByLabel("Здоровье").fill("Здоров, привит");
  await page.getByLabel("Описание, характер, история").fill("Позвоните мне +373 600 11 222");
  await page.getByRole("button", { name: "Добавить животное" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Уберите из поля «Описание» телефон" })).toBeVisible();
  await expect(page.getByLabel("Кличка")).toHaveValue(name);
  await page.locator("#photo").setInputFiles(await photo("#aa6633"));
  await expect(page.getByText(/^Выбрано: photo\./)).toBeVisible({ timeout: 15000 });
  await page.getByLabel("Описание, характер, история").fill("Добрый и спокойный пёс.");
  await page.getByRole("button", { name: "Добавить животное" }).click();
  await expect(page).toHaveURL(/\/volunteer$/);

  await page.getByLabel("Найти по имени или вольеру").fill(name);
  await page.getByRole("button", { name: "Показать" }).click();
  await expect(page.getByRole("heading", { name })).toBeVisible();
  await expect(page.getByText("Вольер: Тест-1")).toBeVisible();

  const publicPage = await page.context().newPage();
  await publicPage.goto("/ru/catalog");
  const card = publicPage.getByRole("link", { name: `Подробнее: ${name}` });
  await expect(card).toBeVisible();
  await card.click();
  const image = publicPage.getByRole("img", { name: "Рыжий пёс на траве" }).first();
  const source = (await image.getAttribute("src")) ?? "";
  expect(source).toMatch(/\/animals\/[0-9a-f-]+\/photo\.(webp|jpg)$/);
  for (const copy of [source, source.replace(/\.(webp|jpg)$/, "-card.$1"), source.replace(/\.(webp|jpg)$/, "-og.jpg")]) {
    const response = await publicPage.request.get(copy);
    expect(response.status(), copy).toBe(200);
    const meta = await sharp(await response.body()).metadata();
    expect(meta.exif, `${copy} has no EXIF`).toBeUndefined();
    if (copy.endsWith("-og.jpg")) {
      expect([meta.width, meta.height]).toEqual([1200, 630]);
    } else if (copy.includes("-card.")) {
      expect(Math.max(meta.width ?? 0, meta.height ?? 0)).toBe(800);
    } else {
      expect(Math.max(meta.width ?? 0, meta.height ?? 0)).toBe(1600);
    }
  }
  await expect(publicPage.locator('meta[property="og:image"]')).toHaveAttribute("content", /-og\.jpg$/);
  await publicPage.close();

  await page.getByRole("link", { name: `Редактировать: ${name}` }).click();
  await expect(page).toHaveTitle(`Редактирование: ${name}`);
  await page.getByLabel("Кличка").fill(`${name}-2`);
  await page.getByRole("checkbox", { name: "Срочно нужна помощь с лечением" }).check();
  await page.locator("#photo").setInputFiles(await photo("#3366aa"));
  await expect(page.getByText(/^Выбрано: photo\./)).toBeVisible({ timeout: 15000 });
  await page.getByRole("button", { name: "Сохранить изменения" }).click();
  await expect(page).toHaveURL(/\/volunteer$/);
  const oldCopies = [source, source.replace(/\.(webp|jpg)$/, "-card.$1"), source.replace(/\.(webp|jpg)$/, "-og.jpg")];
  for (const copy of oldCopies) {
    await expect.poll(async () => (await page.request.get(copy)).status(), { message: `${copy} is removed` }).not.toBe(200);
  }
  const replaced = await page.context().newPage();
  await replaced.goto("/ru/catalog");
  await replaced.getByRole("link", { name: `Подробнее: ${name}-2` }).click();
  const newSource = (await replaced.getByRole("img", { name: "Рыжий пёс на траве" }).first().getAttribute("src")) ?? "";
  expect(newSource).toMatch(/\/animals\/[0-9a-f-]+\/[0-9a-f-]{36}\.(webp|jpg)$/);
  for (const copy of [newSource, newSource.replace(/\.(webp|jpg)$/, "-card.$1"), newSource.replace(/\.(webp|jpg)$/, "-og.jpg")]) {
    expect((await replaced.request.get(copy)).status(), copy).toBe(200);
  }
  await replaced.close();
  await page.getByLabel("Найти по имени или вольеру").fill(`${name}-2`);
  await page.getByRole("button", { name: "Показать" }).click();
  await expect(page.getByText(/Срочно нужна помощь с лечением, с/)).toBeVisible();
  await page.getByLabel(`Статус: ${name}-2`, { exact: true }).selectOption("в процессе");
  await page.getByRole("button", { name: `Сохранить статус: ${name}-2` }).click();
  await expect(page.getByLabel(`Статус: ${name}-2`, { exact: true })).toHaveValue("в процессе");
});

test("a volunteer records a purchase, undoes it and records consumption", async ({ page }) => {
  const name = `Корм тест ${Date.now() % 100000}`;
  await signIn(page);
  await page.getByRole("link", { name: "Добавить позицию" }).click();
  await page.getByLabel("Название").fill(name);
  await page.getByLabel("Категория").selectOption("корм");
  await page.getByLabel("Единица измерения").selectOption("кг");
  await page.getByLabel("Нужное количество").fill("10");
  await page.getByRole("checkbox", { name: "Срочно нужно" }).check();
  await page.getByRole("button", { name: "Добавить позицию" }).click();
  await expect(page).toHaveURL(/\/volunteer\/needs$/);

  await page.getByLabel("Позиция").selectOption({ label: `${name}: Нужно: 10 кг` });
  await page.getByLabel("Сколько получили").fill("abc");
  await page.getByRole("button", { name: "Записать" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Введите, сколько получили" })).toBeVisible();
  await page.getByLabel("Позиция").selectOption({ label: `${name}: Нужно: 10 кг` });
  await page.getByLabel("Сколько получили").fill("2,5");
  await page.getByRole("button", { name: "Записать" }).click();
  await expect(page.getByRole("status").filter({ hasText: `Записано: 2,5 кг, ${name}. Нужно: 7,5 кг` })).toBeVisible();
  await page.reload();
  await expect(page.getByText(`2,5 кг, ${name}`)).toBeVisible();
  await page.getByRole("button", { name: `Отменить запись: 2,5 кг, ${name}` }).click();
  await expect(page.getByRole("status").filter({ hasText: `Покупка отменена: 2,5 кг, ${name}. Нужно: 10 кг` })).toBeVisible();

  await page.getByRole("link", { name: "Нужно купить" }).click();
  const consumption = page.locator("details", { has: page.getByLabel(`Расход: ${name}`, { exact: true }) });
  await consumption.getByLabel(`Расход: ${name}`, { exact: true }).click();
  await consumption.getByLabel("Сколько израсходовали:").fill("1");
  await page.getByRole("button", { name: `Записать расход: ${name}` }).click();
  await expect(page.getByRole("status").filter({ hasText: `расход 1 кг, ${name}. Нужно: 11 кг` })).toBeVisible();

  const publicPage = await page.context().newPage();
  await publicPage.goto("/ru/needs?urgent=1");
  await expect(publicPage.getByRole("heading", { name })).toBeVisible();
  await publicPage.close();
});

test("a volunteer adds a project with a photo and completes it", async ({ page }) => {
  const title = `Проект тест ${Date.now() % 100000}`;
  await signIn(page);
  await page.getByRole("link", { name: "Проекты" }).click();
  await page.getByRole("link", { name: "Добавить проект" }).click();
  await page.getByLabel("Название").fill(title);
  await page.getByLabel("Описание", { exact: true }).fill("Строим навес.\n- Доски\n- Гвозди");
  await page.locator("#photo").setInputFiles(await photo("#336699"));
  await expect(page.getByText(/^Выбрано: photo\./)).toBeVisible({ timeout: 15000 });
  await page.getByLabel("Описание фото").fill("Навес из досок");
  await page.getByLabel("Сколько всего").fill("4");
  await page.getByLabel("Сколько сделано").fill("1");
  await page.getByLabel("Что считаем").fill("досок");
  await page.getByRole("button", { name: "Добавить проект" }).click();
  await expect(page).toHaveURL(/\/volunteer\/projects$/);
  const before = await page.context().newPage();
  await before.goto("/ru/projects");
  const oldPhoto =
    (await before.locator("li", { has: before.getByRole("heading", { name: title }) }).getByRole("img", { name: "Навес из досок" }).getAttribute("src")) ?? "";
  await before.close();
  await page.getByRole("link", { name: `Редактировать: ${title}` }).click();
  await page.locator("#photo").setInputFiles(await photo("#993366"));
  await expect(page.getByText(/^Выбрано: photo\./)).toBeVisible({ timeout: 15000 });
  await page.getByRole("button", { name: "Сохранить проект" }).click();
  await expect(page).toHaveURL(/\/volunteer\/projects$/);
  await expect.poll(async () => (await page.request.get(oldPhoto)).status(), { message: `${oldPhoto} is removed` }).not.toBe(200);
  await page.getByLabel(`Сделано из 4 досок: ${title}`).fill("4");
  await page.getByRole("button", { name: `Сохранить счёт дел: ${title}` }).click();
  await expect(page.getByRole("button", { name: `Убрать из списка: ${title}` })).toBeVisible();

  const publicPage = await page.context().newPage();
  await publicPage.goto("/ru/projects");
  const item = publicPage.locator("li", { has: publicPage.getByRole("heading", { name: title }) });
  await expect(item.getByRole("img", { name: "Навес из досок" })).toBeVisible();
  await expect(item.getByText("Цель достигнута:")).toBeVisible();
  await publicPage.close();
});

test("the nightly translation needs the cron secret and reports DeepL", async ({ request }) => {
  test.skip(!CRON_SECRET, "E2E_CRON_SECRET is not set");
  expect((await request.get("/api/cron/translate")).status()).toBe(401);
  expect((await request.get("/api/cron/translate", { headers: { Authorization: "Bearer wrong" } })).status()).toBe(401);
  const response = await request.get("/api/cron/translate", { headers: { Authorization: `Bearer ${CRON_SECRET}` } });
  expect(response.status()).toBe(200);
  const report = await response.json();
  expect(Object.keys(report).sort()).toEqual(["cleared", "deepl", "items", "pets", "projects", "shelters"]);
  expect(typeof report.deepl).toBe("string");
});

test("panel pages pass axe and have unique titles", async ({ page }) => {
  await signIn(page);
  const titles = new Map<string, string>();
  const paths = [
    "/volunteer",
    "/volunteer/pets/new",
    "/volunteer/needs",
    "/volunteer/needs/open",
    "/volunteer/needs/stock",
    "/volunteer/needs/closed",
    "/volunteer/needs/closed?archived=1",
    "/volunteer/needs/new",
    "/volunteer/projects",
    "/volunteer/projects?archived=1",
    "/volunteer/projects/new",
  ];
  for (const path of paths) {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
    expect(results.violations.map((v) => `${path}: ${v.id} ${v.nodes[0].target.join(" ")}`)).toEqual([]);
    const title = await page.title();
    expect(titles.get(title), `title "${title}" of ${path} is also used by ${titles.get(title)}`).toBeUndefined();
    titles.set(title, path);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex");
  }
});

test("logging out ends the session", async ({ page }) => {
  await signIn(page);
  await page.getByText("Аккаунт").click();
  await page.getByRole("button", { name: "Выйти" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/volunteer");
  await expect(page).toHaveURL(/\/login$/);
});

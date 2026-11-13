import { readdirSync, readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import type { Database } from "../src/lib/database.ts";

const url = process.env.SUPABASE_URL ?? "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const GALLERY = "public/shelters/live-life/gallery";
const VOLUNTEER_EMAIL = "volunteer@example.org";
const VOLUNTEER_PASSWORD = "local-test-password";

const host = URL.canParse(url) ? new URL(url).hostname : "";
if (host !== "127.0.0.1" && host !== "localhost") {
  console.error(`Отказ: SUPABASE_URL должен указывать на локальную базу (127.0.0.1 или localhost), а сейчас: «${host || "не задан"}».`);
  console.error("Запуск: node --env-file=.dev.vars scripts/seed-local.ts");
  process.exit(1);
}
if (!serviceKey) {
  console.error("Отказ: в .dev.vars нет SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient<Database>(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

function must<T>(result: { data: T; error: { message: string } | null }, what: string): T {
  if (result.error) {
    console.error(`Ошибка (${what}): ${result.error.message}`);
    process.exit(1);
  }
  return result.data;
}

const existing = must(await supabase.from("shelter").select("name").maybeSingle(), "проверка приюта");
if (existing) {
  console.error(`В этой базе уже есть приют «${existing.name}». Тестовые данные не добавлены.`);
  process.exit(1);
}

const photos = readdirSync(GALLERY)
  .filter((file) => /^\d+\.webp$/.test(file))
  .sort();
if (photos.length === 0) {
  console.error(`В ${GALLERY} нет фото.`);
  process.exit(1);
}

async function upload(path: string, body: Buffer, contentType: string) {
  must(await supabase.storage.from("pet-photos").upload(path, body, { contentType, upsert: true, cacheControl: "31536000" }), `загрузка ${path}`);
}

async function photoSet(source: string, base: string) {
  const input = readFileSync(`${GALLERY}/${source}`);
  const full = await sharp(input).resize(1600, 1600, { fit: "inside", withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
  const card = await sharp(input).resize(800, 800, { fit: "inside", withoutEnlargement: true }).webp({ quality: 75 }).toBuffer();
  const preview = await sharp(input).resize(1200, 630, { fit: "cover" }).jpeg({ quality: 80 }).toBuffer();
  await upload(`${base}.webp`, full, "image/webp");
  await upload(`${base}-card.webp`, card, "image/webp");
  await upload(`${base}-og.jpg`, preview, "image/jpeg");
  return supabase.storage.from("pet-photos").getPublicUrl(`${base}.webp`).data.publicUrl;
}

must(
  await supabase.from("shelter").insert({
    name: "Приют «Живи»",
    name_en: "Live Life Shelter",
    name_ro: "Adăpostul Live Life",
    city: "Кишинёв",
    address: "ул. Примерная, 1",
    contact_phone: "+373 600 00 000",
    contact_messenger: "https://t.me/example",
    contact_email: "shelter@example.org",
    contact_hours: "Каждый день с 10 до 18",
    about: "Мы спасаем собак и кошек с улиц.\n\nКаждое животное лечим и стерилизуем.",
    about_title: "О приюте «Живи»",
    founded_year: 2015,
    legal_info: "ОО «Живи», IDNO 0000000000000",
    adoption_info: "Животное отдаём после знакомства и договора.",
    instagram_url: "https://instagram.com/example",
    facebook_url: "https://facebook.com/example",
    telegram_url: "https://t.me/example_channel",
    payment_url: "https://example.org/pay",
    donation_text: "Любая сумма помогает.",
    content_language: "ru",
    is_published: true,
  }),
  "приют",
);
console.log("Приют: «Приют «Живи»», опубликован.");

must(
  await supabase.from("gallery_photos").insert(
    photos.map((file, position) => {
      const number = file.replace(".webp", "");
      return {
        source_name: `${number}.jpg`,
        path: `/shelters/live-life/gallery/${file}`,
        thumb_path: `/shelters/live-life/gallery/${number}-thumb.webp`,
        alt: `Фото приюта ${number}`,
        position,
      };
    }),
  ),
  "галерея",
);
console.log(`Галерея «О приюте»: ${photos.length} фото.`);

const yearsAgo = (years: number, months = 0) => {
  const date = new Date();
  date.setUTCFullYear(date.getUTCFullYear() - years, date.getUTCMonth() - months, 1);
  return date.toISOString().slice(0, 10);
};
type Size = "мелкая" | "средняя" | "крупная";
const pets: { name: string; sex: "мальчик" | "девочка"; size: Size; age: [number, number]; approximate: boolean; status: string; treatment?: boolean; enclosure?: string }[] = [
  { name: "Барсик", sex: "мальчик", size: "средняя", age: [3, 0], approximate: true, status: "ищет дом", enclosure: "А1" },
  { name: "Рекс", sex: "мальчик", size: "крупная", age: [5, 2], approximate: false, status: "ищет дом", enclosure: "А2" },
  { name: "Альма", sex: "девочка", size: "средняя", age: [2, 6], approximate: false, status: "ищет дом" },
  { name: "Жучка", sex: "девочка", size: "мелкая", age: [1, 3], approximate: false, status: "ищет дом", enclosure: "Б1" },
  { name: "Гром", sex: "мальчик", size: "крупная", age: [7, 0], approximate: true, status: "ищет дом" },
  { name: "Дымка", sex: "девочка", size: "средняя", age: [4, 0], approximate: true, status: "ищет дом", treatment: true },
  { name: "Тузик", sex: "мальчик", size: "мелкая", age: [0, 8], approximate: false, status: "ищет дом" },
  { name: "Ночка", sex: "девочка", size: "крупная", age: [6, 5], approximate: false, status: "на лечении", treatment: true, enclosure: "Л1" },
  { name: "Рыжик", sex: "мальчик", size: "средняя", age: [3, 4], approximate: false, status: "на лечении" },
  { name: "Снежок", sex: "мальчик", size: "крупная", age: [2, 0], approximate: true, status: "в процессе" },
  { name: "Найда", sex: "девочка", size: "средняя", age: [9, 0], approximate: true, status: "ищет дом" },
  { name: "Шарик", sex: "мальчик", size: "мелкая", age: [4, 7], approximate: false, status: "пристроен" },
];
for (const [index, pet] of pets.entries()) {
  const id = crypto.randomUUID();
  const photoUrl = await photoSet(photos[index % photos.length], `animals/${id}/photo`);
  must(
    await supabase.from("pets").insert({
      id,
      name: pet.name,
      species: "собака",
      sex: pet.sex,
      size: pet.size,
      birth_date: yearsAgo(...pet.age),
      is_age_approximate: pet.approximate,
      health: pet.treatment ? "Лечим лапу, нужны перевязки." : "Привита, стерилизована.",
      description: `${pet.name} спокойный и ласковый. Любит прогулки и людей.`,
      status: pet.status,
      needs_treatment_since: pet.treatment ? new Date().toISOString() : null,
      photo_url: photoUrl,
      photo_alt: `${pet.name} во дворе приюта`,
    }),
    `животное ${pet.name}`,
  );
  if (pet.enclosure) {
    must(await supabase.from("pet_internal").insert({ pet_id: id, enclosure: pet.enclosure }), `вольер ${pet.name}`);
  }
}
console.log(`Животные: ${pets.length}, у каждого фото, карточка 800 px и превью для ссылок.`);

const needs: { name: string; category: string; unit: string; remaining: number; urgent?: boolean; note?: string }[] = [
  { name: "Сухой корм для собак", category: "корм", unit: "кг", remaining: 40, urgent: true, note: "Любой марки" },
  { name: "Консервы для щенков", category: "корм", unit: "шт", remaining: 24 },
  { name: "Бинты", category: "лекарства", unit: "шт", remaining: 15, urgent: true },
  { name: "Средство от блох", category: "лекарства", unit: "шт", remaining: 10 },
  { name: "Пелёнки", category: "расходники", unit: "шт", remaining: 60 },
  { name: "Шампунь для собак", category: "гигиена", unit: "л", remaining: 3 },
  { name: "Ошейники", category: "амуниция", unit: "шт", remaining: 8 },
  { name: "Миски", category: "инвентарь", unit: "шт", remaining: 12 },
  { name: "Сетка для вольера", category: "территория", unit: "шт", remaining: 5, urgent: true },
  { name: "Перчатки", category: "рабочим", unit: "шт", remaining: 20 },
];
must(
  await supabase.from("purchase_items").insert(
    needs.map((need) => ({ name: need.name, category: need.category, unit: need.unit, remaining: need.remaining, is_urgent: need.urgent ?? false, note: need.note ?? null })),
  ),
  "нужды",
);
console.log(`Нужды: ${needs.length}.`);

const projectPhotoPath = `projects/${crypto.randomUUID()}.webp`;
await upload(
  projectPhotoPath,
  await sharp(readFileSync(`${GALLERY}/${photos[photos.length - 1]}`)).resize(1600, 1600, { fit: "inside", withoutEnlargement: true }).webp({ quality: 80 }).toBuffer(),
  "image/webp",
);
const projects: Database["public"]["Tables"]["projects"]["Insert"][] = [
  { title: "Программа стерилизации", description: "Стерилизуем уличных животных.\n- Кошки\n- Собаки", help_kinds: ["money"], status: "идёт", is_pinned: true },
  {
    title: "Тёплые будки",
    description: "Строим будки к зиме.",
    help_kinds: ["things", "money"],
    status: "идёт",
    progress_total: 20,
    progress_done: 5,
    progress_unit: "будок",
    photo_path: projectPhotoPath,
    photo_alt: "Собаки у вольера",
  },
  { title: "Ремонт сетки", description: "Заменили сетку на двух вольерах.", help_kinds: ["money"], status: "завершён" },
];
for (const project of projects) {
  must(await supabase.from("projects").insert(project), `проект ${project.title}`);
}
console.log("Проекты: 3 (один закреплён, один с фото и счётом дел, один завершён).");

const { data: created, error: createError } = await supabase.auth.admin.createUser({ email: VOLUNTEER_EMAIL, password: VOLUNTEER_PASSWORD, email_confirm: true });
if (createError || !created.user) {
  console.error(`Ошибка (волонтёр): ${createError?.message ?? "нет пользователя"}`);
  process.exit(1);
}
must(await supabase.from("volunteers").insert({ user_id: created.user.id }), "волонтёр в приюте");
console.log("");
console.log("Тестовый волонтёр (только для этой локальной базы):");
console.log(`  почта:  ${VOLUNTEER_EMAIL}`);
console.log(`  пароль: ${VOLUNTEER_PASSWORD}`);
console.log("  При первом входе сайт попросит настроить двухфакторный вход (QR-код для приложения).");
console.log("");
console.log("Готово.");

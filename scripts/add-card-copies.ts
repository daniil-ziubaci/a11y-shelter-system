import type { Database } from "@/types/database";
import { createClient } from "@supabase/supabase-js";
import { cardCopyOf } from "../lib/photoUrls.ts";
import { makeCardCopy } from "./lib/processPhoto.ts";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Использование: node --env-file=.env.coordinator scripts/add-card-copies.ts",
  );
  process.exit(1);
}

const supabase = createClient<Database>(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const bucket = supabase.storage.from("pet-photos");

const { data: pets, error: petsError } = await supabase
  .from("pets")
  .select("id, photo_url")
  .not("photo_url", "is", null)
  .limit(1000);

if (petsError || !pets) {
  console.error(petsError?.message ?? "Не удалось прочитать животных.");
  process.exit(1);
}

if (pets.length === 1000) {
  console.error("Ровно 1000 животных: нужен постраничный запрос.");
  process.exit(1);
}

const marker = "/storage/v1/object/public/pet-photos/";

let created = 0;
let skipped = 0;
let failed = 0;

for (const pet of pets) {
  const index = pet.photo_url?.indexOf(marker) ?? -1;
  if (!pet.photo_url || index === -1) {
    console.error(`Пропущено ${pet.id}: адрес фото не из хранилища.`);
    failed += 1;
    continue;
  }
  const path = decodeURIComponent(pet.photo_url.slice(index + marker.length));

  const { data: file, error: downloadError } = await bucket.download(path);
  if (downloadError || !file) {
    console.error(`Не скачалось ${path}: ${downloadError?.message}`);
    failed += 1;
    continue;
  }
  const full = Buffer.from(await file.arrayBuffer());
  const card = await makeCardCopy(full).catch(() => null);
  if (!card) {
    console.error(`Не удалось уменьшить ${path}`);
    failed += 1;
    continue;
  }

  const { error: uploadError } = await bucket.upload(cardCopyOf(path), card, {
    contentType: "image/webp",
    cacheControl: "31536000",
  });
  if (!uploadError) {
    created += 1;
  } else if (/already exists/i.test(uploadError.message)) {
    skipped += 1;
  } else {
    console.error(`Не загрузилось ${path}: ${uploadError.message}`);
    failed += 1;
  }
}

console.log(
  `Готово: создано ${created}, уже было ${skipped}, ошибок ${failed}.`,
);
if (failed > 0) {
  process.exit(1);
}

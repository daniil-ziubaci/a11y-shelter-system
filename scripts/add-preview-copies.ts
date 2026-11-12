import type { Database } from "@/types/database";
import { createClient } from "@supabase/supabase-js";
import { previewCopyOf } from "../lib/photoUrls.ts";
import { makePreviewJpeg } from "./lib/previewImage.ts";

// One-off backfill: link previews (photo-og.jpg next to each photo) used to be
// rendered on every request by /api/og/*. Now they are prepared at upload
// time, so photos uploaded before that change need a stored preview.
// Safe to run again: existing previews are skipped.

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Использование: node --env-file=.env.coordinator scripts/add-preview-copies.ts",
  );
  process.exit(1);
}

const supabase = createClient<Database>(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const bucket = supabase.storage.from("pet-photos");
const marker = "/storage/v1/object/public/pet-photos/";

const paths: string[] = [];

const { data: shelters, error: sheltersError } = await supabase
  .from("shelters")
  .select("photo_path")
  .not("photo_path", "is", null);
if (sheltersError || !shelters) {
  console.error(sheltersError?.message ?? "Не удалось прочитать приюты.");
  process.exit(1);
}
for (const shelter of shelters) {
  if (shelter.photo_path) paths.push(shelter.photo_path);
}

const pageSize = 1000;
for (let from = 0; ; from += pageSize) {
  const { data: pets, error: petsError } = await supabase
    .from("pets")
    .select("photo_url")
    .not("photo_url", "is", null)
    .order("id")
    .range(from, from + pageSize - 1);
  if (petsError || !pets) {
    console.error(petsError?.message ?? "Не удалось прочитать животных.");
    process.exit(1);
  }
  for (const pet of pets) {
    const index = pet.photo_url?.indexOf(marker) ?? -1;
    if (pet.photo_url && index !== -1) {
      paths.push(
        decodeURIComponent(pet.photo_url.slice(index + marker.length)),
      );
    }
  }
  if (pets.length < pageSize) break;
}

let created = 0;
let skipped = 0;
let failed = 0;

for (const path of paths) {
  const { data: file, error: downloadError } = await bucket.download(path);
  if (downloadError || !file) {
    console.error(`Не скачалось ${path}: ${downloadError?.message}`);
    failed += 1;
    continue;
  }
  const preview = await makePreviewJpeg(
    Buffer.from(await file.arrayBuffer()),
  ).catch(() => null);
  if (!preview) {
    console.error(`Не удалось сделать превью ${path}`);
    failed += 1;
    continue;
  }
  const { error: uploadError } = await bucket.upload(
    previewCopyOf(path),
    preview,
    { contentType: "image/jpeg", cacheControl: "31536000" },
  );
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
  `Превью созданы: ${created}, уже были: ${skipped}, ошибок: ${failed}`,
);
if (failed > 0) process.exit(1);

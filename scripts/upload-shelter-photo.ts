import { randomUUID } from "node:crypto";
import type { Database } from "@/types/database";
import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { processPhoto } from "../lib/processPhoto.ts";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const [slug, filePath, alt] = process.argv.slice(2);

if (!url || !serviceKey || !slug || !filePath || !alt) {
  console.error(
    'Использование: node --env-file=.env.coordinator scripts/upload-shelter-photo.ts slug путь "описание"',
  );
  process.exit(1);
}

if (alt.length > 300) {
  console.error("Описание не длиннее 300 знаков.");
  process.exit(1);
}

const supabase = createClient<Database>(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: shelter, error: shelterError } = await supabase
  .from("shelters")
  .select("id")
  .eq("slug", slug)
  .maybeSingle();

if (shelterError || !shelter) {
  console.error(shelterError?.message ?? "Приют с таким slug не найден.");
  process.exit(1);
}

const raw = await readFile(filePath).catch(() => null);

if (!raw) {
  console.error("Не удалось прочитать файл.");
  process.exit(1);
}

const processed = await processPhoto(
  new File([new Uint8Array(raw)], basename(filePath)),
);

if (!processed) {
  console.error("Нужен снимок в формате jpeg, png или webp.");
  process.exit(1);
}

const photoPath = `${shelter.id}/shelter/${randomUUID()}.webp`;

const { error: uploadError } = await supabase.storage
  .from("pet-photos")
  .upload(photoPath, processed, { contentType: "image/webp" });

if (uploadError) {
  console.error(`Не удалось загрузить файл: ${uploadError.message}`);
  process.exit(1);
}

const { data: updated, error: updateError } = await supabase
  .from("shelters")
  .update({ photo_path: photoPath, photo_alt: alt })
  .eq("id", shelter.id)
  .select("id")
  .maybeSingle();

if (updateError || !updated) {
  console.error(
    `Файл загружен (${photoPath}), но в профиль не записан: ${updateError?.message ?? "приют не найден"}`,
  );
  process.exit(1);
}

console.log(`Фото приюта обновлено: ${photoPath}`);

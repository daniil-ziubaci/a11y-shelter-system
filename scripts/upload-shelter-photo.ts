import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { previewCopyOf } from "../src/lib/photoUrls.ts";
import { connect, splitArgs, stopUnlessApply } from "./lib/connect.ts";
import { makePreviewJpeg } from "./lib/previewImage.ts";
import { processPhoto } from "./lib/processPhoto.ts";

const { apply, args } = splitArgs(process.argv.slice(2));
const [filePath, alt] = args;

if (!filePath || !alt) {
  console.error('Использование: node --env-file=.env.coordinator scripts/upload-shelter-photo.ts путь "описание" [--apply]');
  process.exit(1);
}

if (alt.length > 300) {
  console.error("Описание не длиннее 300 знаков.");
  process.exit(1);
}

const supabase = connect('upload-shelter-photo.ts путь "описание" [--apply]');

const { data: shelter, error: shelterError } = await supabase.from("shelter").select("photo_path").maybeSingle();

if (shelterError || !shelter) {
  console.error(shelterError?.message ?? "Приют ещё не заведён (scripts/create-shelter.ts).");
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

const photoPath = `shelter/${randomUUID()}.webp`;
console.log(`Фото приюта станет ${photoPath} с описанием «${alt}»${shelter.photo_path ? ` (вместо ${shelter.photo_path})` : ""}.`);
stopUnlessApply(apply);

const { error: uploadError } = await supabase.storage
  .from("pet-photos")
  .upload(photoPath, processed, {
    contentType: "image/webp",
    cacheControl: "31536000",
  });

if (uploadError) {
  console.error(`Не удалось загрузить файл: ${uploadError.message}`);
  process.exit(1);
}

const { error: previewError } = await supabase.storage
  .from("pet-photos")
  .upload(previewCopyOf(photoPath), await makePreviewJpeg(processed), {
    contentType: "image/jpeg",
    cacheControl: "31536000",
  });

if (previewError) {
  console.error(`Не удалось загрузить превью: ${previewError.message}`);
  process.exit(1);
}

const { data: updated, error: updateError } = await supabase
  .from("shelter")
  .update({ photo_path: photoPath, photo_alt: alt })
  .eq("id", true)
  .select("id")
  .maybeSingle();

if (updateError || !updated) {
  console.error(
    `Файл загружен (${photoPath}), но в профиль не записан: ${updateError?.message ?? "приют не найден"}`,
  );
  process.exit(1);
}

console.log(`Фото приюта обновлено: ${photoPath}`);

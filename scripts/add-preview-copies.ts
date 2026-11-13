import { previewCopyOf } from "../src/lib/photoUrls.ts";
import { connect, splitArgs, stopUnlessApply, storagePath } from "./lib/connect.ts";
import { makePreviewJpeg } from "./lib/previewImage.ts";

const { apply } = splitArgs(process.argv.slice(2));
const supabase = connect("add-preview-copies.ts [--apply]");
const bucket = supabase.storage.from("pet-photos");

const paths: string[] = [];
const { data: shelter, error: shelterError } = await supabase.from("shelter").select("photo_path").maybeSingle();
if (shelterError) {
  console.error(shelterError.message);
  process.exit(1);
}
if (shelter?.photo_path) paths.push(shelter.photo_path);

for (let from = 0; ; from += 1000) {
  const { data, error } = await supabase.from("pets").select("photo_url").order("id").range(from, from + 999);
  if (error || !data) {
    console.error(error?.message ?? "Не удалось прочитать животных.");
    process.exit(1);
  }
  for (const pet of data) {
    const path = storagePath(pet.photo_url);
    if (path) paths.push(path);
  }
  if (data.length < 1000) break;
}

console.log(`Фото: ${paths.length}. Для каждого будет сделано превью для ссылок 1200×630, если его ещё нет.`);
stopUnlessApply(apply);

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
  const preview = await makePreviewJpeg(Buffer.from(await file.arrayBuffer())).catch(() => null);
  if (!preview) {
    console.error(`Не удалось сделать превью ${path}`);
    failed += 1;
    continue;
  }
  const { error: uploadError } = await bucket.upload(previewCopyOf(path), preview, { contentType: "image/jpeg", cacheControl: "31536000" });
  if (!uploadError) created += 1;
  else if (/already exists/i.test(uploadError.message)) skipped += 1;
  else {
    console.error(`Не загрузилось ${path}: ${uploadError.message}`);
    failed += 1;
  }
}
console.log(`Превью созданы: ${created}, уже были: ${skipped}, ошибок: ${failed}`);
if (failed > 0) process.exit(1);

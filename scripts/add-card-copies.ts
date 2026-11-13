import { cardCopyOf } from "../src/lib/photoUrls.ts";
import { connect, splitArgs, stopUnlessApply, storagePath } from "./lib/connect.ts";
import { makeCardCopy } from "./lib/processPhoto.ts";

const { apply } = splitArgs(process.argv.slice(2));
const supabase = connect("add-card-copies.ts [--apply]");
const bucket = supabase.storage.from("pet-photos");

const paths: string[] = [];
for (let from = 0; ; from += 1000) {
  const { data, error } = await supabase.from("pets").select("id, photo_url").order("id").range(from, from + 999);
  if (error || !data) {
    console.error(error?.message ?? "Не удалось прочитать животных.");
    process.exit(1);
  }
  for (const pet of data) {
    const path = storagePath(pet.photo_url);
    if (path) paths.push(path);
    else console.error(`Пропущено ${pet.id}: адрес фото не из хранилища.`);
  }
  if (data.length < 1000) break;
}

console.log(`Фото животных: ${paths.length}. Для каждого будет сделана карточка 800 px, если её ещё нет.`);
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
  const card = await makeCardCopy(Buffer.from(await file.arrayBuffer())).catch(() => null);
  if (!card) {
    console.error(`Не удалось уменьшить ${path}`);
    failed += 1;
    continue;
  }
  const { error: uploadError } = await bucket.upload(cardCopyOf(path), card, { contentType: "image/webp", cacheControl: "31536000" });
  if (!uploadError) created += 1;
  else if (/already exists/i.test(uploadError.message)) skipped += 1;
  else {
    console.error(`Не загрузилось ${path}: ${uploadError.message}`);
    failed += 1;
  }
}
console.log(`Готово: создано ${created}, уже было ${skipped}, ошибок ${failed}.`);
if (failed > 0) process.exit(1);

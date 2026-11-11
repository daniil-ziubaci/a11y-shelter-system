import { mkdir, readdir, readFile, rm } from "node:fs/promises";
import { join, parse } from "node:path";
import type { Database } from "@/types/database";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const [slug, folder] = process.argv.slice(2);

if (!url || !serviceKey || !slug || !folder) {
  console.error(
    "Использование: node --env-file=.env.coordinator scripts/load-gallery.ts slug папка",
  );
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

type Entry = { file: string; alt: string; alt_en: string; alt_ro: string };

const entries: Entry[] = (await readFile(join(folder, "alts.jsonl"), "utf8"))
  .split("\n")
  .filter((line) => line.trim() !== "")
  .map((line) => JSON.parse(line));

if (entries.length === 0) {
  console.error("В alts.jsonl нет ни одной строки.");
  process.exit(1);
}

const outDir = join("public", "shelters", slug, "gallery");
await mkdir(outDir, { recursive: true });

async function convert(source: Buffer, name: string) {
  const base = sharp(source).rotate();
  await base
    .clone()
    .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 72, effort: 6 })
    .toFile(join(outDir, `${name}.webp`));
  await base
    .clone()
    .resize(192, 192, { fit: "cover" })
    .webp({ quality: 75 })
    .toFile(join(outDir, `${name}-thumb.webp`));
}

const rows: Database["public"]["Tables"]["shelter_photos"]["Insert"][] = [];

for (const [position, entry] of entries.entries()) {
  const name = parse(entry.file).name;
  const source = await readFile(join(folder, entry.file));
  await convert(source, name);
  rows.push({
    shelter_id: shelter.id,
    source_name: entry.file,
    path: `/shelters/${slug}/gallery/${name}.webp`,
    thumb_path: `/shelters/${slug}/gallery/${name}-thumb.webp`,
    alt: entry.alt,
    alt_en: entry.alt_en,
    alt_ro: entry.alt_ro,
    position,
  });
  console.log(`${entry.file} -> ${name}.webp`);
}

const { error: upsertError } = await supabase
  .from("shelter_photos")
  .upsert(rows, { onConflict: "shelter_id,source_name" });

if (upsertError) {
  console.error(upsertError.message);
  process.exit(1);
}

const { error: cleanupError } = await supabase
  .from("shelter_photos")
  .delete()
  .eq("shelter_id", shelter.id)
  .not("source_name", "in", `(${rows.map((row) => row.source_name).join(",")})`);

if (cleanupError) {
  console.error(cleanupError.message);
  process.exit(1);
}

const wanted = new Set(
  rows.flatMap((row) => [parse(row.path).base, parse(row.thumb_path).base]),
);

for (const file of await readdir(outDir)) {
  if (!wanted.has(file)) {
    await rm(join(outDir, file));
  }
}

console.log(`Готово: ${rows.length} фото.`);

import { mkdir, readdir, readFile, rm } from "node:fs/promises";
import { join, parse } from "node:path";
import type { Database } from "@/lib/database";
import sharp from "sharp";
import { GALLERY_WIDTHS, galleryCopyOf } from "../src/lib/galleryImages.ts";
import { connect, splitArgs, stopUnlessApply } from "./lib/connect.ts";

const { apply, args } = splitArgs(process.argv.slice(2));
const [folder] = args;
const GALLERY = "/shelters/live-life/gallery";

if (!folder) {
  console.error("Использование: node --env-file=.env.coordinator scripts/load-gallery.ts папка [--apply]");
  process.exit(1);
}

const supabase = connect("load-gallery.ts папка [--apply]");

type Entry = { file: string; alt: string; alt_en: string; alt_ro: string };

const entries: Entry[] = (await readFile(join(folder, "alts.jsonl"), "utf8"))
  .split("\n")
  .filter((line) => line.trim() !== "")
  .map((line) => JSON.parse(line));

if (entries.length === 0) {
  console.error("В alts.jsonl нет ни одной строки.");
  process.exit(1);
}

const outDir = join("public", ...GALLERY.split("/").filter(Boolean));
console.log(`Фото: ${entries.length}, папка сайта ${outDir}. Подписи и порядок заменят текущую галерею.`);
for (const entry of entries) console.log(`  ${entry.file}: ${entry.alt}`);
stopUnlessApply(apply);
await mkdir(outDir, { recursive: true });

async function convert(source: Buffer, name: string) {
  const base = sharp(source).rotate();
  await base
    .clone()
    .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 72, effort: 6 })
    .toFile(join(outDir, `${name}.webp`));
  for (const width of GALLERY_WIDTHS) {
    await base
      .clone()
      .resize({ width, height: width, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 72, effort: 6 })
      .toFile(join(outDir, `${name}-${width}.webp`));
  }
  await base
    .clone()
    .resize(192, 192, { fit: "cover" })
    .webp({ quality: 75 })
    .toFile(join(outDir, `${name}-thumb.webp`));
}

const rows: Database["public"]["Tables"]["gallery_photos"]["Insert"][] = [];

for (const [position, entry] of entries.entries()) {
  const name = parse(entry.file).name;
  const source = await readFile(join(folder, entry.file));
  await convert(source, name);
  rows.push({
    source_name: entry.file,
    path: `${GALLERY}/${name}.webp`,
    thumb_path: `${GALLERY}/${name}-thumb.webp`,
    alt: entry.alt,
    alt_en: entry.alt_en,
    alt_ro: entry.alt_ro,
    position,
  });
  console.log(`${entry.file} -> ${name}.webp`);
}

const { error: upsertError } = await supabase
  .from("gallery_photos")
  .upsert(rows, { onConflict: "source_name" });

if (upsertError) {
  console.error(upsertError.message);
  process.exit(1);
}

const { error: cleanupError } = await supabase
  .from("gallery_photos")
  .delete()
  .not("source_name", "in", `(${rows.map((row) => row.source_name).join(",")})`);

if (cleanupError) {
  console.error(cleanupError.message);
  process.exit(1);
}

const wanted = new Set(
  rows.flatMap((row) => [
    parse(row.path).base,
    parse(row.thumb_path).base,
    ...GALLERY_WIDTHS.map((width) => parse(galleryCopyOf(row.path, width)).base),
  ]),
);

for (const file of await readdir(outDir)) {
  if (!wanted.has(file)) {
    await rm(join(outDir, file));
  }
}

console.log(`Готово: ${rows.length} фото.`);

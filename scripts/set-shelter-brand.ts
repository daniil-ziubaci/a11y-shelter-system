import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import sharp from "sharp";
import { connect, splitArgs, stopUnlessApply } from "./lib/connect.ts";

const { apply, args } = splitArgs(process.argv.slice(2));
const [iconFile] = args;

if (!iconFile) {
  console.error("Использование: node --env-file=.env.coordinator scripts/set-shelter-brand.ts значок.png [--apply]");
  process.exit(1);
}

const supabase = connect("set-shelter-brand.ts значок.png [--apply]");

const { data: shelter, error: shelterError } = await supabase.from("shelter").select("brand_path").maybeSingle();

if (shelterError || !shelter) {
  console.error(shelterError?.message ?? "Приют ещё не заведён (scripts/create-shelter.ts).");
  process.exit(1);
}

const iconSource = await readFile(iconFile).catch(() => null);

if (!iconSource) {
  console.error("Не удалось прочитать файл.");
  process.exit(1);
}

async function resized(source: Buffer, size: number, rounded = true) {
  const image = sharp(source).resize(size, size, { fit: "cover" });
  if (!rounded) {
    return image.png({ compressionLevel: 9 }).toBuffer();
  }
  const radius = Math.round(size * 0.2);
  const mask = Buffer.from(
    `<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${radius}" ry="${radius}"/></svg>`,
  );
  return image
    .ensureAlpha()
    .composite([{ input: mask, blend: "dest-in" }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

let files: Record<string, Buffer>;
try {
  files = {
    "logo.png": await resized(iconSource, 128),
    "icon-32.png": await resized(iconSource, 32),
    "icon-48.png": await resized(iconSource, 48),
    "icon-192.png": await resized(iconSource, 192),
    "apple-icon.png": await resized(iconSource, 180),
  };
} catch {
  console.error("Нужны изображения png, jpeg или webp.");
  process.exit(1);
}

const folder = `brand/${randomUUID()}`;
console.log(`Будут загружены логотип и значки (${Object.keys(files).join(", ")}) в ${folder}${shelter.brand_path ? `, старые из ${shelter.brand_path} удалены` : ""}.`);
stopUnlessApply(apply);

for (const [name, content] of Object.entries(files)) {
  const { error } = await supabase.storage
    .from("pet-photos")
    .upload(`${folder}/${name}`, content, {
      contentType: "image/png",
      cacheControl: "31536000",
    });
  if (error) {
    console.error(`Не удалось загрузить ${name}: ${error.message}`);
    process.exit(1);
  }
}

const { data: updated, error: updateError } = await supabase
  .from("shelter")
  .update({ brand_path: folder })
  .eq("id", true)
  .select("id")
  .maybeSingle();

if (updateError || !updated) {
  console.error(
    `Файлы загружены (${folder}), но в профиль не записаны: ${updateError?.message ?? "приют не найден"}`,
  );
  process.exit(1);
}

const oldFolder = shelter.brand_path;
if (oldFolder) {
  const { data: oldFiles } = await supabase.storage
    .from("pet-photos")
    .list(oldFolder);
  if (oldFiles && oldFiles.length > 0) {
    await supabase.storage
      .from("pet-photos")
      .remove(oldFiles.map((file) => `${oldFolder}/${file.name}`));
  }
}

console.log(`Логотип и значки приюта обновлены: ${folder}`);

import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import type { Database } from "@/types/database";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const [slug, logoFile, iconFile] = process.argv.slice(2);

if (!url || !serviceKey || !slug || !logoFile || !iconFile) {
  console.error(
    "Использование: node --env-file=.env.coordinator scripts/set-shelter-brand.ts slug логотип.png значок.png",
  );
  process.exit(1);
}

const supabase = createClient<Database>(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: shelter, error: shelterError } = await supabase
  .from("shelters")
  .select("id, brand_path")
  .eq("slug", slug)
  .maybeSingle();

if (shelterError || !shelter) {
  console.error(shelterError?.message ?? "Приют с таким slug не найден.");
  process.exit(1);
}

const logoSource = await readFile(logoFile).catch(() => null);
const iconSource = await readFile(iconFile).catch(() => null);

if (!logoSource || !iconSource) {
  console.error("Не удалось прочитать один из файлов.");
  process.exit(1);
}

async function square(source: Buffer, size: number, opaque = false) {
  let image = sharp(source).resize(size, size, {
    fit: "contain",
    background: { r: 255, g: 255, b: 255, alpha: opaque ? 1 : 0 },
  });
  if (opaque) {
    image = image.flatten({ background: "#ffffff" });
  }
  return image.png({ compressionLevel: 9 }).toBuffer();
}

let files: Record<string, Buffer>;
try {
  files = {
    "logo.png": await square(logoSource, 96),
    "icon-32.png": await square(iconSource, 32),
    "icon-48.png": await square(iconSource, 48),
    "icon-192.png": await square(iconSource, 192),
    "apple-icon.png": await square(iconSource, 180, true),
  };
} catch {
  console.error("Нужны изображения png, jpeg или webp.");
  process.exit(1);
}

const folder = `${shelter.id}/brand/${randomUUID()}`;

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
  .from("shelters")
  .update({ brand_path: folder })
  .eq("id", shelter.id)
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

import type { Database } from "@/types/database";
import { createClient } from "@supabase/supabase-js";

// Deletes an UNPUBLISHED shelter with everything that belongs to it: pets
// (and their internal notes), projects, needs and their log, the gallery,
// and every file in its storage folder (<shelter id>/...).
//
// It refuses to delete when the shelter is published, when volunteers are
// still attached (move them with move-volunteer.ts first) or when another
// shelter's data points at a file in this shelter's folder.
//
// There is no undo except restoring a backup. Without --apply it only shows
// what would be deleted; with --apply it also needs --confirm <slug>. The
// shelter row goes last, so if anything fails, running again picks up the
// rest.
//
//   node --env-file=.env.coordinator scripts/delete-shelter.ts test-shelter
//   node --env-file=.env.coordinator scripts/delete-shelter.ts test-shelter --apply --confirm test-shelter

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const args = process.argv.slice(2);
const apply = args.includes("--apply");
const confirmIndex = args.indexOf("--confirm");
const confirm = confirmIndex >= 0 ? args[confirmIndex + 1] : undefined;
const slug = args.find(
  (arg, i) =>
    !arg.startsWith("--") && (confirmIndex < 0 || i !== confirmIndex + 1),
);

if (!url || !serviceKey || !slug) {
  console.error(
    "Использование: node --env-file=.env.coordinator scripts/delete-shelter.ts slug [--apply --confirm slug]",
  );
  process.exit(1);
}

const supabase = createClient<Database>(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const bucket = supabase.storage.from("pet-photos");
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

const { data: shelter, error: shelterError } = await supabase
  .from("shelters")
  .select("id, name, slug, is_published")
  .eq("slug", slug)
  .maybeSingle();
if (shelterError) fail(shelterError.message);
if (!shelter) fail(`Приют «${slug}» не найден (возможно, уже удалён).`);
if (!UUID.test(shelter.id)) fail(`Неожиданный id приюта: ${shelter.id}`);
if (shelter.is_published) {
  fail(
    `«${shelter.name}» опубликован. Снимите публикацию, прежде чем удалять.`,
  );
}

async function count(
  table:
    | "pets"
    | "projects"
    | "purchase_items"
    | "purchase_log"
    | "shelter_members"
    | "shelter_photos",
) {
  const { count: rows, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true })
    .eq("shelter_id", shelter!.id);
  if (error) fail(`${table}: ${error.message}`);
  return rows ?? 0;
}

// Storage lists one folder level at a time; folders come back without an id.
async function listFiles(prefix: string): Promise<string[]> {
  const files: string[] = [];
  for (let offset = 0; ; offset += 100) {
    const { data, error } = await bucket.list(prefix, { limit: 100, offset });
    if (error) fail(`Хранилище, ${prefix}: ${error.message}`);
    for (const entry of data) {
      const path = `${prefix}/${entry.name}`;
      if (entry.id === null) files.push(...(await listFiles(path)));
      else files.push(path);
    }
    if (data.length < 100) return files;
  }
}

const members = await count("shelter_members");
const counts = {
  животных: await count("pets"),
  проектов: await count("projects"),
  нужд: await count("purchase_items"),
  "записей журнала закупок": await count("purchase_log"),
  "фото галереи": await count("shelter_photos"),
};
const files = await listFiles(shelter.id);

// Another shelter must not depend on a file in this folder.
const folder = `${shelter.id}/`;
const borrowed: string[] = [];
const { data: otherPets } = await supabase
  .from("pets")
  .select("name, photo_url")
  .neq("shelter_id", shelter.id)
  .like("photo_url", `%/${folder}%`);
for (const pet of otherPets ?? []) borrowed.push(`животное «${pet.name}»`);
const { data: otherProjects } = await supabase
  .from("projects")
  .select("title, photo_path")
  .neq("shelter_id", shelter.id)
  .like("photo_path", `${folder}%`);
for (const project of otherProjects ?? [])
  borrowed.push(`проект «${project.title}»`);
const { data: otherShelters } = await supabase
  .from("shelters")
  .select("name, photo_path, brand_path")
  .neq("id", shelter.id);
for (const other of otherShelters ?? []) {
  if (
    other.photo_path?.startsWith(folder) ||
    other.brand_path?.startsWith(folder)
  ) {
    borrowed.push(`приют «${other.name}»`);
  }
}

console.log(`Приют «${shelter.name}» (${shelter.slug}), не опубликован.`);
console.log("Будет удалено:");
for (const [label, rows] of Object.entries(counts))
  console.log(`  ${label}: ${rows}`);
console.log(`  файлов в хранилище: ${files.length}`);
console.log("  и сам приют");

if (members > 0) {
  fail(
    `Отказ: к приюту привязано волонтёров: ${members}. Сначала перенесите их (scripts/move-volunteer.ts).`,
  );
}
if (borrowed.length > 0) {
  fail(
    `Отказ: файлы этого приюта используют другие: ${borrowed.join(", ")}. Сначала перенесите их фото.`,
  );
}
if (!apply) {
  console.log(
    `Ничего не удалено. Чтобы удалить безвозвратно: --apply --confirm ${shelter.slug}`,
  );
  process.exit(0);
}
if (confirm !== shelter.slug) {
  fail(`Для удаления повторите адрес приюта: --confirm ${shelter.slug}`);
}

async function remove(
  table: "purchase_log" | "purchase_items" | "pets" | "projects",
) {
  const { error } = await supabase
    .from(table)
    .delete()
    .eq("shelter_id", shelter!.id);
  if (error)
    fail(
      `Остановлено на ${table}: ${error.message}. Запустите ещё раз, чтобы продолжить.`,
    );
}

// Children first: the log points at needs, needs/pets/projects at the
// shelter. Pet notes and the gallery go with their parents (on delete cascade).
await remove("purchase_log");
await remove("purchase_items");
await remove("pets");
await remove("projects");

for (let i = 0; i < files.length; i += 100) {
  const batch = files.slice(i, i + 100);
  if (batch.some((path) => !path.startsWith(folder)))
    fail("Файл вне папки приюта, остановлено.");
  const { error } = await bucket.remove(batch);
  if (error)
    fail(
      `Остановлено на файлах: ${error.message}. Запустите ещё раз, чтобы продолжить.`,
    );
}

const { error: shelterDeleteError } = await supabase
  .from("shelters")
  .delete()
  .eq("id", shelter.id)
  .eq("is_published", false);
if (shelterDeleteError) {
  fail(
    `Данные удалены, а сам приют нет: ${shelterDeleteError.message}. Запустите ещё раз.`,
  );
}

const left = await listFiles(shelter.id);
console.log(
  `Удалено. Файлов в папке приюта осталось: ${left.length}${left.length ? " (запустите ещё раз)" : ""}.`,
);

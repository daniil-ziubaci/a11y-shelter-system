import type { Database } from "@/types/database";
import { createClient } from "@supabase/supabase-js";

// Moves the active projects (status «идёт», not archived) of one shelter to
// another, together with their photos: a project photo lives in the shelter's
// folder (<shelter id>/projects/...), and storage rights follow that folder.
//
// Without --apply it only lists what would move. Safe to run again: projects
// that already moved are no longer in the source shelter.
//
//   node --env-file=.env.coordinator scripts/move-projects.ts test-shelter live-life
//   node --env-file=.env.coordinator scripts/move-projects.ts test-shelter live-life --apply

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const args = process.argv.slice(2);
const apply = args.includes("--apply");
const [fromSlug, toSlug] = args.filter((arg) => arg !== "--apply");

if (!url || !serviceKey || !fromSlug || !toSlug || fromSlug === toSlug) {
  console.error(
    "Использование: node --env-file=.env.coordinator scripts/move-projects.ts откуда куда [--apply]",
  );
  process.exit(1);
}

const supabase = createClient<Database>(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const bucket = supabase.storage.from("pet-photos");

async function shelterBySlug(slug: string) {
  const { data, error } = await supabase
    .from("shelters")
    .select("id, name, content_language")
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data) {
    console.error(
      `Приют «${slug}» не найден${error ? `: ${error.message}` : "."}`,
    );
    process.exit(1);
  }
  return data;
}

const from = await shelterBySlug(fromSlug);
const to = await shelterBySlug(toSlug);

if (from.content_language !== to.content_language) {
  console.error(
    `У приютов разный язык контента (${from.content_language} и ${to.content_language}): переводы проектов станут неверными. Перенос остановлен.`,
  );
  process.exit(1);
}

const { data: projects, error: projectsError } = await supabase
  .from("projects")
  .select("id, title, photo_path, is_pinned")
  .eq("shelter_id", from.id)
  .eq("status", "идёт")
  .eq("is_archived", false)
  .order("created_at");

if (projectsError || !projects) {
  console.error(projectsError?.message ?? "Не удалось прочитать проекты.");
  process.exit(1);
}

console.log(
  `Из «${from.name}» в «${to.name}»: активных проектов ${projects.length}.`,
);
for (const project of projects) {
  console.log(
    `  - ${project.title}${project.photo_path ? " (с фото)" : ""}${project.is_pinned ? ", закреплён" : ""}`,
  );
}

if (!apply) {
  console.log("Ничего не изменено. Чтобы перенести, добавьте --apply.");
  process.exit(0);
}

let moved = 0;
let failed = 0;

for (const project of projects) {
  let newPhotoPath = project.photo_path;
  const photoInSource = project.photo_path?.startsWith(`${from.id}/`) ?? false;

  if (project.photo_path && photoInSource) {
    newPhotoPath = `${to.id}/${project.photo_path.slice(from.id.length + 1)}`;
    const { error } = await bucket.move(project.photo_path, newPhotoPath);
    if (error) {
      console.error(
        `«${project.title}»: фото не перенесено (${error.message}). Проект оставлен на месте.`,
      );
      failed += 1;
      continue;
    }
  }

  const { data: updated, error } = await supabase
    .from("projects")
    .update({ shelter_id: to.id, photo_path: newPhotoPath })
    .eq("id", project.id)
    .eq("shelter_id", from.id)
    .select("id")
    .maybeSingle();

  if (error || !updated) {
    if (project.photo_path && photoInSource && newPhotoPath) {
      const { error: backError } = await bucket.move(
        newPhotoPath,
        project.photo_path,
      );
      if (backError) {
        console.error(
          `«${project.title}»: фото перенесено в ${newPhotoPath}, а проект нет, и вернуть фото не удалось (${backError.message}). Верните фото вручную.`,
        );
      }
    }
    console.error(
      `«${project.title}»: не перенесён (${error?.message ?? "проект изменился во время переноса"}).`,
    );
    failed += 1;
    continue;
  }

  console.log(`«${project.title}»: перенесён.`);
  moved += 1;
}

console.log(`Готово: перенесено ${moved}, ошибок ${failed}.`);
if (failed > 0) process.exit(1);

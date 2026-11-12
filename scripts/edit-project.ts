import type { Database } from "@/types/database";
import { createClient } from "@supabase/supabase-js";
import { findContact } from "../lib/findContact.ts";

// Coordinator edits of a project: new title, new description, order, pin.
//
// --to-top shows the project first among the shelter's unpinned projects
// (the site lists newer projects first; the creation date is used only for
// that order and is shown nowhere). --pin marks a PERMANENT PROGRAM, such as
// sterilization: the site labels it «постоянная программа» and lists it
// before everything else. Only the coordinator pins, so there is no button
// for it in the volunteer panel. Do not pin just to change the order.
//
// The project is found by its current title within the shelter. Without
// --apply it only shows what would change. In --description, "\n" starts a
// new line; lines starting with "- " are shown as a list on the site.
// Translations refresh on their own: the site shows the new original text
// until the nightly translation run.
//
//   node --env-file=.env.coordinator scripts/edit-project.ts live-life "Тёплые вольеры" --title "Тёплые будки" --to-top
//   node --env-file=.env.coordinator scripts/edit-project.ts live-life "Ремонт" --description "Что делаем:\n- Будки" --apply

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

type Options = {
  title?: string;
  description?: string;
  pinned?: boolean;
  toTop: boolean;
  apply: boolean;
};

function usage(): never {
  console.error(
    'Использование: node --env-file=.env.coordinator scripts/edit-project.ts slug "текущее название" [--title "…"] [--description "…"] [--to-top] [--pin | --unpin] [--apply]',
  );
  process.exit(1);
}

const [slug, currentTitle, ...rest] = process.argv.slice(2);
if (!url || !serviceKey || !slug || !currentTitle) usage();

const options: Options = { apply: false, toTop: false };
for (let i = 0; i < rest.length; i += 1) {
  const arg = rest[i];
  if (arg === "--apply") options.apply = true;
  else if (arg === "--to-top") options.toTop = true;
  else if (arg === "--pin") options.pinned = true;
  else if (arg === "--unpin") options.pinned = false;
  else if (arg === "--title" && rest[i + 1] !== undefined)
    options.title = rest[++i].trim();
  else if (arg === "--description" && rest[i + 1] !== undefined)
    options.description = rest[++i].replace(/\\n/g, "\n").trim();
  else usage();
}
if (
  options.title === undefined &&
  options.description === undefined &&
  options.pinned === undefined &&
  !options.toTop
) {
  console.error(
    "Не указано, что менять: --title, --description, --to-top, --pin или --unpin.",
  );
  process.exit(1);
}

const problems: string[] = [];
if (
  options.title !== undefined &&
  (options.title.length < 1 || options.title.length > 120)
) {
  problems.push("Название должно быть от 1 до 120 символов.");
}
if (
  options.description !== undefined &&
  (options.description.length < 1 || options.description.length > 1000)
) {
  problems.push("Описание должно быть от 1 до 1000 символов.");
}
for (const [label, text] of [
  ["название", options.title],
  ["описание", options.description],
] as const) {
  const found = text ? findContact(text) : null;
  if (found) {
    problems.push(
      `Уберите из поля «${label}» контакт «${found.match}»: контакты приюта показываются только внизу страницы.`,
    );
  }
}
if (problems.length > 0) {
  for (const problem of problems) console.error(problem);
  process.exit(1);
}

const supabase = createClient<Database>(url!, serviceKey!, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: shelter, error: shelterError } = await supabase
  .from("shelters")
  .select("id, name")
  .eq("slug", slug)
  .maybeSingle();
if (shelterError || !shelter) {
  console.error(
    `Приют «${slug}» не найден${shelterError ? `: ${shelterError.message}` : "."}`,
  );
  process.exit(1);
}

const { data: projects, error: projectsError } = await supabase
  .from("projects")
  .select("id, title, description, is_pinned, status, is_archived, created_at")
  .eq("shelter_id", shelter.id)
  .order("created_at");
if (projectsError || !projects) {
  console.error(projectsError?.message ?? "Не удалось прочитать проекты.");
  process.exit(1);
}

const normalize = (text: string) =>
  text.trim().toLocaleLowerCase("ru").replace(/ё/g, "е");
const matches = projects.filter(
  (project) => normalize(project.title) === normalize(currentTitle),
);
if (matches.length !== 1) {
  console.error(
    matches.length === 0
      ? `В «${shelter.name}» нет проекта «${currentTitle}». Есть:`
      : `В «${shelter.name}» несколько проектов «${currentTitle}», уточните. Все проекты:`,
  );
  for (const project of projects) {
    const state = project.is_archived ? "в архиве" : project.status;
    console.error(
      `  - ${project.title} (${state}${project.is_pinned ? ", закреплён" : ""})`,
    );
  }
  process.exit(1);
}

const project = matches[0];
const changes: Partial<
  Pick<typeof project, "title" | "description" | "is_pinned" | "created_at">
> = {};
console.log(`Проект «${project.title}» в «${shelter.name}»:`);
if (options.title !== undefined && options.title !== project.title) {
  changes.title = options.title;
  console.log(`  название: «${project.title}» → «${options.title}»`);
}
if (
  options.description !== undefined &&
  options.description !== project.description
) {
  changes.description = options.description;
  console.log("  описание было:");
  console.log(project.description.replace(/^/gm, "    | "));
  console.log("  описание станет:");
  console.log(options.description.replace(/^/gm, "    | "));
}
if (changes.description === undefined) {
  console.log("  описание (без изменений):");
  console.log(project.description.replace(/^/gm, "    | "));
}
if (options.pinned !== undefined && options.pinned !== project.is_pinned) {
  changes.is_pinned = options.pinned;
  console.log(
    `  закрепление: ${project.is_pinned ? "да" : "нет"} → ${options.pinned ? "да" : "нет"}`,
  );
}
if (options.toTop) {
  const shown = projects.filter(
    (other) =>
      other.status === "идёт" && !other.is_archived && !other.is_pinned,
  );
  const newest = shown.reduce<string | null>(
    (latest, other) =>
      latest === null || other.created_at > latest ? other.created_at : latest,
    null,
  );
  if (project.is_pinned) {
    console.log(
      "  порядок: проект закреплён и и так стоит выше незакреплённых, --to-top не нужен",
    );
  } else if (shown.length > 1 && newest !== project.created_at) {
    changes.created_at = new Date().toISOString();
    console.log("  порядок: станет первым среди незакреплённых проектов");
  } else {
    console.log("  порядок: уже первый среди незакреплённых проектов");
  }
}

if (Object.keys(changes).length === 0) {
  console.log("  менять нечего: всё уже так.");
  process.exit(0);
}
if (!options.apply) {
  console.log("Ничего не изменено. Чтобы применить, добавьте --apply.");
  process.exit(0);
}

const { data: updated, error } = await supabase
  .from("projects")
  .update(changes)
  .eq("id", project.id)
  .select("id")
  .maybeSingle();
if (error || !updated) {
  console.error(`Не сохранено: ${error?.message ?? "проект не найден"}`);
  process.exit(1);
}
console.log("Сохранено. Переводы на другие языки обновятся этой ночью.");

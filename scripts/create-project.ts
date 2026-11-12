import type { Database } from "@/types/database";
import { createClient } from "@supabase/supabase-js";
import { checkProjectTexts, readMultiline } from "./lib/projectTexts.ts";

// Creates a project for a shelter, without a photo (a volunteer can add one
// in the panel later). A new project is the newest, so it is listed first
// among the unpinned projects; use edit-project.ts --to-top on another
// project to put that one above it.
//
// --help says how people can help: things, money, or both (default).
// Without --apply it only shows what would be created.
//
//   node --env-file=.env.coordinator scripts/create-project.ts live-life --title "Ремонт" --description "- Будки\n- Ремонт сетки" --help things,money

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const HELP_LABELS: Record<string, string> = { things: "Вещи", money: "Деньги" };

function usage(): never {
  console.error(
    'Использование: node --env-file=.env.coordinator scripts/create-project.ts slug --title "…" --description "…" [--help things,money] [--apply]',
  );
  process.exit(1);
}

const [slug, ...rest] = process.argv.slice(2);
if (!url || !serviceKey || !slug || slug.startsWith("--")) usage();

let title: string | undefined;
let description: string | undefined;
let helpKinds = ["things", "money"];
let apply = false;
for (let i = 0; i < rest.length; i += 1) {
  const arg = rest[i];
  if (arg === "--apply") apply = true;
  else if (arg === "--title" && rest[i + 1] !== undefined)
    title = rest[++i].trim();
  else if (arg === "--description" && rest[i + 1] !== undefined)
    description = readMultiline(rest[++i]);
  else if (arg === "--help" && rest[i + 1] !== undefined)
    helpKinds = rest[++i].split(",").map((kind) => kind.trim());
  else usage();
}
if (title === undefined || description === undefined) usage();

const problems = checkProjectTexts({ title, description });
if (
  helpKinds.length === 0 ||
  helpKinds.some((kind) => !(kind in HELP_LABELS)) ||
  new Set(helpKinds).size !== helpKinds.length
) {
  problems.push("--help: things, money или things,money.");
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

const { data: existing, error: existingError } = await supabase
  .from("projects")
  .select("title")
  .eq("shelter_id", shelter.id);
if (existingError || !existing) {
  console.error(existingError?.message ?? "Не удалось прочитать проекты.");
  process.exit(1);
}
const normalize = (text: string) =>
  text.trim().toLocaleLowerCase("ru").replace(/ё/g, "е");
if (
  existing.some((project) => normalize(project.title) === normalize(title!))
) {
  console.log(
    `В «${shelter.name}» уже есть проект «${title}». Ничего не создано.`,
  );
  process.exit(0);
}

console.log(`Новый проект в «${shelter.name}»:`);
console.log(`  название: «${title}»`);
console.log("  описание:");
console.log(description.replace(/^/gm, "    | "));
console.log(
  `  чем помочь: ${helpKinds.map((kind) => HELP_LABELS[kind]).join(", ")}`,
);
console.log("  без фото (его можно добавить в панели волонтёра)");

if (!apply) {
  console.log("Ничего не создано. Чтобы создать, добавьте --apply.");
  process.exit(0);
}

const { error } = await supabase.from("projects").insert({
  shelter_id: shelter.id,
  title,
  description,
  help_kinds: helpKinds,
});
if (error) {
  console.error(`Не создано: ${error.message}`);
  process.exit(1);
}
console.log("Создано. Переводы на другие языки появятся этой ночью.");

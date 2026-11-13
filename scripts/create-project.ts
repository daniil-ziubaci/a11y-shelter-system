import { connect } from "./lib/connect.ts";
import { checkProjectTexts, readMultiline } from "./lib/projectTexts.ts";


const HELP_LABELS: Record<string, string> = { things: "Вещи", money: "Деньги" };

function usage(): never {
  console.error(
    'Использование: node --env-file=.env.coordinator scripts/create-project.ts --title "…" --description "…" [--help things,money] [--apply]',
  );
  process.exit(1);
}

const rest = process.argv.slice(2);

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

const supabase = connect('create-project.ts --title "…" --description "…" [--apply]');

const { data: existing, error: existingError } = await supabase.from("projects").select("title");
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
    `Проект «${title}» уже есть. Ничего не создано.`,
  );
  process.exit(0);
}

console.log("Новый проект:");
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
  title,
  description,
  help_kinds: helpKinds,
});
if (error) {
  console.error(`Не создано: ${error.message}`);
  process.exit(1);
}
console.log("Создано. Переводы на другие языки появятся этой ночью.");

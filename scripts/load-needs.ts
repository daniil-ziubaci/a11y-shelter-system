import { readFileSync } from "node:fs";
import { NEED_CATEGORIES } from "../src/lib/needCategories.ts";
import { NEED_UNITS } from "../src/lib/needUnits.ts";
import { connect, splitArgs, stopUnlessApply } from "./lib/connect.ts";

type Entry = {
  name: string;
  category: string;
  unit: string;
  quantity: number;
  urgent: boolean;
  note: string | null;
};

const { apply, args } = splitArgs(process.argv.slice(2));
const [file] = args;

if (!file) {
  console.error("Использование: node --env-file=.env.coordinator scripts/load-needs.ts файл.jsonl [--apply]");
  process.exit(1);
}

const entries: Entry[] = [];
const lines = readFileSync(file, "utf8").split("\n");
for (const [index, line] of lines.entries()) {
  if (line.trim() === "") {
    continue;
  }
  try {
    entries.push(JSON.parse(line) as Entry);
  } catch {
    console.error(`Строка ${index + 1}: это не JSON.`);
    process.exit(1);
  }
}

const problems: string[] = [];
const seen = new Set<string>();
for (const [index, entry] of entries.entries()) {
  const label = `Позиция ${index + 1} («${entry.name}»)`;
  const note = entry.note ?? null;
  if (!entry.name || entry.name.length > 100) {
    problems.push(`${label}: название пустое или длиннее 100 символов.`);
  }
  if (!NEED_CATEGORIES.includes(entry.category)) {
    problems.push(`${label}: неизвестная категория «${entry.category}».`);
  }
  if (!NEED_UNITS.includes(entry.unit)) {
    problems.push(`${label}: неизвестная единица «${entry.unit}».`);
  }
  if (!(entry.quantity > 0 && entry.quantity <= 100000)) {
    problems.push(`${label}: количество должно быть от 0 до 100000.`);
  }
  if (note !== null && (note.length === 0 || note.length > 300)) {
    problems.push(`${label}: примечание пустое или длиннее 300 символов.`);
  }
  const key = entry.name.trim().toLowerCase();
  if (seen.has(key)) {
    problems.push(`${label}: название повторяется.`);
  }
  seen.add(key);
}
if (problems.length > 0) {
  console.error(problems.join("\n"));
  process.exit(1);
}

const supabase = connect("load-needs.ts файл.jsonl [--apply]");

const { data: existing, error: existingError } = await supabase.from("purchase_items").select("id, name");
if (existingError) {
  console.error("Не удалось прочитать позиции:", existingError.message);
  process.exit(1);
}
const idByName = new Map(
  existing.map((item) => [item.name.trim().toLowerCase(), item.id]),
);

const toCreate: { entry: Entry; index: number }[] = [];
const toUpdate: { id: string; entry: Entry }[] = [];
for (const [index, entry] of entries.entries()) {
  const id = idByName.get(entry.name.trim().toLowerCase());
  if (id) {
    toUpdate.push({ id, entry });
  } else {
    toCreate.push({ entry, index });
  }
}
console.log(`Создать: ${toCreate.length}, обновить: ${toUpdate.length}.`);

stopUnlessApply(apply);

if (toCreate.length > 0) {
  const base = Date.now();
  const { error } = await supabase.from("purchase_items").insert(
    toCreate.map(({ entry, index }) => ({
      id: crypto.randomUUID(),
      name: entry.name.trim(),
      category: entry.category,
      unit: entry.unit,
      remaining: entry.quantity,
      is_urgent: entry.urgent === true,
      note: entry.note ?? null,
      created_at: new Date(base - index * 1000).toISOString(),
    })),
  );
  if (error) {
    console.error("Не удалось создать позиции:", error.message);
    process.exit(1);
  }
}

for (const { id, entry } of toUpdate) {
  const { error } = await supabase
    .from("purchase_items")
    .update({
      category: entry.category,
      unit: entry.unit,
      is_urgent: entry.urgent === true,
      note: entry.note ?? null,
    })
    .eq("id", id);
  if (error) {
    console.error(`Не удалось обновить «${entry.name}»:`, error.message);
    process.exit(1);
  }
}

console.log("Готово.");

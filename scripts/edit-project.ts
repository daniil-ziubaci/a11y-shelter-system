import type { Database } from "@/types/database";
import { createClient } from "@supabase/supabase-js";
import { textHash } from "../lib/hashText.ts";
import { readTranslations, type Translations } from "../lib/translations.ts";
import {
  checkProjectTexts,
  parseProgress,
  readMultiline,
  type Progress,
} from "./lib/projectTexts.ts";

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
// --fix-translation ro "было" "стало" corrects a phrase in the automatic
// translation (DeepL sometimes picks the wrong word). The fix stays until the
// Russian text of that field changes; then the field is translated again.
// It can be repeated and cannot be combined with --title or --description.
//
//   node --env-file=.env.coordinator scripts/edit-project.ts live-life "Тёплые вольеры" --title "Тёплые будки" --to-top
//   node --env-file=.env.coordinator scripts/edit-project.ts live-life "Ремонт" --description "Что делаем:\n- Будки" --apply
//   node --env-file=.env.coordinator scripts/edit-project.ts live-life "Тёплые будки" --progress "5/20 будок"
//   node --env-file=.env.coordinator scripts/edit-project.ts live-life "Тёплые будки" --no-progress
//   node --env-file=.env.coordinator scripts/edit-project.ts live-life "Ремонт" --fix-translation en "Renovation" "Repairs"

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

type Options = {
  title?: string;
  description?: string;
  photoAlt?: string;
  progress?: Progress | null;
  pinned?: boolean;
  toTop: boolean;
  fixes: { language: string; from: string; to: string }[];
  apply: boolean;
};

const LANGUAGES = ["ro", "en"];

function usage(): never {
  console.error(
    'Использование: node --env-file=.env.coordinator scripts/edit-project.ts slug "текущее название" [--title "…"] [--description "…"] [--photo-alt "…"] [--progress "5/20 будок" | --no-progress] [--to-top] [--pin | --unpin] [--fix-translation ro|en "было" "стало"] [--apply]',
  );
  process.exit(1);
}

const [slug, currentTitle, ...rest] = process.argv.slice(2);
if (!url || !serviceKey || !slug || !currentTitle) usage();

const options: Options = { apply: false, toTop: false, fixes: [] };
for (let i = 0; i < rest.length; i += 1) {
  const arg = rest[i];
  if (arg === "--apply") options.apply = true;
  else if (arg === "--to-top") options.toTop = true;
  else if (arg === "--photo-alt" && rest[i + 1] !== undefined)
    options.photoAlt = rest[++i].trim();
  else if (arg === "--no-progress") options.progress = null;
  else if (arg === "--progress" && rest[i + 1] !== undefined) {
    const progress = parseProgress(rest[++i]);
    if (typeof progress === "string") {
      console.error(progress);
      process.exit(1);
    }
    options.progress = progress;
  } else if (arg === "--pin") options.pinned = true;
  else if (arg === "--unpin") options.pinned = false;
  else if (arg === "--title" && rest[i + 1] !== undefined)
    options.title = rest[++i].trim();
  else if (arg === "--description" && rest[i + 1] !== undefined)
    options.description = readMultiline(rest[++i]);
  else if (arg === "--fix-translation" && rest[i + 3] !== undefined) {
    const [language, from, to] = rest.slice(i + 1, i + 4);
    i += 3;
    if (!LANGUAGES.includes(language)) {
      console.error(
        `Язык перевода «${language}» неизвестен. Можно: ${LANGUAGES.join(", ")}.`,
      );
      process.exit(1);
    }
    if (!from.trim() || !to.trim()) {
      console.error("В --fix-translation обе фразы должны быть непустыми.");
      process.exit(1);
    }
    options.fixes.push({ language, from, to });
  } else usage();
}
if (
  options.title === undefined &&
  options.description === undefined &&
  options.photoAlt === undefined &&
  options.progress === undefined &&
  options.pinned === undefined &&
  !options.toTop &&
  options.fixes.length === 0
) {
  console.error(
    "Не указано, что менять: --title, --description, --photo-alt, --progress, --no-progress, --to-top, --pin, --unpin или --fix-translation.",
  );
  process.exit(1);
}
if (
  options.fixes.length > 0 &&
  (options.title !== undefined ||
    options.description !== undefined ||
    options.photoAlt !== undefined ||
    options.progress !== undefined)
) {
  // A new Russian text makes the translation outdated, and the night run
  // would replace the corrected one anyway.
  console.error(
    "--fix-translation нельзя совмещать с правкой текста. Сначала измените текст, дождитесь ночного перевода, потом поправьте перевод.",
  );
  process.exit(1);
}

const problems = checkProjectTexts({
  title: options.title,
  description: options.description,
  photoAlt: options.photoAlt,
  progressUnit: options.progress?.unit,
});
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
  .select(
    "id, title, description, photo_path, photo_alt, progress_total, progress_done, progress_unit, is_pinned, status, is_archived, created_at, translations",
  )
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

// Texts saved from Windows keep "\r\n"; a bare "\r" would make the
// terminal overwrite the line, so show line breaks as they will appear.
const quote = (text: string) =>
  text.replace(/\r\n?/g, "\n").replace(/^/gm, "    | ");

const project = matches[0];
const changes: Partial<
  Pick<
    typeof project,
    | "title"
    | "description"
    | "photo_alt"
    | "progress_total"
    | "progress_done"
    | "progress_unit"
    | "is_pinned"
    | "created_at"
  >
> & { translations?: Translations } = {};
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
  console.log(quote(project.description));
  console.log("  описание станет:");
  console.log(quote(options.description));
}
if (changes.description === undefined) {
  console.log("  описание (без изменений):");
  console.log(quote(project.description));
}
if (project.photo_path) {
  if (
    options.photoAlt !== undefined &&
    options.photoAlt !== project.photo_alt
  ) {
    changes.photo_alt = options.photoAlt;
    console.log(
      `  описание фото: «${project.photo_alt}» → «${options.photoAlt}»`,
    );
  } else {
    console.log(`  описание фото (без изменений): «${project.photo_alt}»`);
  }
} else if (options.photoAlt !== undefined) {
  console.error("У проекта нет фото, описание фото задать нельзя.");
  process.exit(1);
}
const progressText = (
  done: number | null,
  total: number | null,
  unit: string | null,
) => (total === null ? "нет" : `${done} из ${total} ${unit}`);
const currentProgress = progressText(
  project.progress_done,
  project.progress_total,
  project.progress_unit,
);
if (options.progress !== undefined) {
  const next = options.progress;
  const nextText = next
    ? progressText(next.done, next.total, next.unit)
    : "нет";
  if (nextText !== currentProgress) {
    changes.progress_total = next?.total ?? null;
    changes.progress_done = next?.done ?? null;
    changes.progress_unit = next?.unit ?? null;
    console.log(`  прогресс: ${currentProgress} → ${nextText}`);
  } else {
    console.log(`  прогресс (без изменений): ${currentProgress}`);
  }
} else if (project.progress_total !== null) {
  console.log(`  прогресс (без изменений): ${currentProgress}`);
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

if (options.fixes.length > 0) {
  const sources: Record<string, string> = {
    title: project.title,
    description: project.description,
    progress_unit: project.progress_unit ?? "",
    photo_alt: project.photo_alt ?? "",
  };
  const fieldNames: Record<string, string> = {
    title: "название",
    description: "описание",
    progress_unit: "единица прогресса",
    photo_alt: "описание фото",
  };
  const translations = readTranslations(project.translations);
  let failed = false;
  for (const { language, from, to } of options.fixes) {
    let found = 0;
    let outdated = false;
    for (const [field, source] of Object.entries(sources)) {
      const entry = translations[field]?.[language];
      if (!entry || !entry.text.includes(from)) continue;
      // Only a translation of the current Russian text is shown on the site;
      // an outdated one is replaced at night, so fixing it would be lost.
      if (entry.hash !== textHash("", source)) {
        console.error(
          `  ${language}, ${fieldNames[field]}: перевод устарел (русский текст изменился). Дождитесь ночного перевода и повторите.`,
        );
        outdated = true;
        continue;
      }
      found += 1;
      const text = entry.text.split(from).join(to);
      console.log(`  перевод ${language}, ${fieldNames[field]} было:`);
      console.log(quote(entry.text));
      console.log(`  перевод ${language}, ${fieldNames[field]} станет:`);
      console.log(quote(text));
      translations[field] = {
        ...translations[field],
        [language]: { text, hash: entry.hash },
      };
    }
    if (outdated) failed = true;
    else if (found === 0) {
      console.error(
        `  в переводе ${language} нет фразы «${from}» (регистр букв важен).`,
      );
      failed = true;
    }
  }
  if (failed) process.exit(1);
  changes.translations = translations;
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
console.log(
  options.fixes.length > 0 && Object.keys(changes).length === 1
    ? "Сохранено. Исправленный перевод уже на сайте (обновите страницу через минуту)."
    : "Сохранено. Переводы на другие языки обновятся этой ночью.",
);

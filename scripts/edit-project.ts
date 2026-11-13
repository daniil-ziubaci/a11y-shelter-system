import { textHash } from "../src/lib/hashText.ts";
import { readTranslations, type Translations } from "../src/lib/translations.ts";
import { connect } from "./lib/connect.ts";
import {
  checkProjectTexts,
  parseProgress,
  readMultiline,
  type Progress,
} from "./lib/projectTexts.ts";


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
    'Использование: node --env-file=.env.coordinator scripts/edit-project.ts "текущее название" [--title "…"] [--description "…"] [--photo-alt "…"] [--progress "5/20 будок" | --no-progress] [--to-top] [--pin | --unpin] [--fix-translation ro|en "было" "стало"] [--apply]',
  );
  process.exit(1);
}

const [currentTitle, ...rest] = process.argv.slice(2);
if (!currentTitle || currentTitle.startsWith("--")) usage();

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

const supabase = connect('edit-project.ts "текущее название" … [--apply]');

const { data: projects, error: projectsError } = await supabase
  .from("projects")
  .select(
    "id, title, description, photo_path, photo_alt, progress_total, progress_done, progress_unit, is_pinned, status, is_archived, created_at, translations",
  )
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
      ? `Нет проекта «${currentTitle}». Есть:`
      : `Несколько проектов «${currentTitle}», уточните. Все проекты:`,
  );
  for (const project of projects) {
    const state = project.is_archived ? "в архиве" : project.status;
    console.error(
      `  - ${project.title} (${state}${project.is_pinned ? ", закреплён" : ""})`,
    );
  }
  process.exit(1);
}

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
console.log(`Проект «${project.title}»:`);
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

import { findContact } from "../../lib/findContact.ts";

// Same limits as the volunteer panel (lib/parseProjectFields.ts) and the
// projects table constraints, so a coordinator script cannot save a text
// the panel would refuse.

export type ProjectTexts = {
  title?: string;
  description?: string;
  photoAlt?: string;
  progressUnit?: string;
};

const LIMITS: Record<keyof ProjectTexts, [string, number]> = {
  title: ["название", 120],
  description: ["описание", 1000],
  photoAlt: ["описание фото", 200],
  progressUnit: ["единица прогресса", 30],
};

// In command-line arguments "\n" starts a new line.
export function readMultiline(value: string): string {
  return value.replace(/\\n/g, "\n").trim();
}

export function checkProjectTexts(texts: ProjectTexts): string[] {
  const problems: string[] = [];
  for (const key of Object.keys(LIMITS) as (keyof ProjectTexts)[]) {
    const text = texts[key];
    if (text === undefined) continue;
    const [label, max] = LIMITS[key];
    if (text.length < 1 || text.length > max) {
      problems.push(`Поле «${label}» должно быть от 1 до ${max} символов.`);
    }
    const found = findContact(text);
    if (found) {
      problems.push(
        `Уберите из поля «${label}» контакт «${found.match}»: контакты приюта показываются только внизу страницы.`,
      );
    }
  }
  return problems;
}

export type Progress = { done: number; total: number; unit: string };

// "20/150 будок" -> { done: 20, total: 150, unit: "будок" }
export function parseProgress(value: string): Progress | string {
  const match = /^\s*(\d+)\s*\/\s*(\d+)\s+(.+?)\s*$/.exec(value);
  if (!match) {
    return 'Прогресс пишется так: "сделано/всего единица", например "5/20 будок".';
  }
  const done = Number(match[1]);
  const total = Number(match[2]);
  if (total < 1 || total > 1000 || done > total) {
    return "Всего — от 1 до 1000, и сделано не больше, чем всего.";
  }
  return { done, total, unit: match[3] };
}

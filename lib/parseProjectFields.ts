import { findContactError } from "@/lib/findContactError";
import {
  PROJECT_HELP_KINDS,
  type ProjectHelpKind,
} from "@/lib/projectHelpKinds";

export const PROJECT_LIMITS = {
  title: 120,
  description: 1000,
  photoAlt: 200,
  progressMax: 1000,
  progressUnit: 30,
} as const;

type ParsedProject =
  | {
      ok: true;
      fields: {
        title: string;
        description: string;
        helpKinds: ProjectHelpKind[];
        photoAlt: string;
        progress: { total: number; done: number; unit: string } | null;
      };
    }
  | { ok: false; error: string };

export function parseProjectFields(formData: FormData): ParsedProject {
  const read = (key: string) => {
    const value = formData.get(key);
    return typeof value === "string" ? value.trim() : "";
  };

  const title = read("title");
  if (title.length === 0) {
    return { ok: false, error: "Введите название проекта." };
  }
  if (title.length > PROJECT_LIMITS.title) {
    return {
      ok: false,
      error: `Название длиннее ${PROJECT_LIMITS.title} знаков.`,
    };
  }

  const description = read("description");
  if (description.length === 0) {
    return { ok: false, error: "Опишите, что нужно сделать и зачем." };
  }
  if (description.length > PROJECT_LIMITS.description) {
    return {
      ok: false,
      error: `Описание длиннее ${PROJECT_LIMITS.description} знаков.`,
    };
  }

  const totalText = read("progressTotal");
  const doneText = read("progressDone");
  const unitText = read("progressUnit");
  let progress: { total: number; done: number; unit: string } | null = null;
  if (totalText || doneText || unitText) {
    const total = Number(totalText);
    const done = Number(doneText);
    if (
      !totalText ||
      !doneText ||
      !unitText ||
      !Number.isInteger(total) ||
      !Number.isInteger(done)
    ) {
      return {
        ok: false,
        error:
          "Заполните все три поля счёта целыми числами или оставьте их пустыми.",
      };
    }
    if (total < 1 || total > PROJECT_LIMITS.progressMax) {
      return {
        ok: false,
        error: `«Сколько всего» должно быть от 1 до ${PROJECT_LIMITS.progressMax}.`,
      };
    }
    if (done < 0 || done > total) {
      return {
        ok: false,
        error: "«Сколько сделано» должно быть от 0 до «сколько всего».",
      };
    }
    if (unitText.length > PROJECT_LIMITS.progressUnit) {
      return {
        ok: false,
        error: `«Что считаем» длиннее ${PROJECT_LIMITS.progressUnit} знаков.`,
      };
    }
    progress = { total, done, unit: unitText };
  }

  const photoAlt = read("photoAlt");
  if (photoAlt.length > PROJECT_LIMITS.photoAlt) {
    return {
      ok: false,
      error: `Описание фото длиннее ${PROJECT_LIMITS.photoAlt} знаков.`,
    };
  }

  const contactProblem = findContactError([
    ["Название проекта", title],
    ["Описание", description],
    ["Единица измерения", unitText],
    ["Описание фото", photoAlt],
  ]);
  if (contactProblem) {
    return { ok: false, error: contactProblem };
  }

  const submitted = formData.getAll("help_kinds");
  const helpKinds = PROJECT_HELP_KINDS.filter((kind) =>
    submitted.includes(kind),
  );
  if (helpKinds.length === 0) {
    return { ok: false, error: "Отметьте, чем можно помочь." };
  }

  return {
    ok: true,
    fields: {
      title,
      description,
      helpKinds,
      photoAlt,
      progress,
    },
  };
}

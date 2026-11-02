import {
  PROJECT_HELP_KINDS,
  type ProjectHelpKind,
} from "@/lib/projectHelpKinds";
import { PROJECT_STAGES, type ProjectStage } from "@/lib/projectStages";

export const PROJECT_LIMITS = {
  title: 120,
  description: 1000,
  goal: 300,
  photoAlt: 200,
} as const;

type ParsedProject =
  | {
      ok: true;
      fields: {
        title: string;
        description: string;
        goal: string | null;
        stage: ProjectStage;
        helpKinds: ProjectHelpKind[];
        photoAlt: string;
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

  const goalText = read("goal");
  if (goalText.length > PROJECT_LIMITS.goal) {
    return {
      ok: false,
      error: `Цель длиннее ${PROJECT_LIMITS.goal} знаков.`,
    };
  }

  const photoAlt = read("photoAlt");
  if (photoAlt.length > PROJECT_LIMITS.photoAlt) {
    return {
      ok: false,
      error: `Описание фото длиннее ${PROJECT_LIMITS.photoAlt} знаков.`,
    };
  }

  const stage = PROJECT_STAGES.find((s) => s === read("stage"));
  if (!stage) {
    return { ok: false, error: "Выберите этап проекта." };
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
      goal: goalText || null,
      stage,
      helpKinds,
      photoAlt,
    },
  };
}

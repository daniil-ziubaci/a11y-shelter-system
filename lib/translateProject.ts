import "server-only";

import { buildTranslations } from "@/lib/buildTranslations";
import { createClient } from "@/lib/supabase/server";
import {
  readTranslations,
  sameTranslations,
  type Translations,
} from "@/lib/translations";
import type { Json } from "@/types/database";

const PROJECT_CONTEXT: Record<string, string> = {
  ru: "Сайт приюта для бездомных животных. Текст описывает проект приюта: его название, описание и единицу измерения.",
  ro: "Site-ul unui adăpost pentru animale fără stăpân. Textul descrie un proiect al adăpostului: titlul, descrierea și unitatea de măsură.",
  en: "Website of a shelter for stray animals. The text describes a shelter project: its title, description and unit of measure.",
};

type ProjectTexts = {
  title: string;
  description: string;
  progress_unit: string | null;
  photo_alt: string | null;
  translations: Json;
};

export function projectTranslations(
  project: ProjectTexts,
  sourceLanguage: string,
): Promise<Translations> {
  return buildTranslations({
    sourceLanguage,
    texts: {
      title: project.title,
      description: project.description,
      progress_unit: project.progress_unit ?? "",
      photo_alt: project.photo_alt ?? "",
    },
    previous: readTranslations(project.translations),
    context: PROJECT_CONTEXT,
  });
}

export async function translateProject(projectId: string): Promise<void> {
  try {
    const supabase = await createClient();
    const { data: project } = await supabase
      .from("projects")
      .select(
        "title, description, progress_unit, photo_alt, translations, shelter_id",
      )
      .eq("id", projectId)
      .maybeSingle();
    if (!project) {
      return;
    }
    const { data: shelter } = await supabase
      .from("shelters")
      .select("content_language")
      .eq("id", project.shelter_id)
      .maybeSingle();
    if (!shelter) {
      return;
    }
    const translations = await projectTranslations(
      project,
      shelter.content_language,
    );
    if (
      sameTranslations(translations, readTranslations(project.translations))
    ) {
      return;
    }
    const { error } = await supabase
      .from("projects")
      .update({ translations })
      .eq("id", projectId);
    if (error) {
      console.error("translateProject update failed", projectId, error.message);
    }
  } catch (error) {
    console.error("translateProject failed", projectId, error);
  }
}

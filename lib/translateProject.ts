import "server-only";

import { buildTranslations } from "@/lib/buildTranslations";
import { createClient } from "@/lib/supabase/server";
import { readTranslations } from "@/lib/translations";

const PROJECT_CONTEXT: Record<string, string> = {
  ru: "Сайт приюта для бездомных животных. Текст описывает проект приюта: его название, описание, цель и единицу измерения.",
  ro: "Site-ul unui adăpost pentru animale fără stăpân. Textul descrie un proiect al adăpostului: titlul, descrierea, obiectivul și unitatea de măsură.",
  en: "Website of a shelter for stray animals. The text describes a shelter project: its title, description, goal and unit of measure.",
};

export async function translateProject(projectId: string): Promise<void> {
  try {
    const supabase = await createClient();
    const { data: project } = await supabase
      .from("projects")
      .select(
        "title, description, goal, progress_unit, photo_alt, translations, shelter_id",
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
    const translations = await buildTranslations({
      sourceLanguage: shelter.content_language,
      texts: {
        title: project.title,
        description: project.description,
        goal: project.goal ?? "",
        progress_unit: project.progress_unit ?? "",
        photo_alt: project.photo_alt ?? "",
      },
      previous: readTranslations(project.translations),
      context: PROJECT_CONTEXT,
    });
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

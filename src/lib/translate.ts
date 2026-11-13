import { buildTranslations } from "@/lib/buildTranslations";
import type { Json } from "@/lib/database";
import { translateHealthPhrases } from "@/lib/healthPhrases";
import type { Supabase } from "@/lib/supabase";
import { readTranslations, sameTranslations, type Translations } from "@/lib/translations";

const PET_CONTEXT: Record<string, string> = {
  ru: "Сайт приюта для бездомных животных. Текст описывает питомца: его здоровье, характер и фото.",
  ro: "Site-ul unui adăpost pentru animale fără stăpân. Textul descrie un animal: sănătatea, caracterul și fotografia lui.",
  en: "Website of a shelter for stray animals. The text describes a pet: its health, character and photo.",
};

const PROJECT_CONTEXT: Record<string, string> = {
  ru: "Сайт приюта для бездомных животных. Текст описывает проект приюта: его название, описание и единицу измерения.",
  ro: "Site-ul unui adăpost pentru animale fără stăpân. Textul descrie un proiect al adăpostului: titlul, descrierea și unitatea de măsură.",
  en: "Website of a shelter for stray animals. The text describes a shelter project: its title, description and unit of measure.",
};

const ITEM_CONTEXT: Record<string, string> = {
  ru: "Сайт приюта для бездомных животных. Тексты это название вещи в списке нужд приюта (например корм, лекарство или наполнитель) и необязательное примечание к ней: какой именно товар нужен или что не подходит.",
  ro: "Site-ul unui adăpost pentru animale fără stăpân. Textele sunt numele unui lucru din lista de nevoi a adăpostului (de exemplu hrană, medicament sau așternut) și o notă opțională despre el: ce anume este necesar sau ce nu se potrivește.",
  en: "Website of a shelter for stray animals. The texts are the name of an item on the shelter's needs list (for example food, medicine or litter) and an optional note about it: what exactly is needed or what does not fit.",
};

type PetTexts = { name: string; health: string; description: string; photo_alt: string; translations: Json };
type ProjectTexts = {
  title: string;
  description: string;
  progress_unit: string | null;
  photo_alt: string | null;
  translations: Json;
};
type ItemTexts = { name: string; note: string | null; translations: Json };

export function petTranslations(pet: PetTexts, sourceLanguage: string): Promise<Translations> {
  return buildTranslations({
    name: pet.name,
    sourceLanguage,
    texts: { health: pet.health, description: pet.description, photo_alt: pet.photo_alt },
    previous: readTranslations(pet.translations),
    context: PET_CONTEXT,
    dictionary: (field, text, to) => (field === "health" ? translateHealthPhrases(text, sourceLanguage, to) : null),
  });
}

export function projectTranslations(project: ProjectTexts, sourceLanguage: string): Promise<Translations> {
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

export function itemTranslations(item: ItemTexts, sourceLanguage: string): Promise<Translations> {
  return buildTranslations({
    sourceLanguage,
    texts: item.note ? { name: item.name, note: item.note } : { name: item.name },
    previous: readTranslations(item.translations),
    context: ITEM_CONTEXT,
  });
}

async function contentLanguage(supabase: Supabase): Promise<string | null> {
  const { data } = await supabase.from("shelter").select("content_language").maybeSingle();
  return data?.content_language ?? null;
}

export async function translatePet(supabase: Supabase, id: string): Promise<void> {
  try {
    const [{ data: pet }, language] = await Promise.all([
      supabase.from("pets").select("name, health, description, photo_alt, translations").eq("id", id).maybeSingle(),
      contentLanguage(supabase),
    ]);
    if (!pet || !language) return;
    const translations = await petTranslations(pet, language);
    if (sameTranslations(translations, readTranslations(pet.translations))) return;
    const { error } = await supabase.from("pets").update({ translations }).eq("id", id);
    if (error) console.error("translatePet update failed", id, error.message);
  } catch (error) {
    console.error("translatePet failed", id, error);
  }
}

export async function translateProject(supabase: Supabase, id: string): Promise<void> {
  try {
    const [{ data: project }, language] = await Promise.all([
      supabase
        .from("projects")
        .select("title, description, progress_unit, photo_alt, translations")
        .eq("id", id)
        .maybeSingle(),
      contentLanguage(supabase),
    ]);
    if (!project || !language) return;
    const translations = await projectTranslations(project, language);
    if (sameTranslations(translations, readTranslations(project.translations))) return;
    const { error } = await supabase.from("projects").update({ translations }).eq("id", id);
    if (error) console.error("translateProject update failed", id, error.message);
  } catch (error) {
    console.error("translateProject failed", id, error);
  }
}

export async function translateItem(supabase: Supabase, id: string): Promise<void> {
  try {
    const [{ data: item }, language] = await Promise.all([
      supabase.from("purchase_items").select("name, note, translations").eq("id", id).maybeSingle(),
      contentLanguage(supabase),
    ]);
    if (!item || !language) return;
    const translations = await itemTranslations(item, language);
    if (sameTranslations(translations, readTranslations(item.translations))) return;
    const { error } = await supabase.from("purchase_items").update({ translations }).eq("id", id);
    if (error) console.error("translateItem update failed", id, error.message);
  } catch (error) {
    console.error("translateItem failed", id, error);
  }
}

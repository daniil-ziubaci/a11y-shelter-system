import { textHash } from "@/lib/hashText";
import { pickTranslation, readTranslations } from "@/lib/translations";
import type { Json } from "@/lib/database";

type ProjectTexts = {
  title: string;
  description: string;
  progress_unit: string | null;
  photo_alt: string | null;
  translations: Json;
};

export function localizeProject<T extends ProjectTexts>(
  project: T,
  locale: string,
) {
  const translations = readTranslations(project.translations);
  const pick = (field: string, original: string) => {
    const text = pickTranslation(
      translations,
      field,
      locale,
      textHash("", original),
    );
    return text === null
      ? { text: original, translated: false }
      : { text, translated: true };
  };
  const pickOptional = (field: string, original: string | null) =>
    original === null
      ? { text: null, translated: false }
      : pick(field, original);

  const title = pick("title", project.title);
  const description = pick("description", project.description);
  const unit = pickOptional("progress_unit", project.progress_unit);
  const alt = pickOptional("photo_alt", project.photo_alt);

  return {
    ...project,
    title: title.text,
    description: description.text,
    progress_unit: unit.text,
    photo_alt: alt.text,
    translated: {
      title: title.translated,
      description: description.translated,
      unit: unit.translated,
      alt: alt.translated,
    },
  };
}

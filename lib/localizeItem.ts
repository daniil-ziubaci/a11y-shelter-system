import { textHash } from "@/lib/hashText";
import { pickTranslation, readTranslations } from "@/lib/translations";
import type { Json } from "@/types/database";

export function localizeItem<T extends { name: string; translations: Json }>(
  item: T,
  locale: string,
) {
  const text = pickTranslation(
    readTranslations(item.translations),
    "name",
    locale,
    textHash("", item.name),
  );
  return { ...item, name: text ?? item.name, translated: text !== null };
}

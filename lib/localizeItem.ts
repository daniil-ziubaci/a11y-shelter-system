import { textHash } from "@/lib/hashText";
import { pickTranslation, readTranslations } from "@/lib/translations";
import type { Json } from "@/types/database";

export function localizeItem<
  T extends { name: string; note?: string | null; translations: Json },
>(item: T, locale: string) {
  const translations = readTranslations(item.translations);
  const name = pickTranslation(
    translations,
    "name",
    locale,
    textHash("", item.name),
  );
  const originalNote = item.note ?? null;
  const note =
    originalNote === null
      ? null
      : pickTranslation(
          translations,
          "note",
          locale,
          textHash("", originalNote),
        );
  return {
    ...item,
    name: name ?? item.name,
    note: note ?? originalNote,
    translated: name !== null,
    noteTranslated: note !== null,
  };
}

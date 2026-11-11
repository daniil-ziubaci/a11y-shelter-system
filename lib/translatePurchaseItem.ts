import "server-only";

import { buildTranslations } from "@/lib/buildTranslations";
import { createClient } from "@/lib/supabase/server";
import {
  readTranslations,
  sameTranslations,
  type Translations,
} from "@/lib/translations";
import type { Json } from "@/types/database";

const ITEM_CONTEXT: Record<string, string> = {
  ru: "Сайт приюта для бездомных животных. Тексты это название вещи в списке нужд приюта (например корм, лекарство или наполнитель) и необязательное примечание к ней: какой именно товар нужен или что не подходит.",
  ro: "Site-ul unui adăpost pentru animale fără stăpân. Textele sunt numele unui lucru din lista de nevoi a adăpostului (de exemplu hrană, medicament sau așternut) și o notă opțională despre el: ce anume este necesar sau ce nu se potrivește.",
  en: "Website of a shelter for stray animals. The texts are the name of an item on the shelter's needs list (for example food, medicine or litter) and an optional note about it: what exactly is needed or what does not fit.",
};

type ItemTexts = { name: string; note: string | null; translations: Json };

export function itemTranslations(
  item: ItemTexts,
  sourceLanguage: string,
): Promise<Translations> {
  return buildTranslations({
    sourceLanguage,
    texts: item.note
      ? { name: item.name, note: item.note }
      : { name: item.name },
    previous: readTranslations(item.translations),
    context: ITEM_CONTEXT,
  });
}

export async function translatePurchaseItem(itemId: string): Promise<void> {
  try {
    const supabase = await createClient();
    const { data: item } = await supabase
      .from("purchase_items")
      .select("name, note, translations, shelter_id")
      .eq("id", itemId)
      .maybeSingle();
    if (!item) {
      return;
    }
    const { data: shelter } = await supabase
      .from("shelters")
      .select("content_language")
      .eq("id", item.shelter_id)
      .maybeSingle();
    if (!shelter) {
      return;
    }
    const translations = await itemTranslations(item, shelter.content_language);
    if (sameTranslations(translations, readTranslations(item.translations))) {
      return;
    }
    const { error } = await supabase
      .from("purchase_items")
      .update({ translations })
      .eq("id", itemId);
    if (error) {
      console.error(
        "translatePurchaseItem update failed",
        itemId,
        error.message,
      );
    }
  } catch (error) {
    console.error("translatePurchaseItem failed", itemId, error);
  }
}

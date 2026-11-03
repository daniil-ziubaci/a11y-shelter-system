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
  ru: "Сайт приюта для бездомных животных. Текст это название вещи в списке нужд приюта, например корм, лекарство или наполнитель.",
  ro: "Site-ul unui adăpost pentru animale fără stăpân. Textul este numele unui lucru din lista de nevoi a adăpostului, de exemplu hrană, medicament sau așternut.",
  en: "Website of a shelter for stray animals. The text is the name of an item on the shelter's needs list, for example food, medicine or litter.",
};

type ItemTexts = { name: string; translations: Json };

export function itemTranslations(
  item: ItemTexts,
  sourceLanguage: string,
): Promise<Translations> {
  return buildTranslations({
    sourceLanguage,
    texts: { name: item.name },
    previous: readTranslations(item.translations),
    context: ITEM_CONTEXT,
  });
}

export async function translatePurchaseItem(itemId: string): Promise<void> {
  try {
    const supabase = await createClient();
    const { data: item } = await supabase
      .from("purchase_items")
      .select("name, translations, shelter_id")
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

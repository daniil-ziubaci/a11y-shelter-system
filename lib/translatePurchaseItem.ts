import "server-only";

import { buildTranslations } from "@/lib/buildTranslations";
import { createClient } from "@/lib/supabase/server";
import { readTranslations } from "@/lib/translations";

const ITEM_CONTEXT: Record<string, string> = {
  ru: "Сайт приюта для бездомных животных. Текст это название вещи в списке нужд приюта, например корм, лекарство или наполнитель.",
  ro: "Site-ul unui adăpost pentru animale fără stăpân. Textul este numele unui lucru din lista de nevoi a adăpostului, de exemplu hrană, medicament sau așternut.",
  en: "Website of a shelter for stray animals. The text is the name of an item on the shelter's needs list, for example food, medicine or litter.",
};

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
    const translations = await buildTranslations({
      sourceLanguage: shelter.content_language,
      texts: { name: item.name },
      previous: readTranslations(item.translations),
      context: ITEM_CONTEXT,
    });
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

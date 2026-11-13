import type { AstroGlobal } from "astro";
import { afterResponse, formValues, refreshPublicPages, text } from "@/lib/panel";
import { parsePurchaseItemEdit } from "@/lib/parsePurchaseItemEdit";
import { parsePurchaseItemFields } from "@/lib/parsePurchaseItemFields";
import { translateItem } from "@/lib/translate";

export type NeedSaveResult = { ok: true; redirect: string } | { ok: false; error: string; values: Record<string, string> };

export async function saveNeed(astro: AstroGlobal, formData: FormData, existingId: string | null): Promise<NeedSaveResult> {
  const values = formValues(formData);
  const fail = (error: string): NeedSaveResult => ({ ok: false, error, values });
  const supabase = astro.locals.supabase;
  let itemId: string;

  if (existingId) {
    const parsed = parsePurchaseItemEdit(formData);
    if (!parsed.ok) return fail(parsed.error);
    const { name, category, isUrgent, note } = parsed.fields;
    const { data, error } = await supabase
      .from("purchase_items")
      .update({ name, category, is_urgent: isUrgent, note })
      .eq("id", existingId)
      .select("id")
      .maybeSingle();
    if (error) return fail("Не удалось сохранить позицию. Попробуйте ещё раз.");
    if (!data) return fail("Позиция не найдена или недоступна.");
    itemId = existingId;
  } else {
    const parsed = parsePurchaseItemFields(formData);
    if (!parsed.ok) return fail(parsed.error);
    const { name, category, unit, quantity, isUrgent, note } = parsed.fields;
    itemId = crypto.randomUUID();
    const { error } = await supabase
      .from("purchase_items")
      .insert({ id: itemId, name, category, unit, remaining: quantity, is_urgent: isUrgent, note });
    if (error) return fail("Не удалось сохранить позицию. Попробуйте ещё раз.");
  }

  afterResponse(astro, () => translateItem(supabase, itemId));
  refreshPublicPages(astro);
  const from = text(formData, "from");
  const section = from === "open" || from === "stock" || from === "closed" ? from : "";
  return { ok: true, redirect: section ? `/volunteer/needs/${section}` : "/volunteer/needs" };
}

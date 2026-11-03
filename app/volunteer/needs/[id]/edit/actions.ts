"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import { translatePurchaseItem } from "@/lib/translatePurchaseItem";
import { createClient } from "@/lib/supabase/server";
import { parsePurchaseItemEdit } from "@/lib/parsePurchaseItemEdit";

type UpdateNeedState =
  | { error: string; values: Record<string, string> }
  | undefined;

export async function updateNeed(
  _prevState: UpdateNeedState,
  formData: FormData,
): Promise<UpdateNeedState> {
  const values: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") {
      values[key] = value;
    }
  }
  const fail = (error: string): UpdateNeedState => ({ error, values });

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) {
    return fail("Войдите заново.");
  }

  const { data: membership } = await supabase
    .from("shelter_members")
    .select("shelter_id")
    .limit(1)
    .maybeSingle();
  if (!membership) {
    return fail("Вы не состоите ни в одном приюте.");
  }

  const itemId = formData.get("itemId");
  if (typeof itemId !== "string" || !itemId) {
    return fail("Позиция не найдена.");
  }

  const parsed = parsePurchaseItemEdit(formData);
  if (!parsed.ok) {
    return fail(parsed.error);
  }
  const { name, category, isUrgent } = parsed.fields;

  const { data: updated, error: updateError } = await supabase
    .from("purchase_items")
    .update({ name, category, is_urgent: isUrgent })
    .eq("id", itemId)
    .eq("shelter_id", membership.shelter_id)
    .select("id")
    .maybeSingle();
  if (updateError) {
    return fail("Не удалось сохранить позицию. Попробуйте ещё раз.");
  }
  if (!updated) {
    return fail("Позиция не найдена или недоступна.");
  }

  const from = formData.get("from");
  const section =
    from === "open" || from === "stock" || from === "closed" ? from : "";

  after(() => translatePurchaseItem(itemId));
  redirect(section ? `/volunteer/needs/${section}` : "/volunteer/needs");
}

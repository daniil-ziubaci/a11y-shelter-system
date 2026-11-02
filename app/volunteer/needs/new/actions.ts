"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parsePurchaseItemFields } from "@/lib/parsePurchaseItemFields";

type CreateNeedState =
  | { error: string; values: Record<string, string> }
  | undefined;

export async function createNeed(
  _prevState: CreateNeedState,
  formData: FormData,
): Promise<CreateNeedState> {
  const values: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") {
      values[key] = value;
    }
  }
  const fail = (error: string): CreateNeedState => ({ error, values });

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

  const parsed = parsePurchaseItemFields(formData);
  if (!parsed.ok) {
    return fail(parsed.error);
  }
  const { name, category, unit, quantity, isUrgent } = parsed.fields;

  const { error: insertError } = await supabase.from("purchase_items").insert({
    shelter_id: membership.shelter_id,
    name,
    category,
    unit,
    remaining: quantity,
    is_urgent: isUrgent,
  });
  if (insertError) {
    return fail("Не удалось сохранить позицию. Попробуйте ещё раз.");
  }

  redirect("/volunteer/needs");
}

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { formatRemaining } from "@/lib/formatRemaining";

type ReceiveState =
  | { ok: true; message: string }
  | { ok: false; error: string; values: Record<string, string> }
  | undefined;

export async function receivePurchase(
  _prevState: ReceiveState,
  formData: FormData,
): Promise<ReceiveState> {
  const values: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") {
      values[key] = value;
    }
  }
  const fail = (error: string): ReceiveState => ({ ok: false, error, values });
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) {
    return fail("Войдите заново.");
  }

  const itemId = formData.get("itemId");
  if (typeof itemId !== "string" || !itemId) {
    return fail("Выберите позицию.");
  }

  const amountInput = formData.get("amount");
  const amount = Number(
    typeof amountInput === "string" ? amountInput.trim().replace(",", ".") : "",
  );
  if (!Number.isFinite(amount) || amount <= 0 || amount > 100000) {
    return fail("Введите, сколько купили, например 2,5.");
  }

  const { data: remaining, error } = await supabase.rpc("receive_purchase", {
    p_item_id: itemId,
    p_amount: amount,
  });
  if (error) {
    if (error.code === "P0002") {
      return fail("Позиция не найдена или недоступна.");
    }
    return fail("Не удалось записать покупку. Попробуйте ещё раз.");
  }

  const { data: item } = await supabase
    .from("purchase_items")
    .select("name, unit")
    .eq("id", itemId)
    .maybeSingle();

  revalidatePath("/volunteer");

  if (!item) {
    return { ok: true, message: "Покупка записана." };
  }
  return {
    ok: true,
    message: `Записано: ${amount.toLocaleString("ru-RU")} ${item.unit}, ${item.name}. ${formatRemaining(remaining, item.unit)}`,
  };
}

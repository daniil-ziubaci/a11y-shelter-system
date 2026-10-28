"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { formatRemaining } from "@/lib/formatRemaining";

type UndoState = { ok: boolean; message: string } | undefined;

export async function undoPurchase(
  _prevState: UndoState,
  formData: FormData,
): Promise<UndoState> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) {
    return { ok: false, message: "Войдите заново." };
  }

  const logId = formData.get("logId");
  if (typeof logId !== "string" || !logId) {
    return { ok: false, message: "Не выбрана покупка для отмены." };
  }

  const { data: entry } = await supabase
    .from("purchase_log")
    .select("amount, purchase_items(name, unit)")
    .eq("id", logId)
    .maybeSingle();

  const { data: remaining, error } = await supabase.rpc("undo_purchase", {
    p_log_id: logId,
  });
  if (error) {
    if (error.code === "P0001") {
      return {
        ok: false,
        message: "Последняя запись изменилась, обновите страницу.",
      };
    }
    if (error.code === "P0002") {
      return {
        ok: false,
        message: "Покупка уже отменена или недоступна. Обновите страницу.",
      };
    }
    return {
      ok: false,
      message: "Не удалось отменить покупку. Попробуйте ещё раз.",
    };
  }

  revalidatePath("/volunteer");

  const item = entry?.purchase_items;
  if (!entry || !item) {
    return { ok: true, message: "Покупка отменена." };
  }
  return {
    ok: true,
    message: `Покупка отменена: ${entry.amount.toLocaleString("ru-RU")} ${item.unit}, ${item.name}. ${formatRemaining(remaining, item.unit)}`,
  };
}

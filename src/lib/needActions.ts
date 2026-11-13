import type { AstroGlobal } from "astro";
import { setFlash } from "@/lib/flash";
import { formatRemaining } from "@/lib/formatRemaining";
import { readForm, refreshPublicPages, text } from "@/lib/panel";

function parseAmount(value: string): number {
  return Number(value.replace(",", "."));
}

function validAmount(amount: number): boolean {
  return Number.isFinite(amount) && amount > 0 && amount <= 100000;
}

export async function handleNeedPost(astro: AstroGlobal): Promise<Response> {
  const supabase = astro.locals.supabase;
  const form = await readForm(astro);
  const back = form ? text(form, "back") : "";
  const backTo = back.startsWith("/volunteer/needs") ? back : "/volunteer/needs";
  if (!form) return astro.redirect(backTo, 303);
  const intent = text(form, "intent");
  const itemId = text(form, "itemId");
  const amountText = text(form, "amount");
  const amount = parseAmount(amountText);

  if (intent === "receive" || intent === "consume") {
    const key = intent === "receive" ? "receive" : `consume-${itemId}`;
    const fail = (message: string) => setFlash(astro.cookies, { key, ok: false, message, value: amountText });
    if (!itemId) {
      fail("Выберите позицию.");
    } else if (!validAmount(amount)) {
      fail(intent === "receive" ? "Введите, сколько получили, например 2,5." : "Введите, сколько израсходовали, например 2,5.");
    } else {
      const { data: remaining, error } = await supabase.rpc(intent === "receive" ? "receive_purchase" : "record_consumption", {
        p_item_id: itemId,
        p_amount: amount,
      });
      if (error) {
        fail(
          error.code === "P0002"
            ? "Позиция не найдена или недоступна."
            : intent === "receive"
              ? "Не удалось записать. Попробуйте ещё раз."
              : "Не удалось записать расход. Попробуйте ещё раз.",
        );
      } else {
        refreshPublicPages(astro);
        const { data: item } = await supabase.from("purchase_items").select("name, unit").eq("id", itemId).maybeSingle();
        const amountLabel = amount.toLocaleString("ru-RU");
        const message = !item
          ? intent === "receive"
            ? "Записано."
            : "Расход записан."
          : intent === "receive"
            ? `Записано: ${amountLabel} ${item.unit}, ${item.name}. ${formatRemaining(remaining ?? 0, item.unit)}`
            : `Записано: расход ${amountLabel} ${item.unit}, ${item.name}. ${formatRemaining(remaining ?? 0, item.unit)}`;
        setFlash(astro.cookies, { key, ok: true, message });
      }
    }
    return astro.redirect(backTo, 303);
  }

  if (intent === "undo") {
    const logId = text(form, "logId");
    let message: string;
    let ok = false;
    if (!logId) {
      message = "Не выбрана покупка для отмены.";
    } else {
      const { data: entry } = await supabase.from("purchase_log").select("amount, purchase_items(name, unit)").eq("id", logId).maybeSingle();
      const { data: remaining, error } = await supabase.rpc("undo_purchase", { p_log_id: logId });
      if (error) {
        message =
          error.code === "P0001"
            ? "Последняя запись изменилась, обновите страницу."
            : error.code === "P0002"
              ? "Покупка уже отменена или недоступна. Обновите страницу."
              : "Не удалось отменить покупку. Попробуйте ещё раз.";
      } else {
        ok = true;
        refreshPublicPages(astro);
        const item = entry?.purchase_items;
        message =
          entry && item
            ? `Покупка отменена: ${entry.amount.toLocaleString("ru-RU")} ${item.unit}, ${item.name}. ${formatRemaining(remaining ?? 0, item.unit)}`
            : "Покупка отменена.";
      }
    }
    setFlash(astro.cookies, { key: "undo", ok, message });
    return astro.redirect(backTo, 303);
  }

  if (intent === "archive") {
    const archived = text(form, "archived") === "1";
    if (itemId) {
      const { error } = await supabase.from("purchase_items").update({ is_archived: archived }).eq("id", itemId);
      if (error && error.code !== "23514") throw new Error("Не удалось изменить позицию.");
    }
    return astro.redirect(backTo, 303);
  }

  return astro.redirect(backTo, 303);
}

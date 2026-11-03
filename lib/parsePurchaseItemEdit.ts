import { findContactError } from "@/lib/findContactError";
import { NEED_CATEGORIES } from "@/lib/needCategories";

export type PurchaseItemEdit = {
  name: string;
  category: string;
  isUrgent: boolean;
};

export type ParsePurchaseItemEditResult =
  | { ok: true; fields: PurchaseItemEdit }
  | { ok: false; error: string };

export function parsePurchaseItemEdit(
  formData: FormData,
): ParsePurchaseItemEditResult {
  const text = (field: string) => {
    const value = formData.get(field);
    return typeof value === "string" ? value.trim() : "";
  };

  const name = text("name");
  if (!name) {
    return { ok: false, error: "Введите название позиции." };
  }
  if (name.length > 100) {
    return { ok: false, error: "Название не длиннее 100 символов." };
  }

  const contactProblem = findContactError([["Название позиции", name]]);
  if (contactProblem) {
    return { ok: false, error: contactProblem };
  }

  const category = text("category");
  if (!NEED_CATEGORIES.includes(category)) {
    return { ok: false, error: "Выберите категорию." };
  }

  const isUrgent = formData.get("is_urgent") === "on";

  return { ok: true, fields: { name, category, isUrgent } };
}

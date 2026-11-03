import { findContactError } from "@/lib/findContactError";
import { NEED_CATEGORIES } from "@/lib/needCategories";
import { NEED_UNITS } from "@/lib/needUnits";

export type PurchaseItemFields = {
  name: string;
  category: string;
  unit: string;
  quantity: number;
  isUrgent: boolean;
};

export type ParsePurchaseItemFieldsResult =
  | { ok: true; fields: PurchaseItemFields }
  | { ok: false; error: string };

export function parsePurchaseItemFields(
  formData: FormData,
): ParsePurchaseItemFieldsResult {
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

  const unit = text("unit");
  if (!NEED_UNITS.includes(unit)) {
    return { ok: false, error: "Выберите единицу измерения." };
  }

  const quantity = Number(text("quantity").replace(",", "."));
  if (!Number.isFinite(quantity) || quantity <= 0 || quantity > 100000) {
    return {
      ok: false,
      error: "Введите нужное количество, например 2,5.",
    };
  }

  const isUrgent = formData.get("is_urgent") === "on";

  return {
    ok: true,
    fields: { name, category, unit, quantity, isUrgent },
  };
}

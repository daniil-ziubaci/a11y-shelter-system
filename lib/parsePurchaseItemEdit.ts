import { NEED_CATEGORIES } from "@/lib/needCategories";

export type PurchaseItemEdit = {
  name: string;
  category: string;
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

  const category = text("category");
  if (!NEED_CATEGORIES.includes(category)) {
    return { ok: false, error: "Выберите категорию." };
  }

  return { ok: true, fields: { name, category } };
}

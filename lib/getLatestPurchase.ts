import { createClient } from "@/lib/supabase/server";
import type { LatestPurchase } from "@/app/volunteer/needs/undo/undo-form";

export async function getLatestPurchase(
  shelterId: string,
): Promise<LatestPurchase | null> {
  const supabase = await createClient();
  const windowStart = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("purchase_log")
    .select("id, amount, purchase_items(name, unit)")
    .eq("shelter_id", shelterId)
    .gte("created_at", windowStart)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data?.purchase_items) {
    return null;
  }
  return {
    id: data.id,
    label: `${data.amount.toLocaleString("ru-RU")} ${data.purchase_items.unit}, ${data.purchase_items.name}`,
  };
}

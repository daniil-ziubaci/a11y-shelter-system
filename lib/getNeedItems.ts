import { createClient } from "@/lib/supabase/server";

export async function getNeedItems(shelterId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("purchase_items")
    .select("id, name, unit, remaining")
    .eq("shelter_id", shelterId)
    .order("created_at");
  return { items: data ?? [], error };
}

import { createClient } from "@/lib/supabase/server";

export async function getNeedItems(shelterId: string, archived = false) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("purchase_items")
    .select("id, name, unit, remaining")
    .eq("shelter_id", shelterId)
    .eq("is_archived", archived)
    .order("created_at");
  return { items: data ?? [], error };
}

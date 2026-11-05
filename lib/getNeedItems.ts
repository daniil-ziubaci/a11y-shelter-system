import { createClient } from "@/lib/supabase/server";

export async function getNeedItems(shelterId: string, archived = false) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("purchase_items")
    .select("id, name, unit, remaining, is_urgent")
    .eq("shelter_id", shelterId)
    .eq("is_archived", archived)
    .order("is_urgent", { ascending: false })
    .order("created_at", { ascending: false })
    .order("id");
  return { items: data ?? [], error };
}

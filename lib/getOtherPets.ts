import { PUBLIC_PET_STATUSES } from "@/lib/petStatuses";
import { createClient } from "@/lib/supabase/server";
import { toPet } from "@/lib/toPet";

export async function getOtherPets(shelterId: string, excludeId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pets")
    .select("*")
    .eq("shelter_id", shelterId)
    .in("status", PUBLIC_PET_STATUSES)
    .neq("id", excludeId)
    .order("status_rank")
    .order("created_at", { ascending: true })
    .limit(4);

  if (error) return [];

  return (data ?? []).map((row) => toPet(row));
}

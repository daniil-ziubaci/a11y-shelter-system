import { getStatusRank, PUBLIC_PET_STATUSES } from "@/lib/petStatuses";
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
    .order("created_at", { ascending: true })
    .limit(100);

  if (error) return [];

  return (data ?? [])
    .map((row) => toPet(row))
    .sort((a, b) => getStatusRank(a.status) - getStatusRank(b.status))
    .slice(0, 4);
}

import { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export async function saveEnclosure(
  supabase: Supabase,
  petId: string,
  enclosure: string,
): Promise<boolean> {
  if (enclosure === "") {
    const { error } = await supabase
      .from("pet_internal")
      .delete()
      .eq("pet_id", petId);
    return !error;
  }

  const { error } = await supabase
    .from("pet_internal")
    .upsert({ pet_id: petId, enclosure });
  return !error;
}

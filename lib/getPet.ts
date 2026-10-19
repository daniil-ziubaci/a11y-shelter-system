import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export const getPet = cache(async (id: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pets")
    .select("*, shelters(name)")
    .eq("id", id)
    .single();
  if (error?.code === "PGRST116" || error?.code === "22P02") {
    notFound();
  }
  if (error) {
    throw new Error("Не удалось загрузить питомца из базы.");
  }
  return data;
});

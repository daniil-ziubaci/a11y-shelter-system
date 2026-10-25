import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export const getShelter = cache(async (slug: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shelters")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error?.code === "PGRST116") {
    notFound();
  }
  if (error) {
    throw new Error("Не удалось загрузить приют из базы.");
  }
  return data;
});

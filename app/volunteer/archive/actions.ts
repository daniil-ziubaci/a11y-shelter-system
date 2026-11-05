"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function readArchive(formData: FormData) {
  const id = formData.get("id");
  const archived = formData.get("archived");
  if (typeof id !== "string" || !id) {
    return null;
  }
  return { id, archived: archived === "1" };
}

export async function setProjectArchived(formData: FormData) {
  const input = readArchive(formData);
  if (!input) {
    return;
  }
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) {
    return;
  }
  const { error } = await supabase
    .from("projects")
    .update({ is_archived: input.archived })
    .eq("id", input.id);
  if (error) {
    throw new Error("Не удалось изменить проект.");
  }
  revalidatePath("/volunteer/projects");
}

export async function setNeedArchived(formData: FormData) {
  const input = readArchive(formData);
  if (!input) {
    return;
  }
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) {
    return;
  }
  const { error } = await supabase
    .from("purchase_items")
    .update({ is_archived: input.archived })
    .eq("id", input.id);
  if (error) {
    if (error.code === "23514") {
      return;
    }
    throw new Error("Не удалось изменить позицию.");
  }
  revalidatePath("/volunteer/needs", "layout");
}

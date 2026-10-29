"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { PROJECT_STATUSES } from "@/lib/projectStages";

export async function setProjectStatus(formData: FormData) {
  const projectId = formData.get("projectId");
  const status = formData.get("status");

  if (typeof projectId !== "string" || typeof status !== "string") {
    return;
  }
  if (!(PROJECT_STATUSES as readonly string[]).includes(status)) {
    return;
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) {
    return;
  }

  const { error } = await supabase
    .from("projects")
    .update({ status })
    .eq("id", projectId);

  if (error) {
    throw new Error("Не удалось изменить статус проекта.");
  }

  revalidatePath("/volunteer/projects");
}

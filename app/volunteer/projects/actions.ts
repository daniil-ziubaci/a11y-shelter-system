"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { PROJECT_STATUS_COMPLETED, PROJECT_STATUS_ONGOING, PROJECT_STATUSES } from "@/lib/projectStages";

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

export async function setProjectProgress(formData: FormData) {
  const projectId = formData.get("projectId");
  const doneInput = formData.get("progressDone");

  if (typeof projectId !== "string" || typeof doneInput !== "string") {
    return;
  }
  const done = Number(doneInput.trim());
  if (!Number.isInteger(done) || done < 0) {
    return;
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) {
    return;
  }

  const { data: project } = await supabase
    .from("projects")
    .select("progress_total")
    .eq("id", projectId)
    .maybeSingle();
  if (!project || project.progress_total === null || done > project.progress_total) {
    return;
  }

  const { error } = await supabase
    .from("projects")
    .update({
      progress_done: done,
      status:
        done === project.progress_total
          ? PROJECT_STATUS_COMPLETED
          : PROJECT_STATUS_ONGOING,
    })
    .eq("id", projectId);

  if (error) {
    throw new Error("Не удалось изменить счёт дел.");
  }

  revalidatePath("/volunteer/projects");
}

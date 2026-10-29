"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parseProjectFields } from "@/lib/parseProjectFields";

type UpdateProjectState =
  | { error: string; values: Record<string, string> }
  | undefined;

export async function updateProject(
  _prevState: UpdateProjectState,
  formData: FormData,
): Promise<UpdateProjectState> {
  const values: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") {
      values[key] = value;
    }
  }
  const fail = (error: string): UpdateProjectState => ({ error, values });

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) {
    return fail("Войдите заново.");
  }

  const { data: membership } = await supabase
    .from("shelter_members")
    .select("shelter_id")
    .limit(1)
    .maybeSingle();
  if (!membership) {
    return fail("Вы не состоите ни в одном приюте.");
  }

  const projectId = formData.get("projectId");
  if (typeof projectId !== "string" || !projectId) {
    return fail("Проект не найден.");
  }

  const parsed = parseProjectFields(formData);
  if (!parsed.ok) {
    return fail(parsed.error);
  }
  const { title, description, goal, stage } = parsed.fields;

  const { data: updated, error: updateError } = await supabase
    .from("projects")
    .update({ title, description, goal, stage })
    .eq("id", projectId)
    .eq("shelter_id", membership.shelter_id)
    .select("id")
    .maybeSingle();
  if (updateError) {
    return fail("Не удалось сохранить проект. Попробуйте ещё раз.");
  }
  if (!updated) {
    return fail("Проект не найден или недоступен.");
  }

  redirect("/volunteer/projects");
}

"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parseProjectFields } from "@/lib/parseProjectFields";

type CreateProjectState =
  | { error: string; values: Record<string, string> }
  | undefined;

export async function createProject(
  _prevState: CreateProjectState,
  formData: FormData,
): Promise<CreateProjectState> {
  const values: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") {
      values[key] = value;
    }
  }
  const fail = (error: string): CreateProjectState => ({ error, values });

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

  const parsed = parseProjectFields(formData);
  if (!parsed.ok) {
    return fail(parsed.error);
  }
  const { title, description, goal } = parsed.fields;

  const { error: insertError } = await supabase.from("projects").insert({
    shelter_id: membership.shelter_id,
    title,
    description,
    goal,
  });
  if (insertError) {
    return fail("Не удалось сохранить проект. Попробуйте ещё раз.");
  }

  redirect("/volunteer/projects");
}

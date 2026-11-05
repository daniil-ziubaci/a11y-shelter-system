"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import { translateProject } from "@/lib/translateProject";
import { createClient } from "@/lib/supabase/server";
import { parseProjectFields } from "@/lib/parseProjectFields";
import { uploadProjectPhoto } from "@/lib/uploadProjectPhoto";

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
      values[key] = key in values ? `${values[key]},${value}` : value;
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
  const { title, description, helpKinds, photoAlt, progress } = parsed.fields;

  let photoPath: string | null = null;
  const photo = formData.get("photo");
  if (photo instanceof File && photo.size > 0) {
    if (photoAlt.length === 0) {
      return fail("Опишите фото: это нужно людям, которые его не видят.");
    }
    const uploaded = await uploadProjectPhoto(
      supabase,
      membership.shelter_id,
      photo,
    );
    if (!uploaded.ok) {
      return fail(uploaded.error);
    }
    photoPath = uploaded.path;
  }

  const { data: created, error: insertError } = await supabase
    .from("projects")
    .insert({
      shelter_id: membership.shelter_id,
      title,
      description,
      help_kinds: helpKinds,
      photo_path: photoPath,
      photo_alt: photoPath ? photoAlt : null,
      progress_total: progress?.total ?? null,
      progress_done: progress?.done ?? null,
      progress_unit: progress?.unit ?? null,
    })
    .select("id")
    .single();
  if (insertError || !created) {
    return fail("Не удалось сохранить проект. Попробуйте ещё раз.");
  }

  after(() => translateProject(created.id));
  redirect("/volunteer/projects");
}

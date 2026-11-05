"use server";

import {
  PROJECT_STATUS_COMPLETED,
  PROJECT_STATUS_ONGOING,
} from "@/lib/projectStages";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { translateProject } from "@/lib/translateProject";
import { createClient } from "@/lib/supabase/server";
import { parseProjectFields } from "@/lib/parseProjectFields";
import { uploadProjectPhoto } from "@/lib/uploadProjectPhoto";

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
      values[key] = key in values ? `${values[key]},${value}` : value;
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
  const { title, description, helpKinds, photoAlt, progress } = parsed.fields;

  let photoFields: { photo_path?: string; photo_alt?: string } = {};
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
    photoFields = { photo_path: uploaded.path, photo_alt: photoAlt };
  } else {
    const { data: current } = await supabase
      .from("projects")
      .select("photo_path")
      .eq("id", projectId)
      .eq("shelter_id", membership.shelter_id)
      .maybeSingle();
    if (current?.photo_path) {
      if (photoAlt.length === 0) {
        return fail("Описание фото не может быть пустым.");
      }
      photoFields = { photo_alt: photoAlt };
    }
  }
  const { data: updated, error: updateError } = await supabase
    .from("projects")
    .update({
      title,
      description,
      help_kinds: helpKinds,
      progress_total: progress?.total ?? null,
      progress_done: progress?.done ?? null,
      progress_unit: progress?.unit ?? null,
      ...(progress
        ? {
            status:
              progress.done === progress.total
                ? PROJECT_STATUS_COMPLETED
                : PROJECT_STATUS_ONGOING,
          }
        : {}),
      ...photoFields,
    })
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

  after(() => translateProject(projectId));
  redirect("/volunteer/projects");
}

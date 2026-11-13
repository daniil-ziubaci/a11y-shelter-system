import type { AstroGlobal } from "astro";
import { afterResponse, formValues, refreshPublicPages } from "@/lib/panel";
import { parseProjectFields } from "@/lib/parseProjectFields";
import { hasFile, removeReplacedProjectPhoto, uploadProjectPhoto } from "@/lib/photos";
import { PROJECT_STATUS_COMPLETED, PROJECT_STATUS_ONGOING } from "@/lib/projectStages";
import { translateProject } from "@/lib/translate";

export type ProjectSaveResult = { ok: true } | { ok: false; error: string; values: Record<string, string> };

export async function saveProject(
  astro: AstroGlobal,
  formData: FormData,
  existing: { id: string; photo_path: string | null } | null,
): Promise<ProjectSaveResult> {
  const values = formValues(formData);
  const fail = (error: string): ProjectSaveResult => ({ ok: false, error, values });
  const supabase = astro.locals.supabase;
  const parsed = parseProjectFields(formData);
  if (!parsed.ok) return fail(parsed.error);
  const { title, description, helpKinds, photoAlt, progress } = parsed.fields;

  let photoFields: { photo_path?: string | null; photo_alt?: string | null } = existing ? {} : { photo_path: null, photo_alt: null };
  const photo = formData.get("photo");
  if (hasFile(photo)) {
    if (photoAlt.length === 0) return fail("Опишите фото: это нужно людям, которые его не видят.");
    const uploaded = await uploadProjectPhoto(supabase, photo);
    if (!uploaded.ok) return fail(uploaded.error);
    photoFields = { photo_path: uploaded.path, photo_alt: photoAlt };
  } else if (existing?.photo_path) {
    if (photoAlt.length === 0) return fail("Описание фото не может быть пустым.");
    photoFields = { photo_alt: photoAlt };
  }

  const row = {
    title,
    description,
    help_kinds: helpKinds,
    progress_total: progress?.total ?? null,
    progress_done: progress?.done ?? null,
    progress_unit: progress?.unit ?? null,
    ...photoFields,
  };

  let projectId: string;
  if (existing) {
    const { data, error } = await supabase
      .from("projects")
      .update({
        ...row,
        ...(progress ? { status: progress.done === progress.total ? PROJECT_STATUS_COMPLETED : PROJECT_STATUS_ONGOING } : {}),
      })
      .eq("id", existing.id)
      .select("id")
      .maybeSingle();
    if (error) return fail("Не удалось сохранить проект. Попробуйте ещё раз.");
    if (!data) return fail("Проект не найден или недоступен.");
    projectId = existing.id;
    if (existing.photo_path && photoFields.photo_path) removeReplacedProjectPhoto(astro, existing.photo_path, photoFields.photo_path);
  } else {
    const { data, error } = await supabase.from("projects").insert(row).select("id").single();
    if (error || !data) return fail("Не удалось сохранить проект. Попробуйте ещё раз.");
    projectId = data.id;
  }

  afterResponse(astro, () => translateProject(supabase, projectId));
  refreshPublicPages(astro);
  return { ok: true };
}

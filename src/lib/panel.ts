import type { AstroGlobal } from "astro";
import type { Supabase } from "@/lib/supabase";

export function formValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") {
      values[key] = key in values ? `${values[key]},${value}` : value;
    }
  }
  return values;
}

export function isPost(astro: AstroGlobal): boolean {
  return astro.request.method === "POST";
}

export async function readForm(astro: AstroGlobal): Promise<FormData | null> {
  try {
    return await astro.request.formData();
  } catch {
    return null;
  }
}

export function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function isVolunteer(supabase: Supabase, userId: string | undefined): Promise<boolean> {
  if (!userId) return false;
  const { data } = await supabase.from("volunteers").select("user_id").eq("user_id", userId).maybeSingle();
  return Boolean(data);
}

export function afterResponse(astro: AstroGlobal, work: () => Promise<unknown>): void {
  const task = work().catch((error) => console.error("background task failed", error));
  const context = astro.locals.cfContext;
  if (context) {
    context.waitUntil(task);
  }
}

export function refreshPublicPages(astro: AstroGlobal): void {
  if (!astro.cache.enabled) return;
  afterResponse(astro, () => astro.cache.invalidate({ tags: ["public"] }));
}

export const NOT_A_VOLUNTEER = "Вы пока не состоите в команде приюта. Обратитесь к координатору.";

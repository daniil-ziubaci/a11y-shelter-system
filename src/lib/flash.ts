import type { AstroCookies } from "astro";

export type Flash = { key: string; ok: boolean; message: string; value?: string };

const NAME = "panel-flash";

export function setFlash(cookies: AstroCookies, flash: Flash): void {
  cookies.set(NAME, JSON.stringify(flash), { path: "/volunteer", httpOnly: true, sameSite: "lax", secure: true, maxAge: 60 });
}

export function takeFlash(cookies: AstroCookies): Flash | null {
  const raw = cookies.get(NAME)?.value;
  if (!raw) return null;
  cookies.delete(NAME, { path: "/volunteer" });
  try {
    const value = JSON.parse(raw) as Flash;
    return typeof value.message === "string" && typeof value.key === "string" ? value : null;
  } catch {
    return null;
  }
}

import type { Supabase } from "@/lib/supabase";

export async function verifyTotp(supabase: Supabase, formData: FormData): Promise<string | null> {
  const factorId = formData.get("factorId");
  const code = formData.get("code");
  if (typeof factorId !== "string" || typeof code !== "string") {
    return "Введите шестизначный код.";
  }
  const cleanCode = code.replace(/\s/g, "");
  if (!/^\d{6}$/.test(cleanCode)) {
    return "Код состоит из шести цифр.";
  }
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: cleanCode });
  return error ? "Неверный код. Попробуйте ещё раз." : null;
}

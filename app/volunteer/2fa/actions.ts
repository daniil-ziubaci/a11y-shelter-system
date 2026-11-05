"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type EnrollResult =
  | { factorId: string; qrCode: string; secret: string }
  | { error: string };

export async function startEnrollment(): Promise<EnrollResult> {
  const supabase = await createClient();

  const { data: factors } = await supabase.auth.mfa.listFactors();
  for (const factor of factors?.all ?? []) {
    if (factor.status === "unverified") {
      await supabase.auth.mfa.unenroll({ factorId: factor.id });
    }
  }

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
  });

  if (error || !data) {
    return { error: "Не удалось начать настройку. Попробуйте ещё раз." };
  }

  return {
    factorId: data.id,
    qrCode: data.totp.qr_code,
    secret: data.totp.secret,
  };
}

export type VerifyState = { error: string } | undefined;

export async function verifyCode(
  _prevState: VerifyState,
  formData: FormData,
): Promise<VerifyState> {
  const factorId = formData.get("factorId");
  const code = formData.get("code");

  if (typeof factorId !== "string" || typeof code !== "string") {
    return { error: "Введите шестизначный код." };
  }

  const cleanCode = code.replace(/\s/g, "");

  if (!/^\d{6}$/.test(cleanCode)) {
    return { error: "Код состоит из шести цифр." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.mfa.challengeAndVerify({
    factorId,
    code: cleanCode,
  });

  if (error) {
    return { error: "Неверный код. Попробуйте ещё раз." };
  }

  redirect("/volunteer/needs");
}

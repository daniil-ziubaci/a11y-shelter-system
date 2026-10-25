"use server";

import { createClient } from "@/lib/supabase/server";

export type EnrollResult =
  | { factorId: string; qrCode: string; secret: string }
  | { error: string };

export async function startEnrollment(): Promise<EnrollResult> {
  const supabase = await createClient();

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

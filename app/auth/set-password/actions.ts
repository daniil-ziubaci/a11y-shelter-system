"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

type SetPasswordState = { error: string } | undefined;

export async function setPassword(
  _prevState: SetPasswordState,
  formData: FormData,
): Promise<SetPasswordState> {
  const password = formData.get("password");
  const confirm = formData.get("confirm");

  if (typeof password !== "string" || typeof confirm !== "string") {
    return { error: "Введите пароль и повторите его." };
  }
  if (password.length < 12) {
    return { error: "Пароль должен быть не короче 12 символов." };
  }
  if (password !== confirm) {
    return { error: "Пароли не совпадают." };
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    return {
      error:
        "Ссылка приглашения устарела. Попросите координатора отправить новую.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: "Не удалось сохранить пароль. Попробуйте другой пароль." };
  }

  redirect("/volunteer");
}

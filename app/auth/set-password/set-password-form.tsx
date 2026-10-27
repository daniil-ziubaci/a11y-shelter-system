"use client";

import { setPassword } from "@/app/auth/set-password/actions";
import { useActionState } from "react";

export function SetPasswordForm() {
  const [state, formAction] = useActionState(setPassword, undefined);

  return (
    <form action={formAction}>
      <p role="alert">{state?.error}</p>

      <label htmlFor="password">Новый пароль</label>
      <p id="password-hint">Не короче 12 символов.</p>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="new-password"
        aria-describedby="password-hint"
        minLength={12}
        required
      />

      <label htmlFor="confirm">Повторите пароль</label>
      <input
        id="confirm"
        name="confirm"
        type="password"
        autoComplete="new-password"
        minLength={12}
        required
      />

      <button type="submit">Сохранить пароль</button>
    </form>
  );
}

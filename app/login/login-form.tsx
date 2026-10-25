"use client";

import { useActionState } from "react";
import { login } from "@/app/login/actions";

export function LoginForm() {
  const [state, formAction] = useActionState(login, undefined);

  return (
    <form action={formAction}>
      <p role="alert">{state?.error}</p>

      <label htmlFor="email">Почта</label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        required
      />

      <label htmlFor="password">Пароль</label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
      />

      <button type="submit">Войти</button>
    </form>
  );
}

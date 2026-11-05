"use client";

import { useActionState } from "react";
import { login } from "@/app/login/actions";
import {
  cardClass,
  errorClass,
  fieldClass,
  labelClass,
  primaryButtonClass,
} from "@/lib/formClasses";

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(login, undefined);

  return (
    <form action={formAction} className={cardClass}>
      <p role="alert" className={errorClass}>
        {state?.error}
      </p>

      <div className="flex flex-col gap-1">
        <label htmlFor="email" className={labelClass}>
          Почта
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          required
          className={fieldClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="password" className={labelClass}>
          Пароль
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={fieldClass}
        />
      </div>

      <button type="submit" disabled={isPending} className={primaryButtonClass}>
        {isPending ? "Входим…" : "Войти"}
      </button>
    </form>
  );
}

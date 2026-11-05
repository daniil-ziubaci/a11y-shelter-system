"use client";

import { setPassword } from "@/app/auth/set-password/actions";
import { useActionState } from "react";
import {
  cardClass,
  errorClass,
  fieldClass,
  hintClass,
  labelClass,
  primaryButtonClass,
} from "@/lib/formClasses";

export function SetPasswordForm() {
  const [state, formAction, isPending] = useActionState(
    setPassword,
    undefined,
  );

  return (
    <form action={formAction} className={cardClass}>
      <p role="alert" className={errorClass}>
        {state?.error}
      </p>

      <div className="flex flex-col gap-1">
        <label htmlFor="password" className={labelClass}>
          Новый пароль
        </label>
        <p id="password-hint" className={hintClass}>
          Не короче 12 символов.
        </p>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          aria-describedby="password-hint"
          minLength={12}
          required
          className={fieldClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="confirm" className={labelClass}>
          Повторите пароль
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          minLength={12}
          required
          className={fieldClass}
        />
      </div>

      <button type="submit" disabled={isPending} className={primaryButtonClass}>
        {isPending ? "Сохраняем…" : "Сохранить пароль"}
      </button>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { verifyCode } from "@/app/volunteer/2fa/actions";
import {
  cardClass,
  errorClass,
  fieldClass,
  labelClass,
  primaryButtonClass,
} from "@/lib/formClasses";

export function CodeForm({ factorId }: { factorId: string }) {
  const [state, formAction, isPending] = useActionState(verifyCode, undefined);

  return (
    <form action={formAction} className={cardClass}>
      <p role="alert" className={errorClass}>
        {state?.error}
      </p>

      <input type="hidden" name="factorId" value={factorId} />

      <div className="flex flex-col gap-1">
        <label htmlFor="code" className={labelClass}>
          Код из приложения
        </label>
        <input
          id="code"
          name="code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          required
          className={`${fieldClass} text-center text-2xl tracking-[0.3em]`}
        />
      </div>

      <button type="submit" disabled={isPending} className={primaryButtonClass}>
        {isPending ? "Проверяем…" : "Подтвердить"}
      </button>
    </form>
  );
}

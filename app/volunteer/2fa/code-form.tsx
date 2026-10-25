"use client";

import { useActionState } from "react";
import { verifyCode } from "@/app/volunteer/2fa/actions";

export function CodeForm({ factorId }: { factorId: string }) {
  const [state, formAction] = useActionState(verifyCode, undefined);

  return (
    <form action={formAction}>
      <p role="alert">{state?.error}</p>

      <input type="hidden" name="factorId" value={factorId} />

      <label htmlFor="code">Код из приложения</label>
      <input
        id="code"
        name="code"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        required
      />

      <button type="submit">Подтвердить</button>
    </form>
  );
}

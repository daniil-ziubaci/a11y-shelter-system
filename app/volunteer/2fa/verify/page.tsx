import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CodeForm } from "@/app/volunteer/2fa/code-form";

export const metadata = {
  title: "Подтверждение входа",
  robots: { index: false },
};

export default async function VerifyPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.mfa.listFactors();
  const factor = data?.totp[0];
  if (!factor) {
    redirect("/volunteer/2fa");
  }

  return (
    <main>
      <h1>Подтверждение входа</h1>
      <p>Введите шестизначный код из приложения-аутентификатора.</p>
      <CodeForm factorId={factor.id} />
    </main>
  );
}

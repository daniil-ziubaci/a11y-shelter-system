import { redirect } from "next/navigation";
import { AuthPage } from "@/components/AuthPage";
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
    <AuthPage hasHeader title="Подтверждение входа">
      <p className="text-(--muted)">
        Введите шестизначный код из приложения-аутентификатора.
      </p>
      <CodeForm factorId={factor.id} />
    </AuthPage>
  );
}

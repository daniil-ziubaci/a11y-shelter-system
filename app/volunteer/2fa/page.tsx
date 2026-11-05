import { AuthPage } from "@/components/AuthPage";
import { SetupFlow } from "@/app/volunteer/2fa/setup-flow";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Настройка двухфакторного входа",
  robots: { index: false },
};

export default async function TwoFactorSetupPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.mfa.listFactors();
  const isEnabled = (data?.totp.length ?? 0) > 0;
  return (
    <AuthPage hasHeader title="Настройка двухфакторного входа">
      {isEnabled ? (
        <p className="text-center">Двухфакторный вход уже настроен.</p>
      ) : (
        <>
          <div className="flex flex-col gap-2 text-(--muted)">
            <p>
              Чтобы войти в панель приюта, нужен пароль и короткий код из
              приложения. Так посторонний не попадёт в панель, даже если узнает
              ваш пароль.
            </p>
            <p>
              Установите на телефон бесплатное приложение Google Authenticator,
              нажмите «Начать настройку» и наведите камеру приложения на
              QR-код.
            </p>
          </div>
          <SetupFlow />
        </>
      )}
    </AuthPage>
  );
}

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
    <main>
      <h1>Настройка двухфакторного входа</h1>
      {isEnabled ? (
        <p>Двухфакторный вход уже настроен.</p>
      ) : (
        <>
          <p>
            Установите на телефон любое приложение для одноразовых кодов (TOTP).
            Нажмите «Начать настройку», отсканируйте QR-код или введите ключ
            вручную и затем введите шестизначный код из приложения.
          </p>
          <SetupFlow />
        </>
      )}
    </main>
  );
}

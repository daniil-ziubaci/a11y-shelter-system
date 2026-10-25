import { SetupFlow } from "@/app/volunteer/2fa/setup-flow";

export const metadata = {
  title: "Настройка двухфакторного входа",
  robots: { index: false },
};

export default function TwoFactorSetupPage() {
  return (
    <main>
      <h1>Настройка двухфакторного входа</h1>
      <p>
        Установите на телефон любое приложение для одноразовых кодов (TOTP).
        Нажмите «Начать настройку», отсканируйте QR-код или введите ключ вручную
        и затем введите шестизначный код из приложения.
      </p>
      <SetupFlow />
    </main>
  );
}

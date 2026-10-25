import { LoginForm } from "@/app/login/login-form";

export const metadata = {
  title: "Вход для волонтёров",
  robots: { index: false },
};

export default function LoginPage() {
  return (
    <main>
      <h1>Вход для волонтёров</h1>
      <LoginForm />
    </main>
  );
}

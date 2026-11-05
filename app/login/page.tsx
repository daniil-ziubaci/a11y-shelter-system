import Link from "next/link";
import { AuthPage } from "@/components/AuthPage";
import { LoginForm } from "@/app/login/login-form";
import { errorClass } from "@/lib/formClasses";

export const metadata = {
  title: "Вход для волонтёров",
  robots: { index: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <AuthPage title="Вход для волонтёров">
      {error === "invite" && (
        <p role="alert" className={errorClass}>
          Ссылка приглашения устарела или уже использована. Попросите
          координатора отправить новую.
        </p>
      )}
      <LoginForm />
      <Link
        href="/ru/privacy"
        className="flex h-10 items-center justify-center text-(--muted) underline"
      >
        Политика конфиденциальности
      </Link>
    </AuthPage>
  );
}

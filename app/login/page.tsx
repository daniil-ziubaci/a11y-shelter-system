import { LoginForm } from "@/app/login/login-form";

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
    <main>
      <h1>Вход для волонтёров</h1>
      {error === "invite" && (
        <p role="alert">
          Ссылка приглашения устарела или уже использована. Попросите
          координатора отправить новую.
        </p>
      )}
      <LoginForm />
    </main>
  );
}

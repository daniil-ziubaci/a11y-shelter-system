import { SetPasswordForm } from "@/app/auth/set-password/set-password-form";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Задайте пароль",
  robots: { index: false },
};

export default async function SetPasswordPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    redirect("/login");
  }

  return (
    <main>
      <h1>Задайте пароль</h1>
      <SetPasswordForm />
    </main>
  );
}

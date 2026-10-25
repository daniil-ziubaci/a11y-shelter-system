import { logout } from "@/app/volunteer/actions";

export const metadata = {
  title: "Панель волонтёра",
  robots: { index: false },
};

export default function VolunteerPage() {
  return (
    <main>
      <h1>Панель волонтёра</h1>
      <form action={logout}>
        <button type="submit">Выйти</button>
      </form>
    </main>
  );
}

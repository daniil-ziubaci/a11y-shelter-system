export const metadata = {
  title: "Вход для волонтёров",
  robots: { index: false },
};

export default function LoginPage() {
  return (
    <main>
      <h1>Вход для волонтёров</h1>
      <form>
        <label htmlFor="email">Почта</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />

        <label htmlFor="password">Пароль</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />

        <button type="submit">Войти</button>
      </form>
    </main>
  );
}

import { expect, test } from "@playwright/test";
import { EMAIL, PASSWORD, SECRET, signIn } from "./support";

const READ_ONLY = ["/api/health", "/api/cron/translate", "/robots.txt", "/sitemap.xml"];

test.skip(({ viewport }) => (viewport?.width ?? 0) < 900, "methods do not depend on the screen");

test("read-only routes answer 405 with Allow to other methods", async ({ request, baseURL }) => {
  const origin = new URL(baseURL ?? "").origin;
  for (const path of READ_ONLY) {
    for (const method of ["GET", "HEAD"]) {
      const response = await request.fetch(path, { method, maxRedirects: 0 });
      expect(response.status(), `${method} ${path}`).not.toBe(405);
    }
    for (const method of ["POST", "PUT", "PATCH", "DELETE"]) {
      const response = await request.fetch(path, { method, headers: { origin }, maxRedirects: 0 });
      expect(response.status(), `${method} ${path}`).toBe(405);
      expect(response.headers()["allow"], `${method} ${path}`).toBe("GET, HEAD");
    }
  }
  for (const method of ["HEAD", "POST", "PUT", "DELETE"]) {
    const response = await request.fetch("/auth/confirm", { method, headers: { origin }, maxRedirects: 0 });
    expect(response.status(), `${method} /auth/confirm`).toBe(405);
    expect(response.headers()["allow"]).toBe("GET");
  }
});

test("only POST signs out; other methods keep the session", async ({ page }) => {
  test.skip(!EMAIL || !PASSWORD || !SECRET, "E2E_EMAIL, E2E_PASSWORD and E2E_TOTP_SECRET are not set");
  await signIn(page);
  await page.goto("/volunteer/logout");
  await expect(page).toHaveURL(/\/volunteer$/);
  await expect(page.getByRole("heading", { level: 1, name: "Животные приюта" })).toBeVisible();
  for (const method of ["PUT", "PATCH", "DELETE"]) {
    const answer = await page.evaluate(async (verb) => {
      const response = await fetch("/volunteer/logout", { method: verb, redirect: "manual" });
      return { status: response.status, allow: response.headers.get("allow") };
    }, method);
    expect(answer, method).toEqual({ status: 405, allow: "POST" });
  }
  await page.goto("/volunteer/projects");
  await expect(page).toHaveURL(/\/volunteer\/projects$/);
  await page.getByText("Аккаунт").click();
  await page.getByRole("button", { name: "Выйти" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/volunteer");
  await expect(page).toHaveURL(/\/login$/);
});

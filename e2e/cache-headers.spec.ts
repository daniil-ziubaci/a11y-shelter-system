import { expect, test } from "@playwright/test";

test("the language redirect on / is never cached and varies by language", async ({ request }) => {
  for (const [language, target] of [
    ["ru-RU,ru;q=0.9", "/ru"],
    ["ro-RO,ro;q=0.9", "/ro"],
    ["en-US,en;q=0.9", "/en"],
  ]) {
    const response = await request.get("/", { headers: { "Accept-Language": language }, maxRedirects: 0 });
    expect(response.status()).toBe(307);
    expect(response.headers()["location"]).toBe(target);
    expect(response.headers()["cache-control"]).toBe("no-store");
    expect(response.headers()["vary"]).toContain("Accept-Language");
    expect(response.headers()["cloudflare-cdn-cache-control"]).toBe("no-store");
  }
});

test("the panel, sign-in, auth and API are never stored", async ({ request }) => {
  for (const path of ["/login", "/volunteer", "/volunteer/needs", "/auth/set-password", "/auth/confirm", "/api/health", "/api/cron/translate"]) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.headers()["cache-control"], path).toBe("no-store");
    expect(response.headers()["cloudflare-cdn-cache-control"], path).toBe("no-store");
  }
});

test("public pages are cached for a minute under the public tag", async ({ request }) => {
  for (const path of ["/ru", "/ro/catalog", "/en/needs", "/ru/projects", "/ru/about", "/ru/privacy"]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
    expect(response.headers()["cloudflare-cdn-cache-control"], path).toBe("public, max-age=60, stale-while-revalidate=60");
    expect(response.headers()["cache-tag"], path).toContain("public");
    expect(response.headers()["set-cookie"], path).toBeUndefined();
  }
});

test("pages forbid framing and content sniffing", async ({ request }) => {
  for (const path of ["/", "/ru", "/ru/catalog", "/login", "/volunteer", "/api/health", "/ru/no-such-page"]) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.headers()["x-content-type-options"], path).toBe("nosniff");
    expect(response.headers()["x-frame-options"], path).toBe("DENY");
    expect(response.headers()["content-security-policy"], path).toBe("frame-ancestors 'none'");
    expect(response.headers()["referrer-policy"], path).toBe("strict-origin-when-cross-origin");
  }
});

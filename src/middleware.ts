import { defineMiddleware } from "astro:middleware";
import { ALLOW_INDEXING } from "astro:env/server";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n";
import { LEGACY_SLUG, PUBLIC_SECTIONS } from "@/lib/routes";
import { createSessionClient } from "@/lib/supabase";

const SESSION_PATHS = /^\/(volunteer|login|auth)(\/|$)/;
const TWO_FACTOR_PATHS = new Set(["/volunteer/2fa", "/volunteer/2fa/verify"]);

function redirect(location: string, status: 301 | 302 | 303 | 307 | 308) {
  return new Response(null, { status, headers: { Location: location } });
}

function preferredLocale(header: string | null): string {
  for (const part of (header ?? "").split(",")) {
    const code = part.split(";")[0].trim().toLowerCase().split("-")[0];
    if (isLocale(code)) return code;
  }
  return DEFAULT_LOCALE;
}

function legacyRedirect(url: URL): Response | null {
  const path = url.pathname;
  if (path === "/") {
    return null;
  }
  if (path.endsWith("/")) {
    return redirect(path.replace(/\/+$/, "") + url.search, 308);
  }
  const segments = path.split("/").slice(1);
  const [first, second, third, ...rest] = segments;
  if (isLocale(first) && second === "shelter" && third === LEGACY_SLUG) {
    const tail = rest.length > 0 ? `/${rest.join("/")}` : "";
    return redirect(`/${first}${tail}${url.search}`, 301);
  }
  if (first === "shelter" && second === LEGACY_SLUG) {
    const tail = [third, ...rest].filter(Boolean).join("/");
    return redirect(`/${DEFAULT_LOCALE}${tail ? `/${tail}` : ""}${url.search}`, 301);
  }
  if (PUBLIC_SECTIONS.includes(first)) {
    return redirect(`/${DEFAULT_LOCALE}${path}${url.search}`, 307);
  }
  return null;
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, request } = context;
  const path = url.pathname;

  if (path === "/") {
    const response = redirect(`/${preferredLocale(request.headers.get("accept-language"))}`, 307);
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("Vary", "Accept-Language");
    return withHeaders(response, new Headers());
  }

  const legacy = legacyRedirect(url);
  if (legacy) {
    return legacy;
  }

  const supabaseHeaders = new Headers();
  if (SESSION_PATHS.test(path)) {
    context.locals.supabase = createSessionClient(request, context.cookies, supabaseHeaders);
    const { data } = await context.locals.supabase.auth.getClaims();
    const claims = data?.claims ?? null;
    context.locals.claims = claims
      ? { sub: claims.sub, aal: typeof claims.aal === "string" ? claims.aal : undefined, email: typeof claims.email === "string" ? claims.email : undefined }
      : null;

    if (path.startsWith("/volunteer")) {
      if (!context.locals.claims) {
        return withHeaders(context.redirect("/login", 303), supabaseHeaders);
      }
      if (context.locals.claims.aal !== "aal2" && !TWO_FACTOR_PATHS.has(path)) {
        const { data: factors } = await context.locals.supabase.auth.mfa.listFactors();
        const target = (factors?.totp.length ?? 0) > 0 ? "/volunteer/2fa/verify" : "/volunteer/2fa";
        return withHeaders(context.redirect(target, 303), supabaseHeaders);
      }
    }
  } else {
    context.locals.claims = null;
  }

  const response = await next();
  return withHeaders(response, supabaseHeaders);
});

function withHeaders(response: Response, extra: Headers): Response {
  let result = response;
  const set = (name: string, value: string) => {
    try {
      result.headers.set(name, value);
    } catch {
      result = new Response(result.body, result);
      result.headers.set(name, value);
    }
  };
  for (const [name, value] of extra) {
    set(name, value);
  }
  if (ALLOW_INDEXING !== "true") {
    set("X-Robots-Tag", "noindex, nofollow");
  }
  return result;
}

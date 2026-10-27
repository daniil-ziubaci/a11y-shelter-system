import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

const handleI18n = createMiddleware(routing);

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/volunteer")) {
    return await updateSession(request);
  }

  return handleI18n(request);
}

export const config = {
  matcher: [
    "/volunteer/:path*",
    "/((?!api|auth|login|volunteer|_next|_vercel|.*\\..*).*)",
  ],
};

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  if (!tokenHash || type !== "invite") {
    return NextResponse.redirect(new URL("/login?error=invite", request.url));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    type: "invite",
    token_hash: tokenHash,
  });

  if (error) {
    return NextResponse.redirect(new URL("/login?error=invite", request.url));
  }

  return NextResponse.redirect(new URL("/auth/set-password", request.url));
}

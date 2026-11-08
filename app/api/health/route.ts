import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const { error } = await supabase
    .from("shelters")
    .select("id")
    .limit(1)
    .abortSignal(AbortSignal.timeout(8000));

  if (error) {
    return Response.json(
      { status: "error" },
      { status: 503, headers: noStore },
    );
  }

  return Response.json({ status: "ok" }, { headers: noStore });
}

import { PET_STATUS_REMOVED } from "@/lib/petStatuses";
import { makePreviewJpeg } from "@/lib/previewImage";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("pets")
    .select("photo_url")
    .eq("id", id)
    .neq("status", PET_STATUS_REMOVED)
    .maybeSingle();

  const storageOrigin = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).origin;
  if (!data || new URL(data.photo_url).origin !== storageOrigin) {
    return new Response(null, { status: 404 });
  }

  const photo = await fetch(data.photo_url);
  if (!photo.ok) {
    return new Response(null, { status: 404 });
  }

  const jpeg = await makePreviewJpeg(Buffer.from(await photo.arrayBuffer()));
  return new Response(new Uint8Array(jpeg), {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}

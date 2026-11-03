import { makePreviewJpeg } from "@/lib/previewImage";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("shelters")
    .select("photo_path, photo_alt")
    .eq("slug", slug)
    .maybeSingle();

  if (!data?.photo_path || !data.photo_alt) {
    return new Response(null, { status: 404 });
  }

  const { publicUrl } = supabase.storage
    .from("pet-photos")
    .getPublicUrl(data.photo_path).data;
  const photo = await fetch(publicUrl);
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

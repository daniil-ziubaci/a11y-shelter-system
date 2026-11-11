import { cache } from "react";
import type { GalleryPhoto } from "@/components/ShelterGallery";
import { createClient } from "@/lib/supabase/server";

export const getShelterPhotos = cache(
  async (shelterId: string, locale: string): Promise<GalleryPhoto[]> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("shelter_photos")
      .select("id, path, thumb_path, alt, alt_en, alt_ro")
      .eq("shelter_id", shelterId)
      .order("position");

    if (error) {
      console.error("Не удалось загрузить фотографии приюта.", error.message);
      return [];
    }

    return data.map((row) => ({
      id: row.id,
      src: row.path,
      thumbSrc: row.thumb_path,
      alt:
        (locale === "en" ? row.alt_en : locale === "ro" ? row.alt_ro : null) ??
        row.alt,
    }));
  },
);

import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";

export default async function LocaleHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shelters")
    .select("slug")
    .limit(2);

  if (error) {
    throw new Error("Не удалось загрузить приюты из базы.");
  }
  if (data.length !== 1) {
    notFound();
  }
  redirect(`/${locale}/shelter/${data[0].slug}`);
}

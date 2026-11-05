"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PET_STATUS_TREATMENT, PET_STATUSES } from "@/lib/petStatuses";
import { revalidatePath } from "next/cache";

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  redirect("/login");
}

export async function setPetStatus(formData: FormData) {
  const petId = formData.get("petId");
  const status = formData.get("status");

  if (typeof petId !== "string" || typeof status !== "string") {
    return;
  }
  if (!(PET_STATUSES as readonly string[]).includes(status)) {
    return;
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) {
    return;
  }

  if (status === PET_STATUS_TREATMENT) {
    const { data: current } = await supabase
      .from("pets")
      .select("status")
      .eq("id", petId)
      .maybeSingle();
    if (current && current.status !== PET_STATUS_TREATMENT) {
      redirect(`/volunteer/pets/${encodeURIComponent(petId)}/edit`);
    }
  }

  const { error } = await supabase
    .from("pets")
    .update({ status })
    .eq("id", petId);

  if (error) {
    throw new Error("Не удалось изменить статус.");
  }

  revalidatePath("/volunteer");
}

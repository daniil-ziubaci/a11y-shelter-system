"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PET_STATUSES } from "@/lib/petStatuses";
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
  const { error } = await supabase
    .from("pets")
    .update({ status })
    .eq("id", petId);

  if (error) {
    throw new Error("Не удалось изменить статус.");
  }

  revalidatePath("/volunteer");
}

export async function setPetTreatment(formData: FormData) {
  const petId = formData.get("petId");
  if (typeof petId !== "string") {
    return;
  }
  const needsTreatment = formData.get("needsTreatment") === "on";
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) {
    return;
  }
  const { error } = await supabase
    .from("pets")
    .update({
      needs_treatment_since: needsTreatment ? new Date().toISOString() : null,
    })
    .eq("id", petId);

  if (error) {
    throw new Error("Не удалось изменить отметку.");
  }
  revalidatePath("/volunteer");
}

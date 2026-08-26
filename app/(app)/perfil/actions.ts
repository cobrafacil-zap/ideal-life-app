"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function updateGoals(input: {
  water_goal_ml: number;
  cardio_weekly_goal_min: number;
  workout_weekly_goal: number;
  calorie_goal: number | null;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const { error } = await supabase.from("profiles").update(input).eq("id", user.id);
  if (error) throw new Error(error.message);

  revalidatePath("/perfil");
  revalidatePath("/hoje");
}

export async function updateProfile(input: { full_name: string }) {
  return updateProfileName(input.full_name);
}

/**
 * Server action exposto ao form inline de perfil. Encapsula
 * a atualização de nome + user_metadata num único ponto para
 * evitar duplicação e facilitar revogação futura.
 */
export async function updateProfileName(fullName: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const cleanName = fullName.trim().slice(0, 80);

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: cleanName || null })
    .eq("id", user.id);
  if (error) throw new Error(error.message);

  // também atualiza o user_metadata para o greeting do "Hoje"
  await supabase.auth.updateUser({
    data: { full_name: cleanName },
  });

  revalidatePath("/perfil");
  revalidatePath("/hoje");
}

export async function signOut() {
  const supabase = createClient();
  try {
    await supabase.auth.signOut();
  } catch (err) {
    // Mesmo que o signOut falhe no servidor, garantimos o redirect
    // para que o usuário não fique preso em uma página autenticada.
    console.error("signOut failed:", err);
  }
  redirect("/login");
}

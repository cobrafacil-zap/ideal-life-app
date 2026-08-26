"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { uploadAvatar } from "@/lib/storage";

export async function updateGoals(input: {
  water_goal_ml: number;
  cardio_weekly_goal_min: number;
  workout_weekly_goal_hours: number | null;
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

/**
 * Server action específico pra aplicar a sugestão de meta calórica
 * sem precisar carregar/preservar os outros goals.
 * Mantém o `updateGoals` original intacto (form completo).
 */
export async function updateCalorieGoal(calorieGoal: number) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  if (!Number.isFinite(calorieGoal) || calorieGoal < 800 || calorieGoal > 6000) {
    throw new Error("Meta calórica deve estar entre 800 e 6.000 kcal.");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ calorie_goal: Math.round(calorieGoal) })
    .eq("id", user.id);
  if (error) throw new Error(error.message);

  revalidatePath("/perfil");
  revalidatePath("/alimentacao");
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

const AVATAR_MIMES = ["image/png", "image/jpeg", "image/webp"];
const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

/**
 * Server Action: recebe FormData com `avatar: File`, valida tipo/tamanho,
 * sobe para o bucket `avatars` (sobrescrevendo o anterior) e grava o
 * `storage_path` em `profiles.avatar_url`.
 */
export async function uploadAvatarAction(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Selecione uma imagem primeiro.");
  }
  if (!AVATAR_MIMES.includes(file.type)) {
    throw new Error("Use PNG, JPG ou WebP.");
  }
  if (file.size > AVATAR_MAX_BYTES) {
    throw new Error("Arquivo maior que 2 MB.");
  }

  const path = await uploadAvatar(supabase, user.id, file, file.type);

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: path })
    .eq("id", user.id);
  if (error) throw new Error(error.message);

  revalidatePath("/perfil");
  revalidatePath("/hoje");
}

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

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

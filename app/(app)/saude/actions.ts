"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function logWeight(weightKg: number) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const { error } = await supabase.from("body_measurements").insert({
    user_id: user.id,
    weight_kg: weightKg,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/saude");
  revalidatePath("/hoje");
}

export async function updatePhysicalProfile(input: {
  height_cm: number;
  weight_goal_kg: number;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const { error } = await supabase
    .from("profiles")
    .update({ height_cm: input.height_cm, weight_goal_kg: input.weight_goal_kg })
    .eq("id", user.id);
  if (error) throw new Error(error.message);

  revalidatePath("/saude");
}

export async function logCardio(input: {
  type: string;
  duration_min: number;
  distance_km?: number;
  intensity?: string;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const { error } = await supabase.from("cardio_sessions").insert({
    user_id: user.id,
    ...input,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/saude");
  revalidatePath("/hoje");
}

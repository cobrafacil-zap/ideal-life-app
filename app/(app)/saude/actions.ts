"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function parseNumber(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(String(value).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export async function logWeight(weightKg: number) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  if (!Number.isFinite(weightKg) || weightKg < 20 || weightKg > 400) {
    throw new Error("Peso inválido.");
  }

  const { error } = await supabase.from("body_measurements").insert({
    user_id: user.id,
    weight_kg: weightKg,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/saude");
  revalidatePath("/hoje");
}

export async function updatePhysicalProfile(input: {
  height_cm: number | string | null;
  weight_goal_kg: number | string | null;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const { error } = await supabase
    .from("profiles")
    .update({
      height_cm: parseNumber(input.height_cm),
      weight_goal_kg: parseNumber(input.weight_goal_kg),
    })
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

  if (!input.type || !input.duration_min || input.duration_min <= 0) {
    throw new Error("Dados de cardio inválidos.");
  }

  const { error } = await supabase.from("cardio_sessions").insert({
    user_id: user.id,
    type: input.type,
    duration_min: input.duration_min,
    distance_km: input.distance_km ?? null,
    intensity: input.intensity ?? null,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/saude");
  revalidatePath("/hoje");
}

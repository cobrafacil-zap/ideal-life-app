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
  birth_date?: string | null;
  biological_sex?: "feminino" | "masculino" | "nao_informado" | null;
  activity_level?: "sedentario" | "leve" | "moderado" | "ativo" | "muito_ativo" | null;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const update: Record<string, unknown> = {
    height_cm: parseNumber(input.height_cm),
    weight_goal_kg: parseNumber(input.weight_goal_kg),
  };
  if (input.birth_date !== undefined) update.birth_date = input.birth_date || null;
  if (input.biological_sex !== undefined) update.biological_sex = input.biological_sex;
  if (input.activity_level !== undefined) update.activity_level = input.activity_level;

  const { error } = await supabase
    .from("profiles")
    .update(update)
    .eq("id", user.id);
  if (error) throw new Error(error.message);

  // Phase 5: recalcula a meta semanal de gasto calórico.
  const { recomputeAndStoreWeeklyBurn } = await import("@/lib/goals");
  void recomputeAndStoreWeeklyBurn(supabase, user.id);

  revalidatePath("/saude");
  revalidatePath("/alimentacao");
  revalidatePath("/hoje");
}

export async function logCardio(input: {
  type: string;
  duration_h: number;
  distance_km?: number;
  intensity?: string;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const hours = Number(input.duration_h);
  if (!input.type || !Number.isFinite(hours) || hours <= 0 || hours > 24) {
    throw new Error("Duração inválida (use horas, ex.: 0.5 = 30 min).");
  }
  const durationMin = Math.round(hours * 60);

  // Pega o peso mais recente para calcular kcal queimadas.
  const { data: weightRow } = await supabase
    .from("body_measurements")
    .select("weight_kg")
    .eq("user_id", user.id)
    .order("measured_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { cardioKcal } = await import("@/lib/cardio");
  const kcal = cardioKcal({
    type: input.type,
    durationH: hours,
    weightKg: weightRow?.weight_kg ?? null,
    intensity: input.intensity ?? null,
  });

  const { error } = await supabase.from("cardio_sessions").insert({
    user_id: user.id,
    type: input.type,
    duration_h: hours,
    duration_min: durationMin,
    kcal_burned: kcal,
    distance_km: input.distance_km ?? null,
    intensity: input.intensity ?? null,
  });
  if (error) throw new Error(error.message);

  // Phase 5: recalcula a meta semanal a partir do peso atual vs meta.
  const { recomputeAndStoreWeeklyBurn } = await import("@/lib/goals");
  void recomputeAndStoreWeeklyBurn(supabase, user.id);

  revalidatePath("/saude");
  revalidatePath("/hoje");
}

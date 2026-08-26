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
  weight_goal_start_kg?: number | string | null;
  weekly_rate_kg?: number | string | null;
  goal_type?: "perder" | "manter" | "ganhar" | "recompor" | null;
  birth_date?: string | null;
  biological_sex?: "feminino" | "masculino" | "nao_informado" | null;
  activity_level?: "sedentario" | "leve" | "moderado" | "ativo" | "muito_ativo" | null;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  // Sanitização da altura (defesa contra o bug "metros em vez de cm").
  const rawHeight = parseNumber(input.height_cm);
  const safeHeight =
    rawHeight === null
      ? null
      : rawHeight < 3
        ? Math.round(rawHeight * 100 * 10) / 10 // converte m → cm
        : rawHeight < 100 || rawHeight > 250
          ? null
          : rawHeight;

  // Lê o estado atual para detectar mudança de goal_type (precisa capturar
  // o peso inicial quando o usuário ativa 'perder' pela primeira vez).
  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("goal_type, weight_goal_start_kg")
    .eq("id", user.id)
    .maybeSingle();

  const prevGoalType = (currentProfile?.goal_type ?? "manter") as
    | "perder"
    | "manter"
    | "ganhar"
    | "recompor";
  const nextGoalType = input.goal_type ?? prevGoalType;

  const update: Record<string, unknown> = {
    height_cm: safeHeight,
    weight_goal_kg: parseNumber(input.weight_goal_kg),
    goal_type: nextGoalType,
  };

  // goal_started_at: carimba quando o objetivo muda.
  if (nextGoalType !== prevGoalType) {
    update.goal_started_at = new Date().toISOString();
  }

  // Peso inicial: obrigatório ao entrar em 'perder'; limpa em outros modos.
  if (nextGoalType === "perder") {
    const start =
      input.weight_goal_start_kg !== undefined
        ? parseNumber(input.weight_goal_start_kg)
        : (currentProfile?.weight_goal_start_kg ?? null);
    if (start === null) {
      throw new Error(
        "Informe o peso inicial para começar uma meta de perda.",
      );
    }
    update.weight_goal_start_kg = start;
  } else {
    update.weight_goal_start_kg = null;
  }

  // Taxa semanal: só persiste em 'perder'.
  if (nextGoalType === "perder") {
    update.weekly_rate_kg = parseNumber(input.weekly_rate_kg) ?? 0.5;
  } else {
    update.weekly_rate_kg = null;
  }

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

/**
 * Atualiza apenas os campos de peso da meta (inicial + meta).
 * Wrapper leve do `updatePhysicalProfile` — não mexe em altura, sexo,
 * atividade, etc. Usado pelo `GoalProgressCard` para que os 3 inputs
 * do card "Seus objetivos" salvem de forma independente.
 *
 * Respeita a regra existente: se `goal_type !== "perder"`, força
 * `weight_goal_start_kg = null` (não faz sentido como âncora fora de
 * uma meta de perda ativa).
 */
export async function updateGoalWeights(input: {
  weight_goal_kg: number | string | null;
  weight_goal_start_kg: number | string | null;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  // Validação local (defesa em profundidade; o CHECK no DB também barra).
  const goal = parseNumber(input.weight_goal_kg);
  if (goal !== null && (goal < 20 || goal > 400)) {
    throw new Error("Meta de peso deve estar entre 20 e 400 kg.");
  }

  const start = parseNumber(input.weight_goal_start_kg);
  if (start !== null && (start < 20 || start > 400)) {
    throw new Error("Peso inicial deve estar entre 20 e 400 kg.");
  }

  // Lê o goal_type atual — se não for "perder", zera o peso inicial.
  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("goal_type")
    .eq("id", user.id)
    .maybeSingle();

  const goalType = (currentProfile?.goal_type ?? "manter") as
    | "perder"
    | "manter"
    | "ganhar"
    | "recompor";

  const update: Record<string, unknown> = {
    weight_goal_kg: goal,
    weight_goal_start_kg: goalType === "perder" ? start : null,
  };

  const { error } = await supabase
    .from("profiles")
    .update(update)
    .eq("id", user.id);
  if (error) throw new Error(error.message);

  // Phase 5: recalcula a meta semanal de gasto calórico (afeta o card "Meta semanal").
  const { recomputeAndStoreWeeklyBurn } = await import("@/lib/goals");
  void recomputeAndStoreWeeklyBurn(supabase, user.id);

  revalidatePath("/saude");
  revalidatePath("/hoje");
}

/**
 * Server action: registra uma sessão de musculação com duração em horas.
 * Usada pelo módulo de treino quando a UI "Iniciar treino" existir.
 * A duração NÃO usa MET (regra diferente de cardio).
 */
export async function logWorkout(input: {
  workout_name: string;
  duration_h: number;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const name = String(input.workout_name ?? "").trim().slice(0, 80);
  if (!name) throw new Error("Informe o nome do treino.");

  const hours = Number(input.duration_h);
  if (!Number.isFinite(hours) || hours <= 0 || hours > 12) {
    throw new Error("Duração inválida (use horas, ex.: 1,5 = 1h30).");
  }
  const durationMin = Math.round(hours * 60);

  const { error } = await supabase.from("workout_sessions").insert({
    user_id: user.id,
    workout_name: name,
    duration_h: hours,
    duration_min: durationMin,
    finished_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);

  revalidatePath("/saude");
  revalidatePath("/hoje");
}

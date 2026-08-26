import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Regras para gerar metas semanais de gasto calórico.
 *
 * Premissa: 1 kg de gordura ≈ 7700 kcal.
 * Para perder `weeklyRateKgPerWeek` kg/semana (default 0.5), o déficit
 * semanal deve ser `weeklyRateKgPerWeek * 7700` kcal.
 *
 * Só faz sentido clínico para `goalType = 'perder'`. Para outros objetivos
 * (manter, ganhar, recompor) retornamos 0 — não há "meta de queima".
 */

const KCAL_PER_KG = 7700;
const DEFAULT_WEEKLY_RATE = 0.5;

export function computeWeeklyBurnGoalKcal(input: {
  currentWeightKg?: number | null;
  goalWeightKg?: number | null;
  goalType?: "perder" | "manter" | "ganhar" | "recompor" | null;
  weeklyRateKgPerWeek?: number | null;
}): number {
  if (input.goalType !== "perder") return 0;
  if (!input.currentWeightKg || !input.goalWeightKg) return 0;
  const delta = input.currentWeightKg - input.goalWeightKg;
  if (delta <= 0) return 0;
  const rate = input.weeklyRateKgPerWeek ?? DEFAULT_WEEKLY_RATE;
  if (rate <= 0) return 0;
  return Math.round(rate * KCAL_PER_KG);
}

/**
 * Recalcula e grava `profiles.weekly_burn_goal_kcal` a partir do último
 * peso registrado, meta, goal_type e taxa semanal. Best-effort — não propaga erro.
 */
export async function recomputeAndStoreWeeklyBurn(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<void> {
  try {
    const [{ data: profile }, { data: lastWeight }] = await Promise.all([
      supabase
        .from("profiles")
        .select("weight_goal_kg, goal_type, weekly_rate_kg")
        .eq("id", userId)
        .maybeSingle(),
      supabase
        .from("body_measurements")
        .select("weight_kg")
        .eq("user_id", userId)
        .order("measured_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const goal = computeWeeklyBurnGoalKcal({
      currentWeightKg: lastWeight?.weight_kg ?? null,
      goalWeightKg: profile?.weight_goal_kg ?? null,
      goalType: (profile?.goal_type as
        | "perder"
        | "manter"
        | "ganhar"
        | "recompor"
        | null) ?? null,
      weeklyRateKgPerWeek: profile?.weekly_rate_kg ?? null,
    });

    await supabase
      .from("profiles")
      .update({ weekly_burn_goal_kcal: goal })
      .eq("id", userId);
  } catch (err) {
    // não bloqueia a operação principal (log/cardi/perfil) se falhar
    console.error("recomputeAndStoreWeeklyBurn:", err);
  }
}

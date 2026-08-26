import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Regras para gerar metas semanais de gasto calórico.
 *
 * Premissa: 1 kg de gordura ≈ 7700 kcal.
 * Para perder `weeklyRateKgPerWeek` kg/semana (default 0.5), o déficit
 * semanal deve ser `weeklyRateKgPerWeek * 7700` kcal.
 *
 * Se `deltaKg <= 0` (peso atual ≤ meta), retorna 0 (sem meta de queima).
 */

const KCAL_PER_KG = 7700;
const DEFAULT_WEEKLY_RATE = 0.5;

export function computeWeeklyBurnGoalKcal(input: {
  currentWeightKg: number | null | undefined;
  goalWeightKg: number | null | undefined;
  weeklyRateKgPerWeek?: number;
}): number {
  if (!input.currentWeightKg || !input.goalWeightKg) return 0;
  const delta = input.currentWeightKg - input.goalWeightKg;
  if (delta <= 0) return 0;
  const rate = input.weeklyRateKgPerWeek ?? DEFAULT_WEEKLY_RATE;
  if (rate <= 0) return 0;
  return Math.round((delta * KCAL_PER_KG * rate) / delta);
  // simplifica para: rate * KCAL_PER_KG  (ex.: 0.5 × 7700 = 3850)
}

/**
 * Recalcula e grava `profiles.weekly_burn_goal_kcal` a partir do último
 * peso registrado e da meta de peso. Best-effort — não propaga erro.
 */
export async function recomputeAndStoreWeeklyBurn(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<void> {
  try {
    const [{ data: profile }, { data: lastWeight }] = await Promise.all([
      supabase
        .from("profiles")
        .select("weight_goal_kg")
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

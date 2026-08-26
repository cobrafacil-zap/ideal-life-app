"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { todayBR } from "@/lib/datetime";

export async function saveCheckin(input: {
  energy: number;
  mood: number;
  disposition: number;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const today = todayBR();

  const { error } = await supabase.from("daily_checkins").upsert(
    {
      user_id: user.id,
      checkin_date: today,
      energy: input.energy,
      mood: input.mood,
      disposition: input.disposition,
    },
    { onConflict: "user_id,checkin_date" }
  );

  if (error) throw new Error(error.message);

  revalidatePath("/hoje");
}

export async function addWater(amountMl: number) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const today = todayBR();

  const { error } = await supabase.from("water_logs").insert({
    user_id: user.id,
    amount_ml: amountMl,
    log_date: today,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/hoje");
}

/**
 * Persiste o resumo do dia atual ao usuário clicar "Encerrar meu dia".
 *
 * Upsert em `daily_summaries` (PK = user_id + summary_date) — idempotente:
 * se o usuário abrir o modal várias vezes, atualiza em vez de duplicar.
 * Validações leves nos campos (ranges plausíveis).
 */
export async function saveDailySummary(input: {
  kcalConsumed: number;
  waterMl: number;
  cardioMin: number;
  workoutMin: number;
  wellbeingPct: number | null;
  completedCount: number;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const today = todayBR();

  if (input.completedCount < 0 || input.completedCount > 5) {
    throw new Error("completedCount fora do range 0–5.");
  }
  if (input.kcalConsumed < 0 || input.kcalConsumed > 20000) {
    throw new Error("kcalConsumed fora do range plausível.");
  }
  if (input.waterMl < 0 || input.waterMl > 20000) {
    throw new Error("waterMl fora do range plausível.");
  }

  const { error } = await supabase.from("daily_summaries").upsert(
    {
      user_id: user.id,
      summary_date: today,
      completed_count: input.completedCount,
      kcal_consumed: input.kcalConsumed,
      water_ml: input.waterMl,
      cardio_min: input.cardioMin,
      workout_min: input.workoutMin,
      wellbeing_pct: input.wellbeingPct,
      closed_at: new Date().toISOString(),
    },
    { onConflict: "user_id,summary_date" },
  );

  if (error) throw new Error(error.message);

  revalidatePath("/hoje");
}

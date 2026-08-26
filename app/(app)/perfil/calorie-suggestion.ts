import "server-only";
import { createClient } from "@/lib/supabase/server";
import { daysAgoBRISO } from "@/lib/datetime";
import { suggestCalorieGoal } from "@/lib/calorie-suggestion";
import type { CalorieSuggestion } from "@/lib/calorie-suggestion";

/**
 * Coleta os dados necessários e devolve a sugestão de meta calórica
 * para o usuário autenticado. Retorna `null` se não houver peso atual —
 * sem peso não há como dar uma sugestão minimamente útil.
 */
export async function getCalorieSuggestion(): Promise<CalorieSuggestion | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Âncora BR — `meal_date` é DATE (YYYY-MM-DD), comparação direta funciona.
  // Para colunas TIMESTAMPTZ, concatenamos com offset fixo -03:00 pra garantir
  // inclusão do dia no fuso de Brasília (consistente com o resto do projeto).
  const sinceDate = daysAgoBRISO(14);
  const sinceTs = `${sinceDate}T00:00:00-03:00`;

  const [
    { data: profile },
    { data: latestWeight },
    { data: cardio },
    { data: workouts },
    { data: meals },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "height_cm, birth_date, biological_sex, activity_level, weight_goal_kg, goal_type, weekly_rate_kg, calorie_goal",
      )
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("body_measurements")
      .select("weight_kg")
      .eq("user_id", user.id)
      .order("measured_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("cardio_sessions")
      .select("duration_min")
      .eq("user_id", user.id)
      .gte("performed_at", sinceTs),
    supabase
      .from("workout_sessions")
      .select("id, duration_h")
      .eq("user_id", user.id)
      .not("finished_at", "is", null)
      .gte("started_at", sinceTs),
    supabase
      .from("meals")
      .select("meal_date, total_calories")
      .eq("user_id", user.id)
      .gte("meal_date", sinceDate),
  ]);

  // Sem peso não dá pra sugerir — caller decide esconder o card.
  if (!latestWeight?.weight_kg) return null;

  const cardioMinutes14d = (cardio ?? []).reduce(
    (s, c) => s + (c.duration_min ?? 0),
    0,
  );
  const workoutCount14d = (workouts ?? []).length;
  const workoutHours14d = (workouts ?? []).reduce(
    (s, w) => s + (w.duration_h ?? 0),
    0,
  );

  // Média 14d: soma kcal ÷ dias com pelo menos 1 refeição.
  // Exige ≥ 5 dias pra evitar distorção (ex.: 1 dia com 5000 kcal).
  const totalsByDay = new Map<string, number>();
  for (const m of meals ?? []) {
    if (!m.meal_date || m.total_calories == null) continue;
    totalsByDay.set(
      m.meal_date,
      (totalsByDay.get(m.meal_date) ?? 0) + m.total_calories,
    );
  }
  const daysWithData = totalsByDay.size;
  const avgKcal14d =
    daysWithData >= 5
      ? Math.round(
          [...totalsByDay.values()].reduce((a, b) => a + b, 0) / daysWithData,
        )
      : null;

  return suggestCalorieGoal({
    currentWeightKg: latestWeight.weight_kg,
    heightCm: profile?.height_cm ?? null,
    birthDate: profile?.birth_date ?? null,
    biologicalSex: (profile?.biological_sex ?? null) as
      | "feminino"
      | "masculino"
      | "nao_informado"
      | null,
    activityLevel: (profile?.activity_level ?? null) as
      | "sedentario"
      | "leve"
      | "moderado"
      | "ativo"
      | "muito_ativo"
      | null,
    weightGoalKg: profile?.weight_goal_kg ?? null,
    goalType: (profile?.goal_type ?? null) as
      | "perder"
      | "manter"
      | "ganhar"
      | "recompor"
      | null,
    weeklyRateKg: profile?.weekly_rate_kg ?? null,
    cardioMinutes14d,
    workoutHours14d,
    avgKcal14d,
  });
}
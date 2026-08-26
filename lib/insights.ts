/**
 * Geração de insights interpretativos para a Home.
 *
 * Função pura `pickDailyInsight(input)` — recebe todos os dados necessários
 * e devolve o insight mais relevante do dia (primeira regra que casa, em
 * ordem de prioridade). Sem dependência de data/hora (a página passa o
 * contexto já derivado).
 *
 * Cada insight tem:
 *  - `key`: id estável pra usar como key React
 *  - `tone`: 'good' (moss) | 'bad' (ember) | 'neutral' (line) | 'gold' (gold)
 *  - `title`: linha curta (display)
 *  - `body`: parágrafo interpretativo (pode ser null se title já diz tudo)
 */

import { wellBeingAverage, type CheckinLike } from "@/lib/well-being";

export type InsightTone = "good" | "bad" | "neutral" | "gold";

export interface Insight {
  key: string;
  tone: InsightTone;
  title: string;
  body?: string;
}

export interface InsightInput {
  today: CheckinLike | null;
  last: CheckinLike | null;
  waterConsumed: number;
  waterGoal: number;
  waterLastRecord: number | null;
  caloriesToday: number;
  caloriesGoal: number | null;
  cardioMinutes: number;
  cardioGoal: number;
  workoutHoursWeek: number;
  workoutHoursGoal: number;
  workoutsThisWeek: number;
  currentWeight: number | null;
  weightStart: number | null;
  weightGoal: number | null;
  dayComplete: boolean;
}

/**
 * Encontra o pilar (energy/mood/disposition) que mais caiu entre o check-in
 * atual e o anterior. Devolve o nome em PT-BR ou null.
 */
function biggestDrop(
  today: CheckinLike,
  last: CheckinLike,
): "energia" | "humor" | "disposição" | null {
  const pairs: Array<[keyof CheckinLike, "energia" | "humor" | "disposição"]> = [
    ["energy", "energia"],
    ["mood", "humor"],
    ["disposition", "disposição"],
  ];
  let worst: { name: "energia" | "humor" | "disposição"; delta: number } | null =
    null;
  for (const [field, name] of pairs) {
    const a = today[field];
    const b = last[field];
    if (a == null || b == null) continue;
    const delta = a - b;
    if (delta < 0 && (worst == null || delta < worst.delta)) {
      worst = { name, delta };
    }
  }
  return worst?.name ?? null;
}

export function pickDailyInsight(input: InsightInput): Insight | null {
  const todayPct = input.today ? wellBeingAverage(input.today) : null;
  const lastPct = input.last ? wellBeingAverage(input.last) : null;

  // 1. Sem check-in hoje
  if (input.today == null) {
    return {
      key: "no-checkin",
      tone: "neutral",
      title: "Você ainda não fez o check-in de hoje.",
      body: "Reserve 30 segundos para registrar como você está — isso alimenta os insights da Home.",
    };
  }

  // 2. Bem-estar caiu ≥ 10 pp
  if (todayPct != null && lastPct != null && lastPct - todayPct >= 10) {
    const dropPp = Math.round((lastPct - todayPct) * 10) / 10;
    const worst = input.today && input.last ? biggestDrop(input.today, input.last) : null;
    return {
      key: "wellbeing-down",
      tone: "bad",
      title: `Seu bem-estar caiu ${dropPp.toFixed(0)} pontos desde o último check-in.`,
      body: worst
        ? `${worst.charAt(0).toUpperCase() + worst.slice(1)} foi o indicador que mais caiu.`
        : undefined,
    };
  }

  // 3. Bem-estar subiu ≥ 10 pp
  if (todayPct != null && lastPct != null && todayPct - lastPct >= 10) {
    const upPp = Math.round((todayPct - lastPct) * 10) / 10;
    return {
      key: "wellbeing-up",
      tone: "good",
      title: `Seu bem-estar subiu ${upPp.toFixed(0)} pontos desde o último check-in.`,
    };
  }

  // 4. Água hoje muito acima do último registro
  if (
    input.waterLastRecord != null &&
    input.waterLastRecord > 0 &&
    input.waterConsumed > input.waterLastRecord * 1.5 &&
    input.waterConsumed > 0
  ) {
    const faltamL = Math.max(0, input.waterGoal - input.waterConsumed) / 1000;
    return {
      key: "water-up",
      tone: "good",
      title: "Você está bebendo mais água que no último registro.",
      body: `Faltam ${faltamL.toFixed(1).replace(".", ",")} L para sua meta.`,
    };
  }

  // 5. Treinos semana: ritmo alto, faltando 1
  if (
    input.workoutHoursWeek >= input.workoutHoursGoal * 0.6 &&
    input.workoutHoursWeek < input.workoutHoursGoal &&
    input.workoutsThisWeek > 0
  ) {
    const faltamH = (input.workoutHoursGoal - input.workoutHoursWeek).toFixed(1);
    return {
      key: "workout-near",
      tone: "gold",
      title: `Falta ${faltamH.replace(".", ",")} h de treino pra fechar a meta semanal.`,
    };
  }

  // 6. Peso atual abaixo do peso inicial da meta (progresso)
  if (
    input.currentWeight != null &&
    input.weightStart != null &&
    input.weightGoal != null &&
    input.weightStart > input.weightGoal &&
    input.currentWeight < input.weightStart - 1
  ) {
    const perdidos = (input.weightStart - input.currentWeight).toFixed(1).replace(".", ",");
    const restantes = (input.currentWeight - input.weightGoal).toFixed(1).replace(".", ",");
    return {
      key: "weight-progress",
      tone: "good",
      title: `Você já perdeu ${perdidos} kg desde o início.`,
      body: `Faltam ${restantes} kg pra sua meta.`,
    };
  }

  // 7. Cardio semana ≥ 80% da meta
  if (input.cardioMinutes >= input.cardioGoal * 0.8 && input.cardioMinutes < input.cardioGoal) {
    const faltamMin = input.cardioGoal - input.cardioMinutes;
    return {
      key: "cardio-near",
      tone: "gold",
      title: `Faltam ${faltamMin} min de cardio pra fechar a semana.`,
    };
  }

  // 8. Dia completo
  if (input.dayComplete) {
    return {
      key: "day-complete",
      tone: "good",
      title: "Você cumpriu todos os pilares hoje. ✨",
      body: "Continue assim — constância vence intensidade.",
    };
  }

  return null;
}

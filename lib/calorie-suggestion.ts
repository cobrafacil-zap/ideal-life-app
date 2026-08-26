import {
  activityFactor,
  computeAge,
  computeTMB,
} from "@/lib/health";
import type { Profile } from "@/types/database";

/**
 * Sugestão de meta calórica diária.
 *
 * Estratégia:
 * 1. Calcula TDEE (gasto energético total).
 *    - Preferência: Mifflin-St Jeor (preciso) — exige birth_date,
 *      height_cm, biological_sex, activity_level.
 *    - Fallback: heurística 22 kcal/kg (manter) — usada quando faltam
 *      dados para Mifflin.
 * 2. Aplica ajuste conforme `goal_type` baseado em **% do TDEE**
 *    (não em déficit fixo de kcal — isso respeita o metabolismo
 *    individual):
 *    - manter → 0
 *    - perder 0.25 kg/sem → ~12% déficit
 *    - perder 0.5  kg/sem → ~22% déficit
 *    - perder 0.75 kg/sem → ~30% déficit
 *    - perder 1.0  kg/sem → ~35% déficit (limite saudável)
 *    - ganhar → 10–15% superávit
 *    - recompor → +8% (leve superávit, foco em proteína)
 * 3. Aplica floor de segurança (1200 feminino / 1500 masculino) e
 *    teto de 6000 kcal.
 *
 * Sem dependência de Supabase — recebe tudo via parâmetro.
 */

export type SuggestionInput = {
  currentWeightKg: number | null;
  heightCm: number | null;
  birthDate: string | null;
  biologicalSex: Profile["biological_sex"];
  activityLevel: Profile["activity_level"];
  weightGoalKg: number | null;
  goalType: Profile["goal_type"];
  weeklyRateKg: number | null;
  // Ritmo real (não declarado) — observado nos últimos 14 dias:
  cardioMinutes14d: number;
  workoutHours14d: number;
  // Alimentação real:
  avgKcal14d: number | null;
};

export type CalorieSuggestion = {
  /** TDEE estimado antes do ajuste da meta. */
  baseKcal: number;
  /** Como o TDEE foi calculado. */
  method: "mifflin" | "heuristica";
  /** Diferença aplicada pela meta (negativo = déficit). */
  adjustmentKcal: number;
  /** Texto explicando o ajuste ("para perder 0.5 kg/sem", "manter"). */
  adjustmentReason: string;
  /** Valor final sugerido, já clampado. */
  suggestedKcal: number;
  /** Confiança da estimativa. */
  confidence: "alta" | "media" | "baixa";
  /** Avisos que o usuário deve ler antes de aplicar. */
  warnings: string[];
};

const MIN_KCAL_FEMALE = 1200;
const MIN_KCAL_MALE = 1500;
const MAX_KCAL = 6000;
const MIN_KCAL_FORM = 800; // combina com validação de GoalsForm

/** Heurística simples (kcal/kg) usada quando faltam dados pro Mifflin. */
const HEURISTIC_KCAL_PER_KG = 22;

/**
 * Tradução de `weeklyRateKg` (kg/semana) para fração do TDEE.
 *
 * Referência: 7700 kcal ≈ 1 kg de gordura; 1 semana = 7 dias.
 * Para uma pessoa com TDEE ~2500 kcal:
 *   - 0.25 kg/sem → ~275 kcal/dia → ~11% déficit
 *   - 0.5  kg/sem → ~550 kcal/dia → ~22% déficit
 *   - 0.75 kg/sem → ~825 kcal/dia → ~33% déficit
 *   - 1.0  kg/sem → ~1100 kcal/dia → ~44% déficit (muito agressivo)
 *
 * Os fatores abaixo interpolam entre esses pontos para TDEEs variados.
 * Limitamos em 0.35 (35% déficit) porque déficits maiores comprometem
 * saúde hormonal, imunidade e adesão.
 */
const DEFICIT_FACTOR_BY_RATE: Array<[number, number]> = [
  [0.25, 0.12],
  [0.5, 0.22],
  [0.75, 0.3],
  [1.0, 0.35],
];

const SURPLUS_FACTOR_BY_RATE: Array<[number, number]> = [
  [0.1, 0.06],
  [0.25, 0.12],
  [0.5, 0.18],
  [0.75, 0.22],
];

function interpolate(
  table: Array<[number, number]>,
  rate: number,
): number {
  if (table.length === 0) return 0;
  if (rate <= table[0]![0]) return table[0]![1];
  if (rate >= table[table.length - 1]![0]) return table[table.length - 1]![1];
  for (let i = 0; i < table.length - 1; i++) {
    const [r0, f0] = table[i]!;
    const [r1, f1] = table[i + 1]!;
    if (rate >= r0 && rate <= r1) {
      const t = (rate - r0) / (r1 - r0);
      return f0 + t * (f1 - f0);
    }
  }
  return table[table.length - 1]![1];
}

function deficitFactor(rate: number): number {
  return interpolate(DEFICIT_FACTOR_BY_RATE, rate);
}

function surplusFactor(rate: number): number {
  return interpolate(SURPLUS_FACTOR_BY_RATE, rate);
}

export function canUseMifflin(input: SuggestionInput): boolean {
  return (
    input.currentWeightKg != null &&
    input.heightCm != null &&
    input.birthDate != null &&
    input.biologicalSex != null &&
    input.biologicalSex !== "nao_informado" &&
    input.activityLevel != null
  );
}

function computeBaseTDEE(input: SuggestionInput): {
  baseKcal: number;
  method: "mifflin" | "heuristica";
} {
  if (canUseMifflin(input)) {
    const age = computeAge(input.birthDate);
    if (age == null || age <= 0 || age > 120) {
      // birth_date presente mas inválida → cai na heurística.
      return {
        baseKcal: Math.round(input.currentWeightKg! * HEURISTIC_KCAL_PER_KG),
        method: "heuristica",
      };
    }
    const tmb = computeTMB(
      input.currentWeightKg!,
      input.heightCm!,
      age,
      input.biologicalSex!,
    );
    const factor = activityFactor(input.activityLevel!);
    return {
      baseKcal: Math.round(tmb * factor),
      method: "mifflin",
    };
  }
  // Fallback
  const weight = input.currentWeightKg ?? 0;
  return {
    baseKcal: Math.round(weight * HEURISTIC_KCAL_PER_KG),
    method: "heuristica",
  };
}

function adjustForGoal(
  baseKcal: number,
  input: SuggestionInput,
): { kcal: number; delta: number; reason: string } {
  const goal = input.goalType ?? "manter";
  const rate = input.weeklyRateKg ?? 0.5;

  // Edge case: meta de perder mas peso atual já <= peso-meta → não corta.
  if (
    goal === "perder" &&
    input.currentWeightKg != null &&
    input.weightGoalKg != null &&
    input.currentWeightKg <= input.weightGoalKg
  ) {
    return { kcal: baseKcal, delta: 0, reason: "peso já na meta" };
  }

  if (goal === "manter") {
    return { kcal: baseKcal, delta: 0, reason: "manter peso" };
  }

  if (goal === "perder") {
    const factor = deficitFactor(rate);
    const delta = Math.round(baseKcal * factor);
    return {
      kcal: baseKcal - delta,
      delta: -delta,
      reason: `déficit de ${Math.round(factor * 100)}% para perder ${rate} kg/sem`,
    };
  }

  if (goal === "ganhar") {
    const factor = surplusFactor(rate);
    const delta = Math.round(baseKcal * factor);
    return {
      kcal: baseKcal + delta,
      delta,
      reason: `superávit de ${Math.round(factor * 100)}% para ganhar ${rate} kg/sem`,
    };
  }

  if (goal === "recompor") {
    const delta = Math.round(baseKcal * 0.08);
    return {
      kcal: baseKcal + delta,
      delta,
      reason: `recomposição (+${Math.round(baseKcal * 0.08)} kcal, +8%)`,
    };
  }

  return { kcal: baseKcal, delta: 0, reason: "manter peso" };
}

function applySafetyFloor(
  kcal: number,
  sex: Profile["biological_sex"],
): number {
  const floor = sex === "masculino" ? MIN_KCAL_MALE : MIN_KCAL_FEMALE;
  // Usa o maior dos dois floors pra cobrir casos com sex=null.
  const effectiveFloor = Math.max(floor, MIN_KCAL_FEMALE);
  return Math.round(Math.min(MAX_KCAL, Math.max(MIN_KCAL_FORM, Math.max(effectiveFloor, kcal))));
}

function buildConfidence(
  input: SuggestionInput,
  method: "mifflin" | "heuristica",
): "alta" | "media" | "baixa" {
  if (method === "heuristica") return "baixa";
  const hasMealHistory = input.avgKcal14d != null;
  const hasActivityHistory =
    input.cardioMinutes14d > 0 || input.workoutHours14d > 0;
  const hasGoal = input.weightGoalKg != null && input.goalType != null;
  if (hasMealHistory && hasActivityHistory && hasGoal) return "alta";
  if (hasGoal) return "media";
  return "media";
}

function buildWarnings(input: SuggestionInput, finalKcal: number): string[] {
  const w: string[] = [];
  if (input.currentWeightKg == null) {
    w.push("Sem peso atual registrado — cadastre em /saude para uma sugestão precisa.");
  }
  if (input.avgKcal14d == null) {
    w.push("Poucos dias de alimentação registrada (menos de 5 dias nos últimos 14).");
  }
  if (input.cardioMinutes14d === 0 && input.workoutHours14d === 0) {
    w.push("Sem atividade nos últimos 14 dias — confira seu nível de atividade em /saude.");
  }
  if (
    input.goalType === "perder" &&
    (input.weeklyRateKg ?? 0) > 1.0
  ) {
    w.push("Ritmo de perda acima de 1 kg/sem é considerado agressivo.");
  }
  if (
    input.goalType === "perder" &&
    finalKcal <= MIN_KCAL_FEMALE
  ) {
    w.push(
      "Sugestão atingiu o floor mínimo de segurança (1200 kcal) — considere ritmo mais lento ou meta diferente.",
    );
  }
  return w;
}

export function suggestCalorieGoal(input: SuggestionInput): CalorieSuggestion {
  const { baseKcal, method } = computeBaseTDEE(input);
  const adj = adjustForGoal(baseKcal, input);
  const finalKcal = applySafetyFloor(adj.kcal, input.biologicalSex);
  const confidence = buildConfidence(input, method);
  const warnings = buildWarnings(input, finalKcal);

  return {
    baseKcal,
    method,
    adjustmentKcal: adj.delta,
    adjustmentReason: adj.reason,
    suggestedKcal: finalKcal,
    confidence,
    warnings,
  };
}
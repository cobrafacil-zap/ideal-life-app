/**
 * Cálculo de kcal queimadas em sessões de cardio.
 *
 * Fórmula simples baseada em METs (Compendium of Physical Activities):
 *   kcal = MET × peso(kg) × horas
 *
 * Para esteira usamos a intensidade para refinar o MET. Para outros tipos
 * usamos um MET médio padrão. Retorna inteiro arredondado (ou `null` se
 * faltar peso/duração).
 */

export type CardioType =
  | "esteira"
  | "caminhada"
  | "corrida"
  | "bicicleta"
  | "escada"
  | "eliptico"
  | "outro";

export type CardioIntensity = "leve" | "moderada" | "intensa";

const FIXED_MET: Record<CardioType, number> = {
  esteira: 0, // tratado à parte via intensidade
  caminhada: 3.5,
  corrida: 8.0,
  bicicleta: 6.0,
  escada: 8.0,
  eliptico: 5.0,
  outro: 4.0,
};

export function treadmillMET(intensity: CardioIntensity | null | undefined): number {
  switch (intensity) {
    case "leve":
      return 3.5;
    case "moderada":
      return 6.0;
    case "intensa":
      return 8.0;
    default:
      return 4.5;
  }
}

export function cardioKcal(input: {
  type: CardioType | string;
  durationH: number | null;
  weightKg: number | null;
  intensity?: CardioIntensity | string | null;
}): number | null {
  if (!input.durationH || !input.weightKg || input.durationH <= 0) return null;
  const met =
    input.type === "esteira"
      ? treadmillMET(input.intensity as CardioIntensity | null)
      : FIXED_MET[input.type as CardioType] ?? 4.0;
  return Math.round(met * input.weightKg * input.durationH);
}

/**
 * Converte minutos em horas com 2 casas. Útil para fallback em sessões
 * antigas que só tinham `duration_min`.
 */
export function minToHours(min: number | null | undefined): number | null {
  if (min == null) return null;
  return Math.round((min / 60) * 100) / 100;
}

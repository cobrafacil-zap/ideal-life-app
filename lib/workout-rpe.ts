/**
 * Heurística de sugestão de carga — puramente informativa, sem prescrever.
 *
 * Texto sempre no formato "Pode [opção]" + frase de isenção.
 * Não afirma que uma carga é segura nem diagnostica nada.
 */

export type ReviewSession = {
  session_id: string;
  started_at: string;
  top_load_kg: number | null;
  reps_at_top: number | null;
  total_volume_kg: number;
  total_sets: number;
};

export type PlanTarget = {
  target_sets: number;
  target_reps_min: number | null;
  target_load: number | null;
};

export type ReviewVerdict =
  | { kind: "increase"; message: string; delta_pct?: number }
  | { kind: "hold"; message: string }
  | { kind: "decrease"; message: string }
  | { kind: "monitor"; message: string }
  | { kind: "insufficient"; message: string };

/**
 * Avalia as últimas `recentSessions` de um exercício e devolve uma
 * sugestão textual neutra baseada em:
 *  - completude das séries vs `target_sets × target_reps_min`
 *  - RPE médio das séries (se houver)
 *  - desconforto médio (se houver)
 *
 * Sem prescrever carga absoluta. Sem diagnosticar.
 */
export function evaluateLoadReview(
  recentSessions: {
    top_load_kg: number | null;
    reps_at_top: number | null;
    total_sets: number;
    total_volume_kg: number;
    avg_rpe: number | null;
    avg_discomfort: number | null;
    session_id: string;
  }[],
  plan: PlanTarget | null,
): ReviewVerdict {
  if (recentSessions.length < 2) {
    return {
      kind: "insufficient",
      message:
        "Ainda há poucas sessões registradas. Continue treinando — a sugestão aparece após 2 ou mais sessões finalizadas.",
    };
  }

  const last = recentSessions[recentSessions.length - 1];
  const lastRpe = last.avg_rpe;
  const lastDiscomfort = last.avg_discomfort;
  const plannedReps = plan?.target_reps_min ?? null;
  const plannedSets = plan?.target_sets ?? null;

  // Regra 1: desconforto alto recorrente (>=2 sessões com discomfort >= 5).
  const highDiscomfortSessions = recentSessions.filter(
    (s) => (s.avg_discomfort ?? 0) >= 5,
  ).length;
  if (highDiscomfortSessions >= 2) {
    return {
      kind: "monitor",
      message:
        "Você registrou desconforto alto em mais de uma sessão deste exercício. Vale considerar manter ou reduzir a carga, ou trocar o exercício. Profissionais de educação física ou fisioterapia podem ajudar a avaliar.",
    };
  }

  // Regra 2: completou tudo com RPE baixo/moderado.
  const completed = plannedSets != null && last.total_sets >= plannedSets;
  const rpeOk = lastRpe != null && lastRpe <= 7;
  const repsOk =
    plannedReps == null ||
    (last.reps_at_top != null && last.reps_at_top >= plannedReps);

  if (completed && rpeOk && repsOk) {
    return {
      kind: "increase",
      message:
        "Nas últimas sessões você completou as séries com RPE baixo/moderado. Pode experimentar aumentar a carga aos poucos — sempre respeitando como você se sente.",
      delta_pct: 5,
    };
  }

  // Regra 3: completou, mas RPE alto (8-9).
  if (completed && lastRpe != null && lastRpe <= 9 && repsOk) {
    return {
      kind: "hold",
      message:
        "Você completou as séries, mas o RPE ficou alto. Pode manter a carga ou ajustar levemente — escute seu corpo.",
    };
  }

  // Regra 4: não completou ou RPE 10.
  if (!completed || lastRpe === 10) {
    return {
      kind: "hold",
      message:
        "A última sessão foi puxada (séries incompletas ou RPE máximo). Vale manter a carga atual antes de tentar subir.",
    };
  }

  // Fallback neutro.
  return {
    kind: "hold",
    message:
      "A carga atual parece adequada. Continue registrando para refinar a sugestão nas próximas sessões.",
  };
}

export const REVIEW_DISCLAIMER =
  "Essas sugestões consideram apenas completude, RPE e desconforto — não levam em conta sono, estresse, alimentação, fadiga acumulada ou histórico clínico. Ajuste sempre com base em como você se sente. Não é prescrição nem diagnóstico.";

/** Texto curto exibido no botão "Aplicar" (se houver sugestão). */
export const APPLY_SUGGESTION_NOTE =
  "Aplicar ajustará apenas a carga alvo no plano atual — você pode revisar antes de salvar.";

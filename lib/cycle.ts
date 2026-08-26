import type { MenstrualCycle } from "@/types/database";

/**
 * Fases do ciclo menstrual (referência clínica padrão):
 * - `menstrual`  — dias 1–5 (sangramento)
 * - `folicular`  — dias 6–13
 * - `fertil`     — janela fértil (dias 11–16, inclui dia de ovulação)
 * - `ovulacao`   — dia 14 (pico de fertilidade)
 * - `lutea`      — dias 17–(comprimento−6)
 * - `tpm`        — últimos 5 dias antes da próxima menstruação
 */
export type CyclePhase =
  | "menstrual"
  | "folicular"
  | "fertil"
  | "ovulacao"
  | "lutea"
  | "tpm";

const DEFAULT_CYCLE_LENGTH = 28;

/**
 * Dia atual dentro do ciclo (1-indexado). Retorna `null` se não houver ciclo
 * registrado.
 */
export function computeCycleDay(
  currentCycleStart: Date | string | null | undefined,
  today: Date = new Date(),
): number | null {
  if (!currentCycleStart) return null;
  const start = new Date(currentCycleStart);
  // zera horas para evitar drift por causa de fuso
  start.setHours(0, 0, 0, 0);
  const t = new Date(today);
  t.setHours(0, 0, 0, 0);
  const diffMs = t.getTime() - start.getTime();
  const day = Math.floor(diffMs / 86_400_000) + 1;
  return day >= 1 ? day : null;
}

/**
 * Comprimento médio do ciclo (gap entre inícios consecutivos). Default 28
 * se houver menos de 2 registros.
 */
export function getAvgCycleLength(
  cycles: Pick<MenstrualCycle, "start_date">[],
): number {
  if (cycles.length < 2) return DEFAULT_CYCLE_LENGTH;
  const gaps: number[] = [];
  for (let i = 0; i < cycles.length - 1; i++) {
    const a = new Date(cycles[i].start_date);
    const b = new Date(cycles[i + 1].start_date);
    gaps.push(Math.round((a.getTime() - b.getTime()) / 86_400_000));
  }
  const sum = gaps.reduce((acc, n) => acc + n, 0);
  return Math.max(20, Math.min(45, Math.round(sum / gaps.length)));
}

/** Janela fértil: dias 11–16 (referência ACOG). */
export function isFertile(cycleDay: number): boolean {
  return cycleDay >= 11 && cycleDay <= 16;
}

/** TPM: últimos 5 dias do ciclo (1–7 dias antes da próxima menstruação). */
export function isPMS(cycleDay: number, cycleLength: number): boolean {
  return cycleDay > cycleLength - 5;
}

/**
 * Resolve a fase do ciclo para um determinado dia. Ordem de checagem importa:
 * fértil e TPM têm prioridade visual sobre as fases "macro" (folicular/lútea).
 */
export function getPhase(
  cycleDay: number | null,
  cycleLength: number,
): CyclePhase | null {
  if (!cycleDay) return null;
  if (cycleDay === 14) return "ovulacao";
  if (isPMS(cycleDay, cycleLength)) return "tpm";
  if (isFertile(cycleDay)) return "fertil";
  if (cycleDay <= 5) return "menstrual";
  if (cycleDay <= 13) return "folicular";
  return "lutea";
}

export const PHASE_META: Record<
  CyclePhase,
  { label: string; tone: "moss" | "ember" | "rose" | "lilac" | "gold"; description: string }
> = {
  menstrual: {
    label: "Menstruação",
    tone: "ember",
    description: "Fase menstrual — dias 1 a 5.",
  },
  folicular: {
    label: "Fase folicular",
    tone: "moss",
    description: "Energia e humor em alta.",
  },
  fertil: {
    label: "Janela fértil",
    tone: "gold",
    description: "Maior chance de concepção (dias 11–16).",
  },
  ovulacao: {
    label: "Ovulação",
    tone: "rose",
    description: "Pico de fertilidade — dia 14.",
  },
  lutea: {
    label: "Fase lútea",
    tone: "lilac",
    description: "Entre a ovulação e a próxima menstruação.",
  },
  tpm: {
    label: "TPM",
    tone: "lilac",
    description: "Últimos 5 dias antes da próxima menstruação.",
  },
};

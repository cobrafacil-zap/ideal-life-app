import {
  addDays,
  clamp,
  daysBetween,
  parseISODate,
  startOfDay,
  toISODate,
} from "./utils";
import type { Goal, ProgressEntry, Step } from "./types";

/* ── Progresso ─────────────────────────────────────────── */

export interface ProgressBreakdown {
  /** Progresso da métrica numérica (0–100). */
  numeric: number;
  /** Progresso das etapas (0–100). */
  steps: number;
  /** Progresso combinado final (0–100). */
  total: number;
  hasMetric: boolean;
  hasSteps: boolean;
  /** Quanto falta (na unidade da meta). */
  remaining: number | null;
  /** Faltam X% para concluir. */
  missingPercent: number;
}

/**
 * Progresso da métrica numérica.
 * - `increase`: start 0 → target 100 (faturamento, clientes…)
 * - `decrease`: start 85 → target 70 (peso)
 */
export function numericProgress(goal: Goal): number {
  const { metricStart, metricCurrent, metricTarget, metricDirection } = goal;
  if (
    metricStart === null ||
    metricCurrent === null ||
    metricTarget === null
  ) {
    return 0;
  }
  const span = metricTarget - metricStart;
  if (span === 0) return metricCurrent >= metricTarget ? 100 : 0;
  const done = metricCurrent - metricStart;
  return clamp((done / span) * 100);
}

export function stepsProgress(steps: Step[]): number {
  if (!steps.length) return 0;
  const done = steps.filter((s) => s.done).length;
  return clamp((done / steps.length) * 100);
}

/**
 * Progresso combinado: quando a meta tem métrica E etapas, o valor numérico
 * pesa 60% e as etapas 40% — concluí-las move a barra conforme o esperado.
 */
export function computeProgress(goal: Goal, steps: Step[]): ProgressBreakdown {
  const hasMetric =
    goal.metricStart !== null &&
    goal.metricCurrent !== null &&
    goal.metricTarget !== null;
  const hasSteps = steps.length > 0;

  const numeric = hasMetric ? numericProgress(goal) : 0;
  const stepsPct = hasSteps ? stepsProgress(steps) : 0;

  let total: number;
  if (hasMetric && hasSteps) total = numeric * 0.6 + stepsPct * 0.4;
  else if (hasMetric) total = numeric;
  else if (hasSteps) total = stepsPct;
  else total = 0;

  total = clamp(total);

  let remaining: number | null = null;
  if (hasMetric) {
    const { metricCurrent, metricTarget, metricDirection } = goal;
    if (metricDirection === "decrease") {
      remaining = Math.max(0, (metricCurrent as number) - (metricTarget as number));
    } else {
      remaining = Math.max(0, (metricTarget as number) - (metricCurrent as number));
    }
  }

  return {
    numeric,
    steps: stepsPct,
    total,
    hasMetric,
    hasSteps,
    remaining,
    missingPercent: clamp(100 - total),
  };
}

/** Progresso da meta em uma data passada (usado nos gráficos históricos). */
export function progressAt(
  goal: Goal,
  steps: Step[],
  progress: ProgressEntry[],
  date: Date,
): number {
  const target = startOfDay(date);
  const entries = progress
    .filter((p) => p.goalId === goal.id)
    .filter((p) => {
      const d = parseISODate(p.loggedAt);
      return d ? d.getTime() <= target.getTime() : false;
    })
    .sort((a, b) => a.loggedAt.localeCompare(b.loggedAt));

  const last = entries[entries.length - 1];
  if (!last) {
    // sem histórico: usa o estado atual se a meta já começou
    const start = parseISODate(goal.startDate);
    if (start && start.getTime() > target.getTime()) return 0;
    return computeProgress(goal, steps).total;
  }

  const simulated: Goal = { ...goal, metricCurrent: last.value };
  const stepDone = steps.filter((s) => {
    if (!s.doneAt) return false;
    const d = parseISODate(s.doneAt);
    return d ? d.getTime() <= target.getTime() : false;
  });
  return computeProgress(simulated, stepDone).total;
}

/* ── Prazos ────────────────────────────────────────────── */

export type DeadlineTone = "ok" | "soon" | "today" | "late" | "none";

export interface DeadlineInfo {
  daysLeft: number | null;
  /** Texto curto: "Faltam 20 dias", "Prazo termina amanhã", "Atrasada há 5 dias". */
  label: string;
  longLabel: string;
  tone: DeadlineTone;
  /** 0–100: quanto do prazo já passou. */
  elapsed: number;
  /** Data formatada do prazo. */
  dueLabel: string;
}

export function deadlineInfo(goal: Goal, today: Date = new Date()): DeadlineInfo {
  const due = parseISODate(goal.dueDate);
  const start = parseISODate(goal.startDate);
  if (!due) {
    return {
      daysLeft: null,
      label: "Sem prazo",
      longLabel: "Esta meta não tem prazo definido.",
      tone: "none",
      elapsed: 0,
      dueLabel: "—",
    };
  }

  const daysLeft = daysBetween(today, due);
  const total = start ? Math.max(1, daysBetween(start, due)) : Math.max(1, daysLeft + 1);
  const passed = start ? daysBetween(start, today) : 0;
  const elapsed = clamp((passed / total) * 100);

  let label: string;
  let longLabel: string;
  let tone: DeadlineTone;

  if (daysLeft < 0) {
    const late = Math.abs(daysLeft);
    label = `Atrasada há ${late} ${late === 1 ? "dia" : "dias"}`;
    longLabel = `Esta meta está atrasada há ${late} ${late === 1 ? "dia" : "dias"}.`;
    tone = "late";
  } else if (daysLeft === 0) {
    label = "Prazo termina hoje";
    longLabel = "O prazo desta meta termina hoje.";
    tone = "today";
  } else if (daysLeft === 1) {
    label = "Prazo termina amanhã";
    longLabel = "O prazo desta meta termina amanhã.";
    tone = "soon";
  } else if (daysLeft <= 15) {
    label = `Faltam ${daysLeft} dias`;
    longLabel = `Faltam ${daysLeft} dias para o prazo desta meta.`;
    tone = "soon";
  } else {
    label = `Faltam ${daysLeft} dias`;
    longLabel = `Faltam ${daysLeft} dias para o prazo desta meta.`;
    tone = "ok";
  }

  return {
    daysLeft,
    label,
    longLabel,
    tone,
    elapsed,
    dueLabel: new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(due),
  };
}

export const DEADLINE_TONE_CLASS: Record<DeadlineTone, string> = {
  ok: "text-ink-faint bg-ink/5 ring-1 ring-inset ring-line",
  soon: "text-amber-dark bg-amber-soft ring-1 ring-inset ring-amber/25",
  today: "text-iris-dark bg-iris-soft ring-1 ring-inset ring-iris/25",
  late: "text-rose-dark bg-rose-soft ring-1 ring-inset ring-rose/25",
  none: "text-ink-faint bg-ink/5 ring-1 ring-inset ring-line",
};

/** Dias sem registrar atualização (usa o histórico de progresso). */
export function daysSinceUpdate(
  goal: Goal,
  progress: ProgressEntry[],
  today: Date = new Date(),
): number {
  const last = progress
    .filter((p) => p.goalId === goal.id)
    .sort((a, b) => b.loggedAt.localeCompare(a.loggedAt))[0];
  const reference = last?.loggedAt ?? goal.updatedAt?.slice(0, 10) ?? goal.createdAt.slice(0, 10);
  const date = parseISODate(reference);
  if (!date) return 0;
  return Math.max(0, daysBetween(date, today));
}

/** Progresso esperado até hoje (linear entre início e prazo). */
export function expectedProgress(goal: Goal, today: Date = new Date()): number | null {
  const start = parseISODate(goal.startDate);
  const due = parseISODate(goal.dueDate);
  if (!start || !due) return null;
  const total = daysBetween(start, due);
  if (total <= 0) return 100;
  const passed = daysBetween(start, today);
  return clamp((passed / total) * 100);
}

/** "Em dia" / "Atrasada no ritmo" / "Adiantada". */
export function paceLabel(goal: Goal, current: number, today: Date = new Date()): string {
  const expected = expectedProgress(goal, today);
  if (expected === null) return "Sem prazo";
  const diff = current - expected;
  if (diff >= 5) return "Adiantada";
  if (diff <= -15) return "Atrasada no ritmo";
  return "Em dia";
}

export function isOverdue(goal: Goal, today: Date = new Date()): boolean {
  const due = parseISODate(goal.dueDate);
  if (!due) return false;
  return goal.status === "ativa" && daysBetween(today, due) < 0;
}

export function isDueSoon(goal: Goal, days = 15, today: Date = new Date()): boolean {
  const due = parseISODate(goal.dueDate);
  if (!due) return false;
  const diff = daysBetween(today, due);
  return goal.status === "ativa" && diff >= 0 && diff <= days;
}

export function isCompleted(goal: Goal, steps: Step[]): boolean {
  if (goal.status === "concluida") return true;
  return computeProgress(goal, steps).total >= 100;
}

/** Semana atual (segunda → domingo). */
export function currentWeekRange(today: Date = new Date()): { start: Date; end: Date } {
  const day = today.getDay(); // 0 dom … 6 sáb
  const diff = day === 0 ? -6 : 1 - day;
  const start = addDays(startOfDay(today), diff);
  const end = addDays(start, 6);
  return { start, end };
}

export function isoWeekKey(date: Date = new Date()): string {
  const { start } = currentWeekRange(date);
  return toISODate(start);
}

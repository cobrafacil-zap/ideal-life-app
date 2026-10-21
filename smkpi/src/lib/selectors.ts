import type { AppState, Goal, ProgressEntry, Step } from "./types";
import {
  computeProgress,
  currentWeekRange,
  daysSinceUpdate,
  deadlineInfo,
  isDueSoon,
  isOverdue,
  type DeadlineInfo,
  type ProgressBreakdown,
} from "./progress";
import { PRIORITY_ORDER } from "./constants";
import { addDays, monthKey, parseISODate, startOfDay, toISODate } from "./utils";

export interface GoalView {
  goal: Goal;
  steps: Step[];
  progress: ProgressEntry[];
  breakdown: ProgressBreakdown;
  deadline: DeadlineInfo;
  category: AppState["categories"][number] | undefined;
  daysSinceUpdate: number;
}

export function buildGoalViews(state: AppState, today: Date = new Date()): GoalView[] {
  return state.goals.map((goal) => {
    const steps = state.steps.filter((s) => s.goalId === goal.id);
    const progress = state.progress
      .filter((p) => p.goalId === goal.id)
      .sort((a, b) => a.loggedAt.localeCompare(b.loggedAt));
    return {
      goal,
      steps,
      progress,
      breakdown: computeProgress(goal, steps),
      deadline: deadlineInfo(goal, today),
      category: state.categories.find((c) => c.id === goal.categoryId),
      daysSinceUpdate: daysSinceUpdate(goal, state.progress, today),
    };
  });
}

export interface Summary {
  total: number;
  ativas: number;
  concluidas: number;
  pausadas: number;
  atrasadas: number;
  proximas: number;
  semPrazo: number;
  overallProgress: number;
  pessoal: { total: number; concluidas: number; progress: number };
  profissional: { total: number; concluidas: number; progress: number };
  neutro: { total: number; concluidas: number; progress: number };
  concluidasNoAno: number;
  pertoDeConcluir: number;
}

export function summarize(state: AppState, views: GoalView[], today: Date = new Date()): Summary {
  const ativas = views.filter((v) => v.goal.status === "ativa");
  const concluidas = views.filter((v) => v.goal.status === "concluida");
  const atrasadas = ativas.filter((v) => isOverdue(v.goal, today));
  const proximas = ativas.filter((v) => isDueSoon(v.goal, 15, today));
  const near = ativas.filter((v) => v.breakdown.total >= 80 && v.breakdown.total < 100);
  const year = today.getFullYear();

  const overall = views.length
    ? views.reduce((acc, v) => acc + v.breakdown.total, 0) / views.length
    : 0;

  const byScope = (scope: "pessoal" | "profissional" | "neutro") => {
    const list = views.filter((v) => v.goal.scope === scope);
    return {
      total: list.length,
      concluidas: list.filter((v) => v.goal.status === "concluida").length,
      progress: list.length
        ? list.reduce((acc, v) => acc + v.breakdown.total, 0) / list.length
        : 0,
    };
  };

  return {
    total: views.length,
    ativas: ativas.length,
    concluidas: concluidas.length,
    pausadas: views.filter((v) => v.goal.status === "pausada").length,
    atrasadas: atrasadas.length,
    proximas: proximas.length,
    semPrazo: views.filter((v) => !v.goal.dueDate).length,
    overallProgress: overall,
    pessoal: byScope("pessoal"),
    profissional: byScope("profissional"),
    neutro: byScope("neutro"),
    concluidasNoAno: concluidas.filter(
      (v) => v.goal.completedAt?.slice(0, 4) === String(year),
    ).length,
    pertoDeConcluir: near.length,
  };
}

/** Série de evolução: progresso médio das metas ao longo das últimas semanas. */
export function evolutionSeries(
  state: AppState,
  views: GoalView[],
  weeks = 12,
  today: Date = new Date(),
): Array<{ label: string; date: string; pessoal: number; profissional: number; geral: number }> {
  const out: Array<{
    label: string;
    date: string;
    pessoal: number;
    profissional: number;
    geral: number;
  }> = [];

  for (let i = weeks - 1; i >= 0; i--) {
    const date = addDays(startOfDay(today), -i * 7);
    const values: number[] = [];
    const pessoal: number[] = [];
    const profissional: number[] = [];

    views.forEach((v) => {
      const stepsAt = v.steps.filter((s) => {
        if (!s.doneAt) return false;
        const d = parseISODate(s.doneAt);
        return d ? d.getTime() <= date.getTime() : false;
      });
      const entries = v.progress.filter((p) => {
        const d = parseISODate(p.loggedAt);
        return d ? d.getTime() <= date.getTime() : false;
      });
      const simulated: Goal = {
        ...v.goal,
        metricCurrent: entries.length ? entries[entries.length - 1].value : v.goal.metricCurrent,
      };
      const pct = computeProgress(simulated, stepsAt).total;
      values.push(pct);
      if (v.goal.scope === "pessoal") pessoal.push(pct);
      if (v.goal.scope === "profissional") profissional.push(pct);
    });

    const avg = (list: number[]) =>
      list.length ? list.reduce((a, b) => a + b, 0) / list.length : 0;

    out.push({
      label: new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(date),
      date: toISODate(date),
      geral: avg(values),
      pessoal: avg(pessoal),
      profissional: avg(profissional),
    });
  }
  return out;
}

/** Metas concluídas por mês (últimos 12 meses). */
export function completedByMonth(
  state: AppState,
  today: Date = new Date(),
): Array<{ key: string; label: string; total: number }> {
  const out: Array<{ key: string; label: string; total: number }> = [];
  for (let i = 11; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const key = monthKey(date);
    const total = state.goals.filter(
      (g) => g.status === "concluida" && g.completedAt?.slice(0, 7) === key,
    ).length;
    out.push({
      key,
      label: new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(date),
      total,
    });
  }
  return out;
}

/** Progresso médio por categoria. */
export function categoryBreakdown(
  state: AppState,
  views: GoalView[],
): Array<{ name: string; color: string; progress: number; total: number; concluidas: number }> {
  return state.categories
    .map((category) => {
      const list = views.filter((v) => v.goal.categoryId === category.id);
      return {
        name: category.name,
        color: category.color,
        progress: list.length
          ? list.reduce((acc, v) => acc + v.breakdown.total, 0) / list.length
          : 0,
        total: list.length,
        concluidas: list.filter((v) => v.goal.status === "concluida").length,
      };
    })
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total);
}

/** Prioridades da semana: urgentes primeiro, depois por prazo. */
export function weeklyPriorities(views: GoalView[], today: Date = new Date()): GoalView[] {
  const { start, end } = currentWeekRange(today);
  return views
    .filter((v) => v.goal.status === "ativa")
    .filter((v) => {
      const startDate = parseISODate(v.goal.startDate);
      const due = parseISODate(v.goal.dueDate);
      const afterStart = !startDate || startDate.getTime() <= end.getTime();
      const beforeDue = !due || due.getTime() >= start.getTime();
      return afterStart && beforeDue;
    })
    .sort((a, b) => {
      const p = PRIORITY_ORDER[a.goal.priority] - PRIORITY_ORDER[b.goal.priority];
      if (p !== 0) return p;
      const ad = a.deadline.daysLeft ?? 9999;
      const bd = b.deadline.daysLeft ?? 9999;
      return ad - bd;
    })
    .slice(0, 5);
}

/* ── Notificações / lembretes ─────────────────────────── */

export type NoticeTone = "info" | "warning" | "danger" | "success";

export interface Notice {
  id: string;
  tone: NoticeTone;
  title: string;
  description: string;
  href: string;
  goalId?: string;
}

export function buildNotices(state: AppState, views: GoalView[], today: Date = new Date()): Notice[] {
  const notices: Notice[] = [];
  const s = state.settings;

  views
    .filter((v) => v.goal.status === "ativa")
    .forEach((v) => {
      const days = v.daysSinceUpdate;
      if (days >= s.notifyStaleDays) {
        notices.push({
          id: `stale_${v.goal.id}`,
          tone: "warning",
          title: `Você não atualiza esta meta há ${days} dias`,
          description: v.goal.title,
          href: `/metas/${v.goal.id}`,
          goalId: v.goal.id,
        });
      }
      const dl = v.deadline.daysLeft;
      if (dl !== null && dl >= 0 && dl <= s.notifyDueDays) {
        notices.push({
          id: `due_${v.goal.id}`,
          tone: dl === 0 ? "danger" : "info",
          title:
            dl === 0
              ? "Sua meta termina hoje"
              : `Sua meta termina em ${dl} ${dl === 1 ? "dia" : "dias"}`,
          description: v.goal.title,
          href: `/metas/${v.goal.id}`,
          goalId: v.goal.id,
        });
      }
      if (
        v.breakdown.total >= s.notifyNearCompletion &&
        v.breakdown.total < 100
      ) {
        notices.push({
          id: `near_${v.goal.id}`,
          tone: "success",
          title: `Você está a ${Math.round(v.breakdown.missingPercent)}% de concluir esta meta`,
          description: v.goal.title,
          href: `/metas/${v.goal.id}`,
          goalId: v.goal.id,
        });
      }
      if (isOverdue(v.goal, today)) {
        notices.push({
          id: `late_${v.goal.id}`,
          tone: "danger",
          title: v.deadline.label,
          description: v.goal.title,
          href: `/metas/${v.goal.id}`,
          goalId: v.goal.id,
        });
      }
    });

  const order: Record<NoticeTone, number> = { danger: 0, warning: 1, success: 2, info: 3 };
  return notices.sort((a, b) => order[a.tone] - order[b.tone]).slice(0, 12);
}

/** Estatísticas da área "Minha evolução". */
export function evolutionStats(state: AppState, views: GoalView[], today: Date = new Date()) {
  const year = today.getFullYear();
  const yearGoals = views.filter(
    (v) =>
      v.goal.startDate?.slice(0, 4) === String(year) ||
      v.goal.dueDate?.slice(0, 4) === String(year) ||
      v.goal.completedAt?.slice(0, 4) === String(year),
  );
  const yearConcluded = yearGoals.filter((v) => v.goal.status === "concluida");
  const near = views.filter(
    (v) => v.goal.status === "ativa" && v.breakdown.total >= 80 && v.breakdown.total < 100,
  );
  return {
    yearGoals,
    yearConcluded,
    concludedThisYear: yearConcluded.length,
    percentYear: yearGoals.length ? (yearConcluded.length / yearGoals.length) * 100 : 0,
    near,
    totalProgress: views.length
      ? views.reduce((acc, v) => acc + v.breakdown.total, 0) / views.length
      : 0,
  };
}

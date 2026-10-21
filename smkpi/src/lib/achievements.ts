import type { AppState } from "./types";

export interface AchievementDef {
  key: string;
  title: string;
  description: string;
  icon: string;
  tier: number;
  /** Progresso atual rumo à conquista. */
  current: (state: AppState, progressByGoal?: Record<string, number>) => number;
  /** Total necessário. */
  target: number;
}

export const ACHIEVEMENT_DEFS: AchievementDef[] = [
  {
    key: "primeira_meta",
    title: "Primeira meta concluída",
    description: "Você concluiu a primeira meta do seu painel.",
    icon: "🏆",
    tier: 1,
    current: (s) => s.goals.filter((g) => g.status === "concluida").length,
    target: 1,
  },
  {
    key: "cinco_metas",
    title: "5 metas concluídas",
    description: "Cinco objetivos cruzados no caminho.",
    icon: "🎯",
    tier: 2,
    current: (s) => s.goals.filter((g) => g.status === "concluida").length,
    target: 5,
  },
  {
    key: "dez_metas",
    title: "Dez metas conquistadas",
    description: "Dez objetivos transformados em resultado real.",
    icon: "💫",
    tier: 3,
    current: (s) => s.goals.filter((g) => g.status === "concluida").length,
    target: 10,
  },
  {
    key: "primeira_financeira",
    title: "Primeira meta financeira",
    description: "Você alcançou o primeiro objetivo financeiro.",
    icon: "💰",
    tier: 2,
    current: (s) =>
      s.goals.filter(
        (g) => g.status === "concluida" && g.metricUnit === "R$",
      ).length,
    target: 1,
  },
  {
    key: "sequencia_7",
    title: "7 dias de constância",
    description: "Sete dias seguidos cumprindo seus hábitos.",
    icon: "🔥",
    tier: 1,
    current: (s) => bestStreak(s),
    target: 7,
  },
  {
    key: "sequencia_30",
    title: "30 dias de constância",
    description: "Um mês inteiro sem quebrar a sequência.",
    icon: "⚡",
    tier: 3,
    current: (s) => bestStreak(s),
    target: 30,
  },
  {
    key: "atualizacoes_constantes",
    title: "Constância documentada",
    description: "Você registrou 25 atualizações de progresso.",
    icon: "📈",
    tier: 2,
    current: (s) => s.progress.length,
    target: 25,
  },
  {
    key: "sonho_realidade",
    title: "Sonho virou meta",
    description: "Transformou um sonho da área “Meus sonhos” em meta real.",
    icon: "🌟",
    tier: 1,
    current: (s) => s.dreams.filter((d) => d.goalId).length,
    target: 1,
  },
  {
    key: "quase_la",
    title: "Quase lá — 5 metas acima de 80%",
    description: "Cinco metas prontas para o último empurrão.",
    icon: "🚀",
    tier: 3,
    current: (s, p = {}) =>
      s.goals.filter((g) => g.status === "ativa" && (p[g.id] ?? 0) >= 80).length,
    target: 5,
  },
  {
    key: "placar_completo",
    title: "Todas as categorias ativas",
    description: "Pelo menos uma meta em cada categoria do painel.",
    icon: "🗂️",
    tier: 2,
    current: (s) => new Set(s.goals.map((g) => g.categoryId)).size,
    target: 8,
  },
  {
    key: "ano_produtivo",
    title: "Ano produtivo",
    description: "Concluiu 8 metas dentro de um mesmo ano.",
    icon: "📅",
    tier: 3,
    current: (s) => {
      const byYear = new Map<string, number>();
      s.goals
        .filter((g) => g.status === "concluida" && g.completedAt)
        .forEach((g) => {
          const y = g.completedAt!.slice(0, 4);
          byYear.set(y, (byYear.get(y) ?? 0) + 1);
        });
      return Math.max(0, ...byYear.values());
    },
    target: 8,
  },
  {
    key: "habitos_equilibrados",
    title: "Rotina sólida",
    description: "Cinco hábitos diferentes com ao menos 10 registros.",
    icon: "🧭",
    tier: 2,
    current: (s) => {
      const counts = new Map<string, number>();
      s.habitLogs.forEach((l) => counts.set(l.habitId, (counts.get(l.habitId) ?? 0) + 1));
      return [...counts.values()].filter((n) => n >= 10).length;
    },
    target: 5,
  },
];

/** Maior sequência de dias consecutivos com pelo menos um hábito marcado. */
export function bestStreak(state: AppState): number {
  const dates = new Set(state.habitLogs.map((l) => l.logDate));
  if (!dates.size) return 0;
  const sorted = [...dates].sort();
  let best = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diff = Math.round((curr.getTime() - prev.getTime()) / 86_400_000);
    if (diff === 1) {
      run += 1;
      best = Math.max(best, run);
    } else if (diff > 1) {
      run = 1;
    }
  }
  return best;
}

/** Sequência atual (contando a partir de hoje ou ontem). */
export function currentStreak(state: AppState, today = new Date()): number {
  const dates = new Set(state.habitLogs.map((l) => l.logDate));
  if (!dates.size) return 0;
  const iso = (d: Date) =>
    `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, "0")}-${`${d.getDate()}`.padStart(2, "0")}`;
  let cursor = new Date(today);
  if (!dates.has(iso(cursor))) {
    cursor = new Date(cursor);
    cursor.setDate(cursor.getDate() - 1);
    if (!dates.has(iso(cursor))) return 0;
  }
  let streak = 0;
  while (dates.has(iso(cursor))) {
    streak += 1;
    cursor = new Date(cursor);
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export interface AchievementState {
  def: AchievementDef;
  unlocked: boolean;
  current: number;
  target: number;
  percent: number;
  unlockedAt: string | null;
}

/**
 * Avalia todas as conquistas contra o estado atual.
 * `progressByGoal` traz o progresso (%) já calculado de cada meta.
 */
export function evaluateAchievements(
  state: AppState,
  progressByGoal: Record<string, number> = {},
): AchievementState[] {
  const enriched = state;

  return ACHIEVEMENT_DEFS.map((def) => {
    const current = Math.min(def.current(enriched, progressByGoal), def.target);
    const record = state.achievements.find((a) => a.key === def.key);
    return {
      def,
      unlocked: Boolean(record),
      current,
      target: def.target,
      percent: Math.round((current / def.target) * 100),
      unlockedAt: record?.unlockedAt ?? null,
    };
  });
}

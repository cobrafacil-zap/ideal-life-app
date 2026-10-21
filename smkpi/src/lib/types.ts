/**
 * Domínio do Vitta Goals.
 *
 * Todas as entidades carregam `userId` para permitir a mesma estrutura
 * em modo local (demonstração) e em modo Supabase (multi-usuário).
 */

export type GoalScope = "pessoal" | "profissional" | "neutro";
export type GoalPriority = "baixa" | "media" | "alta" | "urgente";
export type GoalStatus = "ativa" | "concluida" | "pausada";
export type GoalCadence = "anual" | "mensal" | "semanal" | "sem-prazo";
export type MetricDirection = "increase" | "decrease";

export interface Category {
  id: string;
  userId: string;
  name: string;
  slug: string;
  color: string;
  icon: string;
  scope: GoalScope;
  isCustom: boolean;
  createdAt: string;
}

export interface Step {
  id: string;
  userId: string;
  goalId: string;
  title: string;
  done: boolean;
  doneAt: string | null;
  position: number;
  createdAt: string;
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description: string;
  categoryId: string;
  scope: GoalScope;
  priority: GoalPriority;
  status: GoalStatus;
  cadence: GoalCadence;
  startDate: string | null;
  dueDate: string | null;
  parentGoalId: string | null;
  /** Valor inicial da métrica (linha de base). */
  metricStart: number | null;
  /** Valor atual da métrica. */
  metricCurrent: number | null;
  /** Valor desejado. */
  metricTarget: number | null;
  metricUnit: string;
  metricDirection: MetricDirection;
  icon: string;
  cover: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface ProgressEntry {
  id: string;
  userId: string;
  goalId: string;
  /** ISO date (yyyy-MM-dd). */
  loggedAt: string;
  value: number;
  note: string;
  createdAt: string;
}

export interface Habit {
  id: string;
  userId: string;
  goalId: string | null;
  title: string;
  icon: string;
  color: string;
  targetPerWeek: number;
  createdAt: string;
}

export interface HabitLog {
  id: string;
  userId: string;
  habitId: string;
  /** ISO date (yyyy-MM-dd). */
  logDate: string;
  createdAt: string;
}

export type DreamStatus = "sonho" | "em_andamento" | "concluido";

export interface Dream {
  id: string;
  userId: string;
  title: string;
  description: string;
  imageUrl: string | null;
  estimatedValue: number | null;
  desiredDate: string | null;
  status: DreamStatus;
  goalId: string | null;
  createdAt: string;
}

export interface Achievement {
  id: string;
  userId: string;
  key: string;
  tier: number;
  unlockedAt: string;
}

export interface Settings {
  userId: string;
  displayName: string;
  currency: string;
  theme: "light" | "dark" | "system";
  notificationsEnabled: boolean;
  notifyStaleDays: number;
  notifyDueDays: number;
  notifyNearCompletion: number;
  updatedAt: string;
}

/** Snapshot completo do workspace — usado para persistência e sincronização. */
export interface AppState {
  categories: Category[];
  goals: Goal[];
  steps: Step[];
  progress: ProgressEntry[];
  habits: Habit[];
  habitLogs: HabitLog[];
  dreams: Dream[];
  achievements: Achievement[];
  settings: Settings;
}

export type CollectionKey = Exclude<keyof AppState, "settings">;

export const EMPTY_STATE: AppState = {
  categories: [],
  goals: [],
  steps: [],
  progress: [],
  habits: [],
  habitLogs: [],
  dreams: [],
  achievements: [],
  settings: {
    userId: "local",
    displayName: "",
    currency: "BRL",
    theme: "system",
    notificationsEnabled: true,
    notifyStaleDays: 7,
    notifyDueDays: 10,
    notifyNearCompletion: 85,
    updatedAt: new Date(0).toISOString(),
  },
};

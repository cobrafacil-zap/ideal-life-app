"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  Achievement,
  AppState,
  Category,
  Dream,
  Goal,
  Habit,
  HabitLog,
  ProgressEntry,
  Settings,
  Step,
} from "@/lib/types";
import { EMPTY_STATE } from "@/lib/types";
import { buildSeedState } from "@/lib/seed";
import {
  clearLocalState,
  getInitialState,
  hasSeeded,
  markSeeded,
  saveLocalState,
} from "./storage";
import { cloudBackend, getSupabase } from "./backend";
import { computeProgress } from "@/lib/progress";
import { evaluateAchievements } from "@/lib/achievements";
import { uid } from "@/lib/utils";

export type Mode = "local" | "cloud";

export interface StoreContextValue {
  state: AppState;
  ready: boolean;
  mode: Mode;
  user: { id: string; email: string | null } | null;
  saving: boolean;
  /* metas */
  addGoal: (input: Partial<Goal> & { title: string }) => Goal;
  updateGoal: (id: string, patch: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  /* etapas */
  addStep: (goalId: string, title: string) => void;
  toggleStep: (stepId: string) => void;
  updateStep: (stepId: string, patch: Partial<Step>) => void;
  deleteStep: (stepId: string) => void;
  /* progresso */
  addProgress: (
    goalId: string,
    value: number,
    note?: string,
    date?: string,
  ) => void;
  deleteProgress: (id: string) => void;
  /* categorias */
  addCategory: (input: Partial<Category> & { name: string }) => Category;
  updateCategory: (id: string, patch: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  /* hábitos */
  addHabit: (input: Partial<Habit> & { title: string }) => Habit;
  updateHabit: (id: string, patch: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  toggleHabitDay: (habitId: string, date: string) => void;
  /* sonhos */
  addDream: (input: Partial<Dream> & { title: string }) => Dream;
  updateDream: (id: string, patch: Partial<Dream>) => void;
  deleteDream: (id: string) => void;
  /* configurações */
  updateSettings: (patch: Partial<Settings>) => void;
  /* dados */
  resetDemo: () => void;
  clearAll: () => void;
  exportJson: () => string;
  importJson: (raw: string) => boolean;
  /* autenticação */
  signInWithGoogle: () => Promise<{ ok: boolean; message: string }>;
  signInWithPassword: (email: string, password: string) => Promise<{ ok: boolean; message: string }>;
  signUp: (email: string, password: string) => Promise<{ ok: boolean; message: string }>;
  signOut: () => Promise<void>;
}

const StoreContext = createContext<StoreContextValue | null>(null);

const nowIso = () => new Date().toISOString();

export function DataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(EMPTY_STATE);
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<Mode>("local");
  const [user, setUser] = useState<{ id: string; email: string | null } | null>(null);
  const [saving, setSaving] = useState(false);

  const prevRef = useRef<AppState>(EMPTY_STATE);
  const hydratedRef = useRef(false);

  /* ── Bootstrap ─────────────────────────────────────── */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const local = getInitialState();
      const supabase = getSupabase();
      const sessionRes = supabase ? await supabase.auth.getSession() : null;
      const session = sessionRes?.data?.session ?? null;

      if (session && supabase) {
        try {
          const cloud = await cloudBackend.load(session.user.id);
          const isEmpty =
            cloud.goals.length === 0 && cloud.categories.length === 0;
          const initial = isEmpty ? buildSeedState() : cloud;
          if (isEmpty) {
            const seeded = { ...initial, settings: { ...initial.settings, userId: session.user.id } };
            await cloudBackend.save(session.user.id, seeded, EMPTY_STATE);
          }
          if (cancelled) return;
          prevRef.current = initial;
          setState(initial);
          setMode("cloud");
          setUser({ id: session.user.id, email: session.user.email ?? null });
        } catch (error) {
          console.error("[smkpi] falha ao carregar do Supabase", error);
          if (cancelled) return;
          prevRef.current = local;
          setState(local);
          setMode("local");
        }
      } else {
        if (cancelled) return;
        prevRef.current = local;
        setState(local);
        setMode("local");
        if (!hasSeeded()) {
          markSeeded();
        }
      }
      hydratedRef.current = true;
      setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ── Persistência ──────────────────────────────────── */
  useEffect(() => {
    if (!ready || !hydratedRef.current) return;
    if (mode === "local") {
      saveLocalState(state);
      return;
    }
    if (!user) return;
    setSaving(true);
    const timer = window.setTimeout(async () => {
      try {
        await cloudBackend.save(user.id, state, prevRef.current);
        prevRef.current = state;
      } catch (error) {
        console.error("[smkpi] falha ao sincronizar", error);
      } finally {
        setSaving(false);
      }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [state, ready, mode, user]);

  /* ── Conquistas automáticas ────────────────────────── */
  useEffect(() => {
    if (!ready) return;
    const progressByGoal: Record<string, number> = {};
    state.goals.forEach((goal) => {
      const steps = state.steps.filter((s) => s.goalId === goal.id);
      progressByGoal[goal.id] = computeProgress(goal, steps).total;
    });
    const evaluated = evaluateAchievements(state, progressByGoal);
    const missing = evaluated.filter(
      (a) => a.current >= a.target && !state.achievements.some((x) => x.key === a.def.key),
    );
    if (!missing.length) return;
    const records: Achievement[] = missing.map((a) => ({
      id: uid("ach"),
      userId: state.settings.userId,
      key: a.def.key,
      tier: a.def.tier,
      unlockedAt: nowIso(),
    }));
    setState((prev) => ({ ...prev, achievements: [...prev.achievements, ...records] }));
  }, [state, ready]);

  /* ── Tema ──────────────────────────────────────────── */
  useEffect(() => {
    if (!ready) return;
    const theme = state.settings.theme;
    const root = document.documentElement;
    const prefersDark =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    const resolved = theme === "system" ? (prefersDark ? "dark" : "light") : theme;
    root.dataset.theme = resolved;
  }, [state.settings.theme, ready]);

  /* ── Ações ─────────────────────────────────────────── */
  const patch = useCallback((fn: (prev: AppState) => AppState) => setState(fn), []);

  const addGoal: StoreContextValue["addGoal"] = useCallback(
    (input) => {
      const id = input.id ?? uid("g");
      const goal: Goal = {
        id,
        userId: state.settings.userId,
        title: input.title.trim(),
        description: input.description ?? "",
        categoryId: input.categoryId ?? state.categories[0]?.id ?? "",
        scope: input.scope ?? "neutro",
        priority: input.priority ?? "media",
        status: input.status ?? "ativa",
        cadence: input.cadence ?? "sem-prazo",
        startDate: input.startDate ?? null,
        dueDate: input.dueDate ?? null,
        parentGoalId: input.parentGoalId ?? null,
        metricStart: input.metricStart ?? null,
        metricCurrent: input.metricCurrent ?? null,
        metricTarget: input.metricTarget ?? null,
        metricUnit: input.metricUnit ?? "",
        metricDirection: input.metricDirection ?? "increase",
        icon: input.icon ?? "target",
        cover: input.cover ?? null,
        notes: input.notes ?? "",
        createdAt: nowIso(),
        updatedAt: nowIso(),
        completedAt: null,
      };
      patch((prev) => ({ ...prev, goals: [goal, ...prev.goals] }));
      return goal;
    },
    [patch, state.settings.userId, state.categories],
  );

  const updateGoal: StoreContextValue["updateGoal"] = useCallback(
    (id, patchData) => {
      patch((prev) => ({
        ...prev,
        goals: prev.goals.map((g) =>
          g.id === id ? { ...g, ...patchData, updatedAt: nowIso() } : g,
        ),
      }));
    },
    [patch],
  );

  const deleteGoal: StoreContextValue["deleteGoal"] = useCallback(
    (id) => {
      patch((prev) => ({
        ...prev,
        goals: prev.goals.filter((g) => g.id !== id),
        steps: prev.steps.filter((s) => s.goalId !== id),
        progress: prev.progress.filter((p) => p.goalId !== id),
        habits: prev.habits.map((h) => (h.goalId === id ? { ...h, goalId: null } : h)),
        dreams: prev.dreams.map((dr) => (dr.goalId === id ? { ...dr, goalId: null } : dr)),
      }));
    },
    [patch],
  );

  const addStep: StoreContextValue["addStep"] = useCallback(
    (goalId, title) => {
      const clean = title.trim();
      if (!clean) return;
      patch((prev) => {
        const position = prev.steps.filter((s) => s.goalId === goalId).length;
        const step: Step = {
          id: uid("st"),
          userId: prev.settings.userId,
          goalId,
          title: clean,
          done: false,
          doneAt: null,
          position,
          createdAt: nowIso(),
        };
        return { ...prev, steps: [...prev.steps, step] };
      });
    },
    [patch],
  );

  const toggleStep: StoreContextValue["toggleStep"] = useCallback(
    (stepId) => {
      patch((prev) => ({
        ...prev,
        steps: prev.steps.map((s) =>
          s.id === stepId
            ? { ...s, done: !s.done, doneAt: !s.done ? nowIso().slice(0, 10) : null }
            : s,
        ),
      }));
    },
    [patch],
  );

  const updateStep: StoreContextValue["updateStep"] = useCallback(
    (stepId, patchData) => {
      patch((prev) => ({
        ...prev,
        steps: prev.steps.map((s) => (s.id === stepId ? { ...s, ...patchData } : s)),
      }));
    },
    [patch],
  );

  const deleteStep: StoreContextValue["deleteStep"] = useCallback(
    (stepId) => {
      patch((prev) => ({ ...prev, steps: prev.steps.filter((s) => s.id !== stepId) }));
    },
    [patch],
  );

  const addProgress: StoreContextValue["addProgress"] = useCallback(
    (goalId, value, note = "", date) => {
      patch((prev) => {
        const entry: ProgressEntry = {
          id: uid("pg"),
          userId: prev.settings.userId,
          goalId,
          loggedAt: date ?? new Date().toISOString().slice(0, 10),
          value,
          note,
          createdAt: nowIso(),
        };
        const goals = prev.goals.map((g) =>
          g.id === goalId
            ? {
                ...g,
                metricCurrent: value,
                updatedAt: nowIso(),
                status:
                  g.status === "concluida"
                    ? ("concluida" as const)
                    : g.status,
              }
            : g,
        );
        return { ...prev, progress: [...prev.progress, entry], goals };
      });
    },
    [patch],
  );

  const deleteProgress: StoreContextValue["deleteProgress"] = useCallback(
    (id) => {
      patch((prev) => ({
        ...prev,
        progress: prev.progress.filter((p) => p.id !== id),
      }));
    },
    [patch],
  );

  const addCategory: StoreContextValue["addCategory"] = useCallback(
    (input) => {
      const id = input.id ?? uid("cat");
      const category: Category = {
        id,
        userId: state.settings.userId,
        name: input.name.trim(),
        slug: input.slug ?? input.name.toLowerCase().replace(/\s+/g, "-"),
        color: input.color ?? "#4F46E5",
        icon: input.icon ?? "target",
        scope: input.scope ?? "neutro",
        isCustom: input.isCustom ?? true,
        createdAt: nowIso(),
      };
      patch((prev) => ({ ...prev, categories: [...prev.categories, category] }));
      return category;
    },
    [patch, state.settings.userId],
  );

  const updateCategory: StoreContextValue["updateCategory"] = useCallback(
    (id, patchData) => {
      patch((prev) => ({
        ...prev,
        categories: prev.categories.map((c) => (c.id === id ? { ...c, ...patchData } : c)),
      }));
    },
    [patch],
  );

  const deleteCategory: StoreContextValue["deleteCategory"] = useCallback(
    (id) => {
      patch((prev) => ({
        ...prev,
        categories: prev.categories.filter((c) => c.id !== id),
        goals: prev.goals.map((g) =>
          g.categoryId === id ? { ...g, categoryId: prev.categories[0]?.id ?? "" } : g,
        ),
      }));
    },
    [patch],
  );

  const addHabit: StoreContextValue["addHabit"] = useCallback(
    (input) => {
      const id = input.id ?? uid("hb");
      const habit: Habit = {
        id,
        userId: state.settings.userId,
        goalId: input.goalId ?? null,
        title: input.title.trim(),
        icon: input.icon ?? "check",
        color: input.color ?? "#4F46E5",
        targetPerWeek: input.targetPerWeek ?? 5,
        createdAt: nowIso(),
      };
      patch((prev) => ({ ...prev, habits: [...prev.habits, habit] }));
      return habit;
    },
    [patch, state.settings.userId],
  );

  const updateHabit: StoreContextValue["updateHabit"] = useCallback(
    (id, patchData) => {
      patch((prev) => ({
        ...prev,
        habits: prev.habits.map((h) => (h.id === id ? { ...h, ...patchData } : h)),
      }));
    },
    [patch],
  );

  const deleteHabit: StoreContextValue["deleteHabit"] = useCallback(
    (id) => {
      patch((prev) => ({
        ...prev,
        habits: prev.habits.filter((h) => h.id !== id),
        habitLogs: prev.habitLogs.filter((l) => l.habitId !== id),
      }));
    },
    [patch],
  );

  const toggleHabitDay: StoreContextValue["toggleHabitDay"] = useCallback(
    (habitId, date) => {
      patch((prev) => {
        const exists = prev.habitLogs.find(
          (l) => l.habitId === habitId && l.logDate === date,
        );
        if (exists) {
          return {
            ...prev,
            habitLogs: prev.habitLogs.filter((l) => l.id !== exists.id),
          };
        }
        const log: HabitLog = {
          id: uid("hl"),
          userId: prev.settings.userId,
          habitId,
          logDate: date,
          createdAt: nowIso(),
        };
        return { ...prev, habitLogs: [...prev.habitLogs, log] };
      });
    },
    [patch],
  );

  const addDream: StoreContextValue["addDream"] = useCallback(
    (input) => {
      const id = input.id ?? uid("dr");
      const dream: Dream = {
        id,
        userId: state.settings.userId,
        title: input.title.trim(),
        description: input.description ?? "",
        imageUrl: input.imageUrl ?? null,
        estimatedValue: input.estimatedValue ?? null,
        desiredDate: input.desiredDate ?? null,
        status: input.status ?? "sonho",
        goalId: input.goalId ?? null,
        createdAt: nowIso(),
      };
      patch((prev) => ({ ...prev, dreams: [dream, ...prev.dreams] }));
      return dream;
    },
    [patch, state.settings.userId],
  );

  const updateDream: StoreContextValue["updateDream"] = useCallback(
    (id, patchData) => {
      patch((prev) => ({
        ...prev,
        dreams: prev.dreams.map((d) => (d.id === id ? { ...d, ...patchData } : d)),
      }));
    },
    [patch],
  );

  const deleteDream: StoreContextValue["deleteDream"] = useCallback(
    (id) => {
      patch((prev) => ({ ...prev, dreams: prev.dreams.filter((d) => d.id !== id) }));
    },
    [patch],
  );

  const updateSettings: StoreContextValue["updateSettings"] = useCallback(
    (patchData) => {
      patch((prev) => ({
        ...prev,
        settings: { ...prev.settings, ...patchData, updatedAt: nowIso() },
      }));
    },
    [patch],
  );

  const resetDemo = useCallback(() => {
    const seeded = buildSeedState();
    patch(() => seeded);
  }, [patch]);

  const clearAll = useCallback(() => {
    clearLocalState();
    patch(() => ({ ...EMPTY_STATE, settings: { ...EMPTY_STATE.settings, userId: state.settings.userId } }));
  }, [patch, state.settings.userId]);

  const exportJson = useCallback(() => JSON.stringify(state, null, 2), [state]);

  const importJson = useCallback(
    (raw: string) => {
      try {
        const parsed = JSON.parse(raw) as AppState;
        if (!parsed || !Array.isArray(parsed.goals)) return false;
        patch(() => ({ ...EMPTY_STATE, ...parsed }));
        return true;
      } catch {
        return false;
      }
    },
    [patch],
  );

  /* ── Autenticação ──────────────────────────────────── */
  const signInWithGoogle = useCallback<StoreContextValue["signInWithGoogle"]>(
    async () => {
      const supabase = getSupabase();
      if (!supabase) {
        return {
          ok: false,
          message: "Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.",
        };
      }
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin },
      });
      if (error) {
        return {
          ok: false,
          message:
            "O login com Google ainda não está habilitado no projeto Supabase. Ative o provedor em Authentication → Providers → Google.",
        };
      }
      return { ok: true, message: "Redirecionando para o Google…" };
    },
    [],
  );

  const signInWithPassword = useCallback<StoreContextValue["signInWithPassword"]>(
    async (email, password) => {
      const supabase = getSupabase();
      if (!supabase) return { ok: false, message: "Supabase não configurado." };
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { ok: false, message: error.message };
      return { ok: true, message: "Login realizado." };
    },
    [],
  );

  const signUp = useCallback<StoreContextValue["signUp"]>(async (email, password) => {
    const supabase = getSupabase();
    if (!supabase) return { ok: false, message: "Supabase não configurado." };
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) return { ok: false, message: error.message };
    if (data.session) return { ok: true, message: "Conta criada. Bem-vindo!" };
    return {
      ok: true,
      message: "Conta criada. Confirme o e-mail recebido para ativar o acesso.",
    };
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabase();
    if (supabase) await supabase.auth.signOut();
    setUser(null);
    setMode("local");
    const local = getInitialState();
    prevRef.current = local;
    setState(local);
  }, []);

  /* ── Sincronizar sessão (login por OAuth) ──────────── */
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!session) return;
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        setUser({ id: session.user.id, email: session.user.email ?? null });
        setMode("cloud");
        try {
          const cloud = await cloudBackend.load(session.user.id);
          const isEmpty = cloud.goals.length === 0 && cloud.categories.length === 0;
          const initial = isEmpty ? buildSeedState() : cloud;
          if (isEmpty) {
            await cloudBackend.save(
              session.user.id,
              { ...initial, settings: { ...initial.settings, userId: session.user.id } },
              EMPTY_STATE,
            );
          }
          prevRef.current = initial;
          setState(initial);
        } catch {
          /* mantém o estado local */
        }
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const value = useMemo<StoreContextValue>(
    () => ({
      state,
      ready,
      mode,
      user,
      saving,
      addGoal,
      updateGoal,
      deleteGoal,
      addStep,
      toggleStep,
      updateStep,
      deleteStep,
      addProgress,
      deleteProgress,
      addCategory,
      updateCategory,
      deleteCategory,
      addHabit,
      updateHabit,
      deleteHabit,
      toggleHabitDay,
      addDream,
      updateDream,
      deleteDream,
      updateSettings,
      resetDemo,
      clearAll,
      exportJson,
      importJson,
      signInWithGoogle,
      signInWithPassword,
      signUp,
      signOut,
    }),
    [
      state,
      ready,
      mode,
      user,
      saving,
      addGoal,
      updateGoal,
      deleteGoal,
      addStep,
      toggleStep,
      updateStep,
      deleteStep,
      addProgress,
      deleteProgress,
      addCategory,
      updateCategory,
      deleteCategory,
      addHabit,
      updateHabit,
      deleteHabit,
      toggleHabitDay,
      addDream,
      updateDream,
      deleteDream,
      updateSettings,
      resetDemo,
      clearAll,
      exportJson,
      importJson,
      signInWithGoogle,
      signInWithPassword,
      signUp,
      signOut,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore precisa estar dentro de <DataProvider>");
  return ctx;
}

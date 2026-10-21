import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type {
  AppState,
  Category,
  Dream,
  Goal,
  Habit,
  HabitLog,
  ProgressEntry,
  Step,
  Achievement,
  Settings,
} from "@/lib/types";
import { EMPTY_STATE } from "@/lib/types";

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://ffhtyfrrenpoerkkltws.supabase.co";
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

let client: SupabaseClient | null = null;

/** Cliente Supabase do browser (null quando as variáveis não existem). */
export function getSupabase(): SupabaseClient | null {
  if (typeof window === "undefined") return null;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return client;
}

/* ── Mapeamento de linhas (snake_case ⇄ camelCase) ───── */

const toSnake = (value: string) =>
  value.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);

const COLUMNS: Record<string, string[]> = {
  categories: [
    "id", "user_id", "name", "slug", "color", "icon", "scope", "is_custom", "created_at",
  ],
  goals: [
    "id", "user_id", "title", "description", "category_id", "scope", "priority", "status",
    "cadence", "start_date", "due_date", "parent_goal_id", "metric_start", "metric_current",
    "metric_target", "metric_unit", "metric_direction", "icon", "cover", "notes",
    "created_at", "updated_at", "completed_at",
  ],
  steps: ["id", "user_id", "goal_id", "title", "done", "done_at", "position", "created_at"],
  progress: ["id", "user_id", "goal_id", "logged_at", "value", "note", "created_at"],
  habits: ["id", "user_id", "goal_id", "title", "icon", "color", "target_per_week", "created_at"],
  habit_logs: ["id", "user_id", "habit_id", "log_date", "created_at"],
  dreams: [
    "id", "user_id", "title", "description", "image_url", "estimated_value",
    "desired_date", "status", "goal_id", "created_at",
  ],
  achievements: ["id", "user_id", "key", "tier", "unlocked_at"],
};

const TABLE_MAP: Record<string, string> = {
  categories: "goal_categories",
  goals: "goals",
  steps: "goal_steps",
  progress: "goal_progress",
  habits: "habits",
  habit_logs: "habit_logs",
  dreams: "dreams",
  achievements: "goal_achievements",
};

type Row = Record<string, unknown>;

function entityToRow(entity: Row, columns: string[]): Row {
  const row: Row = {};
  columns.forEach((col) => {
    const key = col.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
    if (key in entity) row[col] = entity[key] ?? null;
  });
  return row;
}

function rowToEntity(row: Row): Row {
  const out: Row = {};
  Object.entries(row).forEach(([key, value]) => {
    out[key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())] = value;
  });
  return out;
}

/* ── Backend Supabase ─────────────────────────────────── */

export interface CloudBackend {
  load(userId: string): Promise<AppState>;
  save(userId: string, next: AppState, prev: AppState): Promise<void>;
  clear(userId: string): Promise<void>;
}

async function fetchTable(
  supabase: SupabaseClient,
  table: string,
  userId: string,
): Promise<Row[]> {
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .eq("user_id", userId);
  if (error) throw error;
  return (data ?? []) as Row[];
}

export const cloudBackend: CloudBackend = {
  async load(userId) {
    const supabase = getSupabase();
    if (!supabase) return { ...EMPTY_STATE };
    const [categories, goals, steps, progress, habits, habitLogs, dreams, achievements, settingsRes] =
      await Promise.all([
        fetchTable(supabase, "goal_categories", userId),
        fetchTable(supabase, "goals", userId),
        fetchTable(supabase, "goal_steps", userId),
        fetchTable(supabase, "goal_progress", userId),
        fetchTable(supabase, "habits", userId),
        fetchTable(supabase, "habit_logs", userId),
        fetchTable(supabase, "dreams", userId),
        fetchTable(supabase, "goal_achievements", userId),
        supabase.from("goal_settings").select("*").eq("user_id", userId).maybeSingle(),
      ]);

    const settingsRow = settingsRes.data
      ? (rowToEntity(settingsRes.data as Row) as unknown as Settings)
      : null;

    return {
      categories: categories.map((r) => rowToEntity(r) as unknown as Category),
      goals: goals.map((r) => rowToEntity(r) as unknown as Goal),
      steps: steps.map((r) => rowToEntity(r) as unknown as Step),
      progress: progress.map((r) => rowToEntity(r) as unknown as ProgressEntry),
      habits: habits.map((r) => rowToEntity(r) as unknown as Habit),
      habitLogs: habitLogs.map((r) => rowToEntity(r) as unknown as HabitLog),
      dreams: dreams.map((r) => rowToEntity(r) as unknown as Dream),
      achievements: achievements.map((r) => rowToEntity(r) as unknown as Achievement),
      settings: {
        ...EMPTY_STATE.settings,
        ...(settingsRow ?? {}),
        userId,
      },
    };
  },

  async save(userId, next, prev) {
    const supabase = getSupabase();
    if (!supabase) return;

    const collections = Object.keys(TABLE_MAP) as Array<
      keyof typeof TABLE_MAP
    >;
    const nextState = next as unknown as Record<string, Row[]>;
    const prevState = prev as unknown as Record<string, Row[]>;

    for (const key of collections) {
      const table = TABLE_MAP[key];
      const columns = COLUMNS[key];
      const nextItems = nextState[key] ?? [];
      const prevItems = prevState[key] ?? [];
      const prevMap = new Map(prevItems.map((i) => [i.id as string, i]));

      const changed = nextItems.filter((item) => {
        const before = prevMap.get(item.id as string);
        if (!before) return true;
        return JSON.stringify(before) !== JSON.stringify(item);
      });

      if (changed.length) {
        const rows = changed.map((item) => ({
          ...entityToRow(item, columns),
          user_id: userId,
        }));
        const { error } = await supabase.from(table).upsert(rows, { onConflict: "id" });
        if (error) console.error(`[smkpi] falha ao salvar ${table}`, error);
      }

      const nextIds = new Set(nextItems.map((i) => i.id as string));
      const removed = prevItems
        .filter((i) => !nextIds.has(i.id as string))
        .map((i) => i.id as string);
      if (removed.length) {
        const { error } = await supabase.from(table).delete().in("id", removed);
        if (error) console.error(`[smkpi] falha ao remover ${table}`, error);
      }
    }

    // configurações (upsert singular)
    const settingsRow = {
      ...entityToRow(next.settings as unknown as Row, [
        "user_id",
        "display_name",
        "currency",
        "theme",
        "notifications_enabled",
        "notify_stale_days",
        "notify_due_days",
        "notify_near_completion",
        "updated_at",
      ]),
      user_id: userId,
    };
    const { error: settingsError } = await supabase
      .from("goal_settings")
      .upsert(settingsRow, { onConflict: "user_id" });
    if (settingsError) console.error("[smkpi] falha ao salvar configurações", settingsError);
  },

  async clear(userId) {
    const supabase = getSupabase();
    if (!supabase) return;
    await Promise.all(
      Object.values(TABLE_MAP).map((table) =>
        supabase.from(table).delete().eq("user_id", userId),
      ),
    );
    await supabase.from("goal_settings").delete().eq("user_id", userId);
  },
};

export { toSnake };

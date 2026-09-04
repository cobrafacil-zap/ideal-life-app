"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  uploadExerciseImage,
  removeFile,
} from "@/lib/storage";
import type {
  Exercise,
  EquipmentKind,
  ExerciseCategory,
  MachineType,
  PrimaryMuscleGroup,
} from "@/types/database";

const PRIMARY_MUSCLE_VALUES: PrimaryMuscleGroup[] = [
  "peito",
  "costas",
  "pernas",
  "ombros",
  "bracos",
  "core",
  "cardio",
  "outro",
];

const EQUIPMENT_VALUES: EquipmentKind[] = [
  "nenhum",
  "haltere",
  "barra",
  "maquina",
  "elastico",
  "cabo",
  "kettlebell",
  "outro",
];

const EXERCISE_CATEGORY_VALUES: ExerciseCategory[] = [
  "peito",
  "costas",
  "ombros",
  "biceps",
  "triceps",
  "quadriceps",
  "posterior",
  "gluteos",
  "adutores",
  "abdutores",
  "panturrilha",
  "tibial",
  "abdomen",
  "lombar",
  "trapezio",
  "antebraco",
  "corpo_inteiro",
  "cardio",
];

const MACHINE_TYPE_VALUES: MachineType[] = [
  "selectorized",
  "plate_loaded",
  "cable",
  "smith",
  "free_weight",
  "bodyweight",
  "cardio",
  "other",
];

function clean(value: string | null | undefined, max = 200): string | null {
  if (value == null) return null;
  const trimmed = value.trim().slice(0, max);
  return trimmed.length ? trimmed : null;
}

function isPrimaryMuscle(value: string): value is PrimaryMuscleGroup {
  return (PRIMARY_MUSCLE_VALUES as string[]).includes(value);
}

function isEquipment(value: string): value is EquipmentKind {
  return (EQUIPMENT_VALUES as string[]).includes(value);
}

function isExerciseCategory(value: string): value is ExerciseCategory {
  return (EXERCISE_CATEGORY_VALUES as string[]).includes(value);
}

function isMachineType(value: string): value is MachineType {
  return (MACHINE_TYPE_VALUES as string[]).includes(value);
}

/** Lista enxuta das colunas usadas em todas as queries `exercises`.
 *  Mantém em um só lugar para evitar drift entre SELECTs. */
const EXERCISE_SELECT_COLUMNS_LEGACY =
  "id, user_id, name, primary_muscle, secondary_muscles, equipment, image_url, animation_url";

/** Mesmo SELECT mas incluindo as colunas novas (v2 da biblioteca).
 *  Antes da migration v2 do schema ser aplicada em produção, usar
 *  somente a versão LEGACY. */
const EXERCISE_SELECT_COLUMNS =
  "id, user_id, name, primary_muscle, secondary_muscles, equipment, image_url, animation_url, category, aliases, machine_type, instructions";

export type ExerciseListItem = Pick<
  Exercise,
  | "id"
  | "user_id"
  | "name"
  | "primary_muscle"
  | "secondary_muscles"
  | "equipment"
  | "image_url"
  | "animation_url"
  | "category"
  | "aliases"
  | "machine_type"
  | "instructions"
>;

/**
 * Lista exercícios do catálogo (user_id NULL) e/ou do próprio usuário.
 * A RLS já aplica essa lógica, mas mantemos o filtro explícito
 * pra evitar resultados espúrios caso a RLS mude no futuro.
 *
 * `scope`:
 * - "all"   (default): catálogo global + exercícios do próprio usuário
 * - "global": só catálogo global (user_id IS NULL) — usado no picker
 *   ao montar plano e na sessão de treino, onde o usuário só escolhe
 *   exercícios pré-determinados pelo sistema.
 * - "mine":  só exercícios do próprio usuário
 *
 * Tolerante à migration v2 ainda não aplicada: se o SELECT estendido
 * falhar (coluna inexistente), refaz a query só com as colunas legadas.
 */
export async function listExercises(
  filters?: {
    search?: string;
    primary_muscle?: PrimaryMuscleGroup | null;
    /** Filtro fino pela nova categoria (v2). Aceita qualquer ExerciseCategory. */
    category?: ExerciseCategory | null;
    equipment?: EquipmentKind | null;
    scope?: "all" | "global" | "mine";
  },
): Promise<ExerciseListItem[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const scope = filters?.scope ?? "all";
  let userFilter: string;
  if (scope === "global") {
    userFilter = "user_id.is.null";
  } else if (scope === "mine") {
    userFilter = `user_id.eq.${user.id}`;
  } else {
    userFilter = `user_id.is.null,user_id.eq.${user.id}`;
  }

  const selectColumns = EXERCISE_SELECT_COLUMNS;

  let query = supabase
    .from("exercises")
    .select(selectColumns)
    .or(userFilter)
    .order("name", { ascending: true })
    .limit(300);

  if (filters?.primary_muscle) {
    query = query.eq("primary_muscle", filters.primary_muscle);
  }
  if (filters?.equipment) {
    query = query.eq("equipment", filters.equipment);
  }
  // category / aliases.cs exigem migration v2 aplicada. São tentados primeiro;
  // se a query falhar (coluna inexistente), refazemos sem esses filtros.
  let useV2Search = true;
  if (filters?.category && isExerciseCategory(filters.category)) {
    query = query.eq("category", filters.category);
  }
  if (filters?.search) {
    const term = filters.search.trim();
    if (term) {
      // ilike em name + equipment + aliases (cs = contains no array text[]).
      query = query.or(
        `name.ilike.%${term}%,equipment.ilike.%${term}%,aliases.cs.{"${term.replace(/"/g, "")}"}`,
      );
    }
  }

  let data: unknown[] | null = null;

  const { data: primaryData, error } = await query;
  if (!error) {
    data = (primaryData ?? []) as unknown[];
  } else {
    // Se falhou (provavelmente coluna v2 ainda não existe), cai pro SELECT legado
    // sem os filtros `category` / `aliases.cs`.
    const msg = String(error.message ?? "").toLowerCase();
    const looksLikeMissingColumn =
      msg.includes("column") &&
      (msg.includes("does not exist") || msg.includes("não existe"));
    if (!looksLikeMissingColumn) {
      throw new Error(error.message);
    }
    useV2Search = false;
    let fallback = supabase
      .from("exercises")
      .select(EXERCISE_SELECT_COLUMNS_LEGACY)
      .or(userFilter)
      .order("name", { ascending: true })
      .limit(300);
    if (filters?.primary_muscle) {
      fallback = fallback.eq("primary_muscle", filters.primary_muscle);
    }
    if (filters?.equipment) {
      fallback = fallback.eq("equipment", filters.equipment);
    }
    if (filters?.search) {
      const term = filters.search.trim();
      if (term) {
        fallback = fallback.or(
          `name.ilike.%${term}%,equipment.ilike.%${term}%`,
        );
      }
    }
    const fallbackRes = await fallback;
    if (fallbackRes.error) throw new Error(fallbackRes.error.message);
    data = (fallbackRes.data ?? []) as unknown[];
  }

  // Se caímos no modo legado, normalize os campos novos para `null` / `[]`
  // para satisfazer o tipo ExerciseListItem (campos nullable no client).
  const rows = data as Array<Record<string, unknown>>;
  if (!useV2Search) {
    for (const row of rows) {
      if (row.category === undefined) row.category = null;
      if (row.aliases === undefined) row.aliases = [];
      if (row.machine_type === undefined) row.machine_type = null;
      if (row.instructions === undefined) row.instructions = null;
    }
  }
  return rows as unknown as ExerciseListItem[];
}

export async function getExercise(id: string): Promise<ExerciseListItem | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const res = await supabase
    .from("exercises")
    .select(EXERCISE_SELECT_COLUMNS)
    .eq("id", id)
    .or(`user_id.is.null,user_id.eq.${user.id}`)
    .maybeSingle();

  if (res.error) {
    // Fallback se as colunas v2 não existem no banco (migration não aplicada).
    const fallback = await supabase
      .from("exercises")
      .select(EXERCISE_SELECT_COLUMNS_LEGACY)
      .eq("id", id)
      .or(`user_id.is.null,user_id.eq.${user.id}`)
      .maybeSingle();
    if (fallback.error) throw new Error(fallback.error.message);
    return (fallback.data ?? null) as ExerciseListItem | null;
  }

  return (res.data ?? null) as ExerciseListItem | null;
}

export async function createExercise(input: {
  name: string;
  primary_muscle: PrimaryMuscleGroup;
  secondary_muscles?: string[];
  equipment?: EquipmentKind | null;
  substitutes?: string[];
}): Promise<ExerciseListItem> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const name = clean(input.name, 120);
  if (!name) throw new Error("Nome do exercício é obrigatório.");

  if (!isPrimaryMuscle(input.primary_muscle)) {
    throw new Error("Grupo muscular inválido.");
  }
  if (input.equipment && !isEquipment(input.equipment)) {
    throw new Error("Equipamento inválido.");
  }

  const insert = {
    user_id: user.id,
    name,
    primary_muscle: input.primary_muscle,
    secondary_muscles: (input.secondary_muscles ?? [])
      .map((s) => clean(s, 60))
      .filter((s): s is string => !!s),
    equipment: input.equipment ?? null,
    substitutes: (input.substitutes ?? [])
      .map((s) => clean(s, 120))
      .filter((s): s is string => !!s),
  };

  const { data, error } = await supabase
    .from("exercises")
    .insert(insert)
    .select(EXERCISE_SELECT_COLUMNS)
    .maybeSingle();

  let created: unknown = data;
  if (error) {
    // Fallback se as colunas v2 não existem no banco (migration não aplicada).
    const fallback = await supabase
      .from("exercises")
      .insert(insert)
      .select(EXERCISE_SELECT_COLUMNS_LEGACY)
      .maybeSingle();
    if (fallback.error) throw new Error(fallback.error.message);
    created = fallback.data;
  }
  if (!created) throw new Error("Falha ao criar exercício.");

  revalidatePath("/treinos");
  return created as ExerciseListItem;
}

export async function updateExercise(
  id: string,
  input: {
    name?: string;
    primary_muscle?: PrimaryMuscleGroup;
    secondary_muscles?: string[];
    equipment?: EquipmentKind | null;
    substitutes?: string[];
  },
): Promise<ExerciseListItem> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  // Garante que o exercício é do usuário (RLS já filtra, mas previne update em global).
  const { data: own } = await supabase
    .from("exercises")
    .select("user_id")
    .eq("id", id)
    .maybeSingle();

  if (!own || own.user_id !== user.id) {
    throw new Error("Só é possível editar exercícios próprios.");
  }

  const update: Record<string, unknown> = {};
  if (input.name !== undefined) {
    const name = clean(input.name, 120);
    if (!name) throw new Error("Nome inválido.");
    update.name = name;
  }
  if (input.primary_muscle !== undefined) {
    if (!isPrimaryMuscle(input.primary_muscle)) {
      throw new Error("Grupo muscular inválido.");
    }
    update.primary_muscle = input.primary_muscle;
  }
  if (input.equipment !== undefined) {
    if (input.equipment && !isEquipment(input.equipment)) {
      throw new Error("Equipamento inválido.");
    }
    update.equipment = input.equipment;
  }
  if (input.secondary_muscles !== undefined) {
    update.secondary_muscles = input.secondary_muscles
      .map((s) => clean(s, 60))
      .filter((s): s is string => !!s);
  }
  if (input.substitutes !== undefined) {
    update.substitutes = input.substitutes
      .map((s) => clean(s, 120))
      .filter((s): s is string => !!s);
  }

  if (Object.keys(update).length === 0) {
    throw new Error("Nada para atualizar.");
  }

  const { data, error } = await supabase
    .from("exercises")
    .update(update)
    .eq("id", id)
    .select(EXERCISE_SELECT_COLUMNS)
    .maybeSingle();

  let updated: unknown = data;
  if (error) {
    // Fallback se as colunas v2 não existem no banco (migration não aplicada).
    const fallback = await supabase
      .from("exercises")
      .update(update)
      .eq("id", id)
      .select(EXERCISE_SELECT_COLUMNS_LEGACY)
      .maybeSingle();
    if (fallback.error) throw new Error(fallback.error.message);
    updated = fallback.data;
  }
  if (!updated) throw new Error("Exercício não encontrado.");

  revalidatePath("/treinos");
  return updated as ExerciseListItem;
}

export async function deleteExercise(id: string): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const { data: own } = await supabase
    .from("exercises")
    .select("user_id, image_url")
    .eq("id", id)
    .maybeSingle();

  if (!own || own.user_id !== user.id) {
    throw new Error("Só é possível excluir exercícios próprios.");
  }

  const { error } = await supabase.from("exercises").delete().eq("id", id);
  if (error) throw new Error(error.message);

  if (own.image_url) {
    try {
      await removeFile(supabase, "workout-images", [own.image_url]);
    } catch {
      // ignora falha de storage — o exercício já foi removido.
    }
  }

  revalidatePath("/treinos");
}

const EXERCISE_IMAGE_MIMES = ["image/png", "image/jpeg", "image/webp"];
const EXERCISE_IMAGE_MAX = 4 * 1024 * 1024;

/**
 * Server Action que recebe FormData com `image: File` e sobe para o bucket
 * `workout-images` (pasta `userId/exerciseId.ext`). Retorna o storage_path
 * gravado no exercício.
 *
 * Tolera `image_url` prévio sendo uma URL externa (Wikimedia, etc.) — nesse
 * caso só sobrescreve sem tentar remover do storage.
 */
export async function uploadExerciseImageAction(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const exerciseId = String(formData.get("exercise_id") ?? "");
  if (!exerciseId) throw new Error("Exercício inválido.");

  const { data: own } = await supabase
    .from("exercises")
    .select("user_id, image_url")
    .eq("id", exerciseId)
    .maybeSingle();

  if (!own || own.user_id !== user.id) {
    throw new Error("Só é possível editar imagem de exercícios próprios.");
  }

  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Selecione uma imagem primeiro.");
  }
  if (!EXERCISE_IMAGE_MIMES.includes(file.type)) {
    throw new Error("Use PNG, JPG ou WebP.");
  }
  if (file.size > EXERCISE_IMAGE_MAX) {
    throw new Error("Arquivo maior que 4 MB.");
  }

  const path = await uploadExerciseImage(
    supabase,
    user.id,
    exerciseId,
    file,
    file.type,
  );

  const { error } = await supabase
    .from("exercises")
    .update({ image_url: path })
    .eq("id", exerciseId);
  if (error) throw new Error(error.message);

  revalidatePath("/treinos");
}

export async function removeExerciseImageAction(exerciseId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const { data: own } = await supabase
    .from("exercises")
    .select("user_id, image_url")
    .eq("id", exerciseId)
    .maybeSingle();

  if (!own || own.user_id !== user.id) {
    throw new Error("Só é possível remover imagem de exercícios próprios.");
  }
  if (!own.image_url) return;

  // Se for URL externa (Wikimedia, etc.), só zera o campo.
  // Se for storage path, tenta remover o objeto no bucket também.
  if (!/^https?:\/\//i.test(own.image_url)) {
    try {
      await removeFile(supabase, "workout-images", [own.image_url]);
    } catch {
      // ignora falha de storage — a remoção visual vai acontecer de qualquer forma.
    }
  }

  const { error } = await supabase
    .from("exercises")
    .update({ image_url: null })
    .eq("id", exerciseId);
  if (error) throw new Error(error.message);

  revalidatePath("/treinos");
}

/* =========================================================================
   FASE 3 — Planos de treino (workout_plans + workout_plan_exercises)
   ========================================================================= */

export type PlanSummary = {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  scheduled_weekday: number | null;
  updated_at: string;
  exercise_count: number;
};

export async function listWorkoutPlans(): Promise<PlanSummary[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const { data, error } = await supabase
    .from("workout_plans")
    .select(
      "id, name, description, is_active, sort_order, scheduled_weekday, updated_at, workout_plan_exercises(id)",
    )
    .eq("user_id", user.id)
    .order("is_active", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);

  return (data ?? []).map((row: any) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    is_active: row.is_active,
    sort_order: row.sort_order,
    scheduled_weekday: row.scheduled_weekday ?? null,
    updated_at: row.updated_at,
    exercise_count: Array.isArray(row.workout_plan_exercises)
      ? row.workout_plan_exercises.length
      : 0,
  }));
}

export type PlanDetail = {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  updated_at: string;
  exercises: {
    id: string;
    exercise_id: string | null;
    exercise_name: string;
    target_sets: number;
    target_reps: string;
    target_load: number | null;
    load_unit: "kg" | "lb";
    notes: string | null;
    sort_order: number;
  }[];
};

export async function getWorkoutPlan(id: string): Promise<PlanDetail | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const { data, error } = await supabase
    .from("workout_plans")
    .select(
      "id, name, description, is_active, sort_order, updated_at, workout_plan_exercises(id, exercise_id, exercise_name, target_sets, target_reps, target_load, load_unit, notes, sort_order)",
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;

  const exercises = (data.workout_plan_exercises ?? [])
    .map((row: any) => ({
      id: row.id,
      exercise_id: row.exercise_id,
      exercise_name: row.exercise_name,
      target_sets: row.target_sets,
      target_reps: row.target_reps,
      target_load: row.target_load,
      load_unit: row.load_unit,
      notes: row.notes,
      sort_order: row.sort_order,
    }))
    .sort((a: any, b: any) => a.sort_order - b.sort_order);

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    is_active: data.is_active,
    sort_order: data.sort_order,
    updated_at: data.updated_at,
    exercises,
  };
}

export async function createWorkoutPlan(input: {
  name: string;
  description?: string | null;
  scheduled_weekday?: number | null;
}): Promise<{ id: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const name = clean(input.name, 80);
  if (!name) throw new Error("Nome do treino é obrigatório.");

  const weekday = input.scheduled_weekday ?? null;
  if (weekday != null && (weekday < 0 || weekday > 6)) {
    throw new Error("Dia da semana inválido.");
  }

  // Tenta inserir com scheduled_weekday; se a coluna não existir
  // (migration não aplicada), faz fallback sem ela.
  const baseInsert: Record<string, unknown> = {
    user_id: user.id,
    name,
    description: clean(input.description ?? null, 280),
    sort_order: 0,
    is_active: false,
  };
  if (weekday != null) {
    baseInsert.scheduled_weekday = weekday;
  }

  let data: { id: string } | null = null;
  let lastError: string | null = null;
  {
    const { data: d1, error: e1 } = await supabase
      .from("workout_plans")
      .insert(baseInsert)
      .select("id")
      .maybeSingle();
    if (e1) {
      lastError = e1.message;
      // Fallback: remove scheduled_weekday e tenta de novo.
      const { scheduled_weekday: _drop, ...withoutWeekday } = baseInsert;
      const { data: d2, error: e2 } = await supabase
        .from("workout_plans")
        .insert(withoutWeekday)
        .select("id")
        .maybeSingle();
      if (e2) throw new Error(e2.message);
      data = d2;
    } else {
      data = d1;
    }
  }
  if (!data) throw new Error(lastError ?? "Falha ao criar treino.");

  try {
    revalidatePath("/treinos");
    revalidatePath("/treinos/meus-treinos");
  } catch {
    // revalidate pode falhar se a página corrente depende de algo que
    // mudou — não bloqueia o create.
  }
  return { id: data.id };
}

export async function updateWorkoutPlan(
  id: string,
  input: { name?: string; description?: string | null; is_active?: boolean },
): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const update: Record<string, unknown> = {};
  if (input.name !== undefined) {
    const name = clean(input.name, 80);
    if (!name) throw new Error("Nome inválido.");
    update.name = name;
  }
  if (input.description !== undefined) {
    update.description = clean(input.description, 280);
  }
  if (input.is_active !== undefined) {
    update.is_active = input.is_active;
    // Garante apenas um plano ativo: desativa os outros.
    if (input.is_active) {
      await supabase
        .from("workout_plans")
        .update({ is_active: false })
        .eq("user_id", user.id)
        .neq("id", id);
    }
  }
  if (Object.keys(update).length === 0) return;

  const { error } = await supabase
    .from("workout_plans")
    .update(update)
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);

  revalidatePath("/treinos");
  revalidatePath(`/treinos/meus-treinos/${id}`);
}

export async function deleteWorkoutPlan(id: string): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const { error } = await supabase
    .from("workout_plans")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);

  revalidatePath("/treinos");
}

function parseLoad(value: string | number | null | undefined): number | null {
  if (value == null || value === "") return null;
  const n = parseFloat(String(value).replace(",", "."));
  if (!Number.isFinite(n)) return null;
  if (n < 0 || n > 1000) return null;
  return Math.round(n * 100) / 100;
}

function parseSets(value: string | number | null | undefined): number {
  const n = typeof value === "number" ? value : parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(n) || n < 1) return 3;
  return Math.min(Math.max(Math.round(n), 1), 20);
}

export async function addPlanExercise(
  planId: string,
  input: {
    exercise_id: string | null;
    exercise_name: string;
    target_sets: number | string;
    target_reps: string;
    target_load?: string | number | null;
    load_unit?: "kg" | "lb";
    notes?: string | null;
  },
): Promise<{ id: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const name = clean(input.exercise_name, 120);
  if (!name) throw new Error("Nome do exercício é obrigatório.");

  // Descobre o próximo sort_order.
  const { data: last } = await supabase
    .from("workout_plan_exercises")
    .select("sort_order")
    .eq("workout_plan_id", planId)
    .eq("user_id", user.id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrder = ((last?.sort_order ?? -1) + 1) | 0;

  const insert = {
    workout_plan_id: planId,
    user_id: user.id,
    exercise_id: input.exercise_id,
    exercise_name: name,
    target_sets: parseSets(input.target_sets),
    target_reps: clean(input.target_reps, 40) ?? "10",
    target_load: parseLoad(input.target_load ?? null),
    load_unit: input.load_unit === "lb" ? "lb" : "kg",
    notes: clean(input.notes ?? null, 280),
    sort_order: nextOrder,
  };

  const { data, error } = await supabase
    .from("workout_plan_exercises")
    .insert(insert)
    .select("id")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Falha ao adicionar exercício.");

  revalidatePath(`/treinos/meus-treinos/${planId}`);
  return { id: data.id };
}

export async function updatePlanExercise(
  rowId: string,
  input: {
    target_sets?: number | string;
    target_reps?: string;
    target_load?: string | number | null;
    load_unit?: "kg" | "lb";
    notes?: string | null;
  },
): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const update: Record<string, unknown> = {};
  if (input.target_sets !== undefined) update.target_sets = parseSets(input.target_sets);
  if (input.target_reps !== undefined) {
    const v = clean(input.target_reps, 40);
    if (!v) throw new Error("Repetições alvo inválidas.");
    update.target_reps = v;
  }
  if (input.target_load !== undefined) update.target_load = parseLoad(input.target_load);
  if (input.load_unit !== undefined) update.load_unit = input.load_unit === "lb" ? "lb" : "kg";
  if (input.notes !== undefined) update.notes = clean(input.notes, 280);
  if (Object.keys(update).length === 0) return;

  const { error } = await supabase
    .from("workout_plan_exercises")
    .update(update)
    .eq("id", rowId)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);

  revalidatePath(`/treinos/meus-treinos`);
}

export async function removePlanExercise(rowId: string): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const { error } = await supabase
    .from("workout_plan_exercises")
    .delete()
    .eq("id", rowId)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);

  revalidatePath(`/treinos/meus-treinos`);
}

/**
 * Reordena os itens do plano. Recebe o array de ids na ordem desejada.
 * Faz updates em transação lógica (cada um falha independentemente, mas
 * o sort_order é consistente porque é sequencial).
 */
export async function reorderPlanExercises(
  planId: string,
  orderedIds: string[],
): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  for (let i = 0; i < orderedIds.length; i++) {
    const id = orderedIds[i];
    const { error } = await supabase
      .from("workout_plan_exercises")
      .update({ sort_order: i })
      .eq("id", id)
      .eq("workout_plan_id", planId)
      .eq("user_id", user.id);
    if (error) throw new Error(error.message);
  }

  revalidatePath(`/treinos/meus-treinos/${planId}`);
}

/* =========================================================================
   FASE 4 — Agendamento semanal
   ========================================================================= */

export async function setPlanWeekday(
  planId: string,
  weekday: number | null,
): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  if (weekday != null && (!Number.isInteger(weekday) || weekday < 0 || weekday > 6)) {
    throw new Error("Dia da semana inválido.");
  }

  const { error } = await supabase
    .from("workout_plans")
    .update({ scheduled_weekday: weekday })
    .eq("id", planId)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);

  revalidatePath("/treinos/agenda");
  revalidatePath("/treinos");
}

/* =========================================================================
   FASE 5 — Execução de treino e séries
   ========================================================================= */

export async function startWorkoutSession(input: {
  workout_plan_id?: string | null;
  workout_name: string;
}): Promise<{ id: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const name = clean(input.workout_name, 80) ?? "Treino";

  // Garante que não existe sessão aberta (1 por vez).
  const { data: open } = await supabase
    .from("workout_sessions")
    .select("id")
    .eq("user_id", user.id)
    .is("finished_at", null)
    .limit(1);
  if (open && open.length > 0) {
    throw new Error("Você já tem um treino em andamento.");
  }

  const { data, error } = await supabase
    .from("workout_sessions")
    .insert({
      user_id: user.id,
      workout_plan_id: input.workout_plan_id ?? null,
      workout_name: name,
      started_at: new Date().toISOString(),
    })
    .select("id")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Falha ao iniciar treino.");

  revalidatePath("/treinos");
  return { id: data.id };
}

export async function cancelWorkoutSession(sessionId: string): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  // FK ON DELETE CASCADE em exercise_sets garante limpeza.
  const { error } = await supabase
    .from("workout_sessions")
    .delete()
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .is("finished_at", null);
  if (error) throw new Error(error.message);

  revalidatePath("/treinos");
  revalidatePath("/hoje");
  revalidatePath("/saude");
}

export async function finishWorkoutSession(input: {
  session_id: string;
  duration_min: number;
  user_rpe?: number | null;
}): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const dur = Math.round(input.duration_min);
  if (!Number.isFinite(dur) || dur < 1 || dur > 1440) {
    throw new Error("Duração inválida.");
  }
  const rpe = input.user_rpe ?? null;
  if (rpe != null && (!Number.isInteger(rpe) || rpe < 1 || rpe > 10)) {
    throw new Error("RPE deve estar entre 1 e 10.");
  }

  const { error } = await supabase
    .from("workout_sessions")
    .update({
      finished_at: new Date().toISOString(),
      duration_min: dur,
      duration_h: Math.round((dur / 60) * 100) / 100,
      user_rpe: rpe,
    })
    .eq("id", input.session_id)
    .eq("user_id", user.id)
    .is("finished_at", null);
  if (error) throw new Error(error.message);

  revalidatePath("/treinos");
  revalidatePath("/hoje");
  revalidatePath("/saude");
}

export async function logSet(input: {
  session_id: string;
  exercise_id: string | null;
  exercise_name: string;
  set_number: number;
  reps: number | null;
  load: number | null;
  load_unit: "kg" | "lb";
  rpe?: number | null;
  discomfort?: number | null;
}): Promise<{ id: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const name = clean(input.exercise_name, 120);
  if (!name) throw new Error("Exercício inválido.");

  if (!Number.isInteger(input.set_number) || input.set_number < 1 || input.set_number > 50) {
    throw new Error("Número de série inválido.");
  }
  if (input.reps != null && (!Number.isInteger(input.reps) || input.reps < 0 || input.reps > 100)) {
    throw new Error("Repetições devem estar entre 0 e 100.");
  }
  if (input.load != null && (!Number.isFinite(input.load) || input.load < 0 || input.load > 1000)) {
    throw new Error("Carga inválida.");
  }
  if (input.rpe != null && (!Number.isInteger(input.rpe) || input.rpe < 1 || input.rpe > 10)) {
    throw new Error("RPE deve estar entre 1 e 10.");
  }
  if (input.discomfort != null && (!Number.isInteger(input.discomfort) || input.discomfort < 0 || input.discomfort > 10)) {
    throw new Error("Desconforto deve estar entre 0 e 10.");
  }

  const { data, error } = await supabase
    .from("exercise_sets")
    .insert({
      workout_session_id: input.session_id,
      user_id: user.id,
      exercise_id: input.exercise_id,
      exercise_name: name,
      set_number: input.set_number,
      reps: input.reps,
      load: input.load,
      load_unit: input.load_unit === "lb" ? "lb" : "kg",
      rpe: input.rpe ?? null,
      discomfort: input.discomfort ?? null,
    })
    .select("id")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Falha ao registrar série.");

  revalidatePath(`/treinos/sessao/${input.session_id}`);
  return { id: data.id };
}

export async function updateSet(
  setId: string,
  input: {
    reps?: number | null;
    load?: number | null;
    rpe?: number | null;
    discomfort?: number | null;
  },
): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const update: Record<string, unknown> = {};
  if (input.reps !== undefined) update.reps = input.reps;
  if (input.load !== undefined) update.load = input.load;
  if (input.rpe !== undefined) update.rpe = input.rpe;
  if (input.discomfort !== undefined) update.discomfort = input.discomfort;
  if (Object.keys(update).length === 0) return;

  const { error } = await supabase
    .from("exercise_sets")
    .update(update)
    .eq("id", setId)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);

  revalidatePath(`/treinos`);
}

export async function deleteSet(setId: string): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const { error } = await supabase
    .from("exercise_sets")
    .delete()
    .eq("id", setId)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);

  revalidatePath(`/treinos`);
}

/* =========================================================================
   FASE 6 — Histórico e progressão
   ========================================================================= */

export type SessionSummary = {
  id: string;
  workout_name: string;
  started_at: string;
  finished_at: string | null;
  duration_h: number | null;
  duration_min: number | null;
  user_rpe: number | null;
  total_volume_kg: number;
  set_count: number;
};

export async function listWorkoutHistory(filters?: {
  rangeDays?: 7 | 30 | 90 | 365;
  limit?: number;
}): Promise<SessionSummary[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const limit = filters?.limit ?? 60;
  const rangeDays = filters?.rangeDays ?? 30;
  const since = new Date(Date.now() - rangeDays * 24 * 3600 * 1000).toISOString();

  const { data, error } = await supabase
    .from("workout_sessions")
    .select(
      "id, workout_name, started_at, finished_at, duration_h, duration_min, user_rpe, exercise_sets(reps, load, load_unit)",
    )
    .eq("user_id", user.id)
    .not("finished_at", "is", null)
    .gte("started_at", since)
    .order("started_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);

  return (data ?? []).map((row: any) => {
    const sets = Array.isArray(row.exercise_sets) ? row.exercise_sets : [];
    const totalVolume = sets.reduce((acc: number, s: any) => {
      if (s.reps == null || s.load == null) return acc;
      const kg = s.load_unit === "lb" ? s.load * 0.4536 : s.load;
      return acc + s.reps * kg;
    }, 0);
    return {
      id: row.id,
      workout_name: row.workout_name,
      started_at: row.started_at,
      finished_at: row.finished_at,
      duration_h: row.duration_h,
      duration_min: row.duration_min,
      user_rpe: row.user_rpe,
      total_volume_kg: Math.round(totalVolume * 100) / 100,
      set_count: sets.length,
    };
  });
}

export type SessionDetail = {
  id: string;
  workout_name: string;
  started_at: string;
  finished_at: string | null;
  duration_min: number | null;
  user_rpe: number | null;
  sets: {
    id: string;
    exercise_id: string | null;
    exercise_name: string;
    set_number: number;
    reps: number | null;
    load: number | null;
    load_unit: "kg" | "lb";
    rpe: number | null;
    discomfort: number | null;
  }[];
};

export async function getWorkoutSessionDetail(
  sessionId: string,
): Promise<SessionDetail | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const { data, error } = await supabase
    .from("workout_sessions")
    .select(
      "id, workout_name, started_at, finished_at, duration_min, user_rpe, exercise_sets(id, exercise_id, exercise_name, set_number, reps, load, load_unit, rpe, discomfort)",
    )
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;

  const sets = (data.exercise_sets ?? [])
    .map((row: any) => ({
      id: row.id,
      exercise_id: row.exercise_id,
      exercise_name: row.exercise_name,
      set_number: row.set_number,
      reps: row.reps,
      load: row.load,
      load_unit: row.load_unit,
      rpe: row.rpe,
      discomfort: row.discomfort,
    }))
    .sort((a: any, b: any) => a.exercise_name.localeCompare(b.exercise_name) || a.set_number - b.set_number);

  return {
    id: data.id,
    workout_name: data.workout_name,
    started_at: data.started_at,
    finished_at: data.finished_at,
    duration_min: data.duration_min,
    user_rpe: data.user_rpe,
    sets,
  };
}

export type ExerciseProgressionPoint = {
  session_id: string;
  started_at: string;
  top_load_kg: number | null;
  reps_at_top: number | null;
  total_volume_kg: number;
  total_sets: number;
  avg_rpe: number | null;
  avg_discomfort: number | null;
};

export async function getExerciseProgression(
  exerciseId: string,
  opts?: { rangeDays?: number },
): Promise<ExerciseProgressionPoint[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const rangeDays = opts?.rangeDays ?? 90;
  const since = new Date(Date.now() - rangeDays * 24 * 3600 * 1000).toISOString();

  const { data, error } = await supabase
    .from("exercise_sets")
    .select(
      "workout_session_id, exercise_id, exercise_name, reps, load, load_unit, workout_sessions!inner(id, user_id, started_at, finished_at)",
    )
    .eq("exercise_id", exerciseId)
    .eq("user_id", user.id)
    .gte("workout_sessions.started_at", since)
    .order("workout_sessions.started_at", { ascending: true });
  if (error) throw new Error(error.message);

  const bySession = new Map<string, {
    session_id: string;
    started_at: string;
    sets: { reps: number | null; load: number | null; load_unit: "kg" | "lb"; rpe: number | null; discomfort: number | null }[];
  }>();

  for (const row of data ?? []) {
    const ws: any = (row as any).workout_sessions;
    if (!ws || ws.user_id !== user.id || !ws.finished_at) continue;
    const sessionId = ws.id as string;
    if (!bySession.has(sessionId)) {
      bySession.set(sessionId, {
        session_id: sessionId,
        started_at: ws.started_at,
        sets: [],
      });
    }
    bySession.get(sessionId)!.sets.push({
      reps: row.reps,
      load: row.load,
      load_unit: row.load_unit,
      rpe: (row as any).rpe ?? null,
      discomfort: (row as any).discomfort ?? null,
    });
  }

  const points: ExerciseProgressionPoint[] = [];
  for (const [, v] of bySession) {
    let topLoadKg: number | null = null;
    let repsAtTop = 0;
    let totalVol = 0;
    let rpeSum = 0;
    let rpeN = 0;
    let discomfortSum = 0;
    let discomfortN = 0;
    for (const s of v.sets) {
      if (s.load != null) {
        const kg = s.load_unit === "lb" ? s.load * 0.4536 : s.load;
        if (topLoadKg == null || kg > topLoadKg) {
          topLoadKg = Math.round(kg * 100) / 100;
          repsAtTop = s.reps ?? 0;
        }
        if (s.reps != null && s.reps > 0) totalVol += s.reps * kg;
      }
      if (s.rpe != null) {
        rpeSum += s.rpe;
        rpeN++;
      }
      if (s.discomfort != null) {
        discomfortSum += s.discomfort;
        discomfortN++;
      }
    }
    points.push({
      session_id: v.session_id,
      started_at: v.started_at,
      top_load_kg: topLoadKg,
      reps_at_top: repsAtTop,
      total_volume_kg: Math.round(totalVol * 100) / 100,
      total_sets: v.sets.length,
      avg_rpe: rpeN > 0 ? Math.round((rpeSum / rpeN) * 10) / 10 : null,
      avg_discomfort: discomfortN > 0 ? Math.round((discomfortSum / discomfortN) * 10) / 10 : null,
    });
  }

  return points.sort(
    (a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime(),
  );
}

export type ExerciseHistoryItem = {
  exercise_id: string;
  exercise_name: string;
  primary_muscle: string | null;
  sessions: number;
  total_sets: number;
  top_load_kg: number | null;
};

export async function listExerciseHistory(opts?: {
  rangeDays?: number;
}): Promise<ExerciseHistoryItem[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const rangeDays = opts?.rangeDays ?? 90;
  const since = new Date(Date.now() - rangeDays * 24 * 3600 * 1000).toISOString();

  const { data, error } = await supabase
    .from("exercise_sets")
    .select(
      "exercise_id, exercise_name, reps, load, load_unit, workout_sessions!inner(id, user_id, finished_at, started_at), exercises(primary_muscle)",
    )
    .eq("user_id", user.id)
    .gte("workout_sessions.started_at", since)
    .limit(2000);
  if (error) throw new Error(error.message);

  const map = new Map<string, ExerciseHistoryItem>();
  for (const row of data ?? []) {
    const ws: any = (row as any).workout_sessions;
    if (!ws || ws.user_id !== user.id || !ws.finished_at) continue;
    const ex: any = (row as any).exercises;
    const exerciseId = (row.exercise_id as string | null) ?? `orphan:${row.exercise_name}`;
    if (!map.has(exerciseId)) {
      map.set(exerciseId, {
        exercise_id: exerciseId,
        exercise_name: row.exercise_name,
        primary_muscle: ex?.primary_muscle ?? null,
        sessions: 0,
        total_sets: 0,
        top_load_kg: null,
      });
    }
    const item = map.get(exerciseId)!;
    item.total_sets += 1;
    if (row.load != null) {
      const kg = row.load_unit === "lb" ? row.load * 0.4536 : row.load;
      if (item.top_load_kg == null || kg > item.top_load_kg) {
        item.top_load_kg = Math.round(kg * 100) / 100;
      }
    }
  }

  // Conta sessões distintas por exercício.
  for (const [, item] of map) {
    const { data: countRows, error: countErr } = await supabase
      .from("exercise_sets")
      .select("workout_session_id, workout_sessions!inner(id, user_id, finished_at)")
      .eq("user_id", user.id)
      .eq("exercise_name", item.exercise_name)
      .gte("workout_sessions.started_at", since)
      .limit(2000);
    if (countErr) continue;
    const ids = new Set<string>();
    for (const r of countRows ?? []) {
      const ws: any = (r as any).workout_sessions;
      if (ws?.finished_at) ids.add(ws.id);
    }
    item.sessions = ids.size;
  }

  return Array.from(map.values()).sort(
    (a, b) => (b.top_load_kg ?? 0) - (a.top_load_kg ?? 0),
  );
}

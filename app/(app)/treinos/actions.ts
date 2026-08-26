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

export type ExerciseListItem = Pick<
  Exercise,
  | "id"
  | "user_id"
  | "name"
  | "primary_muscle"
  | "secondary_muscles"
  | "equipment"
  | "image_url"
  | "created_at"
>;

/**
 * Lista exercícios do catálogo (user_id NULL) + do próprio usuário.
 * A RLS já aplica essa lógica, mas mantemos o filtro explícito
 * pra evitar resultados espúrios caso a RLS mude no futuro.
 */
export async function listExercises(filters?: {
  search?: string;
  primary_muscle?: PrimaryMuscleGroup | null;
  equipment?: EquipmentKind | null;
}): Promise<ExerciseListItem[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  let query = supabase
    .from("exercises")
    .select(
      "id, user_id, name, primary_muscle, secondary_muscles, equipment, image_url, created_at",
    )
    .or(`user_id.is.null,user_id.eq.${user.id}`)
    .order("name", { ascending: true })
    .limit(300);

  if (filters?.primary_muscle) {
    query = query.eq("primary_muscle", filters.primary_muscle);
  }
  if (filters?.equipment) {
    query = query.eq("equipment", filters.equipment);
  }
  if (filters?.search) {
    const term = filters.search.trim();
    if (term) {
      // ilike em duas colunas principais (nome + equipamento).
      query = query.or(
        `name.ilike.%${term}%,equipment.ilike.%${term}%`,
      );
    }
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as ExerciseListItem[];
}

export async function getExercise(id: string): Promise<ExerciseListItem | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const { data, error } = await supabase
    .from("exercises")
    .select(
      "id, user_id, name, primary_muscle, secondary_muscles, equipment, image_url, created_at",
    )
    .eq("id", id)
    .or(`user_id.is.null,user_id.eq.${user.id}`)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data ?? null) as ExerciseListItem | null;
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
    .select(
      "id, user_id, name, primary_muscle, secondary_muscles, equipment, image_url, created_at",
    )
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Falha ao criar exercício.");

  revalidatePath("/treinos");
  return data as ExerciseListItem;
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
    .select(
      "id, user_id, name, primary_muscle, secondary_muscles, equipment, image_url, created_at",
    )
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Exercício não encontrado.");

  revalidatePath("/treinos");
  return data as ExerciseListItem;
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

  try {
    await removeFile(supabase, "workout-images", [own.image_url]);
  } catch {
    // ignora falha de storage — a remoção visual vai acontecer de qualquer forma.
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
      "id, name, description, is_active, sort_order, updated_at, workout_plan_exercises(id)",
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
    rest_seconds: number;
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
      "id, name, description, is_active, sort_order, updated_at, workout_plan_exercises(id, exercise_id, exercise_name, target_sets, target_reps, target_load, load_unit, rest_seconds, notes, sort_order)",
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
      rest_seconds: row.rest_seconds,
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
}): Promise<{ id: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const name = clean(input.name, 80);
  if (!name) throw new Error("Nome do plano é obrigatório.");

  const { data, error } = await supabase
    .from("workout_plans")
    .insert({
      user_id: user.id,
      name,
      description: clean(input.description ?? null, 280),
      sort_order: 0,
      is_active: false,
    })
    .select("id")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Falha ao criar plano.");

  revalidatePath("/treinos");
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
  revalidatePath(`/treinos/planos/${id}`);
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

function parseLoad(value: string | null | undefined): number | null {
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

function parseRest(value: string | number | null | undefined): number {
  const n = typeof value === "number" ? value : parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(n) || n < 0) return 60;
  return Math.min(Math.max(Math.round(n), 0), 600);
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
    rest_seconds?: number | string;
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
    rest_seconds: parseRest(input.rest_seconds ?? 60),
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

  revalidatePath(`/treinos/planos/${planId}`);
  return { id: data.id };
}

export async function updatePlanExercise(
  rowId: string,
  input: {
    target_sets?: number | string;
    target_reps?: string;
    target_load?: string | number | null;
    load_unit?: "kg" | "lb";
    rest_seconds?: number | string;
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
  if (input.rest_seconds !== undefined) update.rest_seconds = parseRest(input.rest_seconds);
  if (input.notes !== undefined) update.notes = clean(input.notes, 280);
  if (Object.keys(update).length === 0) return;

  const { error } = await supabase
    .from("workout_plan_exercises")
    .update(update)
    .eq("id", rowId)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);

  revalidatePath(`/treinos/planos`);
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

  revalidatePath(`/treinos/planos`);
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

  revalidatePath(`/treinos/planos/${planId}`);
}

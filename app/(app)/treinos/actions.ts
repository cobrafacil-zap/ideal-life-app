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

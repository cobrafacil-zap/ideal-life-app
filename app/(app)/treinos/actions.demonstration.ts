"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { removeFile } from "@/lib/storage";

const ALLOWED_DEMO_TYPES = ["gif", "video", "image"] as const;
const MAX_DEMO_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Server action: faz upload de uma demonstração visual (GIF/vídeo) para um exercício.
 *
 * - Valida que o exercício pertence ao usuário
 * - Valida tipo de arquivo (gif/mp4/webp) e tamanho (máx 10MB)
 * - Faz upload para o bucket `exercise-demonstrations`
 * - Atualiza o campo `demonstration_url` e `demonstration_type` no banco
 */
export async function uploadExerciseDemonstrationAction(
  formData: FormData
): Promise<{ url: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const exerciseId = formData.get("exercise_id") as string;
  const demoType = formData.get("demonstration_type") as string;
  const file = formData.get("file") as File;

  if (!exerciseId) throw new Error("ID do exercício é obrigatório.");
  if (!ALLOWED_DEMO_TYPES.includes(demoType as any)) {
    throw new Error("Tipo de demonstração inválido.");
  }
  if (!file) throw new Error("Arquivo é obrigatório.");
  if (file.size > MAX_DEMO_SIZE) {
    throw new Error("Arquivo muito grande. Máximo 10MB.");
  }

  // Verifica se o exercício pertence ao usuário
  const { data: exercise } = await supabase
    .from("exercises")
    .select("id, user_id, demonstration_url")
    .eq("id", exerciseId)
    .maybeSingle();

  if (!exercise || exercise.user_id !== user.id) {
    throw new Error("Exercício não encontrado ou não pertence ao usuário.");
  }

  // Remove arquivo antigo se existir
  if (exercise.demonstration_url) {
    try {
      await removeFile(supabase, "exercise-demonstrations", [
        exercise.demonstration_url,
      ]);
    } catch {
      // ignora se já foi removido
    }
  }

  // Upload para o bucket exercise-demonstrations
  const path = await uploadExerciseImage(supabase, user.id, exerciseId, file);

  // Atualiza o banco
  const { error } = await supabase
    .from("exercises")
    .update({
      demonstration_url: path,
      demonstration_type: demoType,
    })
    .eq("id", exerciseId);

  if (error) throw new Error(error.message);

  revalidatePath("/treinos");
  return { url: path };
}

/**
 * Server action: remove a demonstração visual de um exercício.
 */
export async function removeExerciseDemonstrationAction(
  exerciseId: string
): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  // Busca o caminho atual
  const { data: exercise } = await supabase
    .from("exercises")
    .select("id, user_id, demonstration_url")
    .eq("id", exerciseId)
    .maybeSingle();

  if (!exercise || exercise.user_id !== user.id) {
    throw new Error("Exercício não encontrado ou não pertence ao usuário.");
  }

  // Remove do storage
  if (exercise.demonstration_url) {
    try {
      await removeFile(supabase, "exercise-demonstrations", [
        exercise.demonstration_url,
      ]);
    } catch {
      // ignora se já foi removido
    }
  }

  // Limpa o banco
  const { error } = await supabase
    .from("exercises")
    .update({
      demonstration_url: null,
      demonstration_type: null,
    })
    .eq("id", exerciseId);

  if (error) throw new Error(error.message);

  revalidatePath("/treinos");
}

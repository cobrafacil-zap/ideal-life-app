"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { removeFile } from "@/lib/storage";
import { lookupExerciseImage } from "@/lib/exercise-image-map";
import type { Exercise } from "@/types/database";

const IMAGE_EXT_RE = /\.(png|jpe?g|webp|gif|svg)(\?|$|#)/i;
const ALLOWED_PROTOCOLS = ["https:", "http:"];

/**
 * Server action: aplica a imagem padrão do mapa ao exercício.
 *
 * - Só funciona se `image_url` está NULL (não sobrescreve upload do usuário).
 * - Pode ser chamada em exercícios próprios OU do catálogo — para o
 *   catálogo, atualiza todos os usuários que tenham esse nome em seu
 *   library (no-op se não houver correspondência).
 *
 * Retorna a URL gravada ou null se não houver mapeamento.
 */
export async function setExerciseImageFromMapAction(
  exerciseId: string,
): Promise<{ url: string } | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const { data: own } = await supabase
    .from("exercises")
    .select("user_id, name, image_url")
    .eq("id", exerciseId)
    .maybeSingle();

  if (!own) throw new Error("Exercício não encontrado.");
  if (own.user_id !== user.id) {
    throw new Error("Só é possível editar imagem de exercícios próprios.");
  }
  if (own.image_url) {
    throw new Error("Exercício já tem imagem — remova antes de aplicar a padrão.");
  }

  const mapped = lookupExerciseImage(own.name);
  if (!mapped?.url) {
    throw new Error("Não há imagem padrão mapeada para esse exercício.");
  }

  const { error } = await supabase
    .from("exercises")
    .update({ image_url: mapped.url })
    .eq("id", exerciseId);
  if (error) throw new Error(error.message);

  revalidatePath("/treinos");
  return { url: mapped.url };
}

/**
 * Server action: grava uma URL externa como `image_url` do exercício.
 *
 * - Valida que a URL é http(s) e aponta para uma imagem (.png/.jpg/
 *   .jpeg/.webp/.gif/.svg).
 * - Só funciona em exercícios próprios (`user_id !== null`).
 * - Não chama Supabase Storage — grava direto no banco.
 */
export async function setExerciseExternalImageAction(
  exerciseId: string,
  rawUrl: string,
): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const url = String(rawUrl ?? "").trim();
  if (!url) throw new Error("Informe uma URL válida.");

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("URL inválida.");
  }
  if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
    throw new Error("URL precisa começar com http:// ou https://.");
  }
  if (!IMAGE_EXT_RE.test(parsed.pathname + parsed.search)) {
    throw new Error("URL precisa apontar para um arquivo de imagem (png/jpg/webp/gif/svg).");
  }

  const { data: own } = await supabase
    .from("exercises")
    .select("user_id, image_url")
    .eq("id", exerciseId)
    .maybeSingle();

  if (!own || own.user_id !== user.id) {
    throw new Error("Só é possível definir URL externa em exercícios próprios.");
  }

  const { error } = await supabase
    .from("exercises")
    .update({ image_url: url })
    .eq("id", exerciseId);
  if (error) throw new Error(error.message);

  revalidatePath("/treinos");
}

/**
 * Server action: remove a imagem do exercício.
 *
 * - Funciona tanto para storage path quanto para URL externa — para
 *   URL externa, simplesmente zera o campo (não chama Supabase Storage).
 * - Protegido: só exercícios próprios.
 */
export async function clearExerciseImageAction(exerciseId: string): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const { data: own } = await supabase
    .from("exercises")
    .select("user_id, image_url")
    .eq("id", exerciseId)
    .maybeSingle();

  if (!own || own.user_id !== user.id) {
    throw new Error("Só é possível remover imagem de exercícios próprios.");
  }

  if (own.image_url && !/^https?:\/\//i.test(own.image_url)) {
    try {
      await removeFile(supabase, "workout-images", [own.image_url]);
    } catch {
      // ignora — pode já ter sido removido
    }
  }

  const { error } = await supabase
    .from("exercises")
    .update({ image_url: null })
    .eq("id", exerciseId);
  if (error) throw new Error(error.message);

  revalidatePath("/treinos");
}

export type ExerciseImageActionResult = { url: string };

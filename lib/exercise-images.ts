import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { getSignedFileUrl } from "./storage";
import { lookupExerciseImage } from "./exercise-image-map";

/**
 * Resolve a URL final de mídia de um exercício, com cascata em 3 níveis:
 *
 *   1. Storage path do upload do próprio usuário (image_url armazenando
 *      algo relativo — `userId/exerciseId.ext`). Nesse caso é gerada
 *      uma signed URL temporária do bucket privado `workout-images`.
 *   2. URL absoluta (http/https) — pode ter sido gravada via:
 *        - Migration de catálogo (Wikimedia Commons)
 *        - "Colar URL externa" no editor do usuário
 *      Nesse caso retornamos a URL direto, sem signed URL.
 *   3. Fallback no mapa padrão por nome (cinto de segurança caso a
 *      migration ainda não tenha rodado em algum ambiente).
 *
 * Se nada resolver, retorna null (o componente ExerciseMedia cai no
 * placeholder SVG).
 *
 * Aceita também `animationPath` (gif/mp4/webm) que tem prioridade sobre
 * a imagem estática quando presente.
 */
export async function getExerciseImageSignedUrl(
  supabase: SupabaseClient<Database>,
  storagePath: string | null | undefined,
): Promise<string | null> {
  if (!storagePath) return null;
  if (isAbsoluteHttpUrl(storagePath)) return storagePath;
  return getSignedFileUrl(supabase, "workout-images", storagePath, 3600);
}

export async function getExerciseMediaSignedUrl(
  supabase: SupabaseClient<Database>,
  imagePath: string | null | undefined,
  animationPath: string | null | undefined,
  fallbackName?: string | null,
): Promise<string | null> {
  // Prioridade: animation_url > image_url > mapa padrão por nome.
  const chosen = animationPath ?? imagePath ?? null;
  if (chosen) {
    if (isAbsoluteHttpUrl(chosen)) return chosen;
    return getSignedFileUrl(supabase, "workout-images", chosen, 3600);
  }
  if (fallbackName) {
    const mapped = lookupExerciseImage(fallbackName);
    if (mapped?.url) return mapped.url;
  }
  return null;
}

/** Detecta URL absoluta http(s) — sem protocolo (ex: //cdn.com) nem paths relativos. */
function isAbsoluteHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

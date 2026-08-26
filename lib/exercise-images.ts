import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { getSignedFileUrl } from "./storage";

/**
 * Wrapper de signed URL focado no bucket `workout-images`.
 *
 * `getExerciseMediaSignedUrl` prefere `animation_url` quando presente
 * (gif/mp4/webm) e cai pro `image_url` estático caso contrário.
 * `getExerciseImageSignedUrl` é a versão antiga que só lê `image_url`
 * (mantida para compatibilidade).
 */

export async function getExerciseImageSignedUrl(
  supabase: SupabaseClient<Database>,
  storagePath: string | null | undefined,
): Promise<string | null> {
  if (!storagePath) return null;
  return getSignedFileUrl(supabase, "workout-images", storagePath, 3600);
}

export async function getExerciseMediaSignedUrl(
  supabase: SupabaseClient<Database>,
  imagePath: string | null | undefined,
  animationPath: string | null | undefined,
): Promise<string | null> {
  // Prioridade: animation_url > image_url.
  const chosen = animationPath ?? imagePath ?? null;
  if (!chosen) return null;
  return getSignedFileUrl(supabase, "workout-images", chosen, 3600);
}

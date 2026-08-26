import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { getSignedFileUrl } from "./storage";

/**
 * Wrapper de signed URL focado no bucket `workout-images`.
 */
export async function getExerciseImageSignedUrl(
  supabase: SupabaseClient<Database>,
  storagePath: string | null | undefined,
): Promise<string | null> {
  if (!storagePath) return null;
  return getSignedFileUrl(supabase, "workout-images", storagePath, 3600);
}

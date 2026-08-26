import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { getSignedFileUrl } from "./storage";

/**
 * Retorna uma signed URL temporária do avatar do usuário, ou `null` se não houver.
 * Wrapper de `getSignedFileUrl` focado no bucket `avatars`.
 */
export async function getAvatarSignedUrl(
  supabase: SupabaseClient<Database>,
  avatarPath: string | null | undefined,
): Promise<string | null> {
  if (!avatarPath) return null;
  return getSignedFileUrl(supabase, "avatars", avatarPath, 3600);
}

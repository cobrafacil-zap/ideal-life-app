import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { getSignedFileUrl, removeFile } from "./storage";

const BUCKET = "meal-photos";
const RETENTION_DAYS = 7;

/**
 * Converte um array de paths em `Map<path, signedUrl>`. Paths que falham
 * (404 / expirados) são simplesmente omitidos.
 */
export async function getSignedMealPhotoUrls(
  supabase: SupabaseClient<Database>,
  paths: string[],
  expiresIn = 3600,
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  await Promise.all(
    paths.map(async (p) => {
      const url = await getSignedFileUrl(supabase, BUCKET, p, expiresIn);
      if (url) out.set(p, url);
    }),
  );
  return out;
}

/**
 * Deleta `meal_photos` com `created_at` mais antigo que `RETENTION_DAYS` e
 * remove os arquivos correspondentes do Storage. Idempotente.
 */
export async function purgeOldMealPhotos(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<{ deleted: number; errors: number }> {
  const cutoff = new Date(
    Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data: rows, error } = await supabase
    .from("meal_photos")
    .select("id, storage_path")
    .eq("user_id", userId)
    .lt("created_at", cutoff);

  if (error) {
    console.error("purgeOldMealPhotos: select failed", error);
    return { deleted: 0, errors: 1 };
  }

  const items = rows ?? [];
  if (items.length === 0) return { deleted: 0, errors: 0 };

  // Remove os arquivos do Storage primeiro (best-effort).
  let storageErrors = 0;
  try {
    await removeFile(
      supabase,
      BUCKET,
      items.map((r) => r.storage_path),
    );
  } catch (err) {
    storageErrors = 1;
    console.error("purgeOldMealPhotos: storage remove failed", err);
  }

  // Depois deleta as linhas.
  const ids = items.map((r) => r.id);
  const { error: delErr } = await supabase
    .from("meal_photos")
    .delete()
    .in("id", ids);

  if (delErr) {
    console.error("purgeOldMealPhotos: delete failed", delErr);
    return { deleted: 0, errors: storageErrors + 1 };
  }

  return { deleted: ids.length, errors: storageErrors };
}

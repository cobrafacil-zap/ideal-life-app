import { randomUUID } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Helpers de Storage do Supabase.
 *
 * Os buckets `avatars` e `meal-photos` são privados — gravamos o `storagePath`
 * (key do objeto) no banco e geramos uma signed URL server-side sempre que
 * precisamos exibir a imagem.
 */

const AVATAR_BUCKET = "avatars";
const MEAL_PHOTOS_BUCKET = "meal-photos";
const WORKOUT_IMAGES_BUCKET = "workout-images";

export type AvatarExt = "png" | "jpg" | "jpeg" | "webp";
export type MealPhotoExt = "png" | "jpg" | "jpeg" | "webp";
export type WorkoutImageExt = "png" | "jpg" | "jpeg" | "webp";

export const WORKOUT_IMAGE_BUCKET = WORKOUT_IMAGES_BUCKET;

function extFromMime(type: string): string | null {
  switch (type) {
    case "image/png":
      return "png";
    case "image/jpeg":
      return "jpg";
    case "image/webp":
      return "webp";
    default:
      return null;
  }
}

/**
 * Faz upload (ou substitui) o avatar do usuário em `avatars/{userId}/avatar.{ext}`.
 * Retorna o `storagePath` para gravar em `profiles.avatar_url`.
 */
export async function uploadAvatar(
  supabase: SupabaseClient<Database>,
  userId: string,
  file: File | Blob,
  mimeType: string,
): Promise<string> {
  const ext = extFromMime(mimeType);
  if (!ext) throw new Error("Tipo de imagem não suportado (use PNG, JPG ou WebP).");

  const path = `${userId}/avatar.${ext}`;
  const { error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, file, { upsert: true, contentType: mimeType, cacheControl: "3600" });

  if (error) throw new Error(`Falha no upload do avatar: ${error.message}`);
  return path;
}

/**
 * Faz upload da foto do prato em `meal-photos/{userId}/{uuid}.{ext}`.
 * Retorna o `storagePath` para gravar em `meal_photos.storage_path`.
 */
export async function uploadMealPhoto(
  supabase: SupabaseClient<Database>,
  userId: string,
  file: File | Blob,
  mimeType: string,
): Promise<string> {
  const ext = extFromMime(mimeType);
  if (!ext) throw new Error("Tipo de imagem não suportado (use PNG, JPG ou WebP).");

  const path = `${userId}/${randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(MEAL_PHOTOS_BUCKET)
    .upload(path, file, { contentType: mimeType, cacheControl: "3600" });

  if (error) throw new Error(`Falha no upload da foto: ${error.message}`);
  return path;
}

/**
 * Gera URL assinada temporária para um objeto de qualquer bucket privado.
 * Retorna `null` se o objeto não existir mais (ou signed URL expirou).
 */
export async function getSignedFileUrl(
  supabase: SupabaseClient<Database>,
  bucket: "avatars" | "meal-photos" | "workout-images",
  path: string,
  expiresIn = 3600,
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

/**
 * Remove um objeto do bucket. Não falha se já não existir.
 */
export async function removeFile(
  supabase: SupabaseClient<Database>,
  bucket: "avatars" | "meal-photos" | "workout-images",
  paths: string[],
): Promise<void> {
  if (paths.length === 0) return;
  await supabase.storage.from(bucket).remove(paths);
}

/**
 * Upload da imagem do exercício. Pasta por usuário + nome estável
 * baseado no id do exercício pra permitir sobrescrita controlada.
 */
export async function uploadExerciseImage(
  supabase: SupabaseClient<Database>,
  userId: string,
  exerciseId: string,
  file: File | Blob,
  mimeType: string,
): Promise<string> {
  const ext = extFromMime(mimeType);
  if (!ext) throw new Error("Tipo de imagem não suportado (use PNG, JPG ou WebP).");

  const path = `${userId}/${exerciseId}.${ext}`;
  const { error } = await supabase.storage
    .from(WORKOUT_IMAGES_BUCKET)
    .upload(path, file, { upsert: true, contentType: mimeType, cacheControl: "3600" });

  if (error) throw new Error(`Falha no upload da imagem do exercício: ${error.message}`);
  return path;
}

import type { Exercise } from "@/types/database";

export type ExerciseListItem = Pick<
  Exercise,
  | "id"
  | "user_id"
  | "name"
  | "primary_muscle"
  | "secondary_muscles"
  | "equipment"
  | "image_url"
  | "animation_url"
  | "demonstration_url"
  | "demonstration_type"
  | "category"
  | "aliases"
  | "machine_type"
  | "instructions"
  | "common_mistakes"
>;

/** Verifica se o exercício tem demonstração visual (GIF/vídeo) */
export function hasDemonstration(ex: ExerciseListItem): boolean {
  return ex.demonstration_url != null;
}

/**
 * Retorna a URL da demonstração animada resolvida.
 *
 * Três fontes possíveis para `demonstration_url`:
 *  1. Path estático do app (`/exercises-gifs/xxx.gif`) — servido pelo
 *     CDN, sem autenticação nem chamada ao Storage.
 *  2. URL absoluta (http/https) — ex.: Wikimedia Commons.
 *  3. Storage path no bucket privado `exercise-demonstrations` — o
 *     servidor gera a signed URL e entrega no mapa `signedUrls`.
 *
 * Retorna `null` quando o exercício não tem GIF/vídeo de demonstração.
 */
export function getDemonstrationUrl(
  ex: ExerciseListItem,
  signedUrls: Record<string, string | null>
): string | null {
  const path = ex.demonstration_url;
  if (!path) return null;
  // Asset estático do próprio app: usar direto.
  if (path.startsWith("/")) return path;
  // URL absoluta: já é publicamente acessível.
  if (/^https?:\/\//i.test(path)) return path;
  // Storage path: signed URL resolvida no servidor.
  return signedUrls[ex.id] ?? null;
}

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
>;

/** Verifica se o exercício tem demonstração visual (GIF/vídeo) */
export function hasDemonstration(ex: ExerciseListItem): boolean {
  return ex.demonstration_url != null;
}

/** Retorna a URL de demonstração resolvida (prioridade: demonstration > animation > image) */
export function getDemonstrationUrl(
  ex: ExerciseListItem,
  signedUrls: Record<string, string | null>
): string | null {
  if (ex.demonstration_url) {
    if (!/^https?:\/\//i.test(ex.demonstration_url)) {
      return signedUrls[ex.id] ?? null;
    }
    return ex.demonstration_url;
  }
  if (ex.animation_url) {
    if (!/^https?:\/\//i.test(ex.animation_url)) {
      return signedUrls[ex.id] ?? null;
    }
    return ex.animation_url;
  }
  return null;
}

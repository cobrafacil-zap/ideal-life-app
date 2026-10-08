import type { ExerciseListItem } from "@/app/(app)/treinos/actions";

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

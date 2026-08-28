/**
 * Helpers de busca textual usados nos pickers/listas de exercícios.
 * Mantém a normalização em um único lugar para que a lupa da biblioteca,
 * do picker e do seletor avulso compartilhem o mesmo comportamento.
 */

/** Normaliza para busca: minúsculas + remoção de acentos + trim. */
export function normalizeSearch(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

/**
 * Verifica se `haystack` contém `needle` ignorando:
 *   - case (maiúsculas/minúsculas);
 *   - acentos (á, ã, ç, …);
 *   - espaços nas pontas.
 *
 * Útil para buscas de exercícios que precisam casar "Puxada Alta"
 * com "puxada" ou "maquina" / "máquina".
 */
export function fuzzyIncludes(haystack: string | null | undefined, needle: string): boolean {
  const term = normalizeSearch(needle);
  if (!term) return true;
  if (haystack == null) return false;
  return normalizeSearch(haystack).includes(term);
}

/**
 * Verifica se `needle` está presente em pelo menos um dos campos
 * fornecidos. Cada campo é avaliado com `fuzzyIncludes`.
 */
export function matchesAny(
  needle: string,
  fields: Array<string | null | undefined>,
): boolean {
  const term = needle.trim();
  if (!term) return true;
  return fields.some((f) => fuzzyIncludes(f, term));
}

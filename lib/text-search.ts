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

/** Segmento retornado por `splitByMatch` — usado para renderizar o nome
 *  com a parte que casa com o termo em destaque. */
export type MatchSegment = { text: string; match: boolean };

/**
 * Divide `text` em segmentos contíguos marcando quais batem com `term`
 * (case/accent-insensitive via `normalizeSearch`). Útil para renderizar
 * um highlight visual no picker de exercícios.
 *
 * Devolve `[{ text: <texto original>, match: boolean }]` na ordem
 * encontrada. Se `term` é vazio, devolve `[{ text, match: false }]`.
 *
 * O mapeamento entre índices normalizados e originais é feito
 * caminhando ambos os strings em paralelo: a normalização NFD pode
 * dividir um caractere com acento em 2+ unidades (ex: `ã` → `a` + `̃`),
 * então cada unidade original pode gerar 1 ou mais unidades normalizadas.
 */
export function splitByMatch(
  text: string,
  term: string,
): MatchSegment[] {
  if (!text) return [];
  const normalizedTerm = normalizeSearch(term);
  if (!normalizedTerm) return [{ text, match: false }];

  // Pré-computa o array de unidades normalizadas de `text` e um mapa
  // de cada unidade normalizada → índice original correspondente.
  const normalizedChars: string[] = [];
  const originalIndices: number[] = [];
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const decomposed = ch.normalize("NFD").replace(/\p{Diacritic}/gu, "");
    for (let k = 0; k < decomposed.length; k++) {
      normalizedChars.push(decomposed[k]);
      originalIndices.push(i);
    }
  }
  const normalized = normalizedChars.join("").toLowerCase();

  const segments: MatchSegment[] = [];
  let cursor = 0; // cursor na string normalizada
  let originalCursor = 0; // cursor na string original
  while (cursor < normalized.length) {
    const found = normalized.indexOf(normalizedTerm, cursor);
    if (found === -1) {
      // resto: tudo não-match
      segments.push({ text: text.slice(originalCursor), match: false });
      break;
    }
    if (found > cursor) {
      // trecho não-match antes
      const start = originalIndices[found];
      segments.push({ text: text.slice(originalCursor, start), match: false });
    }
    // trecho match: cobre `normalizedTerm.length` unidades normalizadas
    const endNormIdx = found + normalizedTerm.length - 1;
    const endOriginalIdx = originalIndices[endNormIdx] + 1; // exclusivo
    segments.push({ text: text.slice(originalCursor, endOriginalIdx), match: true });
    cursor = endNormIdx + 1;
    originalCursor = endOriginalIdx;
  }
  return segments;
}

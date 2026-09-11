/**
 * Helpers de busca textual usados nos pickers/listas de exercícios.
 * Mantém a normalização em um único lugar para que a lupa da biblioteca,
 * do picker e do seletor avulso compartilhem o mesmo comportamento.
 */

import {
  EQUIPMENT_LABEL,
  EXERCISE_CATEGORY_LABEL,
  PRIMARY_MUSCLE_LABEL,
} from "@/lib/workout";
import type {
  EquipmentKind,
  ExerciseCategory,
  PrimaryMuscleGroup,
} from "@/types/database";

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

/* =========================================================================
   Ranking de exercícios por query (filtro + score).
   Usado pelo ExercisePicker, ExerciseLibrary e AdHocExercisePicker.
   ========================================================================= */

/**
 * Forma mínima que um objeto precisa ter para ser rankeado. `ExerciseListItem`
 * (e a tabela `exercises` no banco) já satisfazem essa interface — só os
 * campos relevantes para a busca.
 */
export interface SearchableExercise {
  name: string;
  /** `ExerciseCategory` v2 (fina). */
  category?: string | null;
  /** `PrimaryMuscleGroup` legado (amplo). */
  primary_muscle?: string | null;
  aliases?: ReadonlyArray<string> | null;
  secondary_muscles?: ReadonlyArray<string> | null;
  equipment?: string | null;
  instructions?: string | null;
}

/**
 * Termos amplos (vocabulário do usuário) que mapeiam para múltiplas
 * categorias. Chaves já estão normalizadas (minúsculas, sem acento). O
 * lookup também normaliza a query do usuário antes de consultar.
 *
 * Quando o usuário digitar "perna" e houver um exercício da categoria
 * `gluteos` (ou `quadriceps` / `posterior` / `panturrilha`), o score dele
 * recebe o boost `COMPOUND_CATEGORY` — não é exclusividade, é só mais um
 * sinal de relevância.
 */
export const COMPOUND_TERM_CATEGORIES: Record<string, ReadonlyArray<string>> = {
  perna: ["quadriceps", "posterior", "gluteos", "panturrilha"],
  pernas: ["quadriceps", "posterior", "gluteos", "panturrilha"],
  inferior: [
    "quadriceps",
    "posterior",
    "gluteos",
    "adutores",
    "abdutores",
    "panturrilha",
    "tibial",
  ],
  inferiores: [
    "quadriceps",
    "posterior",
    "gluteos",
    "adutores",
    "abdutores",
    "panturrilha",
    "tibial",
  ],
  superior: [
    "peito",
    "costas",
    "ombros",
    "biceps",
    "triceps",
    "antebraco",
    "trapezio",
  ],
  superiores: [
    "peito",
    "costas",
    "ombros",
    "biceps",
    "triceps",
    "antebraco",
    "trapezio",
  ],
  braco: ["biceps", "triceps"],
  bracos: ["biceps", "triceps"],
  coxa: ["quadriceps", "posterior", "gluteos", "adutores", "abdutores"],
  coxas: ["quadriceps", "posterior", "gluteos", "adutores", "abdutores"],
  gluteo: ["gluteos"],
  gluteos: ["gluteos"],
  glute: ["gluteos"],
};

/**
 * Pesos do ranking. A ordem é importante — reflete a prioridade pedida:
 * (1) match de categoria, (2) match de nome, (3) alias, (4) secundário,
 * (5) equipamento. Os números não precisam ser perfeitos; só a ordem
 * relativa entre eles.
 */
const SCORE = {
  EXACT_NAME: 1000,
  CATEGORY_LABEL_HIT: 900, // "gluteo" em "Glúteos"
  NAME_PREFIX: 800,
  NAME_CONTAINS: 700,
  COMPOUND_CATEGORY: 600, // termo está no COMPOUND_TERM_CATEGORIES
  LEGACY_MUSCLE_LABEL: 500, // peito, costas, pernas (legado)
  ALIAS_CONTAINS: 400,
  SECONDARY_MUSCLE: 250,
  EQUIPMENT_LABEL: 150,
  INSTRUCTIONS_HINT: 50,
} as const;

/**
 * Rankeia `exercises` pelo `query` em ordem decrescente de score. Itens
 * com score 0 são removidos do resultado. Quando `query` é vazio, devolve
 * a lista original (sem alocação extra além do spread).
 *
 * Os campos consultados são:
 *   - `name` (com pesos diferentes para exato / prefixo / contém)
 *   - `category` (label humano via `EXERCISE_CATEGORY_LABEL`)
 *   - `primary_muscle` (label humano via `PRIMARY_MUSCLE_LABEL` legado)
 *   - `aliases` (qualquer um casando — primeira bonificação)
 *   - `secondary_muscles` (qualquer um casando — primeira bonificação)
 *   - `equipment` (label humano via `EQUIPMENT_LABEL`)
 *   - `instructions` (cauda longa)
 *
 * Em caso de empate de score, desempate por nome alfabético (PT-BR) para
 * resultados determinísticos.
 */
export function rankExercisesByQuery<T extends SearchableExercise>(
  exercises: ReadonlyArray<T>,
  query: string,
): T[] {
  const term = normalizeSearch(query);
  if (!term) return [...exercises];

  const boost = COMPOUND_TERM_CATEGORIES[term];

  type Scored = { ex: T; score: number };
  const scored: Scored[] = [];

  for (const ex of exercises) {
    let score = 0;

    // Nome: exato > prefixo > contém.
    const nameN = normalizeSearch(ex.name ?? "");
    if (nameN) {
      if (nameN === term) score += SCORE.EXACT_NAME;
      else if (nameN.startsWith(term)) score += SCORE.NAME_PREFIX;
      else if (nameN.includes(term)) score += SCORE.NAME_CONTAINS;
    }

    // Categoria v2 (label humano).
    if (ex.category) {
      const label = EXERCISE_CATEGORY_LABEL[ex.category as ExerciseCategory];
      if (label && normalizeSearch(label).includes(term)) {
        score += SCORE.CATEGORY_LABEL_HIT;
      }
      if (boost && (boost as ReadonlyArray<string>).includes(ex.category)) {
        score += SCORE.COMPOUND_CATEGORY;
      }
    }

    // Grupo muscular legado (label humano).
    if (ex.primary_muscle) {
      const label = PRIMARY_MUSCLE_LABEL[ex.primary_muscle as PrimaryMuscleGroup];
      if (label && normalizeSearch(label).includes(term)) {
        score += SCORE.LEGACY_MUSCLE_LABEL;
      }
    }

    // Aliases: primeira bonificação (não cumulativa dentro do array).
    const aliases = ex.aliases ?? [];
    for (const a of aliases) {
      if (a && normalizeSearch(a).includes(term)) {
        score += SCORE.ALIAS_CONTAINS;
        break;
      }
    }

    // Músculos secundários: idem.
    const secondary = ex.secondary_muscles ?? [];
    for (const s of secondary) {
      if (s && normalizeSearch(s).includes(term)) {
        score += SCORE.SECONDARY_MUSCLE;
        break;
      }
    }

    // Equipamento: label humano.
    if (ex.equipment) {
      const label = EQUIPMENT_LABEL[ex.equipment as EquipmentKind];
      if (label && normalizeSearch(label).includes(term)) {
        score += SCORE.EQUIPMENT_LABEL;
      }
    }

    // Instruções: cauda longa (texto livre).
    if (ex.instructions && normalizeSearch(ex.instructions).includes(term)) {
      score += SCORE.INSTRUCTIONS_HINT;
    }

    if (score > 0) scored.push({ ex, score });
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.ex.name.localeCompare(b.ex.name, "pt-BR");
  });

  return scored.map((s) => s.ex);
}

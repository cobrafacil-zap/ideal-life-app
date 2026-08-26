import type { CyclePhase } from "./cycle";

/**
 * Sintomas físicos e emocionais comuns por fase do ciclo.
 *
 * Estes são padrões gerais observados em literatura de saúde feminina
 * (sem ser diagnóstico). Servem para a UI mostrar ao usuário o que é
 * comum sentir em cada fase — referência, não regra.
 *
 * Cada item inclui:
 *  - `id`     : chave estável (para ícones/chips)
 *  - `label`  : rótulo curto
 *  - `category`: "fisico" | "emocional" | "energia"
 *  - `tip`    : texto curto de orientação (ex.: "beba mais água")
 */

export type CycleSymptomCategory = "fisico" | "emocional" | "energia";

export interface CycleSymptom {
  id: string;
  label: string;
  category: CycleSymptomCategory;
  tip?: string;
}

export const PHASE_COMMON_SYMPTOMS: Record<CyclePhase, CycleSymptom[]> = {
  menstrual: [
    { id: "colica", label: "Cólica", category: "fisico", tip: "bolsa de água quente e alongamentos leves ajudam" },
    { id: "cansaço", label: "Cansaço", category: "energia", tip: "reduza a intensidade do treino nesse dia" },
    { id: "dor_lombar", label: "Dor lombar", category: "fisico" },
    { id: "humor_sensivel", label: "Humor mais sensível", category: "emocional" },
    { id: "retencao", label: "Inchaço / retenção", category: "fisico", tip: "reduza sódio e beba mais água" },
  ],
  folicular: [
    { id: "energia_alta", label: "Energia em alta", category: "energia" },
    { id: "boa_disposição", label: "Mais disposição", category: "energia" },
    { id: "foco_maior", label: "Foco e clareza", category: "emocional" },
    { id: "pele_mais_limpa", label: "Pele mais limpa", category: "fisico" },
  ],
  fertil: [
    { id: "libido_alta", label: "Libido em alta", category: "fisico" },
    { id: "muco_claro", label: "Muco cervical claro", category: "fisico" },
    { id: "energia_boa", label: "Boa energia", category: "energia" },
  ],
  ovulacao: [
    { id: "leve_dor_ovario", label: "Leve dor no ovário", category: "fisico" },
    { id: "libido_pico", label: "Pico de libido", category: "fisico" },
    { id: "brilho_pele", label: "Brilho na pele", category: "fisico" },
    { id: "humor_animado", label: "Humor animado", category: "emocional" },
  ],
  lutea: [
    { id: "inchaço_leve", label: "Inchaço leve", category: "fisico" },
    { id: "desejo_alimentos", label: "Desejo por doces", category: "fisico" },
    { id: "seios_sensiveis", label: "Seios sensíveis", category: "fisico" },
    { id: "humor_variavel", label: "Humor variável", category: "emocional" },
  ],
  tpm: [
    { id: "irritabilidade", label: "Irritabilidade", category: "emocional", tip: "auto-compaixão ajuda — é hormonal" },
    { id: "ansiedade", label: "Ansiedade", category: "emocional" },
    { id: "choro_facil", label: "Choro fácil", category: "emocional" },
    { id: "insonia", label: "Insônia leve", category: "energia" },
    { id: "cólica_previa", label: "Cólica prévia", category: "fisico" },
  ],
};

/**
 * Devolve os sintomas comuns esperados para um determinado dia do ciclo.
 * Útil para a UI exibir "o que é comum sentir hoje".
 */
export function commonSymptomsForPhase(phase: CyclePhase | null): CycleSymptom[] {
  if (!phase) return [];
  return PHASE_COMMON_SYMPTOMS[phase];
}

export const CATEGORY_LABEL: Record<CycleSymptomCategory, string> = {
  fisico: "Físico",
  emocional: "Emocional",
  energia: "Energia",
};
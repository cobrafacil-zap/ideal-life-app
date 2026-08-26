/**
 * Referência de calorias por porção comum.
 *
 * Valores arredondados a partir das tabelas TACO (Tabela Brasileira de
 * Composição de Alimentos) e rótulos nutricionais típicos. Não substituem
 * a leitura do rótulo, mas dão uma boa ordem de grandeza para o usuário
 * estimar o que comeu.
 */

export type PortionItem = {
  label: string;
  kcal: number;
  unit: string;
  protein?: number;
  carbs?: number;
  fat?: number;
};

export const PORTION_TABLE: PortionItem[] = [
  { label: "Arroz branco cozido", kcal: 33, unit: "1 col. sopa (~25 g)", protein: 0.7, carbs: 7.2, fat: 0.1 },
  { label: "Arroz integral cozido", kcal: 28, unit: "1 col. sopa (~25 g)", protein: 0.7, carbs: 6.0, fat: 0.2 },
  { label: "Feijão carioca cozido", kcal: 76, unit: "1 concha média (~80 g)", protein: 4.8, carbs: 13.6, fat: 0.5 },
  { label: "Frango grelhado", kcal: 165, unit: "1 filé médio (~100 g)", protein: 31, carbs: 0, fat: 3.6 },
  { label: "Carne moída refogada", kcal: 50, unit: "1 col. sopa (~25 g)", protein: 5, carbs: 0.2, fat: 3.3 },
  { label: "Ovo cozido", kcal: 78, unit: "1 unidade (~50 g)", protein: 6.3, carbs: 0.6, fat: 5.3 },
  { label: "Pão francês", kcal: 135, unit: "1 unidade (~50 g)", protein: 4.5, carbs: 28, fat: 0.7 },
  { label: "Pão integral", kcal: 70, unit: "1 fatia (~25 g)", protein: 2.5, carbs: 13, fat: 1.0 },
  { label: "Queijo branco (minas)", kcal: 70, unit: "1 fatia (~30 g)", protein: 5.4, carbs: 1.0, fat: 4.8 },
  { label: "Iogurte natural", kcal: 100, unit: "1 copo (~170 g)", protein: 6, carbs: 12, fat: 3.0 },
  { label: "Banana", kcal: 90, unit: "1 unidade média", carbs: 23, protein: 1.3, fat: 0.3 },
  { label: "Maçã", kcal: 72, unit: "1 unidade média", carbs: 19, protein: 0.4, fat: 0.2 },
  { label: "Macarrão cozido", kcal: 100, unit: "1 pegador (~80 g)", carbs: 20, protein: 3.4, fat: 0.6 },
  { label: "Batata inglesa cozida", kcal: 120, unit: "1 unidade média (~150 g)", carbs: 28, protein: 2.5, fat: 0.1 },
  { label: "Salada verde", kcal: 20, unit: "1 prato (~80 g)", carbs: 4, protein: 1.5, fat: 0.2 },
  { label: "Azeite de oliva", kcal: 119, unit: "1 col. sopa (~13 ml)", fat: 13.5 },
  { label: "Manteiga", kcal: 36, unit: "1 col. chá (~5 g)", fat: 4.1 },
  { label: "Açúcar", kcal: 48, unit: "1 col. sopa (~12 g)", carbs: 12 },
  { label: "Suco natural de laranja", kcal: 90, unit: "1 copo (~200 ml)", carbs: 21, protein: 1.3, fat: 0.2 },
  { label: "Refrigerante", kcal: 140, unit: "1 lata (~350 ml)", carbs: 36 },
];

/**
 * kcal por grama de alguns alimentos comuns — útil para estimar porções
 * a partir do prato servido (ex.: "uns 150 g de arroz").
 */
export const KCAL_PER_GRAM: Record<string, number> = {
  arroz_branco: 1.3,
  arroz_integral: 1.1,
  feijao: 0.95,
  frango_grelhado: 1.65,
  carne_magra: 2.0,
  ovo: 1.55,
  pao_frances: 2.7,
  pao_integral: 2.8,
  macarrao: 1.3,
  batata: 0.86,
  azeite: 8.8,
  manteiga: 7.2,
  acucar: 4.0,
};

/**
 * Texto curto explicando a regra de cálculo Atwater usada para estimar
 * kcal a partir dos macronutrientes.
 */
export function explainCalorieMath(): string {
  return (
    "Cálculo Atwater: kcal = (proteína × 4) + (carboidrato × 4) + (gordura × 9) " +
    "para 100 g do alimento. Esses fatores vêm da energia média de cada " +
    "macronutriente no corpo humano."
  );
}

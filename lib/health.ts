import type { Profile } from "@/types/database";

/**
 * Funções puras de saúde: IMC, classificação OMS, TMB/TDEE (Mifflin-St Jeor).
 *
 * Mantém a lógica isolada da UI para que possa ser reusada em
 * /saude, /alimentacao (sugestão de dieta) e cards do /hoje.
 */

export type BMICategory =
  | "magreza"
  | "saudavel"
  | "sobrepeso"
  | "obesidade1"
  | "obesidade2"
  | "obesidade3";

export type BMICategoryMeta = {
  key: BMICategory;
  label: string;
  /** Cor Tailwind para o badge / banner */
  tone: "info" | "ok" | "warn" | "danger";
  /** Limite inferior (inclusivo) e superior (exclusivo) do IMC */
  range: [number, number];
};

export const BMI_CATEGORIES: BMICategoryMeta[] = [
  { key: "magreza", label: "Abaixo do peso", tone: "info", range: [0, 18.5] },
  { key: "saudavel", label: "Peso adequado", tone: "ok", range: [18.5, 25] },
  { key: "sobrepeso", label: "Sobrepeso", tone: "warn", range: [25, 30] },
  { key: "obesidade1", label: "Obesidade grau I", tone: "danger", range: [30, 35] },
  { key: "obesidade2", label: "Obesidade grau II", tone: "danger", range: [35, 40] },
  { key: "obesidade3", label: "Obesidade grau III", tone: "danger", range: [40, 200] },
];

export function computeBMI(weightKg: number, heightCm: number): number {
  if (!weightKg || !heightCm) return 0;
  const m = heightCm / 100;
  return weightKg / (m * m);
}

/**
 * Defesa contra o bug "altura em metros" (ex.: 1.70 em vez de 170).
 *
 * Aceita number ou string pt-BR ("170,5" ou "1,70"). Se o valor estiver
 * claramente em metros (< 3), multiplica por 100. Se o resultado final
 * estiver fora da faixa plausível (100–250 cm), devolve null em vez de
 * explodir o IMC com valores absurdos (ex.: 297.577).
 *
 * Migração equivalente roda no banco (ver supabase/migrations/...sql).
 */
export function parseHeightCm(raw: number | string | null | undefined): number | null {
  if (raw === null || raw === undefined || raw === "") return null;
  const n = Number(String(raw).replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return null;
  // Caso legado: valor armazenado em metros.
  const cm = n < 3 ? n * 100 : n;
  if (cm < 100 || cm > 250) return null;
  // Arredonda para 1 casa (NUMERIC(5,1)).
  return Math.round(cm * 10) / 10;
}

export function bmiCategory(bmi: number): BMICategoryMeta {
  const cat = BMI_CATEGORIES.find((c) => bmi >= c.range[0] && bmi < c.range[1]);
  return cat ?? BMI_CATEGORIES[1];
}

/** kg que faltam para chegar na meta (≥ 0). */
export function kgToLose(currentKg: number, goalKg: number | null | undefined): number {
  if (!goalKg) return 0;
  return Math.max(0, currentKg - goalKg);
}

/** Idade em anos completos a partir de uma data ISO. */
export function computeAge(birthDate: string | null | undefined): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

const ACTIVITY_FACTORS: Record<NonNullable<Profile["activity_level"]>, number> = {
  sedentario: 1.2,
  leve: 1.375,
  moderado: 1.55,
  ativo: 1.725,
  muito_ativo: 1.9,
};

export function activityFactor(level: Profile["activity_level"]): number {
  if (!level) return ACTIVITY_FACTORS.sedentario;
  return ACTIVITY_FACTORS[level];
}

/**
 * Mifflin-St Jeor (1990) — padrão moderno para TMB.
 * `weightKg` em kg, `heightCm` em cm, `age` em anos.
 */
export function computeTMB(
  weightKg: number,
  heightCm: number,
  age: number,
  sex: Profile["biological_sex"],
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === "masculino" ? base + 5 : base - 161;
}

export function computeTDEE(
  weightKg: number,
  heightCm: number,
  age: number,
  sex: Profile["biological_sex"],
  level: Profile["activity_level"],
): number {
  return Math.round(computeTMB(weightKg, heightCm, age, sex) * activityFactor(level));
}

/**
 * Faixa de peso "saudável" pela fórmula do IMC (18.5–24.9).
 * Retorna `[min, max]` em kg.
 */
export function healthyWeightRangeKg(heightCm: number): [number, number] {
  const m = heightCm / 100;
  return [Math.round(18.5 * m * m * 10) / 10, Math.round(24.9 * m * m * 10) / 10];
}

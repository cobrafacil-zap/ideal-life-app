import type {
  EquipmentKind,
  ExerciseCategory,
  MachineType,
  PrimaryMuscleGroup,
} from "@/types/database";

/**
 * Labels e gradientes usados em toda a UI do módulo Treinos.
 * Centralizado aqui pra evitar drift entre cards/listas/dialogs.
 */

export const PRIMARY_MUSCLE_LABEL: Record<PrimaryMuscleGroup, string> = {
  peito: "Peito",
  costas: "Costas",
  pernas: "Pernas",
  ombros: "Ombros",
  bracos: "Braços",
  core: "Core",
  cardio: "Cardio",
  outro: "Outro",
};

/** Ordem sugerida pra exibir nos filtros. */
export const PRIMARY_MUSCLE_ORDER: PrimaryMuscleGroup[] = [
  "peito",
  "costas",
  "pernas",
  "ombros",
  "bracos",
  "core",
  "cardio",
  "outro",
];

/** Tailwind classes para o fundo do placeholder/grupo muscular. */
export const PRIMARY_MUSCLE_BG: Record<PrimaryMuscleGroup, string> = {
  peito: "bg-ember-gradient",
  costas: "bg-moss-gradient",
  pernas: "bg-lilac-gradient",
  ombros: "bg-gold-gradient",
  bracos: "bg-ember-soft text-ember-dark",
  core: "bg-moss-soft text-moss-dark",
  cardio: "bg-rose-gradient",
  outro: "bg-line",
};

export const EQUIPMENT_LABEL: Record<EquipmentKind, string> = {
  nenhum: "Sem equipamento",
  haltere: "Haltere",
  barra: "Barra",
  maquina: "Máquina",
  elastico: "Elástico",
  cabo: "Cabo",
  kettlebell: "Kettlebell",
  outro: "Outro",
};

export const EQUIPMENT_ORDER: EquipmentKind[] = [
  "nenhum",
  "haltere",
  "barra",
  "maquina",
  "elastico",
  "cabo",
  "kettlebell",
  "outro",
];

/* =========================================================================
   Categoria fina do exercício (v2 da biblioteca).
   Substitui `primary_muscle` na navegação do picker. Mantém as chaves
   estáveis para que `EXERCISE_CATEGORY_ORDER` determine a ordem visual.
   ========================================================================= */

export const EXERCISE_CATEGORY_LABEL: Record<ExerciseCategory, string> = {
  peito: "Peito",
  costas: "Costas",
  ombros: "Ombros",
  biceps: "Bíceps",
  triceps: "Tríceps",
  quadriceps: "Quadríceps",
  posterior: "Posterior de coxa",
  gluteos: "Glúteos",
  adutores: "Adutores",
  abdutores: "Abdutores",
  panturrilha: "Panturrilha",
  tibial: "Tibial",
  abdomen: "Abdômen / Core",
  lombar: "Lombar / Cadeia posterior",
  trapezio: "Trapézio",
  antebraco: "Antebraço / Pegada",
  corpo_inteiro: "Corpo inteiro",
  cardio: "Cardio",
};

/** Ordem em que as categorias aparecem no picker. */
export const EXERCISE_CATEGORY_ORDER: ExerciseCategory[] = [
  "peito",
  "costas",
  "ombros",
  "biceps",
  "triceps",
  "quadriceps",
  "posterior",
  "gluteos",
  "adutores",
  "abdutores",
  "panturrilha",
  "tibial",
  "abdomen",
  "lombar",
  "trapezio",
  "antebraco",
  "corpo_inteiro",
  "cardio",
];

/** Tailwind classes para o fundo do placeholder por categoria. */
export const EXERCISE_CATEGORY_BG: Record<ExerciseCategory, string> = {
  peito: "bg-ember-gradient",
  costas: "bg-moss-gradient",
  ombros: "bg-gold-gradient",
  biceps: "bg-ember-soft text-ember-dark",
  triceps: "bg-ember-soft text-ember-dark",
  quadriceps: "bg-lilac-gradient",
  posterior: "bg-lilac-gradient",
  gluteos: "bg-lilac-gradient",
  adutores: "bg-lilac-soft text-lilac-dark",
  abdutores: "bg-lilac-soft text-lilac-dark",
  panturrilha: "bg-line",
  tibial: "bg-line",
  abdomen: "bg-moss-soft text-moss-dark",
  lombar: "bg-moss-gradient",
  trapezio: "bg-gold-soft text-gold-dark",
  antebraco: "bg-line",
  corpo_inteiro: "bg-rose-gradient",
  cardio: "bg-rose-gradient",
};

/* =========================================================================
   Tipo de máquina (v2 da biblioteca).
   ========================================================================= */

export const MACHINE_TYPE_LABEL: Record<MachineType, string> = {
  selectorized: "Selectorized",
  plate_loaded: "Plate-loaded",
  cable: "Cabo / Polia",
  smith: "Smith",
  free_weight: "Peso livre",
  bodyweight: "Peso corporal",
  cardio: "Cardio",
  other: "Outro",
};

export const MACHINE_TYPE_ORDER: MachineType[] = [
  "selectorized",
  "plate_loaded",
  "cable",
  "smith",
  "free_weight",
  "bodyweight",
  "cardio",
  "other",
];

/** Rótulos amplos para agrupar categorias em “Membros superiores / inferiores / core / cardio”. */
export type ExerciseGroup =
  | "membros_superiores"
  | "membros_inferiores"
  | "core"
  | "cardio";

export const EXERCISE_GROUP_LABEL: Record<ExerciseGroup, string> = {
  membros_superiores: "Membros superiores",
  membros_inferiores: "Membros inferiores",
  core: "Core",
  cardio: "Cardio",
};

/** Mapa categoria → grupo amplo. */
export const CATEGORY_TO_GROUP: Record<ExerciseCategory, ExerciseGroup> = {
  peito: "membros_superiores",
  costas: "membros_superiores",
  ombros: "membros_superiores",
  biceps: "membros_superiores",
  triceps: "membros_superiores",
  antebraco: "membros_superiores",
  trapezio: "membros_superiores",
  quadriceps: "membros_inferiores",
  posterior: "membros_inferiores",
  gluteos: "membros_inferiores",
  adutores: "membros_inferiores",
  abdutores: "membros_inferiores",
  panturrilha: "membros_inferiores",
  tibial: "membros_inferiores",
  abdomen: "core",
  lombar: "core",
  corpo_inteiro: "membros_inferiores",
  cardio: "cardio",
};

/** Converte minutos em horas decimais (1 casa) com clamp defensivo. */
export function minutesToHours(min: number): number {
  if (!Number.isFinite(min) || min <= 0) return 0;
  return Math.round((min / 60) * 10) / 10;
}

/** RPE descritivo (1–10). Texto neutro — sem diagnosticar nem afirmar segurança. */
export const RPE_DESCRIPTORS: { value: number; label: string; hint: string }[] = [
  { value: 1, label: "Muito leve", hint: "Praticamente sem esforço" },
  { value: 2, label: "Leve", hint: "Aquecimento fácil" },
  { value: 3, label: "Leve", hint: "Controle respiratório tranquilo" },
  { value: 4, label: "Moderado", hint: "Cansaço controlado" },
  { value: 5, label: "Moderado", hint: "Sudoa, mantém conversa" },
  { value: 6, label: "Moderado", hint: "Fala fica entrecortada" },
  { value: 7, label: "Intenso", hint: "Poucas palavras" },
  { value: 8, label: "Intenso", hint: "Respiração pesada" },
  { value: 9, label: "Muito intenso", hint: "Quase máximo, séries curtas" },
  { value: 10, label: "Máximo", hint: "Esforço máximo até a falha" },
];

/** Desconforto (0–10). "Dor" sem rótulo diagnóstico. */
export const DISCOMFORT_HINT =
  "Marque desconforto físico sentido durante a série. Sem diagnóstico — apenas registro.";

/** Normaliza string de repetição alvo. Aceita "10-12", "8", "até a falha". */
export function parseTargetReps(value: string): {
  min?: number;
  max?: number;
  raw: string;
} {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return { raw: "" };
  if (trimmed.includes("-")) {
    const [a, b] = trimmed.split("-").map((n) => parseInt(n.trim(), 10));
    if (Number.isFinite(a) && Number.isFinite(b)) {
      return { min: a, max: b, raw: trimmed };
    }
  }
  const single = parseInt(trimmed, 10);
  if (Number.isFinite(single)) {
    return { min: single, max: single, raw: trimmed };
  }
  return { raw: trimmed };
}

/** Converte uma string de reps-alvo em um número mínimo (heurística pra UI). */
export function targetRepsMin(value: string): number | null {
  return parseTargetReps(value).min ?? null;
}

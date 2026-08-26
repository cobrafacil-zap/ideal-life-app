import type {
  EquipmentKind,
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

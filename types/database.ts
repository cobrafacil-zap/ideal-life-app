// Tipagem simplificada das tabelas usadas na Fase 1.
// (Pode ser substituída pelo gerador oficial: `supabase gen types typescript`)

export type GoalType = "perder" | "manter" | "ganhar" | "recompor";

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  birth_date: string | null;
  biological_sex: "feminino" | "masculino" | "nao_informado" | null;
  height_cm: number | null;
  activity_level: "sedentario" | "leve" | "moderado" | "ativo" | "muito_ativo" | null;
  weight_goal_kg: number | null;
  /** Peso no momento em que a meta foi definida (só faz sentido com goal_type='perder'). */
  weight_goal_start_kg: number | null;
  /** Tipo de objetivo principal. Default 'manter'. */
  goal_type: GoalType | null;
  /** Ritmo semanal desejado (kg/sem). Default 0.5. Só usado com goal_type='perder'. */
  weekly_rate_kg: number | null;
  /** Quando a meta atual foi definida (para auditoria). */
  goal_started_at: string | null;
  water_goal_ml: number;
  cardio_weekly_goal_min: number;
  /** Meta semanal de treino em HORAS (era contagem de sessoes). Bound 0–20. */
  workout_weekly_goal_hours: number | null;
  calorie_goal: number | null;
  /**
   * Meta semanal de gasto calórico derivada do peso atual vs peso-meta
   * (regra 7700 kcal/kg). Recalculada em lib/goals.
   * Só é > 0 quando goal_type = 'perder'.
   */
  weekly_burn_goal_kcal: number | null;
  created_at: string;
  updated_at: string;
}

export interface DailyCheckin {
  id: string;
  user_id: string;
  checkin_date: string;
  energy: number | null;
  mood: number | null;
  disposition: number | null;
}

export interface BodyMeasurement {
  id: string;
  user_id: string;
  weight_kg: number;
  measured_at: string;
  notes: string | null;
}

export interface WaterLog {
  id: string;
  user_id: string;
  amount_ml: number;
  logged_at: string;
  log_date: string;
}

export interface CardioSession {
  id: string;
  user_id: string;
  type: string;
  duration_min: number;
  /** Duração em horas (preferida na UI). Mantida em sincronia com `duration_min`. */
  duration_h: number | null;
  /** kcal queimadas calculadas no momento do insert (MET × peso × duração). */
  kcal_burned: number | null;
  distance_km: number | null;
  intensity: string | null;
  performed_at: string;
}

export interface Meal {
  id: string;
  user_id: string;
  meal_type: "cafe_da_manha" | "almoco" | "lanche" | "jantar" | "ceia" | "outra";
  meal_date: string;
  total_calories: number | null;
  total_protein_g: number | null;
  total_carbs_g: number | null;
  total_fat_g: number | null;
}

export interface MealItem {
  id: string;
  meal_id: string;
  user_id: string;
  food_name: string;
  quantity_g: number | null;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  source: "manual" | "foto_ia";
  created_at: string;
}

export interface MealPhoto {
  id: string;
  meal_id: string;
  user_id: string;
  /** Key do objeto no bucket `meal-photos`. */
  storage_path: string;
  /** Resposta crua da IA usada para gerar os macros (auditoria). */
  ai_raw_response: unknown;
  created_at: string;
}

export interface WorkoutSession {
  id: string;
  user_id: string;
  workout_plan_id: string | null;
  workout_name: string;
  started_at: string;
  finished_at: string | null;
  duration_h: number | null;
  duration_min: number | null;
  /** Esforço percebido geral da sessão (1–10). Adicionado na FASE 1. */
  user_rpe: number | null;
  created_at: string;
}

export interface Exercise {
  id: string;
  /** NULL = exercício do catálogo global; preenchido = exercício próprio. */
  user_id: string | null;
  name: string;
  /** Legado: classificação ampla. Mantida para retrocompat. Use `category` para o picker. */
  primary_muscle: string;
  secondary_muscles: string[];
  equipment: string | null;
  substitutes: string[];
  /** Storage path no bucket `workout-images` (privado). NULL → placeholder SVG. */
  image_url: string | null;
  /** Storage path opcional para GIF/vídeo curto. Tem prioridade sobre image_url quando presente. */
  animation_url: string | null;
  /** Instruções curtas de execução (texto neutro, sem diagnóstico). Legado. */
  execution_notes: string | null;
  /** Categoria fina usada na navegação do picker (Quadríceps, Posterior, Glúteos, ...). */
  category: ExerciseCategory | null;
  /** Sinônimos / nomes alternativos para a busca. */
  aliases: string[];
  /** Tipo de máquina: selectorized, plate_loaded, cable, smith, free_weight, bodyweight, cardio, other. */
  machine_type: MachineType | null;
  /** Indica se o exercício é executado de um lado, dos dois, ou em máquina iso-lateral. */
  laterality: Laterality | null;
  /** Nível de dificuldade percebido (1=fácil, 5=muito difícil). */
  difficulty: 1 | 2 | 3 | 4 | 5 | null;
  /** Padrão de movimento: composto ou isolado. */
  movement_pattern: MovementPattern | null;
  /** Instruções resumidas de execução. */
  instructions: string | null;
  /** Erros comuns ao executar o exercício. */
  common_mistakes: string | null;
  /** URL externa de vídeo demonstrativo (opcional). */
  video_url: string | null;
  created_at: string;
}

export interface WorkoutPlan {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  /** 0=domingo .. 6=sábado. NULL = plano sem dia fixo (sob demanda). */
  scheduled_weekday: number | null;
  created_at: string;
  updated_at: string;
}

export interface WorkoutPlanExercise {
  id: string;
  workout_plan_id: string;
  user_id: string;
  exercise_id: string | null;
  /** Nome do exercício (caso exercise_id seja NULL — exercício apagado). */
  exercise_name: string;
  target_sets: number;
  /** Texto livre: "10-12", "8", "até a falha". */
  target_reps: string;
  target_load: number | null;
  load_unit: "kg" | "lb";
  notes: string | null;
  sort_order: number;
}

export interface ExerciseSet {
  id: string;
  workout_session_id: string;
  user_id: string;
  exercise_id: string | null;
  exercise_name: string;
  set_number: number;
  reps: number | null;
  load: number | null;
  load_unit: "kg" | "lb";
  /** Esforço percebido da série (1–10). Adicionado na FASE 1. */
  rpe: number | null;
  /** Desconforto relatado (0–10). Não é diagnóstico. Adicionado na FASE 1. */
  discomfort: number | null;
  created_at: string;
}

export type PrimaryMuscleGroup =
  | "peito"
  | "costas"
  | "pernas"
  | "ombros"
  | "bracos"
  | "core"
  | "cardio"
  | "outro";

export type EquipmentKind =
  | "nenhum"
  | "haltere"
  | "barra"
  | "maquina"
  | "elastico"
  | "cabo"
  | "kettlebell"
  | "outro";

/**
 * Categoria fina do exercício, usada no picker para agrupar.
 * Mais granular que `primary_muscle` (que continua existindo como legado).
 */
export type ExerciseCategory =
  | "peito"
  | "costas"
  | "ombros"
  | "biceps"
  | "triceps"
  | "quadriceps"
  | "posterior"
  | "gluteos"
  | "adutores"
  | "abdutores"
  | "panturrilha"
  | "tibial"
  | "abdomen"
  | "lombar"
  | "trapezio"
  | "antebraco"
  | "corpo_inteiro"
  | "cardio";

/** Tipo de máquina / equipamento. */
export type MachineType =
  | "selectorized"
  | "plate_loaded"
  | "cable"
  | "smith"
  | "free_weight"
  | "bodyweight"
  | "cardio"
  | "other";

/** Lateralidade de execução. */
export type Laterality = "unilateral" | "bilateral" | "iso_lateral";

/** Padrão de movimento. */
export type MovementPattern = "compound" | "isolation";

export interface MenstrualCycle {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string | null;
  flow_intensity: "leve" | "moderado" | "intenso" | null;
}

export interface MenstrualDailyLog {
  id: string;
  user_id: string;
  log_date: string;
  pain_level: number | null;
  mood: string | null;
  symptoms: string[];
  notes: string | null;
}

// Placeholder genérico para satisfazer @supabase/ssr<Database>.
// Em produção, gere este tipo com a CLI do Supabase.
export type Database = any;

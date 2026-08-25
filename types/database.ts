// Tipagem simplificada das tabelas usadas na Fase 1.
// (Pode ser substituída pelo gerador oficial: `supabase gen types typescript`)

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  birth_date: string | null;
  biological_sex: "feminino" | "masculino" | "nao_informado" | null;
  height_cm: number | null;
  activity_level: "sedentario" | "leve" | "moderado" | "ativo" | "muito_ativo" | null;
  weight_goal_kg: number | null;
  water_goal_ml: number;
  cardio_weekly_goal_min: number;
  workout_weekly_goal: number;
  calorie_goal: number | null;
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

export interface WorkoutSession {
  id: string;
  user_id: string;
  workout_name: string;
  started_at: string;
  finished_at: string | null;
}

export interface MenstrualCycle {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string | null;
  flow_intensity: "leve" | "moderado" | "intenso" | null;
}

// Placeholder genérico para satisfazer @supabase/ssr<Database>.
// Em produção, gere este tipo com a CLI do Supabase.
export type Database = any;

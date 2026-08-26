/* =========================================================================
   VITTA - Schema inicial (Fase 1)
   Rode no SQL Editor do Supabase com o tradutor automatico do navegador
   DESLIGADO. Este arquivo usa apenas keywords SQL canonicas em CAIXA ALTA
   e comentarios /* */, para sobreviver a qualquer traducao automatica.
   ========================================================================= */

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

/* Funcao utilitaria: mantem updated_at sempre atualizado */
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

/* PROFILES - dados de perfil e metas */
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  birth_date DATE,
  biological_sex TEXT CHECK (biological_sex IN ('feminino','masculino','nao_informado')),
  height_cm NUMERIC(5,1) CHECK (height_cm IS NULL OR height_cm BETWEEN 100 AND 250),
  activity_level TEXT CHECK (activity_level IN ('sedentario','leve','moderado','ativo','muito_ativo')),
  weight_goal_kg NUMERIC(5,1),
  weight_goal_start_kg NUMERIC(5,1),
  goal_type TEXT DEFAULT 'manter' CHECK (goal_type IN ('perder','manter','ganhar','recompor')),
  weekly_rate_kg NUMERIC(3,2) DEFAULT 0.5,
  goal_started_at TIMESTAMPTZ,
  weekly_burn_goal_kcal INTEGER,
  water_goal_ml INTEGER DEFAULT 3000,
  cardio_weekly_goal_min INTEGER DEFAULT 150,
  workout_weekly_goal INTEGER DEFAULT 4,
  calorie_goal INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

/* Cria a linha de profile automaticamente quando o usuario se cadastra */
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

/* DAILY CHECKINS - energia / humor / disposicao (0-10) por dia */
CREATE TABLE IF NOT EXISTS public.daily_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  checkin_date DATE NOT NULL DEFAULT CURRENT_DATE,
  energy SMALLINT CHECK (energy BETWEEN 0 AND 10),
  mood SMALLINT CHECK (mood BETWEEN 0 AND 10),
  disposition SMALLINT CHECK (disposition BETWEEN 0 AND 10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, checkin_date)
);
DROP TRIGGER IF EXISTS trg_checkins_updated_at ON public.daily_checkins;
CREATE TRIGGER trg_checkins_updated_at
  BEFORE UPDATE ON public.daily_checkins
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "checkins_all_own" ON public.daily_checkins;
CREATE POLICY "checkins_all_own" ON public.daily_checkins FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

/* BODY MEASUREMENTS - historico de peso */
CREATE TABLE IF NOT EXISTS public.body_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  weight_kg NUMERIC(5,1) NOT NULL,
  measured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.body_measurements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "body_measurements_all_own" ON public.body_measurements;
CREATE POLICY "body_measurements_all_own" ON public.body_measurements FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

/* EXERCISES - catalogo de exercicios (globais + do usuario) */
CREATE TABLE IF NOT EXISTS public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  primary_muscle TEXT,
  secondary_muscles TEXT[],
  equipment TEXT,
  substitutes TEXT[],
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "exercises_select_own_or_global" ON public.exercises;
CREATE POLICY "exercises_select_own_or_global" ON public.exercises FOR SELECT
  USING (user_id IS NULL OR auth.uid() = user_id);
DROP POLICY IF EXISTS "exercises_insert_own" ON public.exercises;
CREATE POLICY "exercises_insert_own" ON public.exercises FOR INSERT
  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "exercises_update_own" ON public.exercises;
CREATE POLICY "exercises_update_own" ON public.exercises FOR UPDATE
  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "exercises_delete_own" ON public.exercises;
CREATE POLICY "exercises_delete_own" ON public.exercises FOR DELETE
  USING (auth.uid() = user_id);

/* WORKOUT PLANS */
CREATE TABLE IF NOT EXISTS public.workout_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
DROP TRIGGER IF EXISTS trg_workout_plans_updated_at ON public.workout_plans;
CREATE TRIGGER trg_workout_plans_updated_at
  BEFORE UPDATE ON public.workout_plans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "workout_plans_all_own" ON public.workout_plans;
CREATE POLICY "workout_plans_all_own" ON public.workout_plans FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.workout_plan_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_plan_id UUID NOT NULL REFERENCES public.workout_plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES public.exercises(id),
  exercise_name TEXT NOT NULL,
  target_sets SMALLINT NOT NULL DEFAULT 3,
  target_reps TEXT NOT NULL DEFAULT '10-12',
  target_load NUMERIC(6,2),
  load_unit TEXT DEFAULT 'kg' CHECK (load_unit IN ('kg','lb')),
  rest_seconds INTEGER DEFAULT 60,
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.workout_plan_exercises ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "workout_plan_exercises_all_own" ON public.workout_plan_exercises;
CREATE POLICY "workout_plan_exercises_all_own" ON public.workout_plan_exercises FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

/* WORKOUT SESSIONS */
CREATE TABLE IF NOT EXISTS public.workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_plan_id UUID REFERENCES public.workout_plans(id),
  workout_name TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "workout_sessions_all_own" ON public.workout_sessions;
CREATE POLICY "workout_sessions_all_own" ON public.workout_sessions FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.exercise_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES public.exercises(id),
  exercise_name TEXT NOT NULL,
  set_number SMALLINT NOT NULL,
  reps SMALLINT,
  load NUMERIC(6,2),
  load_unit TEXT DEFAULT 'kg' CHECK (load_unit IN ('kg','lb')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.exercise_sets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "exercise_sets_all_own" ON public.exercise_sets;
CREATE POLICY "exercise_sets_all_own" ON public.exercise_sets FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

/* CARDIO SESSIONS */
CREATE TABLE IF NOT EXISTS public.cardio_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('esteira','caminhada','corrida','bicicleta','escada','eliptico','outro')),
  duration_min INTEGER NOT NULL,
  distance_km NUMERIC(5,2),
  intensity TEXT CHECK (intensity IN ('leve','moderada','intensa')),
  performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.cardio_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cardio_sessions_all_own" ON public.cardio_sessions;
CREATE POLICY "cardio_sessions_all_own" ON public.cardio_sessions FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

/* WATER LOGS */
CREATE TABLE IF NOT EXISTS public.water_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_ml INTEGER NOT NULL,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  log_date DATE NOT NULL DEFAULT CURRENT_DATE
);
ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "water_logs_all_own" ON public.water_logs;
CREATE POLICY "water_logs_all_own" ON public.water_logs FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

/* MEALS / MEAL ITEMS / MEAL PHOTOS */
CREATE TABLE IF NOT EXISTS public.meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('cafe_da_manha','almoco','lanche','jantar','ceia','outra')),
  meal_date DATE NOT NULL DEFAULT CURRENT_DATE,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_calories NUMERIC(7,1),
  total_protein_g NUMERIC(6,1),
  total_carbs_g NUMERIC(6,1),
  total_fat_g NUMERIC(6,1),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "meals_all_own" ON public.meals;
CREATE POLICY "meals_all_own" ON public.meals FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.meal_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id UUID NOT NULL REFERENCES public.meals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  food_name TEXT NOT NULL,
  quantity_g NUMERIC(6,1),
  calories NUMERIC(7,1),
  protein_g NUMERIC(6,1),
  carbs_g NUMERIC(6,1),
  fat_g NUMERIC(6,1),
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual','foto_ia')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.meal_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "meal_items_all_own" ON public.meal_items;
CREATE POLICY "meal_items_all_own" ON public.meal_items FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.meal_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id UUID NOT NULL REFERENCES public.meals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  ai_raw_response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.meal_photos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "meal_photos_all_own" ON public.meal_photos;
CREATE POLICY "meal_photos_all_own" ON public.meal_photos FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

/* MENSTRUAL CYCLES + DAILY LOGS */
CREATE TABLE IF NOT EXISTS public.menstrual_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE,
  flow_intensity TEXT CHECK (flow_intensity IN ('leve','moderado','intenso')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
DROP TRIGGER IF EXISTS trg_menstrual_cycles_updated_at ON public.menstrual_cycles;
CREATE TRIGGER trg_menstrual_cycles_updated_at
  BEFORE UPDATE ON public.menstrual_cycles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
ALTER TABLE public.menstrual_cycles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "menstrual_cycles_all_own" ON public.menstrual_cycles;
CREATE POLICY "menstrual_cycles_all_own" ON public.menstrual_cycles FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.menstrual_daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  pain_level SMALLINT CHECK (pain_level BETWEEN 0 AND 10),
  mood TEXT,
  symptoms TEXT[],
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, log_date)
);
ALTER TABLE public.menstrual_daily_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "menstrual_daily_logs_all_own" ON public.menstrual_daily_logs;
CREATE POLICY "menstrual_daily_logs_all_own" ON public.menstrual_daily_logs FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

/* MEDICAL APPOINTMENTS */
CREATE TABLE IF NOT EXISTS public.medical_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doctor_name TEXT,
  specialty TEXT,
  appointment_at TIMESTAMPTZ NOT NULL,
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.medical_appointments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "medical_appointments_all_own" ON public.medical_appointments;
CREATE POLICY "medical_appointments_all_own" ON public.medical_appointments FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

/* STORAGE - buckets privados por usuario */
INSERT INTO storage.buckets (id, name, public)
VALUES ('meal-photos', 'meal-photos', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "meal_photos_select_own" ON storage.objects;
CREATE POLICY "meal_photos_select_own" ON storage.objects FOR SELECT
  USING (bucket_id = 'meal-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "meal_photos_insert_own" ON storage.objects;
CREATE POLICY "meal_photos_insert_own" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'meal-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "meal_photos_delete_own" ON storage.objects;
CREATE POLICY "meal_photos_delete_own" ON storage.objects FOR DELETE
  USING (bucket_id = 'meal-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "avatars_select_own" ON storage.objects;
CREATE POLICY "avatars_select_own" ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "avatars_insert_own" ON storage.objects;
CREATE POLICY "avatars_insert_own" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "avatars_update_own" ON storage.objects;
CREATE POLICY "avatars_update_own" ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

/* Fim da Fase 1. Migrations futuras seguem o mesmo padrao. */

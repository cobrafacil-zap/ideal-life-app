/* =========================================================================
   Migration: 20260827_workout_goal_hours
   Reinterpreta a meta semanal de treino em HORAS (era contagem de sessoes).
   - Renomeia profiles.workout_weekly_goal -> workout_weekly_goal_hours
   - Converte tipo INTEGER -> NUMERIC(4,1), default 4 (horas)
   - Adiciona CHECK 0-20h
   - Adiciona duration_h + duration_min em workout_sessions
   Idempotente (re-rodar nao quebra).
   ========================================================================= */

-- 1) Renomeia a coluna se ainda nao foi renomeada.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles'
      AND column_name = 'workout_weekly_goal'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles'
      AND column_name = 'workout_weekly_goal_hours'
  ) THEN
    ALTER TABLE public.profiles
      RENAME COLUMN workout_weekly_goal TO workout_weekly_goal_hours;
  END IF;
END $$;

-- 2) Converte tipo INTEGER -> NUMERIC(4,1) preservando o valor (4 -> 4.0).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles'
      AND column_name = 'workout_weekly_goal_hours'
      AND data_type = 'integer'
  ) THEN
    ALTER TABLE public.profiles
      ALTER COLUMN workout_weekly_goal_hours TYPE NUMERIC(4,1)
      USING workout_weekly_goal_hours::NUMERIC(4,1);
  END IF;
END $$;

-- 3) Default 4 horas (era 4 sessoes; numero igual, semantica nova).
ALTER TABLE public.profiles
  ALTER COLUMN workout_weekly_goal_hours SET DEFAULT 4;

-- 4) CHECK 0-20h.
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_workout_hours_range;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_workout_hours_range
    CHECK (workout_weekly_goal_hours IS NULL
           OR workout_weekly_goal_hours BETWEEN 0 AND 20);

-- 5) duration_h + duration_min em workout_sessions (registro manual).
ALTER TABLE public.workout_sessions
  ADD COLUMN IF NOT EXISTS duration_h NUMERIC(5,2);

ALTER TABLE public.workout_sessions
  DROP CONSTRAINT IF EXISTS workout_sessions_duration_h_range;
ALTER TABLE public.workout_sessions
  ADD CONSTRAINT workout_sessions_duration_h_range
    CHECK (duration_h IS NULL OR (duration_h > 0 AND duration_h <= 24));

ALTER TABLE public.workout_sessions
  ADD COLUMN IF NOT EXISTS duration_min INTEGER;

ALTER TABLE public.workout_sessions
  DROP CONSTRAINT IF EXISTS workout_sessions_duration_min_range;
ALTER TABLE public.workout_sessions
  ADD CONSTRAINT workout_sessions_duration_min_range
    CHECK (duration_min IS NULL OR (duration_min > 0 AND duration_min <= 1440));
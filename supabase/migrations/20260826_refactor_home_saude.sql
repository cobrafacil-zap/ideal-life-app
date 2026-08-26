/* =========================================================================
   Migration: 20260826_refactor_home_saude
   Reforco da tabela profiles:
   - CHECK constraint na altura (cm)
   - Conversao defensiva de valores legados em metros
   - Campos de objetivo (goal_type, peso inicial, taxa semanal)
   - Campo semanal de queima (ja referenciado em codigo, faltava no schema)
   Rode no SQL Editor do Supabase.
   ========================================================================= */

-- 1) CORRECAO DA ALTURA: dados legados gravados em metros (ex.: 1.70) sao
-- convertidos para cm (170.0). Depois disso, CHECK impede valores invalidos.
UPDATE public.profiles
  SET height_cm = height_cm * 100
  WHERE height_cm IS NOT NULL AND height_cm < 3;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_height_cm_range;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_height_cm_range
    CHECK (height_cm IS NULL OR height_cm BETWEEN 100 AND 250);

-- 2) CAMPOS DE OBJETIVO
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS goal_type TEXT
    CHECK (goal_type IN ('perder','manter','ganhar','recompor'));

-- Default seguro para usuarios antigos: 'manter'.
UPDATE public.profiles
  SET goal_type = 'manter'
  WHERE goal_type IS NULL;

ALTER TABLE public.profiles
  ALTER COLUMN goal_type SET DEFAULT 'manter';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS weight_goal_start_kg NUMERIC(5,1);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS weekly_rate_kg NUMERIC(3,2) DEFAULT 0.5;

ALTER TABLE public.profiles
  ALTER COLUMN weekly_rate_kg SET DEFAULT 0.5;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS goal_started_at TIMESTAMPTZ;

-- 3) META SEMANAL DE QUEIMA (ja usada em codigo, faltava no schema).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS weekly_burn_goal_kcal INTEGER;
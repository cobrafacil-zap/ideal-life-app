-- =========================================================================
-- Migration: 20260904_drop_rest_seconds
-- Remove o campo `rest_seconds` (descanso entre séries) do plano.
-- Após o produto pivotar para foco em séries/reps/carga, o descanso
-- deixou de ser útil: removemos coluna, default e qualquer referência
-- em código. Migration idempotente (DROP COLUMN IF EXISTS).
-- =========================================================================

ALTER TABLE public.workout_plan_exercises
  DROP COLUMN IF EXISTS rest_seconds;

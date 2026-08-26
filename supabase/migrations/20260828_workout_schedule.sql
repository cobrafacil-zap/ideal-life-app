/* =========================================================================
   Migration: 20260828_workout_schedule
   Adiciona agendamento semanal opcional a workout_plans.
   - scheduled_weekday: 0 (domingo) .. 6 (sabado). NULL = sem dia fixo.
   - sort_order ja existe; usamos para ordenar planos no mesmo dia.
   Idempotente.
   ========================================================================= */

ALTER TABLE public.workout_plans
  ADD COLUMN IF NOT EXISTS scheduled_weekday SMALLINT;

ALTER TABLE public.workout_plans
  DROP CONSTRAINT IF EXISTS workout_plans_scheduled_weekday_range;
ALTER TABLE public.workout_plans
  ADD CONSTRAINT workout_plans_scheduled_weekday_range
    CHECK (scheduled_weekday IS NULL
           OR (scheduled_weekday >= 0 AND scheduled_weekday <= 6));

-- Indice pra buscar o(s) plano(s) agendado(s) de um dia.
CREATE INDEX IF NOT EXISTS workout_plans_user_weekday_idx
  ON public.workout_plans (user_id, scheduled_weekday)
  WHERE scheduled_weekday IS NOT NULL;

/* =========================================================================
   Migration: 20260828_workout_module
   Prepara o schema para o módulo /treinos (FASE 1).
   - Adiciona colunas de feedback em exercise_sets + workout_sessions
   - Cria índice para a agenda/histórico
   - Cria bucket privado workout-images + policies
   - Cria função get_active_workout_session para a Home
   Idempotente (re-rodar não quebra).
   ========================================================================= */

-- 1) Feedback por série: RPE (esforço percebido 1–10) + desconforto (0–10).
ALTER TABLE public.exercise_sets
  ADD COLUMN IF NOT EXISTS rpe SMALLINT;

ALTER TABLE public.exercise_sets
  DROP CONSTRAINT IF EXISTS exercise_sets_rpe_range;
ALTER TABLE public.exercise_sets
  ADD CONSTRAINT exercise_sets_rpe_range
    CHECK (rpe IS NULL OR (rpe >= 1 AND rpe <= 10));

ALTER TABLE public.exercise_sets
  ADD COLUMN IF NOT EXISTS discomfort SMALLINT;

ALTER TABLE public.exercise_sets
  DROP CONSTRAINT IF EXISTS exercise_sets_discomfort_range;
ALTER TABLE public.exercise_sets
  ADD CONSTRAINT exercise_sets_discomfort_range
    CHECK (discomfort IS NULL OR (discomfort >= 0 AND discomfort <= 10));

-- 2) Feedback geral da sessão: RPE médio.
ALTER TABLE public.workout_sessions
  ADD COLUMN IF NOT EXISTS user_rpe SMALLINT;

ALTER TABLE public.workout_sessions
  DROP CONSTRAINT IF EXISTS workout_sessions_user_rpe_range;
ALTER TABLE public.workout_sessions
  ADD CONSTRAINT workout_sessions_user_rpe_range
    CHECK (user_rpe IS NULL OR (user_rpe >= 1 AND user_rpe <= 10));

-- 3) Índice para a agenda/histórico (consulta mais quente do módulo).
CREATE INDEX IF NOT EXISTS workout_sessions_user_started_idx
  ON public.workout_sessions (user_id, started_at DESC);

CREATE INDEX IF NOT EXISTS exercise_sets_session_idx
  ON public.exercise_sets (workout_session_id, set_number);

-- 4) Função utilitária: devolve a sessão em aberto do usuário (se houver).
CREATE OR REPLACE FUNCTION public.get_active_workout_session(p_user_id UUID)
RETURNS SETOF public.workout_sessions
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.workout_sessions
  WHERE user_id = p_user_id
    AND finished_at IS NULL
  ORDER BY started_at DESC
  LIMIT 1;
$$;

-- 5) Bucket privado para imagens de exercícios (limite 4 MB).
INSERT INTO storage.buckets (id, name, public, file_size_limit)
  VALUES ('workout-images', 'workout-images', false, 4 * 1024 * 1024)
  ON CONFLICT (id) DO UPDATE
    SET public = EXCLUDED.public,
        file_size_limit = EXCLUDED.file_size_limit;

-- 6) Policies do bucket workout-images: somente o dono da pasta lê/grava.
DROP POLICY IF EXISTS "workout_images_select_own" ON storage.objects;
CREATE POLICY "workout_images_select_own" ON storage.objects FOR SELECT
  USING (bucket_id = 'workout-images'
         AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "workout_images_insert_own" ON storage.objects;
CREATE POLICY "workout_images_insert_own" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'workout-images'
              AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "workout_images_update_own" ON storage.objects;
CREATE POLICY "workout_images_update_own" ON storage.objects FOR UPDATE
  USING (bucket_id = 'workout-images'
         AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "workout_images_delete_own" ON storage.objects;
CREATE POLICY "workout_images_delete_own" ON storage.objects FOR DELETE
  USING (bucket_id = 'workout-images'
         AND (storage.foldername(name))[1] = auth.uid()::text);

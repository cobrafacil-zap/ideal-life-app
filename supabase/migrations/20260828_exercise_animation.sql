/* =========================================================================
   Migration: 20260828_exercise_animation
   Adiciona suporte a mídias demonstrativas nos exercícios.
   - execution_notes: instruções curtas de execução (texto neutro).
   - animation_url: storage path no bucket workout-images (opcional).
     Quando preenchido, ExerciseMedia prefere animation_url (gif/vídeo curto)
     sobre image_url (estático).
   Idempotente.
   ========================================================================= */

ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS execution_notes TEXT;

ALTER TABLE public.exercises
  DROP CONSTRAINT IF EXISTS exercises_execution_notes_length;
ALTER TABLE public.exercises
  ADD CONSTRAINT exercises_execution_notes_length
    CHECK (execution_notes IS NULL OR char_length(execution_notes) <= 600);

ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS animation_url TEXT;

COMMENT ON COLUMN public.exercises.animation_url IS
  'Storage path opcional no bucket workout-images. Quando preenchido, '
  'tem prioridade sobre image_url — usado para GIF/vídeo curto.';

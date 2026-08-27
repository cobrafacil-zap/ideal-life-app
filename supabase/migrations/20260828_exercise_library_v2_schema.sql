/* =========================================================================
   Migration: 20260828_exercise_library_v2_schema
   Expande a tabela `exercises` para suportar a biblioteca ampla:
     - category        (texto, com CHECK) substitui a navegação fina do picker
     - aliases         (text[]) habilita busca por sinônimos
     - machine_type    (texto, com CHECK) classifica o equipamento
     - laterality      unilateral | bilateral | iso_lateral
     - difficulty      (smallint 1..5)
     - movement_pattern compound | isolation
     - instructions    (text) execução resumida
     - common_mistakes (text)
     - video_url       (text)

   Idempotente. Não remove `primary_muscle` (mantido por retrocompatibilidade).
   ========================================================================= */

ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS category         TEXT,
  ADD COLUMN IF NOT EXISTS aliases          TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS machine_type     TEXT,
  ADD COLUMN IF NOT EXISTS laterality       TEXT,
  ADD COLUMN IF NOT EXISTS difficulty       SMALLINT,
  ADD COLUMN IF NOT EXISTS movement_pattern TEXT,
  ADD COLUMN IF NOT EXISTS instructions     TEXT,
  ADD COLUMN IF NOT EXISTS common_mistakes  TEXT,
  ADD COLUMN IF NOT EXISTS video_url        TEXT;

-- CHECK: category
ALTER TABLE public.exercises
  DROP CONSTRAINT IF EXISTS exercises_category_check;
ALTER TABLE public.exercises
  ADD CONSTRAINT exercises_category_check CHECK (category IN (
    'peito','costas','ombros','biceps','triceps',
    'quadriceps','posterior','gluteos','adutores','abdutores',
    'panturrilha','tibial','abdomen','lombar','trapezio',
    'antebraco','corpo_inteiro','cardio'
  ));

-- CHECK: machine_type
ALTER TABLE public.exercises
  DROP CONSTRAINT IF EXISTS exercises_machine_type_check;
ALTER TABLE public.exercises
  ADD CONSTRAINT exercises_machine_type_check CHECK (machine_type IN (
    'selectorized','plate_loaded','cable','smith',
    'free_weight','bodyweight','cardio','other'
  ));

-- CHECK: laterality
ALTER TABLE public.exercises
  DROP CONSTRAINT IF EXISTS exercises_laterality_check;
ALTER TABLE public.exercises
  ADD CONSTRAINT exercises_laterality_check CHECK (
    laterality IS NULL OR laterality IN ('unilateral','bilateral','iso_lateral')
  );

-- CHECK: movement_pattern
ALTER TABLE public.exercises
  DROP CONSTRAINT IF EXISTS exercises_movement_pattern_check;
ALTER TABLE public.exercises
  ADD CONSTRAINT exercises_movement_pattern_check CHECK (
    movement_pattern IS NULL OR movement_pattern IN ('compound','isolation')
  );

-- CHECK: difficulty 1..5
ALTER TABLE public.exercises
  DROP CONSTRAINT IF EXISTS exercises_difficulty_check;
ALTER TABLE public.exercises
  ADD CONSTRAINT exercises_difficulty_check CHECK (
    difficulty IS NULL OR (difficulty BETWEEN 1 AND 5)
  );

-- Índice para o filtro por categoria (usado em todo listExercises global).
CREATE INDEX IF NOT EXISTS exercises_category_idx
  ON public.exercises (category, name)
  WHERE user_id IS NULL;

/* =========================================================================
   VITTA - Adiciona campos de demonstração visual aos exercícios
   demonstration_url: URL do GIF/vídeo curto (até 10s) mostrando execução
   demonstration_type: tipo da mídia (gif, video, image)
   ========================================================================= */

ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS demonstration_url TEXT,
  ADD COLUMN IF NOT EXISTS demonstration_type TEXT;

-- Constraint para garantir que demonstration_type só tenha valores válidos
ALTER TABLE public.exercises
  DROP CONSTRAINT IF EXISTS exercises_demonstration_type_check;

ALTER TABLE public.exercises
  ADD CONSTRAINT exercises_demonstration_type_check
  CHECK (demonstration_type IS NULL OR demonstration_type IN ('gif', 'video', 'image'));

-- Índice para exercícios que têm demonstração
CREATE INDEX IF NOT EXISTS exercises_has_demonstration_idx
  ON public.exercises (id)
  WHERE demonstration_url IS NOT NULL;

COMMENT ON COLUMN public.exercises.demonstration_url IS 'URL do GIF/vídeo curto (máx 10s) demonstrando a execução do exercício';
COMMENT ON COLUMN public.exercises.demonstration_type IS 'Tipo da mídia: gif, video ou image';

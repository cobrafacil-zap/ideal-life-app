/* =========================================================================
   VITTA - Garante category em todos os exercícios (idempotente)
   Preenche category para exercícios que ainda estão com NULL, baseado
   no nome, aliases e primary_muscle. Rode no SQL Editor do Supabase.
   ========================================================================= */

-- Mapeamento de palavras-chave para categoria fina
WITH keyword_map AS (
  SELECT * FROM (VALUES
    ('glute', 'gluteos'),
    ('glúteo', 'gluteos'),
    ('gluteo', 'gluteos'),
    ('hip thrust', 'gluteos'),
    ('hip thruster', 'gluteos'),
    ('ponte', 'gluteos'),
    ('pump', 'gluteos'),
    ('kickback', 'gluteos'),
    ('coice', 'gluteos'),
    ('abducao', 'abdutores'),
    ('abdução', 'abdutores'),
    ('aducao', 'adutores'),
    ('adução', 'adutores'),
    ('quadriceps', 'quadriceps'),
    ('quadriceps', 'quadriceps'),
    ('leg press', 'quadriceps'),
    ('agachamento', 'quadriceps'),
    ('squat', 'quadriceps'),
    ('afundo', 'quadriceps'),
    ('avanco', 'quadriceps'),
    ('step up', 'quadriceps'),
    ('extensao', 'quadriceps'),
    ('extensão', 'quadriceps'),
    ('posterior', 'posterior'),
    ('hamstring', 'posterior'),
    ('flexora', 'posterior'),
    ('stiff', 'posterior'),
    ('terra', 'posterior'),
    ('romeno', 'posterior'),
    ('panturrilha', 'panturrilha'),
    ('calcanhar', 'panturrilha'),
    ('peito', 'peito'),
    ('chest', 'peito'),
    ('supino', 'peito'),
    ('crucifixo', 'peito'),
    ('fly', 'peito'),
    ('costas', 'costas'),
    ('remada', 'costas'),
    ('puxada', 'costas'),
    ('lat', 'costas'),
    ('ombro', 'ombros'),
    ('ombros', 'ombros'),
    ('desenvolvimento', 'ombros'),
    ('elevacao', 'ombros'),
    ('elevação', 'ombros'),
    ('biceps', 'biceps'),
    ('bíceps', 'biceps'),
    ('rosca', 'biceps'),
    ('triceps', 'triceps'),
    ('tríceps', 'triceps'),
    ('tricep', 'triceps'),
    ('abdomen', 'abdomen'),
    ('abdominal', 'abdomen'),
    ('prancha', 'abdomen'),
    ('lombar', 'lombar'),
    ('core', 'core'),
    ('cardio', 'cardio'),
    ('esteira', 'cardio'),
    ('bicicleta', 'cardio'),
    ('eliptico', 'cardio'),
    ('elíptico', 'cardio')
  ) AS t(keyword, category)
),
exercises_to_update AS (
  SELECT DISTINCT e.id, e.name, e.primary_muscle, e.aliases,
    (
      SELECT km.category
      FROM keyword_map km
      WHERE
        LOWER(e.name) LIKE '%' || km.keyword || '%'
        OR EXISTS (
          SELECT 1 FROM UNNEST(e.aliases) AS alias
          WHERE LOWER(alias) LIKE '%' || km.keyword || '%'
        )
      ORDER BY LENGTH(km.keyword) DESC
      LIMIT 1
    ) AS new_category
  FROM public.exercises e
  WHERE e.category IS NULL
)
UPDATE public.exercises e
SET category = eu.new_category
FROM exercises_to_update eu
WHERE e.id = eu.id AND eu.new_category IS NOT NULL;

-- Para exercícios que ainda estão sem category, usar primary_muscle como fallback
UPDATE public.exercises
SET category = CASE primary_muscle
  WHEN 'peito' THEN 'peito'
  WHEN 'costas' THEN 'costas'
  WHEN 'pernas' THEN 'quadriceps'
  WHEN 'ombros' THEN 'ombros'
  WHEN 'bracos' THEN 'biceps'
  WHEN 'core' THEN 'core'
  WHEN 'cardio' THEN 'cardio'
  ELSE 'corpo_inteiro'
END
WHERE category IS NULL;

-- Log do resultado
DO $$
DECLARE
  total_count INTEGER;
  null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count FROM public.exercises;
  SELECT COUNT(*) INTO null_count FROM public.exercises WHERE category IS NULL;
  RAISE NOTICE 'Total exercícios: %, Sem category: %', total_count, null_count;
END $$;

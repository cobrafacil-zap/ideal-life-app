/* =========================================================================
   Migration: 20260910_gluteos_extras
   Preenche lacunas na busca de glúteos / pernas / posteriores.

   - Insere 12 exercícios que faltavam para que "glúteo" / "perna" /
     "afundo" / "posterior" retornem cobertura completa no picker.
   - Enriquece `aliases` dos existentes sem sobrescrever o que já está.

   Idempotente: INSERTs via `WHERE NOT EXISTS` (mesmo padrão do seed
   `20260828_exercise_library_v2_data.sql`); UPDATEs via
   `NOT (... = ANY(aliases))` para não duplicar entrada em re-run.
   ========================================================================= */

DO $$
DECLARE
  inserted INT := 0;
BEGIN
  /* ====================================================================
     1) Novos exercícios
     ==================================================================== */

  INSERT INTO public.exercises
    (user_id, name, primary_muscle, secondary_muscles, equipment, machine_type,
     category, aliases, instructions)
  SELECT NULL, t.name, t."primary", t."secondary", t.equipment, t.machine_type,
         t.category, t.aliases, t.instructions
  FROM (VALUES
    ('Frog Pump', 'pernas', ARRAY['gluteos']::TEXT[], 'barra', 'free_weight',
     'gluteos', ARRAY['Frog pump','Pump de glúteo']::TEXT[],
     'Deitado com solas juntas e joelhos abertos, suba o quadril contraindo os glúteos no topo.'),
    ('Afundo', 'pernas', ARRAY['gluteos','quadriceps']::TEXT[], 'haltere', 'free_weight',
     'quadriceps', ARRAY['Lunge clássico','Walking lunge','Afundo clássico']::TEXT[],
     'Dê um passo à frente e desça até o joelho de trás quase tocar o chão. Alterne pernas.'),
    ('Afundo reverso', 'pernas', ARRAY['gluteos','quadriceps']::TEXT[], 'haltere', 'free_weight',
     'quadriceps', ARRAY['Reverse lunge','Afundo ré']::TEXT[],
     'Dê um passo para trás e desça flexionando os joelhos. Menos estresse no joelho da frente.'),
    ('Step Up', 'pernas', ARRAY['gluteos','quadriceps']::TEXT[], 'haltere', 'free_weight',
     'gluteos', ARRAY['Step up','Subida no step','Step up halter']::TEXT[],
     'Em frente ao step, suba com uma perna e desça controlando. Foco em quadríceps e glúteo.'),
    ('Levantamento terra romeno', 'pernas', ARRAY['posterior','gluteos']::TEXT[], 'barra', 'free_weight',
     'posterior', ARRAY['RDL','Romanian deadlift','Terra romeno','Levantamento terra romeno barra']::TEXT[],
     'Barra nas mãos, desça rolando pelas coxas com joelhos pouco flexionados e costas neutras.'),
    ('Levantamento terra sumô', 'pernas', ARRAY['posterior','gluteos','adutores']::TEXT[], 'barra', 'free_weight',
     'posterior', ARRAY['Sumo deadlift','Terra sumô','Levantamento terra sumô barra']::TEXT[],
     'Pés bem afastados e pontas para fora, suba com tronco ereto e pegada no meio da barra.'),
    ('Pull Through no cabo', 'pernas', ARRAY['gluteos','posterior']::TEXT[], 'cabo', 'cable',
     'gluteos', ARRAY['Cable pull through','Pull through polia','Pull through']::TEXT[],
     'De costas para o cabo baixo, puxe a alça entre as pernas estendendo o quadril contraindo glúteos.'),
    ('Glúteo quatro apoios', 'pernas', ARRAY[]::TEXT[], 'nenhum', 'bodyweight',
     'gluteos', ARRAY['Donkey kick','Coice quatro apoios','Gluteo 4 apoios']::TEXT[],
     'Quatro apoios, chute uma perna para trás e para cima contraindo o glúteo. Costas neutras.'),
    ('Glúteo no Smith', 'pernas', ARRAY['posterior']::TEXT[], 'barra', 'smith',
     'gluteos', ARRAY['Smith glute','Hip thrust smith','Smith hip thrust gluteo']::TEXT[],
     'Apoiado no banco com a barra no quadril, suba no Smith até alinhar tronco e coxas.'),
    ('Extensão de quadril quatro apoios', 'pernas', ARRAY[]::TEXT[], 'nenhum', 'bodyweight',
     'gluteos', ARRAY['Quadruped hip extension','Coice extensão quadril','Extensao quadril 4 apoios']::TEXT[],
     'Quatro apoios, estenda o quadril para trás e para cima mantendo o core estável.'),
    ('Abdução com elástico', 'pernas', ARRAY[]::TEXT[], 'elastico', 'other',
     'abdutores', ARRAY['Band hip abduction','Abdução banda','Abdução elástico']::TEXT[],
     'Em pé com elástico nos tornozelos, afaste a perna lateralmente contra a resistência.'),
    ('Cadeira abdutora', 'pernas', ARRAY[]::TEXT[], 'maquina', 'selectorized',
     'abdutores', ARRAY['Hip abduction machine','Abdução cadeira']::TEXT[],
     'Sentado na cadeira abdutora, abra as pernas contra a resistência. Trabalha glúteo médio/mínimo.')
  ) AS t(name, "primary", "secondary", equipment, machine_type, category, aliases, instructions)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.exercises
    WHERE user_id IS NULL AND LOWER(name) = LOWER(t.name)
  );

  GET DIAGNOSTICS inserted = ROW_COUNT;

  /* ====================================================================
     2) Enriquecimento de `aliases` em exercícios existentes
        (sem sobrescrever, sem duplicar)
     ==================================================================== */

  -- Hip thrust
  UPDATE public.exercises
  SET aliases = ARRAY(SELECT DISTINCT unnest(aliases || ARRAY['Barra','Hip thrust clássico']::TEXT[]))
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Hip thrust')
    AND NOT ('Barra' = ANY(aliases));

  -- Elevação pélvica (alias "Ponte de glúteo" cobre o que o usuário
  -- costuma digitar; "Ponte" é ainda mais curto)
  UPDATE public.exercises
  SET aliases = ARRAY(SELECT DISTINCT unnest(aliases || ARRAY['Ponte de glúteo','Ponte']::TEXT[]))
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Elevação pélvica')
    AND NOT ('Ponte de glúteo' = ANY(aliases));

  -- Abdução de quadril
  UPDATE public.exercises
  SET aliases = ARRAY(SELECT DISTINCT unnest(aliases || ARRAY['Cadeira abdutora','Abdução quadril']::TEXT[]))
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Abdução de quadril')
    AND NOT ('Cadeira abdutora' = ANY(aliases));

  -- Abdução em pé máquina
  UPDATE public.exercises
  SET aliases = ARRAY(SELECT DISTINCT unnest(aliases || ARRAY['Hip abduction','Abdução em pé']::TEXT[]))
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Abdução em pé máquina')
    AND NOT ('Hip abduction' = ANY(aliases));

  -- Abdução no cabo
  UPDATE public.exercises
  SET aliases = ARRAY(SELECT DISTINCT unnest(aliases || ARRAY['Abdução quadril cabo','Cable hip abduction']::TEXT[]))
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Abdução no cabo')
    AND NOT ('Abdução quadril cabo' = ANY(aliases));

  -- Máquina adutora
  UPDATE public.exercises
  SET aliases = ARRAY(SELECT DISTINCT unnest(aliases || ARRAY['Adutora','Hip adduction machine']::TEXT[]))
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Máquina adutora')
    AND NOT ('Adutora' = ANY(aliases));

  -- Afundo búlgaro
  UPDATE public.exercises
  SET aliases = ARRAY(SELECT DISTINCT unnest(aliases || ARRAY['Bulgarian split squat']::TEXT[]))
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Afundo búlgaro')
    AND NOT ('Bulgarian split squat' = ANY(aliases));

  -- Romanian Deadlift no Smith
  UPDATE public.exercises
  SET aliases = ARRAY(SELECT DISTINCT unnest(aliases || ARRAY['RDL no Smith','Smith RDL']::TEXT[]))
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Romanian Deadlift no Smith')
    AND NOT ('RDL no Smith' = ANY(aliases));

  -- Bom dia
  UPDATE public.exercises
  SET aliases = ARRAY(SELECT DISTINCT unnest(aliases || ARRAY['Good morning','Good Morning']::TEXT[]))
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Bom dia')
    AND NOT ('Good morning' = ANY(aliases));

  -- Agachamento livre
  UPDATE public.exercises
  SET aliases = ARRAY(SELECT DISTINCT unnest(aliases || ARRAY['Agachamento barra','Back squat','Squat']::TEXT[]))
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Agachamento livre')
    AND NOT ('Back squat' = ANY(aliases));

  -- Agachamento sumô
  UPDATE public.exercises
  SET aliases = ARRAY(SELECT DISTINCT unnest(aliases || ARRAY['Sumo squat']::TEXT[]))
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Agachamento sumô')
    AND NOT ('Sumo squat' = ANY(aliases));

  RAISE NOTICE 'Gluteos extras: % novos exercícios inseridos (após este bloco).', inserted;
END $$;

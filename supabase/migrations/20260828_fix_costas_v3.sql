/* =========================================================================
   Migration: 20260828_fix_costas_v3
   Reorganiza os 5 exercícios canônicos da categoria COSTAS no catálogo
   global (user_id IS NULL):

     1) Puxada Alta                       (cabo / polia)         COSTAS
     2) Puxada Baixa                      (cabo / polia baixa)   COSTAS
     3) Crucifixo Invertido               (máquina / peck deck)  COSTAS
     4) Remada Sentada na Máquina         (máquina)              COSTAS
     5) Puxador Alto na Máquina           (máquina)              COSTAS

   Esta migration é idempotente e segura:
     - Antes de inserir, consulta exercícios existentes (case-insensitive)
       para preservar o ID e aliases já usados.
     - Para os itens que já existem com nome similar, FAZ UPDATE em vez
       de INSERT (mantém o ID — evita órfãos em workout_plan_exercises /
       exercise_sets / WorkoutSession).
     - Itens duplicados com mesmo LOWER(name) são deduplicados antes
       da inserção (mantém a linha mais antiga).
     - Não apaga séries, históricos, treinos ou sessões.
     - Reclassifica variações existentes (Crucifixo inverso haltere /
       máquina) também para category='costas' para aparecerem no bucket
       Costas quando o usuário rolar — sem excluir as entradas.
   ========================================================================= */

DO $$
DECLARE
  dup_count INT;
  ins_count INT;
  upd_count INT;
BEGIN
  /* ====================================================================
     0) DEDUP — remove cópias duplicadas por LOWER(name) no catálogo
        global, preservando a linha mais antiga (menor created_at).
        IMPORTANTE: só apaga linhas que NÃO têm referências em
        workout_plan_exercises ou exercise_sets — assim não quebramos
        treinos, séries ou históricos existentes.
     ==================================================================== */
  WITH ranked AS (
    SELECT id, name,
           ROW_NUMBER() OVER (
             PARTITION BY LOWER(name)
             ORDER BY created_at ASC, id ASC
           ) AS rn
    FROM public.exercises
    WHERE user_id IS NULL
  ),
  in_use AS (
    SELECT DISTINCT exercise_id FROM public.workout_plan_exercises
    UNION
    SELECT DISTINCT exercise_id FROM public.exercise_sets
  )
  DELETE FROM public.exercises e
    USING ranked r
   WHERE e.id = r.id
     AND r.rn > 1
     AND e.id NOT IN (SELECT exercise_id FROM in_use WHERE exercise_id IS NOT NULL);
  GET DIAGNOSTICS dup_count = ROW_COUNT;
  RAISE NOTICE 'fix_costas_v3: % duplicatas removidas antes do upsert (preservando IDs em uso).', dup_count;

  /* ====================================================================
     1) PUXADA ALTA — cabo/polia, COSTAS
        Aliases: puxada alta, pulley, pulley frente, puxada frente,
                 lat pulldown
     ==================================================================== */
  IF NOT EXISTS (
    SELECT 1 FROM public.exercises
    WHERE user_id IS NULL AND LOWER(name) = LOWER('Puxada Alta')
  ) THEN
    INSERT INTO public.exercises (
      user_id, name, primary_muscle, secondary_muscles, equipment,
      substitutes, image_url, animation_url, execution_notes,
      category, machine_type, aliases, instructions
    ) VALUES (
      NULL, 'Puxada Alta', 'costas', ARRAY['bracos']::TEXT[], 'cabo',
      ARRAY[]::TEXT[], NULL, NULL,
      'Sente-se no pulley e ajuste o apoio de coxas. Puxe a barra em direção à parte superior do peito, conduzindo os cotovelos para baixo e para trás. Retorne controlando, sem deixar o tronco cair bruscamente para frente.',
      'costas', 'cable',
      ARRAY['Puxada alta','Pulley','Pulley frente','Puxada frente','Lat pulldown']::TEXT[],
      'Sente-se no pulley e ajuste o apoio de coxas. Puxe a barra em direção à parte superior do peito, conduzindo os cotovelos para baixo e para trás. Retorne controlando.'
    );
    GET DIAGNOSTICS ins_count = ROW_COUNT;
    RAISE NOTICE 'fix_costas_v3: Puxada Alta inserida (%).', ins_count;
  ELSE
    UPDATE public.exercises SET
      primary_muscle     = 'costas',
      equipment          = 'cabo',
      secondary_muscles  = ARRAY['bracos']::TEXT[],
      category           = 'costas',
      machine_type       = COALESCE(machine_type, 'cable'),
      aliases            = COALESCE(NULLIF(aliases, ARRAY[]::TEXT[]),
                                     ARRAY['Puxada alta','Pulley','Pulley frente','Puxada frente','Lat pulldown']::TEXT[]),
      instructions       = COALESCE(instructions,
        'Sente-se no pulley e ajuste o apoio de coxas. Puxe a barra em direção à parte superior do peito, conduzindo os cotovelos para baixo e para trás. Retorne controlando.')
    WHERE user_id IS NULL AND LOWER(name) = LOWER('Puxada Alta');
    GET DIAGNOSTICS upd_count = ROW_COUNT;
    RAISE NOTICE 'fix_costas_v3: Puxada Alta atualizada (%).', upd_count;
  END IF;

  /* ====================================================================
     2) PUXADA BAIXA — cabo/polia baixa, COSTAS
        Aliases: puxada baixa, pulley baixo, puxada baixa no cabo,
                 remada baixa no cabo
     ==================================================================== */
  IF NOT EXISTS (
    SELECT 1 FROM public.exercises
    WHERE user_id IS NULL AND LOWER(name) = LOWER('Puxada Baixa')
  ) THEN
    INSERT INTO public.exercises (
      user_id, name, primary_muscle, secondary_muscles, equipment,
      substitutes, image_url, animation_url, execution_notes,
      category, machine_type, aliases, instructions
    ) VALUES (
      NULL, 'Puxada Baixa', 'costas', ARRAY['bracos']::TEXT[], 'cabo',
      ARRAY[]::TEXT[], NULL, NULL,
      'Sentado de frente para o pulley baixo, puxe o cabo até o abdômen, contraindo as escapulares. Retorne controlando, sem arredondar a lombar.',
      'costas', 'cable',
      ARRAY['Puxada baixa','Pulley baixo','Puxada baixa no cabo','Remada baixa no cabo']::TEXT[],
      'Sentado de frente para o pulley baixo, puxe o cabo até o abdômen, contraindo as escapulares. Retorne controlando.'
    );
    GET DIAGNOSTICS ins_count = ROW_COUNT;
    RAISE NOTICE 'fix_costas_v3: Puxada Baixa inserida (%).', ins_count;
  ELSE
    UPDATE public.exercises SET
      primary_muscle     = 'costas',
      equipment          = 'cabo',
      secondary_muscles  = ARRAY['bracos']::TEXT[],
      category           = 'costas',
      machine_type       = COALESCE(machine_type, 'cable'),
      aliases            = COALESCE(NULLIF(aliases, ARRAY[]::TEXT[]),
                                     ARRAY['Puxada baixa','Pulley baixo','Puxada baixa no cabo','Remada baixa no cabo']::TEXT[]),
      instructions       = COALESCE(instructions,
        'Sentado de frente para o pulley baixo, puxe o cabo até o abdômen, contraindo as escapulares. Retorne controlando.')
    WHERE user_id IS NULL AND LOWER(name) = LOWER('Puxada Baixa');
    GET DIAGNOSTICS upd_count = ROW_COUNT;
    RAISE NOTICE 'fix_costas_v3: Puxada Baixa atualizada (%).', upd_count;
  END IF;

  /* ====================================================================
     3) CRUCIFIXO INVERTIDO — máquina/peck deck reverso, COSTAS
        Énfase: parte posterior dos ombros e parte superior das costas.
        Aliases: crucifixo invertido, voador invertido, peck deck reverso,
                 reverse fly, reverse pec deck
     ==================================================================== */
  IF NOT EXISTS (
    SELECT 1 FROM public.exercises
    WHERE user_id IS NULL AND LOWER(name) = LOWER('Crucifixo Invertido')
  ) THEN
    INSERT INTO public.exercises (
      user_id, name, primary_muscle, secondary_muscles, equipment,
      substitutes, image_url, animation_url, execution_notes,
      category, machine_type, aliases, instructions
    ) VALUES (
      NULL, 'Crucifixo Invertido', 'costas', ARRAY['ombros']::TEXT[], 'maquina',
      ARRAY[]::TEXT[], NULL, NULL,
      'Sentado de frente para a máquina (peck deck reverso), abra os braços contra a resistência focando no deltoide posterior e na parte superior das costas. Retorne sem perder tensão.',
      'costas', 'selectorized',
      ARRAY['Crucifixo invertido','Voador invertido','Peck deck reverso','Reverse fly','Reverse pec deck']::TEXT[],
      'Sentado de frente para a máquina (peck deck reverso), abra os braços contra a resistência focando no deltoide posterior e na parte superior das costas. Retorne sem perder tensão.'
    );
    GET DIAGNOSTICS ins_count = ROW_COUNT;
    RAISE NOTICE 'fix_costas_v3: Crucifixo Invertido inserido (%).', ins_count;
  ELSE
    UPDATE public.exercises SET
      primary_muscle     = 'costas',
      equipment          = 'maquina',
      secondary_muscles  = ARRAY['ombros']::TEXT[],
      category           = 'costas',
      machine_type       = COALESCE(machine_type, 'selectorized'),
      aliases            = COALESCE(NULLIF(aliases, ARRAY[]::TEXT[]),
                                     ARRAY['Crucifixo invertido','Voador invertido','Peck deck reverso','Reverse fly','Reverse pec deck']::TEXT[]),
      instructions       = COALESCE(instructions,
        'Sentado de frente para a máquina (peck deck reverso), abra os braços contra a resistência focando no deltoide posterior e na parte superior das costas. Retorne sem perder tensão.')
    WHERE user_id IS NULL AND LOWER(name) = LOWER('Crucifixo Invertido');
    GET DIAGNOSTICS upd_count = ROW_COUNT;
    RAISE NOTICE 'fix_costas_v3: Crucifixo Invertido atualizado (%).', upd_count;
  END IF;

  /* ====================================================================
     4) REMADA SENTADA NA MÁQUINA — máquina, COSTAS
        Já existia (gaps_v1). Aqui reforçamos category/aliases/instructions
        para alinhar com o nome canônico pedido pelo usuário.
     ==================================================================== */
  UPDATE public.exercises SET
    primary_muscle     = 'costas',
    equipment          = 'maquina',
    secondary_muscles  = ARRAY['bracos','ombros']::TEXT[],
    category           = 'costas',
    machine_type       = COALESCE(machine_type, 'selectorized'),
    aliases            = COALESCE(NULLIF(aliases, ARRAY[]::TEXT[]),
                                   ARRAY['Remada sentada','Remada máquina','Remada na máquina','Seated row','Machine row']::TEXT[]),
    instructions       = COALESCE(instructions,
      'Sente-se com os pés firmes no apoio, joelhos semitracionados. Puxe o tronco em direção ao apoio peitoral, conduzindo o cotovelo para trás. Retorne controlando, sem arredondar a lombar.')
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Remada Sentada na Máquina');
  GET DIAGNOSTICS upd_count = ROW_COUNT;
  RAISE NOTICE 'fix_costas_v3: Remada Sentada na Máquina atualizada (%).', upd_count;

  /* ====================================================================
     5) PUXADOR ALTO NA MÁQUINA — máquina selectorized, COSTAS
        É uma VARIAÇÃO distinta do "Puxador alto" (cabo). Mantemos a
        entrada antiga "Puxador alto" intocada e criamos uma nova.
     ==================================================================== */
  IF NOT EXISTS (
    SELECT 1 FROM public.exercises
    WHERE user_id IS NULL AND LOWER(name) = LOWER('Puxador Alto na Máquina')
  ) THEN
    INSERT INTO public.exercises (
      user_id, name, primary_muscle, secondary_muscles, equipment,
      substitutes, image_url, animation_url, execution_notes,
      category, machine_type, aliases, instructions
    ) VALUES (
      NULL, 'Puxador Alto na Máquina', 'costas', ARRAY['bracos']::TEXT[], 'maquina',
      ARRAY[]::TEXT[], NULL, NULL,
      'Sentado na máquina, ajuste o apoio de coxas. Puxe a alavanca em direção à parte superior do peito, conduzindo os cotovelos para baixo e para trás. Retorne controlando, sem deixar o tronco cair bruscamente para frente.',
      'costas', 'selectorized',
      ARRAY['Puxador alto','Puxador máquina','Puxada máquina','Puxada alta máquina','Lat pulldown machine']::TEXT[],
      'Sentado na máquina, ajuste o apoio de coxas. Puxe a alavanca em direção à parte superior do peito, conduzindo os cotovelos para baixo e para trás. Retorne controlando.'
    );
    GET DIAGNOSTICS ins_count = ROW_COUNT;
    RAISE NOTICE 'fix_costas_v3: Puxador Alto na Máquina inserido (%).', ins_count;
  ELSE
    UPDATE public.exercises SET
      primary_muscle     = 'costas',
      equipment          = 'maquina',
      secondary_muscles  = ARRAY['bracos']::TEXT[],
      category           = 'costas',
      machine_type       = COALESCE(machine_type, 'selectorized'),
      aliases            = COALESCE(NULLIF(aliases, ARRAY[]::TEXT[]),
                                     ARRAY['Puxador alto','Puxador máquina','Puxada máquina','Puxada alta máquina','Lat pulldown machine']::TEXT[]),
      instructions       = COALESCE(instructions,
        'Sentado na máquina, ajuste o apoio de coxas. Puxe a alavanca em direção à parte superior do peito, conduzindo os cotovelos para baixo e para trás. Retorne controlando.')
    WHERE user_id IS NULL AND LOWER(name) = LOWER('Puxador Alto na Máquina');
    GET DIAGNOSTICS upd_count = ROW_COUNT;
    RAISE NOTICE 'fix_costas_v3: Puxador Alto na Máquina atualizado (%).', upd_count;
  END IF;

  /* ====================================================================
     6) BÔNUS — reclassificar variações existentes de Crucifixo inverso
        (haltere e máquina) também como category='costas' para aparecerem
        no bucket Costas do picker, sem remover nem renomear nada.
        Mantém o primary_muscle legado (ombros) para retrocompatibilidade.
     ==================================================================== */
  UPDATE public.exercises SET category = 'costas'
  WHERE user_id IS NULL
    AND LOWER(name) IN (
      LOWER('Crucifixo inverso'),
      LOWER('Crucifixo inverso na máquina'),
      LOWER('Reverse Fly máquina')
    );
  GET DIAGNOSTICS upd_count = ROW_COUNT;
  RAISE NOTICE 'fix_costas_v3: variações de crucifixo inverso reclassificadas para category=costas (%).', upd_count;
END $$;

-- Verificação final: 5 entradas canônicas em Costas.
SELECT
  name,
  primary_muscle,
  category,
  equipment,
  machine_type,
  array_length(aliases, 1) AS n_aliases,
  CASE WHEN image_url IS NOT NULL THEN 'sim' ELSE 'não' END AS tem_imagem,
  CASE WHEN animation_url IS NOT NULL THEN 'sim' ELSE 'não' END AS tem_animacao
FROM public.exercises
WHERE user_id IS NULL
  AND LOWER(name) IN (
    LOWER('Puxada Alta'),
    LOWER('Puxada Baixa'),
    LOWER('Crucifixo Invertido'),
    LOWER('Remada Sentada na Máquina'),
    LOWER('Puxador Alto na Máquina')
  )
ORDER BY name;

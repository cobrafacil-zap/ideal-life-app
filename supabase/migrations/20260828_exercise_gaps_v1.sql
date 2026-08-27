/* =========================================================================
   Migration: 20260828_exercise_gaps_v1
   Acrescenta 3 exercícios ao catálogo global (user_id IS NULL) que estavam
   faltando no seed inicial:
     - Cadeira flexora (pernas, máquina)
     - Remada sentada na máquina (costas, máquina)
     - Puxador alto (costas, cabo)

   Idempotente: cada insert é precedido de um IF NOT EXISTS case-insensitive
   no nome, replicando a estratégia da seed original.
   ========================================================================= */

DO $$
DECLARE
  inserted INT := 0;
  skipped INT := 0;
BEGIN
  -- 1) Cadeira flexora
  IF NOT EXISTS (
    SELECT 1 FROM public.exercises
    WHERE user_id IS NULL AND LOWER(name) = LOWER('Cadeira flexora')
  ) THEN
    INSERT INTO public.exercises (
      user_id, name, primary_muscle, secondary_muscles, equipment,
      substitutes, image_url, animation_url, execution_notes
    ) VALUES (
      NULL, 'Cadeira flexora', 'pernas', ARRAY['gluteos']::TEXT[], 'maquina',
      ARRAY[]::TEXT[], NULL, NULL,
      'Ajuste o banco para que o joelho fique alinhado com o eixo da máquina. Flexione os joelhos levando os calcanhares em direção aos glúteos, sem tirar o quadril do banco. Retorne controlando.'
    );
    inserted := inserted + 1;
  ELSE
    skipped := skipped + 1;
  END IF;

  -- 2) Remada sentada na máquina
  IF NOT EXISTS (
    SELECT 1 FROM public.exercises
    WHERE user_id IS NULL AND LOWER(name) = LOWER('Remada sentada na máquina')
  ) THEN
    INSERT INTO public.exercises (
      user_id, name, primary_muscle, secondary_muscles, equipment,
      substitutes, image_url, animation_url, execution_notes
    ) VALUES (
      NULL, 'Remada sentada na máquina', 'costas', ARRAY['bracos','ombros']::TEXT[], 'maquina',
      ARRAY[]::TEXT[], NULL, NULL,
      'Sente-se com os pés firmes no apoio, joelhos semitracionados. Puxe o tronco em direção ao apoio peitoral, conduzindo o cotovelo para trás. Retorne controlando, sem arredondar a lombar.'
    );
    inserted := inserted + 1;
  ELSE
    skipped := skipped + 1;
  END IF;

  -- 3) Puxador alto
  IF NOT EXISTS (
    SELECT 1 FROM public.exercises
    WHERE user_id IS NULL AND LOWER(name) = LOWER('Puxador alto')
  ) THEN
    INSERT INTO public.exercises (
      user_id, name, primary_muscle, secondary_muscles, equipment,
      substitutes, image_url, animation_url, execution_notes
    ) VALUES (
      NULL, 'Puxador alto', 'costas', ARRAY['bracos']::TEXT[], 'cabo',
      ARRAY[]::TEXT[], NULL, NULL,
      'Sente-se e ajuste o apoio de coxas. Puxe a barra em direção à parte superior do peito, conduzindo os cotovelos para baixo e para trás. Retorne controlando, sem deixar o tronco cair bruscamente para frente.'
    );
    inserted := inserted + 1;
  ELSE
    skipped := skipped + 1;
  END IF;

  RAISE NOTICE 'Gaps v1 concluído: % inseridos, % já existiam.', inserted, skipped;
END $$;

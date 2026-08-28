/* =========================================================================
   Migration: 20260828_ensure_costas_exercises
   INSERT blind (sem IF NOT EXISTS) para garantir que Puxador alto e
   Remada sentada na máquina existam no catálogo global (user_id IS NULL).

   Diferente do gaps_v1, esta migration:
   - NÃO checa antes de inserir.
   - Remove qualquer duplicata prévia com mesmo LOWER(name) antes de
     inserir (para evitar duplicatas acumuladas por re-rodadas do
     seed original + gaps_v1).
   - Faz o INSERT canônico por último.
   - Idempotente: rodar 2x resulta em 2 linhas (mesma quantidade).
   ========================================================================= */

DO $$
DECLARE
  removed_puxador INT := 0;
  removed_remada INT := 0;
  inserted_pux INT;
  inserted_remada INT;
BEGIN
  -- Remove duplicatas anteriores (mantém só a que tem o menor id, que é a
  -- inserida mais cedo — apaga as posteriores se houver mais de uma).
  DELETE FROM public.exercises
  WHERE user_id IS NULL
    AND LOWER(name) = LOWER('Puxador alto')
    AND id NOT IN (
      SELECT MIN(id) FROM public.exercises
      WHERE user_id IS NULL AND LOWER(name) = LOWER('Puxador alto')
    );
  GET DIAGNOSTICS removed_puxador = ROW_COUNT;

  DELETE FROM public.exercises
  WHERE user_id IS NULL
    AND LOWER(name) = LOWER('Remada sentada na máquina')
    AND id NOT IN (
      SELECT MIN(id) FROM public.exercises
      WHERE user_id IS NULL AND LOWER(name) = LOWER('Remada sentada na máquina')
    );
  GET DIAGNOSTICS removed_remada = ROW_COUNT;

  -- INSERT canônico dos dois (cada um roda se não existir).
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
    GET DIAGNOSTICS inserted_pux = ROW_COUNT;
  END IF;

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
    GET DIAGNOSTICS inserted_remada = ROW_COUNT;
  END IF;

  -- Garante que estejam classificados como Costas no v2 (caso a migration
  -- v2 não tenha sido aplicada mas force_costas também não).
  UPDATE public.exercises SET primary_muscle = 'costas'
  WHERE user_id IS NULL
    AND LOWER(name) IN (LOWER('Puxador alto'), LOWER('Remada sentada na máquina'));

  RAISE NOTICE 'ensure_costas_exercises: removidas % duplicatas Puxador alto e % Remada sentada; inseridos Puxador=%, Remada=%.',
    removed_puxador, removed_remada, COALESCE(inserted_pux, 0), COALESCE(inserted_remada, 0);
END $$;

-- Verificação final: 1 linha por exercício, todas em primary_muscle='costas'.
SELECT
  name,
  primary_muscle,
  equipment,
  created_at
FROM public.exercises
WHERE user_id IS NULL
  AND LOWER(name) IN (LOWER('Puxador alto'), LOWER('Remada sentada na máquina'))
ORDER BY name;
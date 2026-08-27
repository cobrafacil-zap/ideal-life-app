/* =========================================================================
   Migration: 20260828_force_costas_exercises
   Garante que dois exercícios fiquem visíveis no bucket "Costas" do picker:

   1) Puxador alto — seed original já classifica como costas
      (primary_muscle='costas'). Aqui só reforçamos category/machine_type/
      aliases/instructions caso a migration v2 ainda não tenha rodado.

   2) Remada alta — no seed original está em primary_muscle='ombros'
      (upright row trabalha deltoide + trapézio). O usuário pediu para
      incluí-la também em Costas (recruta traps e romboides como
      secundários). Como o picker agrupa por category (v2) e cai
      em primary_muscle (legado), basta ajustar o category='costas' para
      que apareça no bucket Costas — sem remover o primary_muscle
      legado (que ainda pode ser usado em filtros legados).

   Idempotente: WHERE user_id IS NULL AND LOWER(name) = LOWER(?).
   ========================================================================= */

DO $$
DECLARE
  updated_count INT := 0;
BEGIN
  -- 1) Puxador alto — reforçar metadados
  UPDATE public.exercises SET
      category       = 'costas',
      machine_type   = COALESCE(machine_type, 'cable'),
      aliases        = COALESCE(
        aliases,
        ARRAY['Lat pulldown','Puxada frontal','Pulley frente']::TEXT[]
      ),
      instructions   = COALESCE(
        instructions,
        'Sente-se e ajuste o apoio de coxas. Puxe a barra em direção à parte superior do peito, conduzindo os cotovelos para baixo e para trás. Retorne controlando, sem deixar o tronco cair bruscamente para frente.'
      )
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Puxador alto');
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Puxador alto: % linha(s) atualizada(s).', updated_count;

  -- 2) Remada alta — classificar também como Costas (v2)
  --    sem alterar primary_muscle legado (continua 'ombros' para retrocompat).
  UPDATE public.exercises SET
      category       = 'costas',
      machine_type   = COALESCE(machine_type, 'free_weight'),
      aliases        = COALESCE(
        aliases,
        ARRAY['Upright row','Remada alta barra']::TEXT[]
      ),
      instructions   = COALESCE(
        instructions,
        'Em pé, pegada na largura dos ombros. Puxe a barra verticalmente ao longo do corpo, cotovelos acima dos ombros. Trabalha deltoide, trapézio e — em menor grau — parte superior das costas.'
      )
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Remada alta');
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Remada alta: % linha(s) atualizada(s).', updated_count;
END $$;

-- Verificação opcional (SELECT depois da migration):
-- SELECT name, primary_muscle, category, machine_type
-- FROM public.exercises
-- WHERE user_id IS NULL AND LOWER(name) IN (LOWER('Puxador alto'), LOWER('Remada alta'));
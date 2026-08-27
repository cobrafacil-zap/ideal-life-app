/* =========================================================================
   Migration: 20260828_check_costas_exercises
   SELECT diagnóstico. NÃO altera nada. Apenas mostra o estado atual
   dos 3 exercícios de Costas no banco.

   Use para conferir se o seed e a migration force_costas rodaram
   corretamente.

   Resultado esperado (após force_costas aplicada):
     - 3 linhas
     - category = 'costas' para todas
     - Puxador alto: machine_type='cable'
     - Remada sentada na máquina: machine_type='selectorized'
     - Remada alta: machine_type='free_weight' | primary_muscle='ombros' legado
   ========================================================================= */

SELECT
  name,
  primary_muscle,
  category,
  machine_type,
  equipment,
  array_length(aliases, 1) AS n_aliases,
  CASE WHEN instructions IS NOT NULL THEN 'sim' ELSE 'não' END AS tem_instrucoes,
  created_at
FROM public.exercises
WHERE user_id IS NULL
  AND LOWER(name) IN (
    LOWER('Puxador alto'),
    LOWER('Remada sentada na máquina'),
    LOWER('Remada alta')
  )
ORDER BY name;
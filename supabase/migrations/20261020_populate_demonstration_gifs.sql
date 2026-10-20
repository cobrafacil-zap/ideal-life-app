/* =========================================================================
   VITTA - Popula a demonstração animada de TODOS os exercícios
   demonstration_url: path do GIF em /exercises-gifs/<slug>.gif
   demonstration_type: 'gif'

   Os GIFs são estáticos no app (servidos pelo CDN), então o path é
   suficiente — sem signed URL e sem chamada ao Storage.

   Gerado por scripts/emit_demonstration_migration.py
   (106 exercícios)
   ========================================================================= */

UPDATE public.exercises AS e
   SET demonstration_url = t.gif_path,
       demonstration_type = 'gif'
  FROM (VALUES
    ('Abdominal bicicleta', '/exercises-gifs/abdominal-bicicleta.gif'),
    ('Abdominal canivete', '/exercises-gifs/abdominal-canivete.gif'),
    ('Abdominal crunch', '/exercises-gifs/abdominal-crunch.gif'),
    ('Abdominal na roda', '/exercises-gifs/abdominal-na-roda.gif'),
    ('Abdominal supra', '/exercises-gifs/abdominal-supra.gif'),
    ('Abdução de quadril', '/exercises-gifs/abducao-de-quadril.gif'),
    ('Abdução de quadril com elástico', '/exercises-gifs/abducao-de-quadril-com-elastico.gif'),
    ('Afundo búlgaro', '/exercises-gifs/afundo-bulgaro.gif'),
    ('Afundo com halteres', '/exercises-gifs/afundo-com-halteres.gif'),
    ('Agachamento búlgaro com halteres', '/exercises-gifs/agachamento-bulgaro-com-halteres.gif'),
    ('Agachamento com elástico', '/exercises-gifs/agachamento-com-elastico.gif'),
    ('Agachamento com halteres', '/exercises-gifs/agachamento-com-halteres.gif'),
    ('Agachamento com kettlebell', '/exercises-gifs/agachamento-com-kettlebell.gif'),
    ('Agachamento livre', '/exercises-gifs/agachamento-livre.gif'),
    ('Agachamento no hack', '/exercises-gifs/agachamento-no-hack.gif'),
    ('Agachamento no smith', '/exercises-gifs/agachamento-no-smith.gif'),
    ('Agachamento smith sumô', '/exercises-gifs/agachamento-smith-sumo.gif'),
    ('Agachamento sumô', '/exercises-gifs/agachamento-sumo.gif'),
    ('Avanço', '/exercises-gifs/avanco.gif'),
    ('Barra fixa', '/exercises-gifs/barra-fixa.gif'),
    ('Bicicleta ergométrica', '/exercises-gifs/bicicleta-ergometrica.gif'),
    ('Bom dia', '/exercises-gifs/bom-dia.gif'),
    ('Cadeira abdutora', '/exercises-gifs/cadeira-abdutora.gif'),
    ('Cadeira adutora', '/exercises-gifs/cadeira-adutora.gif'),
    ('Cadeira extensora', '/exercises-gifs/cadeira-extensora.gif'),
    ('Caminhada', '/exercises-gifs/caminhada.gif'),
    ('Caminhada com elástico', '/exercises-gifs/caminhada-com-elastico.gif'),
    ('Coice com elástico', '/exercises-gifs/coice-com-elastico.gif'),
    ('Corrida', '/exercises-gifs/corrida.gif'),
    ('Crossover', '/exercises-gifs/crossover.gif'),
    ('Crucifixo inclinado', '/exercises-gifs/crucifixo-inclinado.gif'),
    ('Crucifixo inverso', '/exercises-gifs/crucifixo-inverso.gif'),
    ('Crucifixo inverso na máquina', '/exercises-gifs/crucifixo-inverso-na-maquina.gif'),
    ('Crucifixo reto', '/exercises-gifs/crucifixo-reto.gif'),
    ('Dead bug', '/exercises-gifs/dead-bug.gif'),
    ('Desenvolvimento com barra', '/exercises-gifs/desenvolvimento-com-barra.gif'),
    ('Desenvolvimento com halteres', '/exercises-gifs/desenvolvimento-com-halteres.gif'),
    ('Desenvolvimento máquina', '/exercises-gifs/desenvolvimento-maquina.gif'),
    ('Elevação de pernas', '/exercises-gifs/elevacao-de-pernas.gif'),
    ('Elevação frontal', '/exercises-gifs/elevacao-frontal.gif'),
    ('Elevação frontal com barra', '/exercises-gifs/elevacao-frontal-com-barra.gif'),
    ('Elevação lateral', '/exercises-gifs/elevacao-lateral.gif'),
    ('Elevação lateral unilateral no cabo', '/exercises-gifs/elevacao-lateral-unilateral-no-cabo.gif'),
    ('Elevação pélvica', '/exercises-gifs/elevacao-pelvica.gif'),
    ('Elíptico', '/exercises-gifs/eliptico.gif'),
    ('Encolhimento', '/exercises-gifs/encolhimento.gif'),
    ('Esteira', '/exercises-gifs/esteira.gif'),
    ('Extensão de quadril no cabo', '/exercises-gifs/extensao-de-quadril-no-cabo.gif'),
    ('Face pull', '/exercises-gifs/face-pull.gif'),
    ('Flexora em pé', '/exercises-gifs/flexora-em-pe.gif'),
    ('Flexora em pé unilateral', '/exercises-gifs/flexora-em-pe-unilateral.gif'),
    ('Flexão de braço', '/exercises-gifs/flexao-de-braco.gif'),
    ('Flexão declinada', '/exercises-gifs/flexao-declinada.gif'),
    ('Glúteo na máquina', '/exercises-gifs/gluteo-na-maquina.gif'),
    ('Hack squat', '/exercises-gifs/hack-squat.gif'),
    ('Hip thrust', '/exercises-gifs/hip-thrust.gif'),
    ('Hiperextensão', '/exercises-gifs/hiperextensao.gif'),
    ('Leg press 45', '/exercises-gifs/leg-press-45.gif'),
    ('Leg press 45 unilateral', '/exercises-gifs/leg-press-45-unilateral.gif'),
    ('Levantamento terra', '/exercises-gifs/levantamento-terra.gif'),
    ('Levantamento terra com halteres', '/exercises-gifs/levantamento-terra-com-halteres.gif'),
    ('Mergulho', '/exercises-gifs/mergulho.gif'),
    ('Mesa flexora', '/exercises-gifs/mesa-flexora.gif'),
    ('Mesa flexora unilateral', '/exercises-gifs/mesa-flexora-unilateral.gif'),
    ('Panturrilha em pé', '/exercises-gifs/panturrilha-em-pe.gif'),
    ('Panturrilha no leg press', '/exercises-gifs/panturrilha-no-leg-press.gif'),
    ('Panturrilha sentada', '/exercises-gifs/panturrilha-sentada.gif'),
    ('Peck deck', '/exercises-gifs/peck-deck.gif'),
    ('Ponte de glúteo com barra', '/exercises-gifs/ponte-de-gluteo-com-barra.gif'),
    ('Ponte de glúteo com halteres', '/exercises-gifs/ponte-de-gluteo-com-halteres.gif'),
    ('Prancha', '/exercises-gifs/prancha.gif'),
    ('Prancha lateral', '/exercises-gifs/prancha-lateral.gif'),
    ('Pular corda', '/exercises-gifs/pular-corda.gif'),
    ('Pulldown com corda', '/exercises-gifs/pulldown-com-corda.gif'),
    ('Puxada frontal', '/exercises-gifs/puxada-frontal.gif'),
    ('Puxada frontal pegada supinada', '/exercises-gifs/puxada-frontal-pegada-supinada.gif'),
    ('Remada alta', '/exercises-gifs/remada-alta.gif'),
    ('Remada baixa no cabo', '/exercises-gifs/remada-baixa-no-cabo.gif'),
    ('Remada cavalinho', '/exercises-gifs/remada-cavalinho.gif'),
    ('Remada curvada', '/exercises-gifs/remada-curvada.gif'),
    ('Remada unilateral', '/exercises-gifs/remada-unilateral.gif'),
    ('Remo ergométrico', '/exercises-gifs/remo-ergometrico.gif'),
    ('Rosca alternada', '/exercises-gifs/rosca-alternada.gif'),
    ('Rosca concentrada', '/exercises-gifs/rosca-concentrada.gif'),
    ('Rosca direta', '/exercises-gifs/rosca-direta.gif'),
    ('Rosca inversa', '/exercises-gifs/rosca-inversa.gif'),
    ('Rosca martelo', '/exercises-gifs/rosca-martelo.gif'),
    ('Rosca no cabo', '/exercises-gifs/rosca-no-cabo.gif'),
    ('Rosca scott', '/exercises-gifs/rosca-scott.gif'),
    ('Russian twist', '/exercises-gifs/russian-twist.gif'),
    ('Sissy squat', '/exercises-gifs/sissy-squat.gif'),
    ('Step up com halteres', '/exercises-gifs/step-up-com-halteres.gif'),
    ('Stiff', '/exercises-gifs/stiff.gif'),
    ('Stiff com halteres', '/exercises-gifs/stiff-com-halteres.gif'),
    ('Stiff com kettlebell', '/exercises-gifs/stiff-com-kettlebell.gif'),
    ('Supino declinado', '/exercises-gifs/supino-declinado.gif'),
    ('Supino fechado', '/exercises-gifs/supino-fechado.gif'),
    ('Supino inclinado com barra', '/exercises-gifs/supino-inclinado-com-barra.gif'),
    ('Supino inclinado com halteres', '/exercises-gifs/supino-inclinado-com-halteres.gif'),
    ('Supino reto com barra', '/exercises-gifs/supino-reto-com-barra.gif'),
    ('Supino reto com halteres', '/exercises-gifs/supino-reto-com-halteres.gif'),
    ('Swing de kettlebell', '/exercises-gifs/swing-de-kettlebell.gif'),
    ('Tríceps coice', '/exercises-gifs/triceps-coice.gif'),
    ('Tríceps francês', '/exercises-gifs/triceps-frances.gif'),
    ('Tríceps na polia', '/exercises-gifs/triceps-na-polia.gif'),
    ('Tríceps testa', '/exercises-gifs/triceps-testa.gif')
  ) AS t(name, gif_path)
 WHERE LOWER(TRIM(e.name)) = LOWER(TRIM(t.name));

-- Relatório: quantos exercícios ainda estão sem demonstração.
DO $$
DECLARE
  total INT;
  com_demo INT;
BEGIN
  SELECT COUNT(*) INTO total FROM public.exercises WHERE user_id IS NULL;
  SELECT COUNT(*) INTO com_demo FROM public.exercises
   WHERE user_id IS NULL AND demonstration_url IS NOT NULL;
  RAISE NOTICE 'Catálogo global: % exercícios, % com GIF demonstrativo (%)',
    total, com_demo, ROUND(100.0 * com_demo / GREATEST(total, 1));
END $$;

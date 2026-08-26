/* =========================================================================
   Migration: 20260828_workout_seed_library
   Popula o catálogo global de exercícios (user_id NULL).
   Sem imagens (placeholders SVG renderizam fallback). Imagens definitivas
   podem ser adicionadas depois via upload no app (campos image_url /
   animation_url ficam NULL até lá).
   Idempotente: usa ON CONFLICT (user_id, name) e checa antes de inserir.
   ========================================================================= */

DO $$
DECLARE
  cat RECORD;
  ex RECORD;
  inserted INT := 0;
  skipped INT := 0;
BEGIN
  -- Catalog: lista de (nome, grupo_principal, equipamento, secundarios[])
  -- Mantida inline para a migration ser auto-contida.
  -- Os nomes são canônicos em PT-BR para a UI.
  CREATE TEMP TABLE _seed_exercises (
    name TEXT NOT NULL,
    primary_muscle TEXT NOT NULL,
    equipment TEXT,
    secondary_muscles TEXT[] NOT NULL DEFAULT '{}'
  ) ON COMMIT DROP;

  INSERT INTO _seed_exercises (name, primary_muscle, equipment, secondary_muscles) VALUES
    -- OMBROS
    ('Elevação lateral',                       'ombros',  'haltere',  ARRAY['bracos']),
    ('Elevação lateral unilateral no cabo',    'ombros',  'cabo',     ARRAY['bracos','core']),
    ('Elevação frontal',                       'ombros',  'haltere',  ARRAY['bracos']),
    ('Elevação frontal com barra',             'ombros',  'barra',    ARRAY['bracos']),
    ('Desenvolvimento com halteres',           'ombros',  'haltere',  ARRAY['bracos','peito']),
    ('Desenvolvimento com barra',              'ombros',  'barra',    ARRAY['bracos','peito']),
    ('Desenvolvimento máquina',                'ombros',  'maquina',  ARRAY['bracos']),
    ('Crucifixo inverso',                      'ombros',  'haltere',  ARRAY['costas']),
    ('Crucifixo inverso na máquina',           'ombros',  'maquina',  ARRAY['costas']),
    ('Remada alta',                            'ombros',  'barra',    ARRAY['costas','bracos']),
    ('Encolhimento',                           'ombros',  'haltere',  ARRAY['costas']),
    -- PEITO
    ('Supino reto com barra',                  'peito',   'barra',    ARRAY['bracos','ombros']),
    ('Supino reto com halteres',               'peito',   'haltere',  ARRAY['bracos','ombros']),
    ('Supino inclinado com barra',             'peito',   'barra',    ARRAY['ombros','bracos']),
    ('Supino inclinado com halteres',          'peito',   'haltere',  ARRAY['ombros','bracos']),
    ('Supino declinado',                       'peito',   'barra',    ARRAY['bracos']),
    ('Crucifixo reto',                         'peito',   'haltere',  ARRAY['ombros']),
    ('Crucifixo inclinado',                    'peito',   'haltere',  ARRAY['ombros']),
    ('Crossover',                              'peito',   'cabo',     ARRAY['ombros']),
    ('Flexão de braço',                        'peito',   'nenhum',   ARRAY['ombros','bracos','core']),
    ('Flexão declinada',                       'peito',   'nenhum',   ARRAY['ombros','bracos']),
    ('Peck deck',                              'peito',   'maquina',  ARRAY['ombros']),
    -- COSTAS
    ('Puxada frontal',                         'costas',  'cabo',     ARRAY['bracos']),
    ('Puxada frontal pegada supinada',         'costas',  'cabo',     ARRAY['bracos']),
    ('Remada curvada',                         'costas',  'barra',    ARRAY['bracos']),
    ('Remada cavalinho',                       'costas',  'maquina',  ARRAY['bracos']),
    ('Remada unilateral',                      'costas',  'haltere',  ARRAY['bracos']),
    ('Remada baixa no cabo',                   'costas',  'cabo',     ARRAY['bracos']),
    ('Pulldown com corda',                     'costas',  'cabo',     ARRAY['bracos']),
    ('Barra fixa',                             'costas',  'nenhum',   ARRAY['bracos','core']),
    ('Hiperextensão',                          'costas',  'nenhum',   ARRAY['core','pernas']),
    ('Face pull',                              'costas',  'cabo',     ARRAY['ombros']),
    -- BRAÇOS / BÍCEPS
    ('Rosca direta',                           'bracos',  'barra',    ARRAY[]::TEXT[]),
    ('Rosca alternada',                        'bracos',  'haltere',  ARRAY[]::TEXT[]),
    ('Rosca martelo',                          'bracos',  'haltere',  ARRAY['antebraco']),
    ('Rosca concentrada',                      'bracos',  'haltere',  ARRAY['antebraco']),
    ('Rosca scott',                            'bracos',  'maquina',  ARRAY[]::TEXT[]),
    ('Rosca no cabo',                          'bracos',  'cabo',     ARRAY[]::TEXT[]),
    ('Rosca inversa',                          'bracos',  'barra',    ARRAY['antebraco']),
    -- BRAÇOS / TRÍCEPS
    ('Tríceps na polia',                       'bracos',  'cabo',     ARRAY[]::TEXT[]),
    ('Tríceps francês',                        'bracos',  'haltere',  ARRAY[]::TEXT[]),
    ('Tríceps testa',                          'bracos',  'barra',    ARRAY[]::TEXT[]),
    ('Tríceps coice',                          'bracos',  'haltere',  ARRAY[]::TEXT[]),
    ('Mergulho',                               'bracos',  'nenhum',   ARRAY['peito','ombros']),
    ('Supino fechado',                         'bracos',  'barra',    ARRAY['peito']),
    -- PERNAS / QUADRÍCEPS
    ('Agachamento livre',                      'pernas',  'barra',    ARRAY['core','gluteos']),
    ('Agachamento no smith',                   'pernas',  'maquina',  ARRAY['gluteos']),
    ('Agachamento com halteres',               'pernas',  'haltere',  ARRAY['gluteos','core']),
    ('Leg press 45',                           'pernas',  'maquina',  ARRAY['gluteos']),
    ('Cadeira extensora',                      'pernas',  'maquina',  ARRAY[]::TEXT[]),
    ('Avanço',                                 'pernas',  'haltere',  ARRAY['gluteos']),
    ('Afundo búlgaro',                         'pernas',  'haltere',  ARRAY['gluteos']),
    ('Agachamento sumô',                       'pernas',  'haltere',  ARRAY['gluteos','core']),
    ('Hack squat',                             'pernas',  'maquina',  ARRAY['gluteos']),
    ('Sissy squat',                            'pernas',  'nenhum',   ARRAY['core']),
    -- PERNAS / POSTERIOR
    ('Stiff',                                  'pernas',  'barra',    ARRAY['gluteos','costas']),
    ('Levantamento terra',                     'pernas',  'barra',    ARRAY['costas','gluteos','core']),
    ('Mesa flexora',                           'pernas',  'maquina',  ARRAY['gluteos']),
    ('Flexora em pé',                          'pernas',  'maquina',  ARRAY['gluteos']),
    ('Bom dia',                                'pernas',  'barra',    ARRAY['costas','gluteos']),
    -- GLÚTEOS
    ('Hip thrust',                             'pernas',  'barra',    ARRAY['core']),
    ('Glúteo na máquina',                      'pernas',  'maquina',  ARRAY[]::TEXT[]),
    ('Abdução de quadril',                     'pernas',  'maquina',  ARRAY['core']),
    ('Elevação pélvica',                       'pernas',  'nenhum',   ARRAY['core']),
    -- PANTURRILHA
    ('Panturrilha em pé',                      'pernas',  'maquina',  ARRAY[]::TEXT[]),
    ('Panturrilha sentada',                    'pernas',  'maquina',  ARRAY[]::TEXT[]),
    ('Panturrilha no leg press',               'pernas',  'maquina',  ARRAY[]::TEXT[]),
    -- CORE / ABDÔMEN
    ('Abdominal crunch',                       'core',    'nenhum',   ARRAY[]::TEXT[]),
    ('Abdominal supra',                        'core',    'nenhum',   ARRAY[]::TEXT[]),
    ('Prancha',                                'core',    'nenhum',   ARRAY['ombros']),
    ('Prancha lateral',                        'core',    'nenhum',   ARRAY['obliquos']),
    ('Abdominal na roda',                      'core',    'nenhum',   ARRAY['ombros']),
    ('Abdominal bicicleta',                    'core',    'nenhum',   ARRAY[]::TEXT[]),
    ('Elevação de pernas',                     'core',    'nenhum',   ARRAY['flexores']),
    ('Russian twist',                          'core',    'haltere',  ARRAY['obliquos']),
    ('Dead bug',                               'core',    'nenhum',   ARRAY[]::TEXT[]),
    ('Abdominal canivete',                     'core',    'nenhum',   ARRAY['flexores']),
    -- CARDIO
    ('Esteira',                                'cardio',  'nenhum',   ARRAY[]::TEXT[]),
    ('Bicicleta ergométrica',                  'cardio',  'maquina',  ARRAY[]::TEXT[]),
    ('Elíptico',                               'cardio',  'maquina',  ARRAY[]::TEXT[]),
    ('Remo ergométrico',                       'cardio',  'maquina',  ARRAY['costas','bracos']),
    ('Caminhada',                              'cardio',  'nenhum',   ARRAY[]::TEXT[]),
    ('Corrida',                                'cardio',  'nenhum',   ARRAY['pernas']),
    ('Pular corda',                            'cardio',  'nenhum',   ARRAY['panturrilha']);

  FOR ex IN SELECT * FROM _seed_exercises LOOP
    -- Só insere se ainda não existir no catálogo global (user_id NULL) com o mesmo nome.
    IF NOT EXISTS (
      SELECT 1 FROM public.exercises
      WHERE user_id IS NULL AND LOWER(name) = LOWER(ex.name)
    ) THEN
      INSERT INTO public.exercises (
        user_id, name, primary_muscle, secondary_muscles, equipment,
        substitutes, image_url, animation_url, execution_notes
      ) VALUES (
        NULL, ex.name, ex.primary_muscle, ex.secondary_muscles, ex.equipment,
        ARRAY[]::TEXT[], NULL, NULL,
        CASE ex.primary_muscle
          WHEN 'peito'   THEN 'Deite no banco, pés firmes no chão. Desça a barra/controle até sentir alongamento no peito e empurre de volta controlando.'
          WHEN 'costas'  THEN 'Mantenha as escápulas retraídas e o tronco firme. Puxe o peso em direção ao abdômen, sem balancear o corpo.'
          WHEN 'pernas'  THEN 'Mantenha os joelhos alinhados com a ponta dos pés. Desça até a amplitude confortável e suba controlando.'
          WHEN 'ombros'  THEN 'Evite balanço do tronco. Suba até a altura dos ombros (lateral) ou até estender os braços (frontal/desenvolvimento).'
          WHEN 'bracos'  THEN 'Cotovelos próximos ao tronco (rosca) ou alinhados (tríceps). Sem usar impulso do quadril.'
          WHEN 'core'    THEN 'Mantenha a respiração estável e a lombar neutra. Sem prender a respiração.'
          WHEN 'cardio'  THEN 'Mantenha frequência constante e respiração ritmada. Ajuste intensidade conforme sua percepção de esforço.'
          ELSE                'Mantenha postura neutra e controle da respiração durante o movimento.'
        END
      );
      inserted := inserted + 1;
    ELSE
      skipped := skipped + 1;
    END IF;
  END LOOP;

  RAISE NOTICE 'Seed concluído: % inseridos, % já existiam.', inserted, skipped;
END $$;

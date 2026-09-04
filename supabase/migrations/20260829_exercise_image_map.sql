/* =========================================================================
   Migration: 20260829_exercise_image_map
   Popula `image_url` do catálogo global com URLs externas (Wikimedia
   Commons) quando o exercício ainda não tem imagem.

   Idempotente: WHERE user_id IS NULL AND image_url IS NULL. Re-rodar
   não sobrescreve uploads de admin nem edições manuais.

   Esta migration é OPCIONAL: o app também resolve imagens via
   `lib/exercise-image-map.ts` em runtime como fallback. Rodar a
   migration torna o banco autoritativo (cada exercício com nome
   mapeado passa a trazer image_url preenchido direto na query).

   Se a coluna `image_url` aceita URL absoluta (validação feita em
   `lib/exercise-images.ts:getExerciseMediaSignedUrl`), não precisamos
   de mudança de schema.
   ========================================================================= */

DO $$
DECLARE
  ex RECORD;
  updated INT := 0;
  mapped_count INT := 0;
BEGIN
  -- Lista canônica (nome_lower, url). Mantida inline para a migration
  -- ser auto-contida e idempotente sem precisar de arquivo externo.
  -- Para adicionar novos exercícios: inserir nova linha no VALUES.
  CREATE TEMP TABLE _seed_image_map (
    name_lower TEXT PRIMARY KEY,
    image_url TEXT NOT NULL
  ) ON COMMIT DROP;

  INSERT INTO _seed_image_map (name_lower, image_url) VALUES
    -- OMBROS
    ('elevação lateral',                        'https://upload.wikimedia.org/wikipedia/commons/8/80/Lying_rear_lateral_raise_1.svg'),
    ('elevação frontal',                        'https://upload.wikimedia.org/wikipedia/commons/8/80/Lying_rear_lateral_raise_1.svg'),
    ('elevação frontal com barra',              'https://upload.wikimedia.org/wikipedia/commons/0/0f/Upright_barbell_rows_2.svg'),
    ('desenvolvimento com halteres',            'https://upload.wikimedia.org/wikipedia/commons/4/4d/Dumbbell_shoulder_press_1.svg'),
    ('desenvolvimento com barra',               'https://upload.wikimedia.org/wikipedia/commons/9/99/Barbell_shoulder_press_1.svg'),
    ('desenvolvimento máquina',                 'https://upload.wikimedia.org/wikipedia/commons/6/65/Seated_shoulder_press_machine_1.svg'),
    ('crucifixo inverso',                       'https://upload.wikimedia.org/wikipedia/commons/8/80/Lying_rear_lateral_raise_1.svg'),
    ('crucifixo inverso na máquina',            'https://upload.wikimedia.org/wikipedia/commons/8/80/Lying_rear_lateral_raise_1.svg'),
    ('remada alta',                             'https://upload.wikimedia.org/wikipedia/commons/0/0f/Upright_barbell_rows_2.svg'),
    ('encolhimento',                            'https://upload.wikimedia.org/wikipedia/commons/3/3d/Squat_to_bench_with_dumbbells_2.svg'),
    -- PEITO
    ('supino reto com barra',                   'https://upload.wikimedia.org/wikipedia/commons/7/74/Bench_press_1.svg'),
    ('supino reto com halteres',                'https://upload.wikimedia.org/wikipedia/commons/0/01/Bench_press_dumbbell_1.svg'),
    ('supino inclinado com barra',              'https://upload.wikimedia.org/wikipedia/commons/7/71/Incline_bench_press_1.svg'),
    ('supino inclinado com halteres',           'https://upload.wikimedia.org/wikipedia/commons/4/4d/Dumbbell_incline_bench_press_1.svg'),
    ('supino declinado',                        'https://upload.wikimedia.org/wikipedia/commons/a/ad/Decline_barbell_bench_press_1.svg'),
    ('supino fechado',                          'https://upload.wikimedia.org/wikipedia/commons/3/34/Close_grip_barbell_bench_press_1.svg'),
    ('crucifixo reto',                          'https://upload.wikimedia.org/wikipedia/commons/3/36/Flat_bench_cable_flys_1.svg'),
    ('crucifixo inclinado',                     'https://upload.wikimedia.org/wikipedia/commons/9/95/Incline_cable_flys_1.svg'),
    ('crossover',                               'https://upload.wikimedia.org/wikipedia/commons/3/36/Flat_bench_cable_flys_1.svg'),
    ('flexão de braço',                         'https://upload.wikimedia.org/wikipedia/commons/e/ee/Bosu_ball_push_up_1.svg'),
    ('flexão declinada',                        'https://upload.wikimedia.org/wikipedia/commons/6/6b/Push_up_feet_elevated_2_1.svg'),
    ('peck deck',                               'https://upload.wikimedia.org/wikipedia/commons/3/36/Flat_bench_cable_flys_1.svg'),
    -- COSTAS
    ('puxada frontal',                          'https://upload.wikimedia.org/wikipedia/commons/e/e0/Wide_grip_lat_pull_down_1.svg'),
    ('puxada frontal pegada supinada',          'https://upload.wikimedia.org/wikipedia/commons/e/e0/Wide_grip_lat_pull_down_1.svg'),
    ('remada curvada',                          'https://upload.wikimedia.org/wikipedia/commons/3/3d/Squat_to_bench_with_dumbbells_2.svg'),
    ('remada baixa no cabo',                    'https://upload.wikimedia.org/wikipedia/commons/d/d7/Upright_cable_row_2.svg'),
    ('remada unilateral',                       'https://upload.wikimedia.org/wikipedia/commons/3/3d/Squat_to_bench_with_dumbbells_2.svg'),
    ('face pull',                               'https://upload.wikimedia.org/wikipedia/commons/b/b6/Upright_cable_row_1.svg'),
    ('hiperextensão',                           'https://upload.wikimedia.org/wikipedia/commons/a/ac/Hyperextensions_1.svg'),
    -- BRAÇOS / BÍCEPS
    ('rosca direta',                            'https://upload.wikimedia.org/wikipedia/commons/c/cd/Wide_grip_standing_biceps_curl_with_barbell_1.svg'),
    ('rosca alternada',                         'https://upload.wikimedia.org/wikipedia/commons/a/aa/Biceps_curl_with_dumbbell_1.svg'),
    ('rosca martelo',                           'https://upload.wikimedia.org/wikipedia/commons/a/aa/Biceps_curl_with_dumbbell_1.svg'),
    ('rosca concentrada',                       'https://upload.wikimedia.org/wikipedia/commons/a/aa/Biceps_curl_with_dumbbell_1.svg'),
    ('rosca inversa',                           'https://upload.wikimedia.org/wikipedia/commons/b/b5/Biceps_curl_reverse_with_dumbbells_1.svg'),
    ('rosca no cabo',                           'https://upload.wikimedia.org/wikipedia/commons/8/82/Standing_biceps_curl_with_cable_1.svg'),
    -- BRAÇOS / TRÍCEPS
    ('tríceps na polia',                        'https://upload.wikimedia.org/wikipedia/commons/e/e0/One_arm_tricep_extension_with_cable_1.svg'),
    ('tríceps francês',                         'https://upload.wikimedia.org/wikipedia/commons/2/26/One_arm_bench_press_1.svg'),
    ('tríceps testa',                           'https://upload.wikimedia.org/wikipedia/commons/3/34/Close_grip_barbell_bench_press_1.svg'),
    ('tríceps coice',                           'https://upload.wikimedia.org/wikipedia/commons/a/aa/Biceps_curl_with_dumbbell_1.svg'),
    ('mergulho',                                'https://upload.wikimedia.org/wikipedia/commons/e/ee/Bosu_ball_push_up_1.svg'),
    -- PERNAS / QUADRÍCEPS
    ('agachamento livre',                       'https://upload.wikimedia.org/wikipedia/commons/4/43/Overhead_squat_with_barbell_1.svg'),
    ('agachamento no smith',                    'https://upload.wikimedia.org/wikipedia/commons/d/d5/Smith_machine_hack_squat_1.svg'),
    ('agachamento com halteres',                'https://upload.wikimedia.org/wikipedia/commons/5/5d/Pile_squat_with_dumbbell_1.svg'),
    ('agachamento sumô',                        'https://upload.wikimedia.org/wikipedia/commons/5/5e/Wide_stance_squat_with_barbell_2.svg'),
    ('leg press 45',                            'https://upload.wikimedia.org/wikipedia/commons/a/a0/Lying_squat_1.svg'),
    ('cadeira extensora',                       'https://upload.wikimedia.org/wikipedia/commons/a/a0/Lying_squat_1.svg'),
    ('avanço',                                  'https://upload.wikimedia.org/wikipedia/commons/b/b0/Single_leg_squat_with_barbell_2.svg'),
    ('afundo búlgaro',                          'https://upload.wikimedia.org/wikipedia/commons/b/b0/Single_leg_squat_with_barbell_2.svg'),
    ('hack squat',                              'https://upload.wikimedia.org/wikipedia/commons/5/58/Hack_squat_with_barbell_2.svg'),
    ('sissy squat',                             'https://upload.wikimedia.org/wikipedia/commons/1/1c/Weighted_sissy_squat_with_weight_plate_2.svg'),
    -- PERNAS / POSTERIOR
    ('stiff',                                   'https://upload.wikimedia.org/wikipedia/commons/0/04/Squat_to_bench_with_barbell_1.svg'),
    ('levantamento terra',                      'https://upload.wikimedia.org/wikipedia/commons/0/04/Squat_to_bench_with_barbell_1.svg'),
    ('mesa flexora',                            'https://upload.wikimedia.org/wikipedia/commons/a/a0/Lying_squat_1.svg'),
    ('flexora em pé',                           'https://upload.wikimedia.org/wikipedia/commons/a/a0/Lying_squat_1.svg'),
    ('cadeira flexora',                         'https://upload.wikimedia.org/wikipedia/commons/a/a0/Lying_squat_1.svg'),
    ('bom dia',                                 'https://upload.wikimedia.org/wikipedia/commons/0/04/Squat_to_bench_with_barbell_1.svg'),
    -- GLÚTEOS
    ('hip thrust',                              'https://upload.wikimedia.org/wikipedia/commons/0/04/Squat_to_bench_with_barbell_1.svg'),
    ('glúteo na máquina',                       'https://upload.wikimedia.org/wikipedia/commons/a/a0/Lying_squat_1.svg'),
    ('abdução de quadril',                      'https://upload.wikimedia.org/wikipedia/commons/a/a0/Lying_squat_1.svg'),
    ('elevação pélvica',                        'https://upload.wikimedia.org/wikipedia/commons/a/a0/Lying_squat_1.svg'),
    -- PANTURRILHA
    ('panturrilha em pé',                       'https://upload.wikimedia.org/wikipedia/commons/e/e1/Standing-calf-raises-1.svg'),
    ('panturrilha sentada',                     'https://upload.wikimedia.org/wikipedia/commons/3/3f/Seated_calf_raise_using_machine_1.svg'),
    ('panturrilha no leg press',                'https://upload.wikimedia.org/wikipedia/commons/a/a0/Lying_squat_1.svg'),
    -- CORE
    ('prancha',                                 'https://upload.wikimedia.org/wikipedia/commons/e/ee/Bosu_ball_push_up_1.svg'),
    ('prancha lateral',                         'https://upload.wikimedia.org/wikipedia/commons/e/ee/Bosu_ball_push_up_1.svg'),
    ('abdominal crunch',                        'https://upload.wikimedia.org/wikipedia/commons/e/ee/Bosu_ball_push_up_1.svg'),
    ('abdominal supra',                         'https://upload.wikimedia.org/wikipedia/commons/e/ee/Bosu_ball_push_up_1.svg'),
    ('elevação de pernas',                      'https://upload.wikimedia.org/wikipedia/commons/e/ee/Bosu_ball_push_up_1.svg'),
    ('dead bug',                                'https://upload.wikimedia.org/wikipedia/commons/e/ee/Bosu_ball_push_up_1.svg');

  GET DIAGNOSTICS mapped_count = ROW_COUNT;

  UPDATE public.exercises AS e
     SET image_url = m.image_url
    FROM _seed_image_map AS m
   WHERE e.user_id IS NULL
     AND e.image_url IS NULL
     AND LOWER(e.name) = m.name_lower;

  GET DIAGNOSTICS updated = ROW_COUNT;

  RAISE NOTICE 'Image map: % entradas, % exercícios atualizados.', mapped_count, updated;
END $$;

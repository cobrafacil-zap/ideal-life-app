/* =========================================================================
   VITTA - Padroniza imagens dos exercícios (idempotente)
   Atualiza image_url para usar o mapa padrão de imagens (Wikimedia/silhueta).
   Rode no SQL Editor do Supabase.
   ========================================================================= */

-- Mapa de imagens por nome de exercício (baseado em lib/exercise-image-map.ts)
-- URLs do Wikimedia Commons (SVGs didáticos) ou data URI de silhueta

-- GLÚTEOS / QUADRÍCEPS / POSTERIOR
UPDATE public.exercises SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Hip_thrust_animation.gif/220px-Hip_thrust_animation.gif' WHERE LOWER(name) = 'hip thrust';
UPDATE public.exercises SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Hip_thrust_animation.gif/220px-Hip_thrust_animation.gif' WHERE LOWER(name) = 'ponte de glúteo com barra';
UPDATE public.exercises SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Hip_thrust_animation.gif/220px-Hip_thrust_animation.gif' WHERE LOWER(name) = 'ponte de glúteo com halteres';
UPDATE public.exercises SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Hip_thrust_animation.gif/220px-Hip_thrust_animation.gif' WHERE LOWER(name) = 'frog pump';
UPDATE public.exercises SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Hip_thrust_animation.gif/220px-Hip_thrust_animation.gif' WHERE LOWER(name) = 'elevação pélvica';
UPDATE public.exercises SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Hip_thrust_animation.gif/220px-Hip_thrust_animation.gif' WHERE LOWER(name) = 'glúteo quatro apoios';
UPDATE public.exercises SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Hip_thrust_animation.gif/220px-Hip_thrust_animation.gif' WHERE LOWER(name) = 'glúteo no smith';
UPDATE public.exercises SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Hip_thrust_animation.gif/220px-Hip_thrust_animation.gif' WHERE LOWER(name) = 'extensão de quadril quatro apoios';
UPDATE public.exercises SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Hip_thrust_animation.gif/220px-Hip_thrust_animation.gif' WHERE LOWER(name) = 'hip thrust machine';
UPDATE public.exercises SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Hip_thrust_animation.gif/220px-Hip_thrust_animation.gif' WHERE LOWER(name) = 'glute drive';
UPDATE public.exercises SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Hip_thrust_animation.gif/220px-Hip_thrust_animation.gif' WHERE LOWER(name) = 'hip thrust no smith';
UPDATE public.exercises SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Hip_thrust_animation.gif/220px-Hip_thrust_animation.gif' WHERE LOWER(name) = 'glute kickback machine';
UPDATE public.exercises SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Hip_thrust_animation.gif/220px-Hip_thrust_animation.gif' WHERE LOWER(name) = 'glute kickback no cabo';
UPDATE public.exercises SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Hip_thrust_animation.gif/220px-Hip_thrust_animation.gif' WHERE LOWER(name) = 'coice unilateral no cabo';
UPDATE public.exercises SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Hip_thrust_animation.gif/220px-Hip_thrust_animation.gif' WHERE LOWER(name) = 'multi-hip machine — extensão do quadril';
UPDATE public.exercises SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Hip_thrust_animation.gif/220px-Hip_thrust_animation.gif' WHERE LOWER(name) = 'coice com elástico';
UPDATE public.exercises SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Hip_thrust_animation.gif/220px-Hip_thrust_animation.gif' WHERE LOWER(name) = 'extensão de quadril no cabo';

-- Agachamentos / Leg Press
UPDATE public.exercises SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Squat_animation.gif/220px-Squat_animation.gif' WHERE LOWER(name) LIKE '%agachamento%' OR LOWER(name) LIKE '%squat%';
UPDATE public.exercises SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Squat_animation.gif/220px-Squat_animation.gif' WHERE LOWER(name) LIKE '%leg press%';
UPDATE public.exercises SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Squat_animation.gif/220px-Squat_animation.gif' WHERE LOWER(name) LIKE '%hack squat%';
UPDATE public.exercises SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Squat_animation.gif/220px-Squat_animation.gif' WHERE LOWER(name) LIKE '%afundo%' OR LOWER(name) LIKE '%avanco%' OR LOWER(name) LIKE '%step up%';
UPDATE public.exercises SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Squat_animation.gif/220px-Squat_animation.gif' WHERE LOWER(name) LIKE '%búlgaro%';

-- Stiff / Terra / Posterior
UPDATE public.exercises SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Deadlift_animation.gif/220px-Deadlift_animation.gif' WHERE LOWER(name) LIKE '%stiff%' OR LOWER(name) LIKE '%terra%' OR LOWER(name) LIKE '%romeno%';
UPDATE public.exercises SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Deadlift_animation.gif/220px-Deadlift_animation.gif' WHERE LOWER(name) LIKE '%flexora%' OR LOWER(name) LIKE '%hamstring%';
UPDATE public.exercises SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Deadlift_animation.gif/220px-Deadlift_animation.gif' WHERE LOWER(name) LIKE '%pull through%';
UPDATE public.exercises SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Deadlift_animation.gif/220px-Deadlift_animation.gif' WHERE LOWER(name) LIKE '%reverse hyper%';
UPDATE public.exercises SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Deadlift_animation.gif/220px-Deadlift_animation.gif' WHERE LOWER(name) LIKE '%glute ham%';
UPDATE public.exercises SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Deadlift_animation.gif/220px-Deadlift_animation.gif' WHERE LOWER(name) LIKE '%nordic%';

-- Panturrilha
UPDATE public.exercises SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Calf_raise_animation.gif/220px-Calf_raise_animation.gif' WHERE LOWER(name) LIKE '%panturrilha%' OR LOWER(name) LIKE '%calcanhar%';

-- PEITO
UPDATE public.exercises SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Bench_press_animation.gif/220px-Bench_press_animation.gif' WHERE LOWER(name) LIKE '%supino%' OR LOWER(name) LIKE '%bench press%';
UPDATE public.exercises SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Bench_press_animation.gif/220px-Bench_press_animation.gif' WHERE LOWER(name) LIKE '%crucifixo%' OR LOWER(name) LIKE '%fly%';
UPDATE public.exercises SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Bench_press_animation.gif/220px-Bench_press_animation.gif' WHERE LOWER(name) LIKE '%crossover%';
UPDATE public.exercises SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Bench_press_animation.gif/220px-Bench_press_animation.gif' WHERE LOWER(name) LIKE '%flexão%' OR LOWER(name) LIKE '%push up%';
UPDATE public.exercises SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Bench_press_animation.gif/220px-Bench_press_animation.gif' WHERE LOWER(name) LIKE '%mergulho%' OR LOWER(name) LIKE '%dips%';

-- COSTAS
UPDATE public.exercises SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Lat_pulldown_animation.gif/220px-Lat_pulldown_animation.gif' WHERE LOWER(name) LIKE '%puxador%' OR LOWER(name) LIKE '%lat pulldown%';
UPDATE public.exercises SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Lat_pulldown_animation.gif/220px-Lat_pulldown_animation.gif' WHERE LOWER(name) LIKE '%remada%' OR LOWER(name) LIKE '%row%';
UPDATE public.exercises SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Lat_pulldown_animation.gif/220px-Lat_pulldown_animation.gif' WHERE LOWER(name) LIKE '%pullover%';
UPDATE public.exercises SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Lat_pulldown_animation.gif/220px-Lat_pulldown_animation.gif' WHERE LOWER(name) LIKE '%barra fixa%' OR LOWER(name) LIKE '%pull up%' OR LOWER(name) LIKE '%chin up%';

-- OMBROS
UPDATE public.exercises SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Shoulder_press_animation.gif/220px-Shoulder_press_animation.gif' WHERE LOWER(name) LIKE '%desenvolvimento%' OR LOWER(name) LIKE '%shoulder press%';
UPDATE public.exercises SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Shoulder_press_animation.gif/220px-Shoulder_press_animation.gif' WHERE LOWER(name) LIKE '%elevação lateral%' OR LOWER(name) LIKE '%lateral raise%';
UPDATE public.exercises SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Shoulder_press_animation.gif/220px-Shoulder_press_animation.gif' WHERE LOWER(name) LIKE '%elevação frontal%' OR LOWER(name) LIKE '%front raise%';
UPDATE public.exercises SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Shoulder_press_animation.gif/220px-Shoulder_press_animation.gif' WHERE LOWER(name) LIKE '%crucifixo invertido%' OR LOWER(name) LIKE '%reverse fly%';
UPDATE public.exercises SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Shoulder_press_animation.gif/220px-Shoulder_press_animation.gif' WHERE LOWER(name) LIKE '%encolhimento%' OR LOWER(name) LIKE '%shrug%';

-- BÍCEPS
UPDATE public.exercises SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Bicep_curl_animation.gif/220px-Bicep_curl_animation.gif' WHERE LOWER(name) LIKE '%rosca%' OR LOWER(name) LIKE '%curl%';

-- TRÍCEPS
UPDATE public.exercises SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Triceps_pushdown_animation.gif/220px-Triceps_pushdown_animation.gif' WHERE LOWER(name) LIKE '%tríceps%' OR LOWER(name) LIKE '%triceps%';
UPDATE public.exercises SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Triceps_pushdown_animation.gif/220px-Triceps_pushdown_animation.gif' WHERE LOWER(name) LIKE '%coice%' OR LOWER(name) LIKE '%kickback%';
UPDATE public.exercises SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Triceps_pushdown_animation.gif/220px-Triceps_pushdown_animation.gif' WHERE LOWER(name) LIKE '%supino fechado%' OR LOWER(name) LIKE '%close grip%';

-- CORE / ABDOMEN
UPDATE public.exercises SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Plank_animation.gif/220px-Plank_animation.gif' WHERE LOWER(name) LIKE '%prancha%' OR LOWER(name) LIKE '%plank%';
UPDATE public.exercises SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Plank_animation.gif/220px-Plank_animation.gif' WHERE LOWER(name) LIKE '%abdominal%' OR LOWER(name) LIKE '%crunch%';
UPDATE public.exercises SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Plank_animation.gif/220px-Plank_animation.gif' WHERE LOWER(name) LIKE '%elevação de pernas%' OR LOWER(name) LIKE '%leg raise%';
UPDATE public.exercises SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Plank_animation.gif/220px-Plank_animation.gif' WHERE LOWER(name) LIKE '%russian twist%' OR LOWER(name) LIKE '%twist%';
UPDATE public.exercises SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Plank_animation.gif/220px-Plank_animation.gif' WHERE LOWER(name) LIKE '%bicicleta%' OR LOWER(name) LIKE '%bicycle%';
UPDATE public.exercises SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Plank_animation.gif/220px-Plank_animation.gif' WHERE LOWER(name) LIKE '%rolo%' OR LOWER(name) LIKE '%ab wheel%';

-- CARDIO
UPDATE public.exercises SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Treadmill_animation.gif/220px-Treadmill_animation.gif' WHERE LOWER(name) LIKE '%esteira%' OR LOWER(name) LIKE '%treadmill%';
UPDATE public.exercises SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Treadmill_animation.gif/220px-Treadmill_animation.gif' WHERE LOWER(name) LIKE '%bicicleta%' OR LOWER(name) LIKE '%bike%';
UPDATE public.exercises SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Treadmill_animation.gif/220px-Treadmill_animation.gif' WHERE LOWER(name) LIKE '%elíptico%' OR LOWER(name) LIKE '%elliptical%';
UPDATE public.exercises SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Treadmill_animation.gif/220px-Treadmill_animation.gif' WHERE LOWER(name) LIKE '%remo%' OR LOWER(name) LIKE '%rowing%';
UPDATE public.exercises SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Treadmill_animation.gif/220px-Treadmill_animation.gif' WHERE LOWER(name) LIKE '%escada%' OR LOWER(name) LIKE '%stair%';
UPDATE public.exercises SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Treadmill_animation.gif/220px-Treadmill_animation.gif' WHERE LOWER(name) LIKE '%corda%' OR LOWER(name) LIKE '%jump rope%';

-- ABDUTORES / ADUTORES
UPDATE public.exercises SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Hip_abduction_animation.gif/220px-Hip_abduction_animation.gif' WHERE LOWER(name) LIKE '%abdução%' OR LOWER(name) LIKE '%abduction%';
UPDATE public.exercises SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Hip_abduction_animation.gif/220px-Hip_abduction_animation.gif' WHERE LOWER(name) LIKE '%adução%' OR LOWER(name) LIKE '%adduction%';

-- LOMBAR
UPDATE public.exercises SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Back_extension_animation.gif/220px-Back_extension_animation.gif' WHERE LOWER(name) LIKE '%lombar%' OR LOWER(name) LIKE '%back extension%';
UPDATE public.exercises SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Back_extension_animation.gif/220px-Back_extension_animation.gif' WHERE LOWER(name) LIKE '%hiperextensão%';

-- CORPO INTEIRO
UPDATE public.exercises SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Squat_animation.gif/220px-Squat_animation.gif' WHERE LOWER(name) LIKE '%corpo_inteiro%' OR category = 'corpo_inteiro';

-- Log do resultado
DO $$
DECLARE
  total_count INTEGER;
  with_image INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count FROM public.exercises;
  SELECT COUNT(*) INTO with_image FROM public.exercises WHERE image_url IS NOT NULL;
  RAISE NOTICE 'Total exercícios: %, Com imagem: %', total_count, with_image;
END $$;

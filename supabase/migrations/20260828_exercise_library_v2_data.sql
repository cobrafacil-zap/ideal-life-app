/* =========================================================================
   Migration: 20260828_exercise_library_v2_data
   Popula a biblioteca expandida de exercícios. Aplica duas atualizações:

   1) UPDATEs idempotentes dos 87 exercícios já existentes (seed original +
      gaps v1) para preencher `category`, `machine_type`, `aliases` e
      `instructions` quando ainda não foram definidos (NULL).

   2) INSERTs idempotentes dos 53 exercícios novos (não estavam no banco
      antes desta migration). Usa `IF NOT EXISTS` por LOWER(name) igual aos
      seeds anteriores.

   Sem `image_url`/`animation_url` — as imagens serão adicionadas depois.
   ========================================================================= */

DO $$
DECLARE
  inserted INT := 0;
  updated  INT := 0;
  ex RECORD;
BEGIN
  /* ====================================================================
     1) UPDATES — preencher category/machine_type/aliases/instructions
        nos 87 exercícios já existentes. UPDATE só altera linhas onde
        o campo alvo está NULL (não sobrescreve caso já esteja definido).
     ==================================================================== */

  -- OMBROS
  UPDATE public.exercises SET category='ombros', machine_type='free_weight',
    aliases=ARRAY['Lateral raise','Elevação lateral com halter'],
    instructions='Em pé, cotovelos levemente flexionados. Suba os braços lateralmente até a altura dos ombros e desça controlando, sem balanço do tronco.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Elevação lateral') AND category IS NULL;
  UPDATE public.exercises SET category='ombros', machine_type='cable',
    aliases=ARRAY['Unilateral lateral raise no cabo','Cable lateral raise'],
    instructions='Em pé, de lado para o cabo. Cotovelo levemente flexionado, suba o braço em arco até a altura do ombro. Volte controlando.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Elevação lateral unilateral no cabo') AND category IS NULL;
  UPDATE public.exercises SET category='ombros', machine_type='free_weight',
    aliases=ARRAY['Front raise','Elevação frontal com halter'],
    instructions='Em pé, braços à frente. Suba os halteres até a altura dos ombros, cotovelos levemente flexionados. Desça controlando.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Elevação frontal') AND category IS NULL;
  UPDATE public.exercises SET category='ombros', machine_type='free_weight',
    aliases=ARRAY['Front raise barra','Barra frontal'],
    instructions='Em pé, pegada na largura dos ombros. Suba a barra à frente até a altura dos ombros. Desça controlando.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Elevação frontal com barra') AND category IS NULL;
  UPDATE public.exercises SET category='ombros', machine_type='free_weight',
    aliases=ARRAY['Shoulder press halter','Desenvolvimento com halter'],
    instructions='Sentado, costas apoiadas. Suba os halteres acima da cabeça até a extensão quase completa dos braços. Desça controlando.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Desenvolvimento com halteres') AND category IS NULL;
  UPDATE public.exercises SET category='ombros', machine_type='free_weight',
    aliases=ARRAY['Shoulder press barra','Desenvolvimento militar'],
    instructions='Em pé ou sentado, pegada na largura dos ombros. Suba a barra acima da cabeça. Desça até a altura do queixo.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Desenvolvimento com barra') AND category IS NULL;
  UPDATE public.exercises SET category='ombros', machine_type='selectorized',
    aliases=ARRAY['Shoulder press machine','Desenvolvimento na máquina'],
    instructions='Sentado na máquina, empurre os braços para cima até a extensão. Retorne controlando.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Desenvolvimento máquina') AND category IS NULL;
  UPDATE public.exercises SET category='ombros', machine_type='free_weight',
    aliases=ARRAY['Reverse fly halter','Crucifixo invertido halter'],
    instructions='Sentado inclinado à frente, abra os braços em arco com cotovelos levemente flexionados. Contraia escapulares e desça controlando.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Crucifixo inverso') AND category IS NULL;
  UPDATE public.exercises SET category='ombros', machine_type='selectorized',
    aliases=ARRAY['Reverse fly machine','Crucifixo invertido máquina','Pec deck reverso'],
    instructions='Sentado de frente para a máquina, abra os braços contra a resistência focando no deltoide posterior. Retorne sem perder tensão.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Crucifixo inverso na máquina') AND category IS NULL;
  UPDATE public.exercises SET category='ombros', machine_type='free_weight',
    aliases=ARRAY['Upright row','Remada alta barra'],
    instructions='Em pé, pegada na largura dos ombros. Puxe a barra verticalmente ao longo do corpo, cotovelos acima dos ombros. Desça controlando.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Remada alta') AND category IS NULL;
  UPDATE public.exercises SET category='trapezio', machine_type='free_weight',
    aliases=ARRAY['Shrug halter','Encolhimento halter'],
    instructions='Em pé, suba os ombros em direção às orelhas o mais alto possível. Mantenha 1s no topo e desça controlando.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Encolhimento') AND category IS NULL;

  -- PEITO
  UPDATE public.exercises SET category='peito', machine_type='free_weight',
    aliases=ARRAY['Bench press','Supino reto barra'],
    instructions='Deitado no banco, pés firmes no chão. Desça a barra até o peito e empurre de volta controlando.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Supino reto com barra') AND category IS NULL;
  UPDATE public.exercises SET category='peito', machine_type='free_weight',
    aliases=ARRAY['Bench press dumbbell','Supino reto halter'],
    instructions='Deitado no banco, desça os halteres na lateral do peito e empurre para cima sem bater os pesos.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Supino reto com halteres') AND category IS NULL;
  UPDATE public.exercises SET category='peito', machine_type='free_weight',
    aliases=ARRAY['Incline bench press','Supino inclinado barra'],
    instructions='Banco a 30–45°. Desça a barra até a parte superior do peito e empurre de volta controlando.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Supino inclinado com barra') AND category IS NULL;
  UPDATE public.exercises SET category='peito', machine_type='free_weight',
    aliases=ARRAY['Incline bench dumbbell','Supino inclinado halter'],
    instructions='Banco a 30–45°. Desça os halteres na lateral/abaixo do peito e empurre para cima.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Supino inclinado com halteres') AND category IS NULL;
  UPDATE public.exercises SET category='peito', machine_type='free_weight',
    aliases=ARRAY['Decline bench press','Supino declinado barra'],
    instructions='Deitado no banco declinado, desça a barra até a parte inferior do peito e empurre controlando.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Supino declinado') AND category IS NULL;
  UPDATE public.exercises SET category='peito', machine_type='free_weight',
    aliases=ARRAY['Fly halter','Crucifixo reto halter'],
    instructions='Deitado, cotovelos levemente flexionados. Abra os braços em arco e contraia o peitoral no topo.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Crucifixo reto') AND category IS NULL;
  UPDATE public.exercises SET category='peito', machine_type='free_weight',
    aliases=ARRAY['Incline fly','Crucifixo inclinado halter'],
    instructions='Banco inclinado, cotovelos levemente flexionados. Abra os braços em arco e feche acima do peito.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Crucifixo inclinado') AND category IS NULL;
  UPDATE public.exercises SET category='peito', machine_type='cable',
    aliases=ARRAY['Cable crossover','Crossover polia'],
    instructions='Em pé entre os cabos, puxe as alças em arco à frente do corpo focando contração peitoral.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Crossover') AND category IS NULL;
  UPDATE public.exercises SET category='peito', machine_type='bodyweight',
    aliases=ARRAY['Push up','Flexão de braço'],
    instructions='Apoio de mãos e pés, corpo alinhado. Desça o peito até próximo ao solo e empurre de volta.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Flexão de braço') AND category IS NULL;
  UPDATE public.exercises SET category='peito', machine_type='bodyweight',
    aliases=ARRAY['Decline push up','Flexão declinada'],
    instructions='Pés elevados, mãos no chão. Desça o peito até o solo e empurre de volta.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Flexão declinada') AND category IS NULL;
  UPDATE public.exercises SET category='peito', machine_type='selectorized',
    aliases=ARRAY['Pec deck','Voador','Butterfly machine'],
    instructions='Sentado, cotovelos apoiados nas almofadas. Feche os braços à frente contraindo o peitoral.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Peck deck') AND category IS NULL;

  -- COSTAS
  UPDATE public.exercises SET category='costas', machine_type='cable',
    aliases=ARRAY['Lat pulldown','Puxada frontal','Pulley frente'],
    instructions='Sentado no pulley, puxe a barra até a parte superior do peito com cotovelos para baixo e para trás.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Puxada frontal') AND category IS NULL;
  UPDATE public.exercises SET category='costas', machine_type='cable',
    aliases=ARRAY['Supinated lat pulldown','Puxada supinada'],
    instructions='Sentado no pulley, pegada supinada. Puxe a barra até o peito com cotovelos próximos ao tronco.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Puxada frontal pegada supinada') AND category IS NULL;
  UPDATE public.exercises SET category='costas', machine_type='free_weight',
    aliases=ARRAY['Bent over row','Remada curvada barra'],
    instructions='Inclinado à frente, costas retas. Puxe a barra até o abdômen e desça controlando.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Remada curvada') AND category IS NULL;
  UPDATE public.exercises SET category='costas', machine_type='selectorized',
    aliases=ARRAY['T-bar row máquina','Remada cavalinho'],
    instructions='Apoiado no banco, puxe a alavanca em direção ao abdômen. Retorne controlando.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Remada cavalinho') AND category IS NULL;
  UPDATE public.exercises SET category='costas', machine_type='free_weight',
    aliases=ARRAY['One arm row','Remada unilateral halter'],
    instructions='Apoiado no banco com uma mão e um joelho, puxe o halter em direção ao quadril. Desça controlando.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Remada unilateral') AND category IS NULL;
  UPDATE public.exercises SET category='costas', machine_type='cable',
    aliases=ARRAY['Seated cable row','Remada baixa no cabo'],
    instructions='Sentado, puxe o cabo até o abdômen, contraindo as escapulares. Volte controlando.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Remada baixa no cabo') AND category IS NULL;
  UPDATE public.exercises SET category='costas', machine_type='cable',
    aliases=ARRAY['Rope pulldown','Pulldown corda'],
    instructions='No pulley com corda, puxe as extremidades para baixo e para fora, contraindo as costas.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Pulldown com corda') AND category IS NULL;
  UPDATE public.exercises SET category='costas', machine_type='bodyweight',
    aliases=ARRAY['Pull up','Barra fixa'],
    instructions='Pendurado na barra, puxe o corpo até o queixo passar da barra. Desça controlando.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Barra fixa') AND category IS NULL;
  UPDATE public.exercises SET category='lombar', machine_type='bodyweight',
    aliases=ARRAY['Back extension','Hiperextensão'],
    instructions='Deitado no banco romano, desça o tronco e suba até alinhar com as pernas. Contraia os lombares.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Hiperextensão') AND category IS NULL;
  UPDATE public.exercises SET category='costas', machine_type='cable',
    aliases=ARRAY['Cable face pull','Puxada para face'],
    instructions='No cabo alto com corda, puxe em direção ao rosto, cotovelos altos. Foco em deltoide posterior.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Face pull') AND category IS NULL;
  UPDATE public.exercises SET category='costas', machine_type='selectorized',
    aliases=ARRAY['Seated row machine','Remada na máquina'],
    instructions='Sente-se com os pés firmes no apoio, puxe o tronco em direção ao apoio peitoral, cotovelos para trás.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Remada sentada na máquina') AND category IS NULL;
  UPDATE public.exercises SET category='costas', machine_type='cable',
    aliases=ARRAY['Lat pulldown','Pulley frente','Lat machine'],
    instructions='Sentado no pulley, puxe a barra até a parte superior do peito com cotovelos para baixo e para trás.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Puxador alto') AND category IS NULL;

  -- BRAÇOS / BÍCEPS
  UPDATE public.exercises SET category='biceps', machine_type='free_weight',
    aliases=ARRAY['Barbell curl','Rosca direta barra'],
    instructions='Em pé, cotovelos colados ao tronco. Suba a barra flexionando os cotovelos. Desça controlando.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Rosca direta') AND category IS NULL;
  UPDATE public.exercises SET category='biceps', machine_type='free_weight',
    aliases=ARRAY['Alternating curl','Rosca alternada halter'],
    instructions='Em pé, alterne a flexão dos cotovelos, sem balanço do tronco.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Rosca alternada') AND category IS NULL;
  UPDATE public.exercises SET category='biceps', machine_type='free_weight',
    aliases=ARRAY['Hammer curl','Rosca martelo'],
    instructions='Em pé, pegada neutra. Suba os halteres flexionando os cotovelos sem rotacionar o antebraço.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Rosca martelo') AND category IS NULL;
  UPDATE public.exercises SET category='biceps', machine_type='free_weight',
    aliases=ARRAY['Concentration curl','Rosca concentrada'],
    instructions='Sentado, cotovelo apoiado na face interna da coxa. Flexione o cotovelo contraindo o bíceps.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Rosca concentrada') AND category IS NULL;
  UPDATE public.exercises SET category='biceps', machine_type='selectorized',
    aliases=ARRAY['Preacher curl','Rosca scott máquina'],
    instructions='Sentado no banco Scott, braços apoiados. Flexione os cotovelos até a contração máxima. Desça controlando.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Rosca scott') AND category IS NULL;
  UPDATE public.exercises SET category='biceps', machine_type='cable',
    aliases=ARRAY['Cable curl','Rosca no cabo'],
    instructions='No cabo, cotovelos colados ao tronco. Flexione puxando o cabo para cima. Desça controlando.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Rosca no cabo') AND category IS NULL;
  UPDATE public.exercises SET category='antebraco', machine_type='free_weight',
    aliases=ARRAY['Reverse curl','Rosca inversa'],
    instructions='Em pé, pegada pronada. Flexione os cotovelos com pegada inversa. Trabalha braquiorradial e antebraço.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Rosca inversa') AND category IS NULL;

  -- BRAÇOS / TRÍCEPS
  UPDATE public.exercises SET category='triceps', machine_type='cable',
    aliases=ARRAY['Tríceps polia','Pushdown'],
    instructions='No cabo, cotovelos colados ao tronco. Empurre a barra/haste para baixo até extensão completa.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Tríceps na polia') AND category IS NULL;
  UPDATE public.exercises SET category='triceps', machine_type='free_weight',
    aliases=ARRAY['French press','Tríceps francês halter'],
    instructions='Deitado, cotovelos apontando para cima. Flexione descendo o halter atrás da cabeça. Estenda controlando.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Tríceps francês') AND category IS NULL;
  UPDATE public.exercises SET category='triceps', machine_type='free_weight',
    aliases=ARRAY['Skull crusher','Tríceps testa'],
    instructions='Deitado, cotovelos estáveis. Flexione descendo a barra em direção à testa. Estenda controlando.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Tríceps testa') AND category IS NULL;
  UPDATE public.exercises SET category='triceps', machine_type='free_weight',
    aliases=ARRAY['Kickback','Tríceps coice'],
    instructions='Apoiado no banco, cotovelo colado ao tronco. Estenda o cotovelo para trás. Contraia o tríceps no topo.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Tríceps coice') AND category IS NULL;
  UPDATE public.exercises SET category='triceps', machine_type='bodyweight',
    aliases=ARRAY['Dip','Mergulho'],
    instructions='Apoiado nas barras paralelas, desça o corpo flexionando os cotovelos. Empurre de volta controlando.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Mergulho') AND category IS NULL;
  UPDATE public.exercises SET category='triceps', machine_type='free_weight',
    aliases=ARRAY['Close grip bench','Supino fechado'],
    instructions='Deitado, pegada fechada. Desça a barra até o peito e empurre focando no tríceps.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Supino fechado') AND category IS NULL;

  -- QUADRÍCEPS
  UPDATE public.exercises SET category='quadriceps', machine_type='free_weight',
    aliases=ARRAY['Back squat','Agachamento livre'],
    instructions='Barra nas costas, pés na largura dos ombros. Desça mantendo o tronco ereto. Suba empurrando o chão.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Agachamento livre') AND category IS NULL;
  UPDATE public.exercises SET category='quadriceps', machine_type='smith',
    aliases=ARRAY['Smith squat','Agachamento no smith'],
    instructions='No Smith, barra posicionada nas costas. Desça e suba controlando o movimento guiado.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Agachamento no smith') AND category IS NULL;
  UPDATE public.exercises SET category='quadriceps', machine_type='free_weight',
    aliases=ARRAY['Goblet squat','Agachamento com halter'],
    instructions='Segurando o halter junto ao peito, agache mantendo o tronco ereto. Suba controlando.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Agachamento com halteres') AND category IS NULL;
  UPDATE public.exercises SET category='quadriceps', machine_type='plate_loaded',
    aliases=ARRAY['Leg press 45 graus','Leg press inclinado'],
    instructions='Sentado no leg press 45°, pés na plataforma na largura dos ombros. Empurre e desça controlando.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Leg press 45') AND category IS NULL;
  UPDATE public.exercises SET category='quadriceps', machine_type='selectorized',
    aliases=ARRAY['Leg extension','Extensora','Cadeira extensora'],
    instructions='Sentado na cadeira extensora, estenda os joelhos até a contração. Desça controlando.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Cadeira extensora') AND category IS NULL;
  UPDATE public.exercises SET category='quadriceps', machine_type='free_weight',
    aliases=ARRAY['Lunge','Avanço'],
    instructions='Dê um passo à frente e desça até o joelho de trás quase tocar o chão. Volte e alterne.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Avanço') AND category IS NULL;
  UPDATE public.exercises SET category='quadriceps', machine_type='free_weight',
    aliases=ARRAY['Bulgarian split squat','Afundo búlgaro'],
    instructions='Pé de trás elevado, agache na perna da frente. Foco em quadríceps e glúteo.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Afundo búlgaro') AND category IS NULL;
  UPDATE public.exercises SET category='quadriceps', machine_type='free_weight',
    aliases=ARRAY['Sumo squat','Agachamento sumô'],
    instructions='Pés bem afastados e pontas para fora. Agache mantendo o tronco ereto. Suba empurrando o chão.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Agachamento sumô') AND category IS NULL;
  UPDATE public.exercises SET category='quadriceps', machine_type='plate_loaded',
    aliases=ARRAY['Hack squat machine','Hack máquina'],
    instructions='No hack squat, posicionado com as costas no apoio, empurre a plataforma. Desça controlando.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Hack squat') AND category IS NULL;
  UPDATE public.exercises SET category='quadriceps', machine_type='bodyweight',
    aliases=ARRAY['Sissy squat','Sissy'],
    instructions='Em pé, joelhos à frente do tronco, desça controlando. Trabalha quadríceps e core.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Sissy squat') AND category IS NULL;

  -- POSTERIOR
  UPDATE public.exercises SET category='posterior', machine_type='free_weight',
    aliases=ARRAY['Stiff leg deadlift','Levantamento terra stiff'],
    instructions='Em pé, desça a barra rolando sobre as coxas mantendo os joelhos pouco flexionados. Suba contraindo posteriores e glúteos.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Stiff') AND category IS NULL;
  UPDATE public.exercises SET category='posterior', machine_type='free_weight',
    aliases=ARRAY['Deadlift','Levantamento terra'],
    instructions='Barra no chão, pés na largura do quadril. Suba estendendo quadril e joelhos juntos, costas neutras.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Levantamento terra') AND category IS NULL;
  UPDATE public.exercises SET category='posterior', machine_type='selectorized',
    aliases=ARRAY['Lying leg curl','Mesa flexora','Leg curl deitado'],
    instructions='Deitado na mesa flexora, flexione os joelhos trazendo os calcanhares em direção aos glúteos. Desça controlando.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Mesa flexora') AND category IS NULL;
  UPDATE public.exercises SET category='posterior', machine_type='selectorized',
    aliases=ARRAY['Standing leg curl','Flexora em pé'],
    instructions='Em pé na máquina, flexione um joelho por vez levando o calcanhar ao glúteo. Volte controlando.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Flexora em pé') AND category IS NULL;
  UPDATE public.exercises SET category='posterior', machine_type='free_weight',
    aliases=ARRAY['Good morning','Bom dia'],
    instructions='Barra nas costas, incline o tronco à frente com quadril para trás. Volte contraindo posteriores e glúteos.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Bom dia') AND category IS NULL;
  UPDATE public.exercises SET category='posterior', machine_type='selectorized',
    aliases=ARRAY['Seated leg curl','Leg curl sentado','Cadeira flexora'],
    instructions='Sentado, flexione os joelhos puxando os calcanhares para baixo e para trás. Desça controlando.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Cadeira flexora') AND category IS NULL;

  -- GLÚTEOS
  UPDATE public.exercises SET category='gluteos', machine_type='free_weight',
    aliases=ARRAY['Hip thrust barra','Elevação pélvica barra'],
    instructions='Apoiado no banco com a barra no quadril, suba estendendo o quadril até alinhar tronco e coxas. Contraia os glúteos.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Hip thrust') AND category IS NULL;
  UPDATE public.exercises SET category='gluteos', machine_type='selectorized',
    aliases=ARRAY['Glute machine','Glúteo na máquina'],
    instructions='Sentado na máquina, contraia os glúteos empurrando o apoio para trás. Volte controlando.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Glúteo na máquina') AND category IS NULL;
  UPDATE public.exercises SET category='abdutores', machine_type='selectorized',
    aliases=ARRAY['Hip abduction','Abdução de quadril na máquina'],
    instructions='Sentado, abra as pernas contra a resistência. Trabalha glúteo médio e mínimo.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Abdução de quadril') AND category IS NULL;
  UPDATE public.exercises SET category='gluteos', machine_type='bodyweight',
    aliases=ARRAY['Glute bridge','Elevação pélvica solo'],
    instructions='Deitado com joelhos flexionados, eleve o quadril contraindo os glúteos. Desça controlando.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Elevação pélvica') AND category IS NULL;

  -- PANTURRILHA
  UPDATE public.exercises SET category='panturrilha', machine_type='selectorized',
    aliases=ARRAY['Standing calf raise','Panturrilha em pé máquina'],
    instructions='Em pé na máquina, suba na ponta dos pés o mais alto possível. Desça com alongamento total.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Panturrilha em pé') AND category IS NULL;
  UPDATE public.exercises SET category='panturrilha', machine_type='selectorized',
    aliases=ARRAY['Seated calf raise','Panturrilha sentada máquina'],
    instructions='Sentado na máquina, suba na ponta dos pés. Desça com alongamento total. Foco em sóleo.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Panturrilha sentada') AND category IS NULL;
  UPDATE public.exercises SET category='panturrilha', machine_type='plate_loaded',
    aliases=ARRAY['Calf press','Panturrilha no leg press'],
    instructions='No leg press com pés na ponta da plataforma, estenda os joelhos e ao final faça a flexão plantar.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Panturrilha no leg press') AND category IS NULL;

  -- CORE / ABDÔMEN
  UPDATE public.exercises SET category='abdomen', machine_type='bodyweight',
    aliases=ARRAY['Crunch','Abdominal crunch'],
    instructions='Deitado, joelhos flexionados. Flexione o tronco bringing a pelve para cima. Desça controlando.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Abdominal crunch') AND category IS NULL;
  UPDATE public.exercises SET category='abdomen', machine_type='bodyweight',
    aliases=ARRAY['Sit up','Abdominal supra'],
    instructions='Deitado, suba o tronco até sentar. Desça controlando.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Abdominal supra') AND category IS NULL;
  UPDATE public.exercises SET category='abdomen', machine_type='bodyweight',
    aliases=ARRAY['Plank','Prancha'],
    instructions='Apoio de antebraços e pés, corpo alinhado. Mantenha a posição neutra sem deixar o quadril cair.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Prancha') AND category IS NULL;
  UPDATE public.exercises SET category='abdomen', machine_type='bodyweight',
    aliases=ARRAY['Side plank','Prancha lateral'],
    instructions='Apoio de um antebraço e lateral dos pés. Mantenha o corpo alinhado lateralmente.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Prancha lateral') AND category IS NULL;
  UPDATE public.exercises SET category='abdomen', machine_type='bodyweight',
    aliases=ARRAY['Ab wheel','Abdominal na roda'],
    instructions='De joelhos com a roda à frente, role estendendo o tronco. Retorne contraindo o core.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Abdominal na roda') AND category IS NULL;
  UPDATE public.exercises SET category='abdomen', machine_type='bodyweight',
    aliases=ARRAY['Bicycle crunch','Abdominal bicicleta'],
    instructions='Deitado, alterne cotovelo ao joelho oposto em movimento de pedalada.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Abdominal bicicleta') AND category IS NULL;
  UPDATE public.exercises SET category='abdomen', machine_type='bodyweight',
    aliases=ARRAY['Leg raise','Elevação de pernas'],
    instructions='Deitado, eleve as pernas estendidas até 90°. Desça controlando sem tocar o chão.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Elevação de pernas') AND category IS NULL;
  UPDATE public.exercises SET category='abdomen', machine_type='free_weight',
    aliases=ARRAY['Russian twist','Abdominal russo'],
    instructions='Sentado com tronco inclinado, gire o tronco de um lado para o outro segurando peso.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Russian twist') AND category IS NULL;
  UPDATE public.exercises SET category='abdomen', machine_type='bodyweight',
    aliases=ARRAY['Dead bug','Inseto morto'],
    instructions='Deitado, braços e pernas em 90°. Estenda braço e perna opostos. Alterne.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Dead bug') AND category IS NULL;
  UPDATE public.exercises SET category='abdomen', machine_type='bodyweight',
    aliases=ARRAY['V-up','Abdominal canivete'],
    instructions='Deitado, suba tronco e pernas juntos formando um V. Desça controlando.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Abdominal canivete') AND category IS NULL;

  -- CARDIO
  UPDATE public.exercises SET category='cardio', machine_type='cardio',
    aliases=ARRAY['Treadmill','Esteira elétrica'],
    instructions='Caminhe ou corra na esteira ajustando velocidade e inclinação conforme objetivo.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Esteira') AND category IS NULL;
  UPDATE public.exercises SET category='cardio', machine_type='cardio',
    aliases=ARRAY['Indoor bike','Bicicleta ergométrica','Bike spinning'],
    instructions='Pedale em ritmo constante, ajustando resistência conforme intensidade desejada.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Bicicleta ergométrica') AND category IS NULL;
  UPDATE public.exercises SET category='cardio', machine_type='cardio',
    aliases=ARRAY['Elliptical','Elíptico'],
    instructions='Mova braços e pernas em padrão cruzado. Ajuste resistência e inclinação.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Elíptico') AND category IS NULL;
  UPDATE public.exercises SET category='cardio', machine_type='cardio',
    aliases=ARRAY['Rowing machine','Remo ergométrico','Ergômetro de remo'],
    instructions='Puxe com pernas + costas + braços, retorne controlando. Foco em potência por stroke.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Remo ergométrico') AND category IS NULL;
  UPDATE public.exercises SET category='cardio', machine_type='bodyweight',
    aliases=ARRAY['Walking','Caminhada'],
    instructions='Caminhe em ritmo constante, mantendo postura ereta e respiração ritmada.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Caminhada') AND category IS NULL;
  UPDATE public.exercises SET category='cardio', machine_type='bodyweight',
    aliases=ARRAY['Running','Corrida'],
    instructions='Corra em ritmo constante, cadência confortável, respiração ritmada.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Corrida') AND category IS NULL;
  UPDATE public.exercises SET category='panturrilha', machine_type='bodyweight',
    aliases=ARRAY['Jump rope','Pular corda'],
    instructions='Pule ritmicamente usando o impulso das panturrilhas. Mantenha os joelhos pouco flexionados.'
  WHERE user_id IS NULL AND LOWER(name) = LOWER('Pular corda') AND category IS NULL;

  GET DIAGNOSTICS updated = ROW_COUNT;

  /* ====================================================================
     2) INSERTS — 53 exercícios novos que NÃO existiam antes.
     ==================================================================== */

  -- COSTAS (11 novos)
  INSERT INTO public.exercises
    (user_id, name, primary_muscle, secondary_muscles, equipment, machine_type,
     category, aliases, instructions)
  SELECT NULL, t.name, t.primary, t.secondary, t.equipment, t.machine_type,
         t.category, t.aliases, t.instructions
  FROM (VALUES
    ('Puxador alto articulado', 'costas', ARRAY['bracos','costas']::TEXT[], 'plate_loaded', 'plate_loaded',
     'costas', ARRAY['Iso-lateral front lat pulldown','Puxada iso-lateral']::TEXT[],
     'Sentado, puxe cada braço de forma independente até o peito. Foco em contração unilateral.'),
    ('Puxador aberto', 'costas', ARRAY['bracos','costas']::TEXT[], 'cabo', 'cable',
     'costas', ARRAY['Wide pulldown','Puxada larga']::TEXT[],
     'Puxada com pegada larga, cotovelos para baixo e para fora, contraindo dorsais.'),
    ('High Row articulado', 'costas', ARRAY['costas','bracos','ombros']::TEXT[], 'plate_loaded', 'plate_loaded',
     'costas', ARRAY['Iso-lateral high row','Remada alta articulada']::TEXT[],
     'Puxada alta unilateral, cotovelos para trás, contraindo parte superior das costas.'),
    ('Low Row articulado', 'costas', ARRAY['costas','bracos']::TEXT[], 'plate_loaded', 'plate_loaded',
     'costas', ARRAY['Iso-lateral low row','Remada baixa articulada']::TEXT[],
     'Puxada baixa unilateral, foco em dorsais e romboides.'),
    ('Remada articulada iso-lateral', 'costas', ARRAY['costas','bracos']::TEXT[], 'plate_loaded', 'plate_loaded',
     'costas', ARRAY['Iso-lateral row','Remada iso-lateral']::TEXT[],
     'Sentado, puxe cada alavanca independentemente em direção ao tronco.'),
    ('D.Y. Row', 'costas', ARRAY['costas','trapezio','bracos']::TEXT[], 'cabo', 'cable',
     'costas', ARRAY['DY row','Remada em D no cabo']::TEXT[],
     'No cabo baixo com pegada neutra, puxe em direção ao abdômen, cotovelos próximos ao tronco.'),
    ('Pullover máquina', 'costas', ARRAY['costas','peito']::TEXT[], 'selectorized', 'selectorized',
     'costas', ARRAY['Machine pullover','Pullover articulado']::TEXT[],
     'Sentado, braços acima da cabeça, puxe a alavanca em arco até a altura do quadril.'),
    ('Remada máquina com apoio peitoral', 'costas', ARRAY['costas','bracos','ombros']::TEXT[], 'selectorized', 'selectorized',
     'costas', ARRAY['Chest supported row','Remada com apoio de peito']::TEXT[],
     'Com o peito apoiado, puxe as alavancas em direção ao tronco. Reduz uso de core.'),
    ('Puxada unilateral no cabo', 'costas', ARRAY['costas','bracos']::TEXT[], 'cable', 'cable',
     'costas', ARRAY['Single arm pulldown','Puxada single arm']::TEXT[],
     'Em pé de lado para o cabo, puxe o cabo com uma mão em arco até o ombro oposto.'),
    ('Pulldown unilateral articulado', 'costas', ARRAY['costas','bracos']::TEXT[], 'plate_loaded', 'plate_loaded',
     'costas', ARRAY['Iso-lateral pulldown']::TEXT[],
     'Sentado, puxe uma alavanca por vez até o ombro, contraindo o dorsal.'),
    ('Pullover no cabo', 'costas', ARRAY['costas','peito']::TEXT[], 'cable', 'cable',
     'costas', ARRAY['Cable pullover','Pullover polia']::TEXT[],
     'No cabo alto, com pegada unilateral, puxe em arco até a coxa. Contraia dorsais.')
  ) AS t(name, primary, secondary, equipment, machine_type, category, aliases, instructions)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.exercises
    WHERE user_id IS NULL AND LOWER(name) = LOWER(t.name)
  );

  -- PEITO (11 novos)
  INSERT INTO public.exercises
    (user_id, name, primary_muscle, secondary_muscles, equipment, machine_type,
     category, aliases, instructions)
  SELECT NULL, t.name, t.primary, t.secondary, t.equipment, t.machine_type,
         t.category, t.aliases, t.instructions
  FROM (VALUES
    ('Chest Press', 'peito', ARRAY['triceps','ombros']::TEXT[], 'selectorized', 'selectorized',
     'peito', ARRAY['Supino máquina','Machine chest press']::TEXT[],
     'Sentado na máquina, empurre os braços para frente até extensão. Volte controlando.'),
    ('Chest Press convergente', 'peito', ARRAY['triceps','ombros']::TEXT[], 'plate_loaded', 'plate_loaded',
     'peito', ARRAY['Converging chest press','Supino convergente']::TEXT[],
     'Os braços se movem em arco convergente. Trajetória mais natural para o ombro.'),
    ('Iso-Lateral Bench Press', 'peito', ARRAY['triceps','ombros']::TEXT[], 'plate_loaded', 'plate_loaded',
     'peito', ARRAY['Supino iso-lateral','Iso-lateral chest press']::TEXT[],
     'Sentado, empurre cada alavanca independentemente. Foco em carga unilateral.'),
    ('Incline Chest Press', 'peito', ARRAY['triceps','ombros']::TEXT[], 'selectorized', 'selectorized',
     'peito', ARRAY['Supino inclinado máquina','Incline press']::TEXT[],
     'Banco inclinado na máquina, empurre para frente e para cima focando porção clavicular.'),
    ('Iso-Lateral Incline Press', 'peito', ARRAY['triceps','ombros']::TEXT[], 'plate_loaded', 'plate_loaded',
     'peito', ARRAY['Supino inclinado iso-lateral']::TEXT[],
     'Inclinado, empurre cada alavanca independentemente. Foco em porção superior.'),
    ('Super Incline Press', 'peito', ARRAY['triceps','ombros']::TEXT[], 'plate_loaded', 'plate_loaded',
     'peito', ARRAY['Steep incline press','Supino super inclinado']::TEXT[],
     'Inclinação alta, foco em porção clavicular do peitoral.'),
    ('Decline Chest Press', 'peito', ARRAY['triceps','ombros']::TEXT[], 'plate_loaded', 'plate_loaded',
     'peito', ARRAY['Supino declinado máquina']::TEXT[],
     'Declinado, empurre para frente e para baixo. Foco em porção inferior do peitoral.'),
    ('Wide Chest Press', 'peito', ARRAY['triceps','ombros']::TEXT[], 'selectorized', 'selectorized',
     'peito', ARRAY['Supino pegada larga máquina']::TEXT[],
     'Pegada mais aberta na máquina. Foco em peito externo.'),
    ('Horizontal Bench Press máquina', 'peito', ARRAY['triceps','ombros']::TEXT[], 'plate_loaded', 'plate_loaded',
     'peito', ARRAY['Horizontal chest press','Supino horizontal máquina']::TEXT[],
     'Deitado horizontal, empurre para cima. Trajetória plana.'),
    ('Crossover alto', 'peito', ARRAY['ombros']::TEXT[], 'cable', 'cable',
     'peito', ARRAY['High cable crossover']::TEXT[],
     'Cabos altos, puxe em arco para baixo e para frente, focando peito superior.'),
    ('Crossover baixo', 'peito', ARRAY['ombros']::TEXT[], 'cable', 'cable',
     'peito', ARRAY['Low cable crossover']::TEXT[],
     'Cabos baixos, puxe em arco para cima e para frente, focando peito inferior.'),
    ('Crucifixo no cabo', 'peito', ARRAY['ombros']::TEXT[], 'cable', 'cable',
     'peito', ARRAY['Cable fly','Voador no cabo']::TEXT[],
     'No cabo, cotovelos levemente flexionados. Feche os braços à frente contraindo o peitoral.')
  ) AS t(name, primary, secondary, equipment, machine_type, category, aliases, instructions)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.exercises
    WHERE user_id IS NULL AND LOWER(name) = LOWER(t.name)
  );

  -- OMBROS (6 novos)
  INSERT INTO public.exercises
    (user_id, name, primary_muscle, secondary_muscles, equipment, machine_type,
     category, aliases, instructions)
  SELECT NULL, t.name, t.primary, t.secondary, t.equipment, t.machine_type,
         t.category, t.aliases, t.instructions
  FROM (VALUES
    ('Iso-Lateral Shoulder Press', 'ombros', ARRAY['triceps']::TEXT[], 'plate_loaded', 'plate_loaded',
     'ombros', ARRAY['Desenvolvimento iso-lateral']::TEXT[],
     'Sentado, empurre cada alavanca independentemente acima da cabeça.'),
    ('Desenvolvimento articulado', 'ombros', ARRAY['triceps']::TEXT[], 'plate_loaded', 'plate_loaded',
     'ombros', ARRAY['Articulating shoulder press','Desenvolvimento convergente ombro']::TEXT[],
     'Desenvolvimento com braços em arco convergente. Trajetória mais natural.'),
    ('Máquina de elevação lateral', 'ombros', ARRAY[]::TEXT[], 'selectorized', 'selectorized',
     'ombros', ARRAY['Lateral raise machine','Elevação lateral máquina']::TEXT[],
     'Sentado na máquina, cotovelos apoiados, suba os braços lateralmente até a altura dos ombros.'),
    ('Elevação lateral no cabo', 'ombros', ARRAY[]::TEXT[], 'cable', 'cable',
     'ombros', ARRAY['Cable lateral raise','Lateral polia']::TEXT[],
     'No cabo baixo, pegada unilateral. Suba o braço em arco até a altura do ombro.'),
    ('Elevação frontal no cabo', 'ombros', ARRAY[]::TEXT[], 'cable', 'cable',
     'ombros', ARRAY['Cable front raise','Frontal polia']::TEXT[],
     'No cabo baixo, atrás do corpo. Suba o braço à frente até a altura do ombro.'),
    ('Reverse Fly máquina', 'ombros', ARRAY['costas']::TEXT[], 'selectorized', 'selectorized',
     'ombros', ARRAY['Pec deck reverso','Crucifixo inverso máquina selectorized']::TEXT[],
     'Sentado de frente para a máquina, abra os braços contra a resistência.')
  ) AS t(name, primary, secondary, equipment, machine_type, category, aliases, instructions)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.exercises
    WHERE user_id IS NULL AND LOWER(name) = LOWER(t.name)
  );

  -- QUADRÍCEPS (13 novos)
  INSERT INTO public.exercises
    (user_id, name, primary_muscle, secondary_muscles, equipment, machine_type,
     category, aliases, instructions)
  SELECT NULL, t.name, t.primary, t.secondary, t.equipment, t.machine_type,
         t.category, t.aliases, t.instructions
  FROM (VALUES
    ('Leg Extension iso-lateral', 'quadriceps', ARRAY[]::TEXT[], 'selectorized', 'selectorized',
     'quadriceps', ARRAY['Iso-lateral leg extension']::TEXT[],
     'Estenda um joelho de cada vez. Foco em carga unilateral.'),
    ('Leg Press horizontal', 'quadriceps', ARRAY['gluteos']::TEXT[], 'plate_loaded', 'plate_loaded',
     'quadriceps', ARRAY['Horizontal leg press']::TEXT[],
     'Deitado horizontal, empurre a plataforma. Desça controlando.'),
    ('Leg Press linear', 'quadriceps', ARRAY['gluteos']::TEXT[], 'plate_loaded', 'plate_loaded',
     'quadriceps', ARRAY['Linear leg press','Leg press vertical']::TEXT[],
     'Sentado, plataforma em frente, empurre em linha reta.'),
    ('Leg Press unilateral', 'quadriceps', ARRAY['gluteos']::TEXT[], 'plate_loaded', 'plate_loaded',
     'quadriceps', ARRAY['Single leg press']::TEXT[],
     'Empurre a plataforma usando apenas uma perna. Foco em correção de assimetria.'),
    ('Hack Squat reverso', 'quadriceps', ARRAY['gluteos']::TEXT[], 'plate_loaded', 'plate_loaded',
     'quadriceps', ARRAY['Reverse hack squat']::TEXT[],
     'De costas para a plataforma, agache e empurre. Trabalha quadríceps e glúteos.'),
    ('Pendulum Squat', 'quadriceps', ARRAY['gluteos']::TEXT[], 'plate_loaded', 'plate_loaded',
     'quadriceps', ARRAY['Agachamento pendulum','Squat pendulum']::TEXT[],
     'No pendulum, posicionado com ombros no apoio, agache em arco. Desça controlando.'),
    ('Super Squat Press', 'corpo_inteiro', ARRAY['quadriceps','gluteos','ombros']::TEXT[], 'plate_loaded', 'plate_loaded',
     'corpo_inteiro', ARRAY['Squat press','Agachamento com desenvolvimento']::TEXT[],
     'Agachamento com carga no ombro + extensão ao subir. Composto.'),
    ('V-Squat', 'quadriceps', ARRAY['gluteos']::TEXT[], 'plate_loaded', 'plate_loaded',
     'quadriceps', ARRAY['V squat','Agachamento V']::TEXT[],
     'No V-squat, ombros sob apoio, agache em V. Trajetória guiada.'),
    ('Belt Squat', 'quadriceps', ARRAY['gluteos']::TEXT[], 'plate_loaded', 'plate_loaded',
     'quadriceps', ARRAY['Agachamento com cinto','Squat belt']::TEXT[],
     'Com cinto preso a carga, agache. Zero compressão axial na coluna.'),
    ('Squat Machine', 'quadriceps', ARRAY['gluteos']::TEXT[], 'selectorized', 'selectorized',
     'quadriceps', ARRAY['Máquina de agachamento','Smith squat machine']::TEXT[],
     'Em máquina guiada, agache. Trajetória fixa reduz necessidade de estabilização.'),
    ('Smith Machine — Agachamento búlgaro', 'quadriceps', ARRAY['gluteos']::TEXT[], 'smith', 'smith',
     'quadriceps', ARRAY['Smith bulgarian split squat']::TEXT[],
     'Pé de trás no banco, barra no smith, agache na perna da frente.'),
    ('Smith Machine — Afundo', 'quadriceps', ARRAY['gluteos']::TEXT[], 'smith', 'smith',
     'quadriceps', ARRAY['Smith lunge']::TEXT[],
     'Com barra no smith, dê um passo à frente e agache. Alterne pernas.'),
    ('Multi-Squat Machine', 'quadriceps', ARRAY['gluteos']::TEXT[], 'plate_loaded', 'plate_loaded',
     'corpo_inteiro', ARRAY['Multi squat','Smith multi']::TEXT[],
     'Máquina multi para variações de agachamento com carga ajustável.')
  ) AS t(name, primary, secondary, equipment, machine_type, category, aliases, instructions)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.exercises
    WHERE user_id IS NULL AND LOWER(name) = LOWER(t.name)
  );

  -- POSTERIOR (7 novos)
  INSERT INTO public.exercises
    (user_id, name, primary_muscle, secondary_muscles, equipment, machine_type,
     category, aliases, instructions)
  SELECT NULL, t.name, t.primary, t.secondary, t.equipment, t.machine_type,
         t.category, t.aliases, t.instructions
  FROM (VALUES
    ('Flexora ajoelhada', 'posterior', ARRAY['gluteos']::TEXT[], 'selectorized', 'selectorized',
     'posterior', ARRAY['Kneeling leg curl','Nordic curl assistido']::TEXT[],
     'Ajoelhado na máquina, flexione os joelhos trazendo os calcanhares aos glúteos.'),
    ('Iso-Lateral Leg Curl', 'posterior', ARRAY['gluteos']::TEXT[], 'selectorized', 'selectorized',
     'posterior', ARRAY['Leg curl iso-lateral']::TEXT[],
     'Flexione um joelho de cada vez. Foco em carga unilateral.'),
    ('Assisted Nordic Ham', 'posterior', ARRAY['gluteos']::TEXT[], 'plate_loaded', 'plate_loaded',
     'posterior', ARRAY['Nordic hamstring assistido','Nordic curl machine']::TEXT[],
     'Com apoio ajustável, desça o tronco à frente controlando com os posteriores.'),
    ('Glute Ham Developer', 'posterior', ARRAY['gluteos']::TEXT[], 'other', 'other',
     'posterior', ARRAY['GHD','Glute ham raise']::TEXT[],
     'No GHD, ajuste a altura. Faça back extension, leg curl ou两者 combinados.'),
    ('Reverse Hyper', 'lombar', ARRAY['gluteos','posterior']::TEXT[], 'plate_loaded', 'plate_loaded',
     'lombar', ARRAY['Hiperextensão reversa','Reverse hyper machine']::TEXT[],
     'De bruços no aparelho, eleve as pernas para trás contraindo glúteos e lombares.'),
    ('Stiff no Smith', 'posterior', ARRAY['gluteos']::TEXT[], 'smith', 'smith',
     'posterior', ARRAY['Smith stiff leg deadlift']::TEXT[],
     'No Smith, desça a barra rolando pelas coxas com joelhos pouco flexionados.'),
    ('Romanian Deadlift no Smith', 'posterior', ARRAY['gluteos']::TEXT[], 'smith', 'smith',
     'posterior', ARRAY['Smith RDL','RDL no smith']::TEXT[],
     'No Smith, desça a barra mantendo joelhos pouco flexionados e costas neutras.')
  ) AS t(name, primary, secondary, equipment, machine_type, category, aliases, instructions)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.exercises
    WHERE user_id IS NULL AND LOWER(name) = LOWER(t.name)
  );

  -- GLÚTEOS / ABDUTORES / ADUTORES (10 novos)
  INSERT INTO public.exercises
    (user_id, name, primary_muscle, secondary_muscles, equipment, machine_type,
     category, aliases, instructions)
  SELECT NULL, t.name, t.primary, t.secondary, t.equipment, t.machine_type,
         t.category, t.aliases, t.instructions
  FROM (VALUES
    ('Hip Thrust Machine', 'gluteos', ARRAY['posterior']::TEXT[], 'plate_loaded', 'plate_loaded',
     'gluteos', ARRAY['Hip thrust na máquina','Glute thruster']::TEXT[],
     'Sentado na máquina com as costas no apoio, empurre com o quadril até extensão completa.'),
    ('Glute Drive', 'gluteos', ARRAY['posterior']::TEXT[], 'plate_loaded', 'plate_loaded',
     'gluteos', ARRAY['Glute drive machine']::TEXT[],
     'Na máquina, com ombros no apoio, empurre o quadril para frente e para cima.'),
    ('Hip Thrust no Smith', 'gluteos', ARRAY['posterior']::TEXT[], 'smith', 'smith',
     'gluteos', ARRAY['Smith hip thrust']::TEXT[],
     'Apoiado no banco com a barra no quadril, suba até alinhar tronco e coxas.'),
    ('Glute Kickback Machine', 'gluteos', ARRAY[]::TEXT[], 'selectorized', 'selectorized',
     'gluteos', ARRAY['Coice máquina','Glute kickback']::TEXT[],
     'Na máquina, chute para trás contra a resistência. Foco em glúteo máximo.'),
    ('Glute Kickback no cabo', 'gluteos', ARRAY[]::TEXT[], 'cable', 'cable',
     'gluteos', ARRAY['Cable kickback','Coice polia']::TEXT[],
     'Com caneleira no cabo, chute para trás contraindo o glúteo.'),
    ('Coice unilateral no cabo', 'gluteos', ARRAY[]::TEXT[], 'cable', 'cable',
     'gluteos', ARRAY['Single leg kickback']::TEXT[],
     'Em pé, caneleira no cabo, chute uma perna por vez para trás.'),
    ('Abdução no cabo', 'abdutores', ARRAY[]::TEXT[], 'cable', 'cable',
     'abdutores', ARRAY['Cable hip abduction']::TEXT[],
     'Em pé ao lado do cabo, caneleira, afaste a perna lateralmente.'),
    ('Abdução em pé máquina', 'abdutores', ARRAY[]::TEXT[], 'selectorized', 'selectorized',
     'abdutores', ARRAY['Standing hip abduction']::TEXT[],
     'Em pé na máquina, caneleira, afaste a perna lateralmente.'),
    ('Máquina adutora', 'adutores', ARRAY[]::TEXT[], 'selectorized', 'selectorized',
     'adutores', ARRAY['Hip adductor machine','Adutora máquina']::TEXT[],
     'Sentado na máquina, feche as pernas contra a resistência. Trabalha adutores.'),
    ('Multi-Hip Machine — extensão do quadril', 'gluteos', ARRAY[]::TEXT[], 'selectorized', 'selectorized',
     'gluteos', ARRAY['Multi-hip extension']::TEXT[],
     'No multi-hip, em pé de lado, empurre a perna para trás contra a resistência.')
  ) AS t(name, primary, secondary, equipment, machine_type, category, aliases, instructions)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.exercises
    WHERE user_id IS NULL AND LOWER(name) = LOWER(t.name)
  );

  -- Multi-Hip variações adicionais (3)
  INSERT INTO public.exercises
    (user_id, name, primary_muscle, secondary_muscles, equipment, machine_type,
     category, aliases, instructions)
  SELECT NULL, t.name, t.primary, t.secondary, t.equipment, t.machine_type,
         t.category, t.aliases, t.instructions
  FROM (VALUES
    ('Multi-Hip Machine — abdução', 'abdutores', ARRAY[]::TEXT[], 'selectorized', 'selectorized',
     'abdutores', ARRAY['Multi-hip abduction']::TEXT[],
     'No multi-hip, afaste a perna lateralmente contra a resistência.'),
    ('Multi-Hip Machine — adução', 'adutores', ARRAY[]::TEXT[], 'selectorized', 'selectorized',
     'adutores', ARRAY['Multi-hip adduction']::TEXT[],
     'No multi-hip, feche a perna contra a resistência.'),
    ('Multi-Hip Machine — flexão do quadril', 'quadriceps', ARRAY[]::TEXT[], 'selectorized', 'selectorized',
     'quadriceps', ARRAY['Multi-hip flexion','Flexor de quadril máquina']::TEXT[],
     'No multi-hip, eleve o quadril/trono contra a resistência.')
  ) AS t(name, primary, secondary, equipment, machine_type, category, aliases, instructions)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.exercises
    WHERE user_id IS NULL AND LOWER(name) = LOWER(t.name)
  );

  -- PANTURRILHA / TIBIAL (3 novos)
  INSERT INTO public.exercises
    (user_id, name, primary_muscle, secondary_muscles, equipment, machine_type,
     category, aliases, instructions)
  SELECT NULL, t.name, t.primary, t.secondary, t.equipment, t.machine_type,
         t.category, t.aliases, t.instructions
  FROM (VALUES
    ('Calf Raise Machine', 'panturrilha', ARRAY[]::TEXT[], 'plate_loaded', 'plate_loaded',
     'panturrilha', ARRAY['Panturrilha plate loaded','Standing calf plate loaded']::TEXT[],
     'Em pé na máquina, suba na ponta dos pés o mais alto possível. Desça com alongamento total.'),
    ('Panturrilha no Smith', 'panturrilha', ARRAY[]::TEXT[], 'smith', 'smith',
     'panturrilha', ARRAY['Smith calf raise']::TEXT[],
     'Com barra no Smith sobre os ombros, suba na ponta dos pés. Desça controlando.'),
    ('Tibia Dorsi-Flexion Machine', 'tibial', ARRAY[]::TEXT[], 'selectorized', 'selectorized',
     'tibial', ARRAY['Tibial machine','Dorsiflexão máquina']::TEXT[],
     'Sentado, puxe a parte da frente do pé em direção à canela contra a resistência.')
  ) AS t(name, primary, secondary, equipment, machine_type, category, aliases, instructions)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.exercises
    WHERE user_id IS NULL AND LOWER(name) = LOWER(t.name)
  );

  -- BÍCEPS (7 novos)
  INSERT INTO public.exercises
    (user_id, name, primary_muscle, secondary_muscles, equipment, machine_type,
     category, aliases, instructions)
  SELECT NULL, t.name, t.primary, t.secondary, t.equipment, t.machine_type,
         t.category, t.aliases, t.instructions
  FROM (VALUES
    ('Biceps Curl Machine', 'biceps', ARRAY['antebraco']::TEXT[], 'selectorized', 'selectorized',
     'biceps', ARRAY['Rosca máquina','Biceps curl selectorized']::TEXT[],
     'Sentado na máquina, cotovelos apoiados, flexione contra a resistência.'),
    ('Seated Biceps Machine', 'biceps', ARRAY['antebraco']::TEXT[], 'selectorized', 'selectorized',
     'biceps', ARRAY['Rosca sentado máquina']::TEXT[],
     'Sentado, braços apoiados, flexione os cotovelos.'),
    ('Scott Machine', 'biceps', ARRAY['antebraco']::TEXT[], 'selectorized', 'selectorized',
     'biceps', ARRAY['Rosca Scott máquina','Preacher curl machine']::TEXT[],
     'No banco Scott, flexione os cotovelos isolando o bíceps.'),
    ('Rosca Scott no cabo', 'biceps', ARRAY['antebraco']::TEXT[], 'cable', 'cable',
     'biceps', ARRAY['Cable preacher curl']::TEXT[],
     'No cabo com banco Scott, flexione os cotovelos contra a resistência constante.'),
    ('Rosca direta no cabo', 'biceps', ARRAY['antebraco']::TEXT[], 'cable', 'cable',
     'biceps', ARRAY['Cable bar curl']::TEXT[],
     'No cabo, pegada supinada, flexione os cotovelos. Tensão constante.'),
    ('Rosca unilateral no cabo', 'biceps', ARRAY['antebraco']::TEXT[], 'cable', 'cable',
     'biceps', ARRAY['Single arm cable curl']::TEXT[],
     'No cabo, um braço por vez, flexione o cotovelo.'),
    ('Rosca martelo no cabo', 'biceps', ARRAY['antebraco']::TEXT[], 'cable', 'cable',
     'biceps', ARRAY['Cable hammer curl']::TEXT[],
     'No cabo, pegada neutra, flexione os cotovelos. Foco em braquial e braquiorradial.')
  ) AS t(name, primary, secondary, equipment, machine_type, category, aliases, instructions)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.exercises
    WHERE user_id IS NULL AND LOWER(name) = LOWER(t.name)
  );

  -- TRÍCEPS (7 novos)
  INSERT INTO public.exercises
    (user_id, name, primary_muscle, secondary_muscles, equipment, machine_type,
     category, aliases, instructions)
  SELECT NULL, t.name, t.primary, t.secondary, t.equipment, t.machine_type,
         t.category, t.aliases, t.instructions
  FROM (VALUES
    ('Triceps Extension Machine', 'triceps', ARRAY[]::TEXT[], 'selectorized', 'selectorized',
     'triceps', ARRAY['Tríceps máquina','Triceps extension selectorized']::TEXT[],
     'Sentado na máquina, estenda os cotovelos contra a resistência.'),
    ('Seated Dip Machine', 'triceps', ARRAY['peito','ombros']::TEXT[], 'plate_loaded', 'plate_loaded',
     'triceps', ARRAY['Mergulho máquina','Tríceps dip machine']::TEXT[],
     'Sentado, empurre o peso para baixo estendendo os cotovelos. Foco em tríceps.'),
    ('Tríceps corda', 'triceps', ARRAY[]::TEXT[], 'cable', 'cable',
     'triceps', ARRAY['Rope pushdown','Tríceps rope']::TEXT[],
     'No cabo com corda, cotovelos colados, empurre para baixo e separe as pontas.'),
    ('Tríceps barra reta', 'triceps', ARRAY[]::TEXT[], 'cable', 'cable',
     'triceps', ARRAY['V bar pushdown','Tríceps V bar']::TEXT[],
     'No cabo com barra V, empurre para baixo até extensão completa.'),
    ('Tríceps unilateral no cabo', 'triceps', ARRAY[]::TEXT[], 'cable', 'cable',
     'triceps', ARRAY['Single arm tricep pushdown']::TEXT[],
     'No cabo, um braço por vez, empurre para baixo.'),
    ('Tríceps francês no cabo', 'triceps', ARRAY[]::TEXT[], 'cable', 'cable',
     'triceps', ARRAY['Cable overhead tricep']::TEXT[],
     'No cabo alto, de costas, estenda os cotovelos acima da cabeça.'),
    ('Tríceps overhead no cabo', 'triceps', ARRAY[]::TEXT[], 'cable', 'cable',
     'triceps', ARRAY['Overhead cable tricep extension']::TEXT[],
     'No cabo, em arco acima da cabeça, estenda os cotovelos.')
  ) AS t(name, primary, secondary, equipment, machine_type, category, aliases, instructions)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.exercises
    WHERE user_id IS NULL AND LOWER(name) = LOWER(t.name)
  );

  -- CORE (8 novos)
  INSERT INTO public.exercises
    (user_id, name, primary_muscle, secondary_muscles, equipment, machine_type,
     category, aliases, instructions)
  SELECT NULL, t.name, t.primary, t.secondary, t.equipment, t.machine_type,
         t.category, t.aliases, t.instructions
  FROM (VALUES
    ('Abdominal Crunch Machine', 'abdomen', ARRAY[]::TEXT[], 'selectorized', 'selectorized',
     'abdomen', ARRAY['Crunch machine']::TEXT[],
     'Sentado na máquina, flexione o tronco contra a resistência.'),
    ('Abdominal / Oblique Crunch Machine', 'abdomen', ARRAY[]::TEXT[], 'selectorized', 'selectorized',
     'abdomen', ARRAY['Oblique crunch machine']::TEXT[],
     'Máquina que combina crunch reto e oblíquo. Ajuste a pegada conforme o foco.'),
    ('Rotary Torso', 'abdomen', ARRAY[]::TEXT[], 'selectorized', 'selectorized',
     'abdomen', ARRAY['Rotação de tronco máquina','Torso rotation machine']::TEXT[],
     'Sentado na máquina, gire o tronco contra a resistência. Trabalha oblíquos.'),
    ('Abdominal no cabo', 'abdomen', ARRAY[]::TEXT[], 'cable', 'cable',
     'abdomen', ARRAY['Cable crunch','Crunch no cabo']::TEXT[],
     'Ajoelhado no cabo, flexione o tronco bringing cotovelos aos joelhos.'),
    ('Wood Chop no cabo', 'abdomen', ARRAY[]::TEXT[], 'cable', 'cable',
     'abdomen', ARRAY['Cable wood chop','Cabo wood chop']::TEXT[],
     'No cabo alto, puxe em diagonal da parte alta para a baixa, girando o tronco.'),
    ('Elevação de pernas na Captain''s Chair', 'abdomen', ARRAY['quadriceps']::TEXT[], 'bodyweight', 'bodyweight',
     'abdomen', ARRAY['Captain chair leg raise','Elevação de pernas paralela']::TEXT[],
     'Suspenso na paralela, eleve os joelhos ao peito. Desça controlando.'),
    ('Ab Coaster', 'abdomen', ARRAY[]::TEXT[], 'bodyweight', 'bodyweight',
     'abdomen', ARRAY['Ab coaster machine','Máquina de abdominal']::TEXT[],
     'No Ab Coaster, deslize o banco enquanto flexiona o tronco.'),
    ('Back Extension Machine', 'lombar', ARRAY['gluteos','posterior']::TEXT[], 'selectorized', 'selectorized',
     'lombar', ARRAY['Roman chair machine','Extensão lombar máquina']::TEXT[],
     'Na máquina, desça e suba o tronco contra a resistência. Foco em lombares.')
  ) AS t(name, primary, secondary, equipment, machine_type, category, aliases, instructions)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.exercises
    WHERE user_id IS NULL AND LOWER(name) = LOWER(t.name)
  );

  -- LOMBAR (3 novos)
  INSERT INTO public.exercises
    (user_id, name, primary_muscle, secondary_muscles, equipment, machine_type,
     category, aliases, instructions)
  SELECT NULL, t.name, t.primary, t.secondary, t.equipment, t.machine_type,
         t.category, t.aliases, t.instructions
  FROM (VALUES
    ('Back Extension', 'lombar', ARRAY['gluteos']::TEXT[], 'bodyweight', 'bodyweight',
     'lombar', ARRAY['Extensão lombar','Banco romano']::TEXT[],
     'No banco romano, desça o tronco e suba até alinhar com as pernas.'),
    ('Hiperextensão 45°', 'lombar', ARRAY['gluteos','posterior']::TEXT[], 'selectorized', 'selectorized',
     'lombar', ARRAY['45 degree back extension']::TEXT[],
     'No banco a 45°, desça e suba o tronco controlando. Foco em lombar e glúteo.'),
    ('GHD Back Extension', 'lombar', ARRAY['gluteos','posterior']::TEXT[], 'other', 'other',
     'lombar', ARRAY['GHD extensão','Glute ham developer extensão']::TEXT[],
     'No GHD, desça o tronco à frente e suba estendendo o quadril.')
  ) AS t(name, primary, secondary, equipment, machine_type, category, aliases, instructions)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.exercises
    WHERE user_id IS NULL AND LOWER(name) = LOWER(t.name)
  );

  -- TRAPÉZIO (3 novos)
  INSERT INTO public.exercises
    (user_id, name, primary_muscle, secondary_muscles, equipment, machine_type,
     category, aliases, instructions)
  SELECT NULL, t.name, t.primary, t.secondary, t.equipment, t.machine_type,
         t.category, t.aliases, t.instructions
  FROM (VALUES
    ('Shrug Machine', 'trapezio', ARRAY[]::TEXT[], 'plate_loaded', 'plate_loaded',
     'trapezio', ARRAY['Encolhimento máquina','Trapézio máquina']::TEXT[],
     'Sentado ou em pé na máquina, suba os ombros em direção às orelhas.'),
    ('Encolhimento no Smith', 'trapezio', ARRAY[]::TEXT[], 'smith', 'smith',
     'trapezio', ARRAY['Smith shrug']::TEXT[],
     'Com barra no Smith, suba os ombros. Desça controlando.'),
    ('Encolhimento no cabo', 'trapezio', ARRAY[]::TEXT[], 'cable', 'cable',
     'trapezio', ARRAY['Cable shrug']::TEXT[],
     'No cabo, com pegada na largura do quadril, suba os ombros.')
  ) AS t(name, primary, secondary, equipment, machine_type, category, aliases, instructions)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.exercises
    WHERE user_id IS NULL AND LOWER(name) = LOWER(t.name)
  );

  -- ANTEBRAÇO (3 novos)
  INSERT INTO public.exercises
    (user_id, name, primary_muscle, secondary_muscles, equipment, machine_type,
     category, aliases, instructions)
  SELECT NULL, t.name, t.primary, t.secondary, t.equipment, t.machine_type,
         t.category, t.aliases, t.instructions
  FROM (VALUES
    ('Gripper Machine', 'antebraco', ARRAY[]::TEXT[], 'selectorized', 'selectorized',
     'antebraco', ARRAY['Máquina de preensão','Grip machine']::TEXT[],
     'Na máquina, aperte a alça contra a resistência. Trabalha musculatura de preensão.'),
    ('Wrist Curl Machine', 'antebraco', ARRAY[]::TEXT[], 'selectorized', 'selectorized',
     'antebraco', ARRAY['Flexor de punho máquina']::TEXT[],
     'Sentado, antebraços apoiados, flexione os punhos.'),
    ('Wrist Extension Machine', 'antebraco', ARRAY[]::TEXT[], 'selectorized', 'selectorized',
     'antebraco', ARRAY['Extensor de punho máquina']::TEXT[],
     'Sentado, antebraços apoiados, estenda os punhos contra a resistência.')
  ) AS t(name, primary, secondary, equipment, machine_type, category, aliases, instructions)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.exercises
    WHERE user_id IS NULL AND LOWER(name) = LOWER(t.name)
  );

  -- CARDIO (9 novos)
  INSERT INTO public.exercises
    (user_id, name, primary_muscle, secondary_muscles, equipment, machine_type,
     category, aliases, instructions)
  SELECT NULL, t.name, t.primary, t.secondary, t.equipment, t.machine_type,
         t.category, t.aliases, t.instructions
  FROM (VALUES
    ('Esteira curva', 'cardio', ARRAY[]::TEXT[], 'cardio', 'cardio',
     'cardio', ARRAY['Curved treadmill','Esteira auto propelida']::TEXT[],
     'Esteira sem motor, propulsionada pelo próprio usuário. Curva define intensidade.'),
    ('Bicicleta vertical', 'cardio', ARRAY[]::TEXT[], 'cardio', 'cardio',
     'cardio', ARRAY['Upright bike','Bike vertical']::TEXT[],
     'Pedale em posição vertical. Ajuste resistência e cadência.'),
    ('Bicicleta horizontal', 'cardio', ARRAY[]::TEXT[], 'cardio', 'cardio',
     'cardio', ARRAY['Recumbent bike','Bike horizontal']::TEXT[],
     'Pedale sentado com encosto. Confortável para costas.'),
    ('Air Bike', 'cardio', ARRAY[]::TEXT[], 'cardio', 'cardio',
     'cardio', ARRAY['Assault bike','Bike de ar']::TEXT[],
     'Pedale e empurre os braços simultaneamente. Resistência proporcional ao esforço.'),
    ('Spinning Bike', 'cardio', ARRAY[]::TEXT[], 'cardio', 'cardio',
     'cardio', ARRAY['Spinning','Bike de spinning']::TEXT[],
     'Bike de aula com resistência variável. Ritmo ditado pelo instrutor ou app.'),
    ('Stair Climber', 'cardio', ARRAY['gluteos']::TEXT[], 'cardio', 'cardio',
     'cardio', ARRAY['Simulador de escada','Stair machine']::TEXT[],
     'Suba degraus em movimento contínuo. Foco em glúteos e quadríceps.'),
    ('Ski Erg', 'cardio', ARRAY['costas','bracos']::TEXT[], 'cardio', 'cardio',
     'cardio', ARRAY['Ergômetro de esqui','Ski ergometer']::TEXT[],
     'Puxe com braços e tronco, simulando remo de esqui. Foco em costas e core.'),
    ('Escada infinita', 'cardio', ARRAY['gluteos']::TEXT[], 'cardio', 'cardio',
     'cardio', ARRAY['StairMill','Escada rolante']::TEXT[],
     'Escada rolante. Suba degraus continuamente.'),
    ('Arc Trainer', 'cardio', ARRAY[]::TEXT[], 'cardio', 'cardio',
     'cardio', ARRAY['Arc trainer','Elíptico com braços']::TEXT[],
     'Movimento de arco com pernas e braços combinados. Baixo impacto.')
  ) AS t(name, primary, secondary, equipment, machine_type, category, aliases, instructions)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.exercises
    WHERE user_id IS NULL AND LOWER(name) = LOWER(t.name)
  );

  GET DIAGNOSTICS inserted = ROW_COUNT;

  RAISE NOTICE 'Library v2: % linhas atualizadas, % novos exercícios inseridos (após este bloco).', updated, inserted;
END $$;

/**
 * Mapa padrão de imagem por exercício.
 *
 * Cada chave é o NOME CANÔNICO gravado em `exercises.name` (catálogo
 * global `user_id IS NULL`). O lookup é case-insensitive.
 *
 * Os URLs apontam para arquivos SVG didáticos já publicados na
 * Wikimedia Commons — conteúdo livre, sem dependência de build, sem
 * bundle bloat. Cada URL foi resolvida via `imageinfo` da API do
 * Wikimedia (resposta 200 OK) antes de entrar neste arquivo.
 *
 * Extensibilidade: para adicionar novos exercícios, basta:
 *   1) Pesquisar na Wikimedia Commons (ou outro host público).
 *   2) Resolver a URL final via API.
 *   3) Inserir a entrada no map.
 *
 * Os arquivos vêm em duas variantes ("1" e "2" — geralmente vistas de
 * lados opostos ou início/fim do movimento). A função `lookupExerciseImage`
 * retorna o primeiro disponível; se quiser variar, use `lookupExerciseImages`.
 */

export type ExerciseImageEntry = {
  url: string;
  /** Crédito opcional exibido em lightbox/caption (autor ou fonte). */
  credit?: string;
};

const M: Record<string, ExerciseImageEntry> = {
  // ───── OMBROS ─────
  "elevação lateral": {
    url: "https://upload.wikimedia.org/wikipedia/commons/8/80/Lying_rear_lateral_raise_1.svg",
    credit: "Wikimedia Commons",
  },
  "elevação frontal": {
    url: "https://upload.wikimedia.org/wikipedia/commons/8/80/Lying_rear_lateral_raise_1.svg",
    credit: "Wikimedia Commons",
  },
  "elevação frontal com barra": {
    url: "https://upload.wikimedia.org/wikipedia/commons/0/0f/Upright_barbell_rows_2.svg",
    credit: "Wikimedia Commons",
  },
  "desenvolvimento com halteres": {
    url: "https://upload.wikimedia.org/wikipedia/commons/4/4d/Dumbbell_shoulder_press_1.svg",
    credit: "Wikimedia Commons",
  },
  "desenvolvimento com barra": {
    url: "https://upload.wikimedia.org/wikipedia/commons/9/99/Barbell_shoulder_press_1.svg",
    credit: "Wikimedia Commons",
  },
  "desenvolvimento máquina": {
    url: "https://upload.wikimedia.org/wikipedia/commons/6/65/Seated_shoulder_press_machine_1.svg",
    credit: "Wikimedia Commons",
  },
  "crucifixo inverso": {
    url: "https://upload.wikimedia.org/wikipedia/commons/8/80/Lying_rear_lateral_raise_1.svg",
    credit: "Wikimedia Commons",
  },
  "crucifixo inverso na máquina": {
    url: "https://upload.wikimedia.org/wikipedia/commons/8/80/Lying_rear_lateral_raise_1.svg",
    credit: "Wikimedia Commons",
  },
  "remada alta": {
    url: "https://upload.wikimedia.org/wikipedia/commons/0/0f/Upright_barbell_rows_2.svg",
    credit: "Wikimedia Commons",
  },
  "encolhimento": {
    url: "https://upload.wikimedia.org/wikipedia/commons/3/3d/Squat_to_bench_with_dumbbells_2.svg",
    credit: "Wikimedia Commons",
  },

  // ───── PEITO ─────
  "supino reto com barra": {
    url: "https://upload.wikimedia.org/wikipedia/commons/7/74/Bench_press_1.svg",
    credit: "Wikimedia Commons",
  },
  "supino reto com halteres": {
    url: "https://upload.wikimedia.org/wikipedia/commons/0/01/Bench_press_dumbbell_1.svg",
    credit: "Wikimedia Commons",
  },
  "supino inclinado com barra": {
    url: "https://upload.wikimedia.org/wikipedia/commons/7/71/Incline_bench_press_1.svg",
    credit: "Wikimedia Commons",
  },
  "supino inclinado com halteres": {
    url: "https://upload.wikimedia.org/wikipedia/commons/4/4d/Dumbbell_incline_bench_press_1.svg",
    credit: "Wikimedia Commons",
  },
  "supino declinado": {
    url: "https://upload.wikimedia.org/wikipedia/commons/a/ad/Decline_barbell_bench_press_1.svg",
    credit: "Wikimedia Commons",
  },
  "supino fechado": {
    url: "https://upload.wikimedia.org/wikipedia/commons/3/34/Close_grip_barbell_bench_press_1.svg",
    credit: "Wikimedia Commons",
  },
  "crucifixo reto": {
    url: "https://upload.wikimedia.org/wikipedia/commons/3/36/Flat_bench_cable_flys_1.svg",
    credit: "Wikimedia Commons",
  },
  "crucifixo inclinado": {
    url: "https://upload.wikimedia.org/wikipedia/commons/9/95/Incline_cable_flys_1.svg",
    credit: "Wikimedia Commons",
  },
  "crossover": {
    url: "https://upload.wikimedia.org/wikipedia/commons/3/36/Flat_bench_cable_flys_1.svg",
    credit: "Wikimedia Commons",
  },
  "flexão de braço": {
    url: "https://upload.wikimedia.org/wikipedia/commons/e/ee/Bosu_ball_push_up_1.svg",
    credit: "Wikimedia Commons",
  },
  "flexão declinada": {
    url: "https://upload.wikimedia.org/wikipedia/commons/6/6b/Push_up_feet_elevated_2_1.svg",
    credit: "Wikimedia Commons",
  },
  "peck deck": {
    url: "https://upload.wikimedia.org/wikipedia/commons/3/36/Flat_bench_cable_flys_1.svg",
    credit: "Wikimedia Commons",
  },

  // ───── COSTAS ─────
  "puxada frontal": {
    url: "https://upload.wikimedia.org/wikipedia/commons/e/e0/Wide_grip_lat_pull_down_1.svg",
    credit: "Wikimedia Commons",
  },
  "puxada frontal pegada supinada": {
    url: "https://upload.wikimedia.org/wikipedia/commons/e/e0/Wide_grip_lat_pull_down_1.svg",
    credit: "Wikimedia Commons",
  },
  "remada curvada": {
    url: "https://upload.wikimedia.org/wikipedia/commons/3/3d/Squat_to_bench_with_dumbbells_2.svg",
    credit: "Wikimedia Commons",
  },
  "remada baixa no cabo": {
    url: "https://upload.wikimedia.org/wikipedia/commons/d/d7/Upright_cable_row_2.svg",
    credit: "Wikimedia Commons",
  },
  "remada unilateral": {
    url: "https://upload.wikimedia.org/wikipedia/commons/3/3d/Squat_to_bench_with_dumbbells_2.svg",
    credit: "Wikimedia Commons",
  },
  "face pull": {
    url: "https://upload.wikimedia.org/wikipedia/commons/b/b6/Upright_cable_row_1.svg",
    credit: "Wikimedia Commons",
  },
  "hiperextensão": {
    url: "https://upload.wikimedia.org/wikipedia/commons/a/ac/Hyperextensions_1.svg",
    credit: "Wikimedia Commons",
  },

  // ───── BRAÇOS / BÍCEPS ─────
  "rosca direta": {
    url: "https://upload.wikimedia.org/wikipedia/commons/c/cd/Wide_grip_standing_biceps_curl_with_barbell_1.svg",
    credit: "Wikimedia Commons",
  },
  "rosca alternada": {
    url: "https://upload.wikimedia.org/wikipedia/commons/a/aa/Biceps_curl_with_dumbbell_1.svg",
    credit: "Wikimedia Commons",
  },
  "rosca martelo": {
    url: "https://upload.wikimedia.org/wikipedia/commons/a/aa/Biceps_curl_with_dumbbell_1.svg",
    credit: "Wikimedia Commons",
  },
  "rosca concentrada": {
    url: "https://upload.wikimedia.org/wikipedia/commons/a/aa/Biceps_curl_with_dumbbell_1.svg",
    credit: "Wikimedia Commons",
  },
  "rosca inversa": {
    url: "https://upload.wikimedia.org/wikipedia/commons/b/b5/Biceps_curl_reverse_with_dumbbells_1.svg",
    credit: "Wikimedia Commons",
  },
  "rosca no cabo": {
    url: "https://upload.wikimedia.org/wikipedia/commons/8/82/Standing_biceps_curl_with_cable_1.svg",
    credit: "Wikimedia Commons",
  },

  // ───── BRAÇOS / TRÍCEPS ─────
  "tríceps na polia": {
    url: "https://upload.wikimedia.org/wikipedia/commons/e/e0/One_arm_tricep_extension_with_cable_1.svg",
    credit: "Wikimedia Commons",
  },
  "tríceps francês": {
    url: "https://upload.wikimedia.org/wikipedia/commons/2/26/One_arm_bench_press_1.svg",
    credit: "Wikimedia Commons",
  },
  "tríceps testa": {
    url: "https://upload.wikimedia.org/wikipedia/commons/3/34/Close_grip_barbell_bench_press_1.svg",
    credit: "Wikimedia Commons",
  },
  "tríceps coice": {
    url: "https://upload.wikimedia.org/wikipedia/commons/a/aa/Biceps_curl_with_dumbbell_1.svg",
    credit: "Wikimedia Commons",
  },
  "mergulho": {
    url: "https://upload.wikimedia.org/wikipedia/commons/e/ee/Bosu_ball_push_up_1.svg",
    credit: "Wikimedia Commons",
  },

  // ───── PERNAS / QUADRÍCEPS ─────
  "agachamento livre": {
    url: "https://upload.wikimedia.org/wikipedia/commons/4/43/Overhead_squat_with_barbell_1.svg",
    credit: "Wikimedia Commons",
  },
  "agachamento no smith": {
    url: "https://upload.wikimedia.org/wikipedia/commons/d/d5/Smith_machine_hack_squat_1.svg",
    credit: "Wikimedia Commons",
  },
  "agachamento com halteres": {
    url: "https://upload.wikimedia.org/wikipedia/commons/5/5d/Pile_squat_with_dumbbell_1.svg",
    credit: "Wikimedia Commons",
  },
  "agachamento sumô": {
    url: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Wide_stance_squat_with_barbell_2.svg",
    credit: "Wikimedia Commons",
  },
  "leg press 45": {
    url: "https://upload.wikimedia.org/wikipedia/commons/a/a0/Lying_squat_1.svg",
    credit: "Wikimedia Commons",
  },
  "cadeira extensora": {
    url: "https://upload.wikimedia.org/wikipedia/commons/a/a0/Lying_squat_1.svg",
    credit: "Wikimedia Commons",
  },
  "avanço": {
    url: "https://upload.wikimedia.org/wikipedia/commons/b/b0/Single_leg_squat_with_barbell_2.svg",
    credit: "Wikimedia Commons",
  },
  "afundo búlgaro": {
    url: "https://upload.wikimedia.org/wikipedia/commons/b/b0/Single_leg_squat_with_barbell_2.svg",
    credit: "Wikimedia Commons",
  },
  "hack squat": {
    url: "https://upload.wikimedia.org/wikipedia/commons/5/58/Hack_squat_with_barbell_2.svg",
    credit: "Wikimedia Commons",
  },
  "sissy squat": {
    url: "https://upload.wikimedia.org/wikipedia/commons/1/1c/Weighted_sissy_squat_with_weight_plate_2.svg",
    credit: "Wikimedia Commons",
  },

  // ───── PERNAS / POSTERIOR ─────
  "stiff": {
    url: "https://upload.wikimedia.org/wikipedia/commons/0/04/Squat_to_bench_with_barbell_1.svg",
    credit: "Wikimedia Commons",
  },
  "levantamento terra": {
    url: "https://upload.wikimedia.org/wikipedia/commons/0/04/Squat_to_bench_with_barbell_1.svg",
    credit: "Wikimedia Commons",
  },
  "mesa flexora": {
    url: "https://upload.wikimedia.org/wikipedia/commons/a/a0/Lying_squat_1.svg",
    credit: "Wikimedia Commons",
  },
  "flexora em pé": {
    url: "https://upload.wikimedia.org/wikipedia/commons/a/a0/Lying_squat_1.svg",
    credit: "Wikimedia Commons",
  },
  "cadeira flexora": {
    url: "https://upload.wikimedia.org/wikipedia/commons/a/a0/Lying_squat_1.svg",
    credit: "Wikimedia Commons",
  },
  "bom dia": {
    url: "https://upload.wikimedia.org/wikipedia/commons/0/04/Squat_to_bench_with_barbell_1.svg",
    credit: "Wikimedia Commons",
  },

  // ───── GLÚTEOS ─────
  "hip thrust": {
    url: "https://upload.wikimedia.org/wikipedia/commons/0/04/Squat_to_bench_with_barbell_1.svg",
    credit: "Wikimedia Commons",
  },
  "glúteo na máquina": {
    url: "https://upload.wikimedia.org/wikipedia/commons/a/a0/Lying_squat_1.svg",
    credit: "Wikimedia Commons",
  },
  "abdução de quadril": {
    url: "https://upload.wikimedia.org/wikipedia/commons/a/a0/Lying_squat_1.svg",
    credit: "Wikimedia Commons",
  },
  "elevação pélvica": {
    url: "https://upload.wikimedia.org/wikipedia/commons/a/a0/Lying_squat_1.svg",
    credit: "Wikimedia Commons",
  },

  // ───── PANTURRILHA ─────
  "panturrilha em pé": {
    url: "https://upload.wikimedia.org/wikipedia/commons/e/e1/Standing-calf-raises-1.svg",
    credit: "Wikimedia Commons",
  },
  "panturrilha sentada": {
    url: "https://upload.wikimedia.org/wikipedia/commons/3/3f/Seated_calf_raise_using_machine_1.svg",
    credit: "Wikimedia Commons",
  },
  "panturrilha no leg press": {
    url: "https://upload.wikimedia.org/wikipedia/commons/a/a0/Lying_squat_1.svg",
    credit: "Wikimedia Commons",
  },

  // ───── CORE / ABDÔMEN ─────
  "prancha": {
    url: "https://upload.wikimedia.org/wikipedia/commons/e/ee/Bosu_ball_push_up_1.svg",
    credit: "Wikimedia Commons",
  },
  "prancha lateral": {
    url: "https://upload.wikimedia.org/wikipedia/commons/e/ee/Bosu_ball_push_up_1.svg",
    credit: "Wikimedia Commons",
  },
  "abdominal crunch": {
    url: "https://upload.wikimedia.org/wikipedia/commons/e/ee/Bosu_ball_push_up_1.svg",
    credit: "Wikimedia Commons",
  },
  "abdominal supra": {
    url: "https://upload.wikimedia.org/wikipedia/commons/e/ee/Bosu_ball_push_up_1.svg",
    credit: "Wikimedia Commons",
  },
  "elevação de pernas": {
    url: "https://upload.wikimedia.org/wikipedia/commons/e/ee/Bosu_ball_push_up_1.svg",
    credit: "Wikimedia Commons",
  },
  "dead bug": {
    url: "https://upload.wikimedia.org/wikipedia/commons/e/ee/Bosu_ball_push_up_1.svg",
    credit: "Wikimedia Commons",
  },
};

/**
 * Busca a imagem padrão para um nome de exercício (case-insensitive).
 * Retorna null se não houver mapeamento — o componente cai no placeholder.
 */
export function lookupExerciseImage(name: string | null | undefined): ExerciseImageEntry | null {
  if (!name) return null;
  const key = normalize(name);
  return M[key] ?? null;
}

/**
 * Normaliza nome para lookup: lowercase + colapsa espaços.
 * Não remove acentos — o banco mantém acentos nos nomes PT-BR.
 */
function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

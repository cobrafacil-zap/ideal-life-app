/**
 * Referência de calorias por porção comum.
 *
 * Valores arredondados a partir das tabelas TACO (Tabela Brasileira de
 * Composição de Alimentos) e rótulos nutricionais típicos. Não substituem
 * a leitura do rótulo, mas dão uma boa ordem de grandeza para o usuário
 * estimar o que comeu.
 *
 * Cada item inclui:
 *  - `label`    : nome amigável (exibido na UI)
 *  - `kcal`     : calorias por porção
 *  - `unit`     : descrição da porção (ex.: "1 col. sopa (~25 g)")
 *  - `protein`  : gramas de proteína
 *  - `carbs`    : gramas de carboidrato
 *  - `fat`      : gramas de gordura
 *  - `category` : agrupamento (para filtro)
 */

export type FoodCategory =
  | "grãos"
  | "carnes"
  | "ovos"
  | "laticínios"
  | "leguminosas"
  | "vegetais"
  | "frutas"
  | "massas"
  | "tubérculos"
  | "pães"
  | "gorduras"
  | "açúcares"
  | "bebidas"
  | "industrializados";

export type PortionItem = {
  label: string;
  kcal: number;
  unit: string;
  category: FoodCategory;
  protein?: number;
  carbs?: number;
  fat?: number;
};

// ───────────────────────────── GRÃOS ─────────────────────────────
const GRAOS: PortionItem[] = [
  { label: "Arroz branco cozido", kcal: 33, unit: "1 col. sopa (~25 g)", category: "grãos", protein: 0.7, carbs: 7.2, fat: 0.1 },
  { label: "Arroz integral cozido", kcal: 28, unit: "1 col. sopa (~25 g)", category: "grãos", protein: 0.7, carbs: 6.0, fat: 0.2 },
  { label: "Arroz temperado (com alho/óleo)", kcal: 55, unit: "1 col. sopa (~25 g)", category: "grãos", protein: 0.7, carbs: 7.2, fat: 1.8 },
];

// ───────────────────────────── MASSAS ─────────────────────────────
const MASSAS: PortionItem[] = [
  { label: "Macarrão cozido (espaguete)", kcal: 100, unit: "1 pegador (~80 g)", category: "massas", carbs: 20, protein: 3.4, fat: 0.6 },
  { label: "Macarrão à bolonhesa", kcal: 140, unit: "1 pegador (~100 g)", category: "massas", carbs: 19, protein: 6, fat: 4 },
  { label: "Macarrão ao alho e óleo", kcal: 160, unit: "1 pegador (~90 g)", category: "massas", carbs: 20, protein: 3.5, fat: 7 },
  { label: "Lasanha (média)", kcal: 320, unit: "1 pedaço (~150 g)", category: "massas", carbs: 28, protein: 16, fat: 14 },
  { label: "Nhoque cozido", kcal: 120, unit: "1 porção (~100 g)", category: "massas", carbs: 24, protein: 3, fat: 1 },
  { label: "Pizza mussarela (1 fatia)", kcal: 270, unit: "1 fatia média (~120 g)", category: "massas", carbs: 32, protein: 12, fat: 10 },
  { label: "Pizza calabresa (1 fatia)", kcal: 290, unit: "1 fatia média (~120 g)", category: "massas", carbs: 30, protein: 12, fat: 12 },
];

// ───────────────────────────── TUBÉRCULOS ─────────────────────────────
const TUBERCULOS: PortionItem[] = [
  { label: "Batata inglesa cozida", kcal: 120, unit: "1 unidade média (~150 g)", category: "tubérculos", carbs: 28, protein: 2.5, fat: 0.1 },
  { label: "Batata frita", kcal: 230, unit: "1 porção (~100 g)", category: "tubérculos", carbs: 30, protein: 3, fat: 11 },
  { label: "Mandioca cozida", kcal: 125, unit: "1 pedaço médio (~100 g)", category: "tubérculos", carbs: 30, protein: 0.6, fat: 0.1 },
  { label: "Purê de batata", kcal: 110, unit: "1 col. sopa (~70 g)", category: "tubérculos", carbs: 17, protein: 2, fat: 3.5 },
  { label: "Cará cozido", kcal: 100, unit: "1 unidade média (~130 g)", category: "tubérculos", carbs: 24, protein: 1.5, fat: 0.2 },
  { label: "Inhame cozido", kcal: 95, unit: "1 unidade média (~120 g)", category: "tubérculos", carbs: 22, protein: 1.7, fat: 0.2 },
  { label: "Aipim frito", kcal: 200, unit: "1 porção (~100 g)", category: "tubérculos", carbs: 28, protein: 1.2, fat: 9 },
];

// ───────────────────────────── LEGUMINOSAS ─────────────────────────────
const LEGUMINOSAS: PortionItem[] = [
  { label: "Feijão carioca cozido", kcal: 76, unit: "1 concha média (~80 g)", category: "leguminosas", protein: 4.8, carbs: 13.6, fat: 0.5 },
  { label: "Feijão preto cozido", kcal: 70, unit: "1 concha média (~80 g)", category: "leguminosas", protein: 4.5, carbs: 12, fat: 0.5 },
  { label: "Feijão verde / lentilha", kcal: 65, unit: "1 concha média (~80 g)", category: "leguminosas", protein: 5.0, carbs: 11, fat: 0.4 },
  { label: "Lentilha cozida", kcal: 85, unit: "1 concha média (~80 g)", category: "leguminosas", protein: 6, carbs: 14, fat: 0.4 },
  { label: "Grão-de-bico cozido", kcal: 120, unit: "1 concha média (~80 g)", category: "leguminosas", protein: 7, carbs: 20, fat: 1.5 },
  { label: "Ervilha cozida", kcal: 60, unit: "1 col. sopa (~30 g)", category: "leguminosas", protein: 3.5, carbs: 10, fat: 0.2 },
  { label: "Lata de feijão (industrializado)", kcal: 230, unit: "1 lata (~300 g)", category: "leguminosas", protein: 14, carbs: 38, fat: 1 },
];

// ───────────────────────────── VEGETAIS ─────────────────────────────
const VEGETAIS: PortionItem[] = [
  { label: "Salada verde (folhas)", kcal: 20, unit: "1 prato (~80 g)", category: "vegetais", carbs: 4, protein: 1.5, fat: 0.2 },
  { label: "Brócolis cozido", kcal: 35, unit: "1 xícara (~90 g)", category: "vegetais", carbs: 7, protein: 2.4, fat: 0.3 },
  { label: "Couve refogada", kcal: 60, unit: "1 col. sopa (~30 g)", category: "vegetais", carbs: 4, protein: 1.2, fat: 4 },
  { label: "Cenoura ralada/cozida", kcal: 30, unit: "1 col. sopa (~30 g)", category: "vegetais", carbs: 7, protein: 0.4, fat: 0.1 },
  { label: "Beterraba cozida", kcal: 35, unit: "1 fatia média (~40 g)", category: "vegetais", carbs: 8, protein: 0.7, fat: 0.1 },
  { label: "Tomate fatiado", kcal: 15, unit: "1 unidade média (~60 g)", category: "vegetais", carbs: 3, protein: 0.7, fat: 0.2 },
  { label: "Pepino fatiado", kcal: 8, unit: "1 xícara (~100 g)", category: "vegetais", carbs: 1.5, protein: 0.5 },
  { label: "Abobrinha refogada", kcal: 25, unit: "1 col. sopa (~30 g)", category: "vegetais", carbs: 4, protein: 0.8, fat: 0.7 },
  { label: "Chuchu cozido", kcal: 18, unit: "1 unidade média (~70 g)", category: "vegetais", carbs: 4, protein: 0.4 },
  { label: "Abóbora cozida", kcal: 25, unit: "1 col. sopa (~40 g)", category: "vegetais", carbs: 6, protein: 0.7 },
  { label: "Berinjela refogada", kcal: 30, unit: "1 col. sopa (~30 g)", category: "vegetais", carbs: 4, protein: 0.6, fat: 1 },
  { label: "Milho verde cozido", kcal: 100, unit: "1 espiga média (~100 g)", category: "vegetais", carbs: 22, protein: 3, fat: 0.6 },
];

// ───────────────────────────── FRUTAS ─────────────────────────────
const FRUTAS: PortionItem[] = [
  { label: "Banana", kcal: 90, unit: "1 unidade média", category: "frutas", carbs: 23, protein: 1.3, fat: 0.3 },
  { label: "Maçã", kcal: 72, unit: "1 unidade média", category: "frutas", carbs: 19, protein: 0.4, fat: 0.2 },
  { label: "Laranja", kcal: 60, unit: "1 unidade média", category: "frutas", carbs: 15, protein: 1.2, fat: 0.2 },
  { label: "Mamão", kcal: 55, unit: "1 fatia média (~150 g)", category: "frutas", carbs: 14, protein: 0.6, fat: 0.2 },
  { label: "Melancia", kcal: 50, unit: "1 fatia média (~200 g)", category: "frutas", carbs: 12, protein: 0.8, fat: 0.2 },
  { label: "Morango", kcal: 35, unit: "10 unidades médias", category: "frutas", carbs: 8, protein: 0.7, fat: 0.3 },
  { label: "Uva", kcal: 70, unit: "1 cacho pequeno (~100 g)", category: "frutas", carbs: 18, protein: 0.6, fat: 0.2 },
  { label: "Abacate", kcal: 160, unit: "1/2 unidade média (~100 g)", category: "frutas", carbs: 9, protein: 2, fat: 15 },
  { label: "Manga", kcal: 100, unit: "1 unidade média", category: "frutas", carbs: 25, protein: 1, fat: 0.5 },
  { label: "Abacaxi", kcal: 50, unit: "1 fatia média (~100 g)", category: "frutas", carbs: 13, protein: 0.5, fat: 0.1 },
  { label: "Pera", kcal: 95, unit: "1 unidade média", category: "frutas", carbs: 25, protein: 0.6, fat: 0.2 },
  { label: "Pêssego", kcal: 45, unit: "1 unidade média", category: "frutas", carbs: 11, protein: 0.8, fat: 0.2 },
  { label: "Melão", kcal: 50, unit: "1 fatia média (~150 g)", category: "frutas", carbs: 12, protein: 0.8, fat: 0.2 },
  { label: "Kiwi", kcal: 50, unit: "1 unidade média", category: "frutas", carbs: 12, protein: 0.9, fat: 0.4 },
  { label: "Goiaba", kcal: 80, unit: "1 unidade média", category: "frutas", carbs: 20, protein: 1.3, fat: 0.5 },
  { label: "Suco natural de laranja", kcal: 90, unit: "1 copo (~200 ml)", category: "bebidas", carbs: 21, protein: 1.3, fat: 0.2 },
  { label: "Suco de maracujá", kcal: 80, unit: "1 copo (~200 ml)", category: "bebidas", carbs: 20, protein: 0.8 },
  { label: "Suco de caju", kcal: 90, unit: "1 copo (~200 ml)", category: "bebidas", carbs: 22, protein: 0.6 },
];

// ───────────────────────────── CARNES ─────────────────────────────
const CARNES: PortionItem[] = [
  { label: "Bife de boi grelhado", kcal: 220, unit: "1 filé médio (~120 g)", category: "carnes", protein: 26, carbs: 0, fat: 13 },
  { label: "Bife de boi à milanesa", kcal: 380, unit: "1 filé (~150 g)", category: "carnes", protein: 28, carbs: 16, fat: 22 },
  { label: "Bife de fígado", kcal: 175, unit: "1 filé (~100 g)", category: "carnes", protein: 23, carbs: 4, fat: 7 },
  { label: "Picanha grelhada", kcal: 290, unit: "1 fatia (~150 g)", category: "carnes", protein: 28, carbs: 0, fat: 20 },
  { label: "Carne moída refogada", kcal: 50, unit: "1 col. sopa (~25 g)", category: "carnes", protein: 5, carbs: 0.2, fat: 3.3 },
  { label: "Carne moída (patty)", kcal: 200, unit: "1 hambúrguer (~100 g)", category: "carnes", protein: 17, carbs: 1, fat: 14 },
  { label: "Carne de panela / cozida", kcal: 240, unit: "1 porção (~120 g)", category: "carnes", protein: 28, carbs: 0, fat: 14 },
  { label: "Costela bovina assada", kcal: 380, unit: "1 costela (~200 g)", category: "carnes", protein: 30, carbs: 0, fat: 28 },
  { label: "Strogonoff de carne", kcal: 320, unit: "1 porção (~150 g)", category: "carnes", protein: 22, carbs: 8, fat: 22 },
  { label: "Frango grelhado (peito)", kcal: 165, unit: "1 filé médio (~100 g)", category: "carnes", protein: 31, carbs: 0, fat: 3.6 },
  { label: "Frango grelhado (coxa/sobrecoxa)", kcal: 215, unit: "1 unidade média (~120 g)", category: "carnes", protein: 24, carbs: 0, fat: 13 },
  { label: "Frango empanado (nugget)", kcal: 280, unit: "6 unidades (~120 g)", category: "carnes", protein: 14, carbs: 18, fat: 16 },
  { label: "Frango xadrez", kcal: 230, unit: "1 porção (~150 g)", category: "carnes", protein: 19, carbs: 8, fat: 13 },
  { label: "Frango assado (inteiro)", kcal: 230, unit: "1 sobrecoxa (~120 g)", category: "carnes", protein: 26, carbs: 0, fat: 13 },
  { label: "Linguiça calabresa frita", kcal: 290, unit: "1 gomo (~80 g)", category: "carnes", protein: 13, carbs: 2, fat: 26 },
  { label: "Linguiça de frango", kcal: 180, unit: "1 gomo (~80 g)", category: "carnes", protein: 14, carbs: 2, fat: 12 },
  { label: "Salsicha", kcal: 130, unit: "1 unidade (~50 g)", category: "carnes", protein: 6, carbs: 1, fat: 11 },
  { label: "Presunto", kcal: 50, unit: "1 fatia (~15 g)", category: "carnes", protein: 4, carbs: 0.3, fat: 3.5 },
  { label: "Mortadela", kcal: 90, unit: "1 fatia (~25 g)", category: "carnes", protein: 4, carbs: 0.5, fat: 8 },
  { label: "Bacon frito", kcal: 110, unit: "2 fatias (~30 g)", category: "carnes", protein: 9, carbs: 0.4, fat: 9 },
  { label: "Peito de peru (bloco)", kcal: 35, unit: "1 fatia (~15 g)", category: "carnes", protein: 6, carbs: 0.5, fat: 1 },
  { label: "Tilápia grelhada", kcal: 130, unit: "1 filé (~120 g)", category: "carnes", protein: 26, carbs: 0, fat: 3 },
  { label: "Salmão grelhado", kcal: 230, unit: "1 filé (~120 g)", category: "carnes", protein: 25, carbs: 0, fat: 14 },
  { label: "Atum em conserva", kcal: 80, unit: "1 lata drenada (~100 g)", category: "carnes", protein: 18, carbs: 0, fat: 1 },
  { label: "Sardinha em conserva", kcal: 130, unit: "1 lata drenada (~80 g)", category: "carnes", protein: 15, carbs: 0, fat: 7 },
  { label: "Bacalhau cozido", kcal: 140, unit: "1 posta (~120 g)", category: "carnes", protein: 26, carbs: 0, fat: 3 },
  { label: "Camarão cozido", kcal: 100, unit: "1 porção (~100 g)", category: "carnes", protein: 22, carbs: 0, fat: 1 },
];

// ───────────────────────────── OVOS ─────────────────────────────
const OVOS: PortionItem[] = [
  { label: "Ovo cozido", kcal: 78, unit: "1 unidade (~50 g)", category: "ovos", protein: 6.3, carbs: 0.6, fat: 5.3 },
  { label: "Ovo frito", kcal: 90, unit: "1 unidade (~50 g)", category: "ovos", protein: 6, carbs: 0.4, fat: 7 },
  { label: "Ovo mexido (2 ovos)", kcal: 180, unit: "2 ovos (~100 g)", category: "ovos", protein: 12, carbs: 1.5, fat: 13 },
  { label: "Omelete simples (2 ovos)", kcal: 200, unit: "1 omelete (~120 g)", category: "ovos", protein: 13, carbs: 2, fat: 14 },
  { label: "Clara de ovo", kcal: 17, unit: "1 unidade (~33 g)", category: "ovos", protein: 3.6, carbs: 0.2 },
];

// ───────────────────────────── LATICÍNIOS ─────────────────────────────
const LATICINIOS: PortionItem[] = [
  { label: "Queijo branco (minas)", kcal: 70, unit: "1 fatia (~30 g)", category: "laticínios", protein: 5.4, carbs: 1.0, fat: 4.8 },
  { label: "Queijo mussarela", kcal: 85, unit: "1 fatia (~30 g)", category: "laticínios", protein: 6, carbs: 0.6, fat: 6 },
  { label: "Queijo cheddar", kcal: 110, unit: "1 fatia (~28 g)", category: "laticínios", protein: 7, carbs: 0.4, fat: 9 },
  { label: "Queijo parmesão ralado", kcal: 110, unit: "1 col. sopa (~15 g)", category: "laticínios", protein: 11, carbs: 0.9, fat: 7 },
  { label: "Queijo prato", kcal: 90, unit: "1 fatia (~30 g)", category: "laticínios", protein: 7, carbs: 0.5, fat: 7 },
  { label: "Queijo ricota", kcal: 50, unit: "1 col. sopa (~30 g)", category: "laticínios", protein: 4, carbs: 1, fat: 3 },
  { label: "Cream cheese", kcal: 50, unit: "1 col. sopa (~15 g)", category: "laticínios", protein: 1, carbs: 0.5, fat: 5 },
  { label: "Requeijão", kcal: 75, unit: "1 col. sopa (~30 g)", category: "laticínios", protein: 2.5, carbs: 1, fat: 7 },
  { label: "Manteiga", kcal: 36, unit: "1 col. chá (~5 g)", category: "laticínios", protein: 0, carbs: 0, fat: 4.1 },
  { label: "Margarina", kcal: 35, unit: "1 col. chá (~5 g)", category: "laticínios", carbs: 0, fat: 4 },
  { label: "Leite integral", kcal: 150, unit: "1 copo (~200 ml)", category: "laticínios", protein: 6, carbs: 10, fat: 6 },
  { label: "Leite desnatado", kcal: 70, unit: "1 copo (~200 ml)", category: "laticínios", protein: 6, carbs: 10, fat: 0.2 },
  { label: "Leite semidesnatado", kcal: 95, unit: "1 copo (~200 ml)", category: "laticínios", protein: 6, carbs: 10, fat: 2 },
  { label: "Iogurte natural", kcal: 100, unit: "1 copo (~170 g)", category: "laticínios", protein: 6, carbs: 12, fat: 3 },
  { label: "Iogurte grego natural", kcal: 130, unit: "1 copo (~170 g)", category: "laticínios", protein: 15, carbs: 8, fat: 4 },
  { label: "Iogurte de frutas (açucarado)", kcal: 160, unit: "1 copo (~170 g)", category: "laticínios", protein: 5, carbs: 28, fat: 2 },
  { label: "Iogurte natural desnatado", kcal: 80, unit: "1 copo (~170 g)", category: "laticínios", protein: 7, carbs: 12, fat: 0.3 },
  { label: "Coalhada", kcal: 110, unit: "1 pote (~170 g)", category: "laticínios", protein: 5, carbs: 8, fat: 6 },
];

// ───────────────────────────── PÃES ─────────────────────────────
const PAES: PortionItem[] = [
  { label: "Pão francês", kcal: 135, unit: "1 unidade (~50 g)", category: "pães", protein: 4.5, carbs: 28, fat: 0.7 },
  { label: "Pão de forma", kcal: 70, unit: "1 fatia (~25 g)", category: "pães", protein: 2, carbs: 13, fat: 1 },
  { label: "Pão integral", kcal: 70, unit: "1 fatia (~25 g)", category: "pães", protein: 2.5, carbs: 13, fat: 1.0 },
  { label: "Pão de queijo", kcal: 110, unit: "1 unidade média (~40 g)", category: "pães", protein: 4, carbs: 12, fat: 6 },
  { label: "Pão de hambúrguer", kcal: 160, unit: "1 unidade (~60 g)", category: "pães", protein: 5, carbs: 30, fat: 2 },
  { label: "Pão sírio", kcal: 130, unit: "1 unidade (~50 g)", category: "pães", protein: 4, carbs: 26, fat: 1 },
  { label: "Pão de centeio", kcal: 80, unit: "1 fatia (~30 g)", category: "pães", protein: 3, carbs: 15, fat: 1 },
  { label: "Pão doce", kcal: 230, unit: "1 unidade (~80 g)", category: "pães", protein: 5, carbs: 36, fat: 8 },
  { label: "Bisnaguinha", kcal: 70, unit: "1 unidade (~25 g)", category: "pães", protein: 2, carbs: 13, fat: 1 },
  { label: "Croissant", kcal: 230, unit: "1 unidade (~60 g)", category: "pães", protein: 5, carbs: 26, fat: 12 },
  { label: "Baguete (miolo)", kcal: 180, unit: "1 porção (~80 g)", category: "pães", protein: 6, carbs: 36, fat: 1 },
  { label: "Tapioca (goma)", kcal: 130, unit: "1 unidade (~50 g)", category: "pães", carbs: 32, protein: 0.2 },
  { label: "Cuscuz nordestino", kcal: 140, unit: "1 porção (~100 g)", category: "pães", carbs: 30, protein: 3, fat: 0.5 },
];

// ───────────────────────────── GORDURAS ─────────────────────────────
const GORDURAS: PortionItem[] = [
  { label: "Azeite de oliva", kcal: 119, unit: "1 col. sopa (~13 ml)", category: "gorduras", fat: 13.5 },
  { label: "Óleo de soja", kcal: 120, unit: "1 col. sopa (~13 ml)", category: "gorduras", fat: 14 },
  { label: "Maionese", kcal: 95, unit: "1 col. sopa (~14 g)", category: "gorduras", protein: 0.3, carbs: 0.6, fat: 10 },
];

// ───────────────────────────── AÇÚCARES ─────────────────────────────
const ACUCARES: PortionItem[] = [
  { label: "Açúcar refinado", kcal: 48, unit: "1 col. sopa (~12 g)", category: "açúcares", carbs: 12 },
  { label: "Açúcar mascavo", kcal: 45, unit: "1 col. sopa (~12 g)", category: "açúcares", carbs: 11 },
  { label: "Mel", kcal: 65, unit: "1 col. sopa (~21 g)", category: "açúcares", carbs: 17 },
  { label: "Chocolate ao leite (barra)", kcal: 150, unit: "3 quadrados (~30 g)", category: "açúcares", protein: 2.5, carbs: 17, fat: 9 },
  { label: "Chocolate meio amargo", kcal: 160, unit: "3 quadrados (~30 g)", category: "açúcares", protein: 2.5, carbs: 15, fat: 11 },
  { label: "Brigadeiro (1 unidade)", kcal: 90, unit: "1 unidade (~25 g)", category: "açúcares", protein: 1, carbs: 13, fat: 4 },
  { label: "Bolacha maisena", kcal: 70, unit: "3 unidades (~20 g)", category: "açúcares", protein: 1.5, carbs: 12, fat: 2 },
  { label: "Bolacha recheada", kcal: 80, unit: "3 unidades (~22 g)", category: "açúcares", protein: 1, carbs: 12, fat: 3 },
  { label: "Granola", kcal: 120, unit: "1/3 xícara (~30 g)", category: "açúcares", protein: 3, carbs: 18, fat: 4 },
];

// ───────────────────────────── BEBIDAS ─────────────────────────────
const BEBIDAS: PortionItem[] = [
  { label: "Café sem açúcar", kcal: 5, unit: "1 xícara (~50 ml)", category: "bebidas" },
  { label: "Café com leite (1 col. açúcar)", kcal: 60, unit: "1 xícara (~150 ml)", category: "bebidas", carbs: 12, protein: 1 },
  { label: "Chá sem açúcar", kcal: 5, unit: "1 xícara (~200 ml)", category: "bebidas" },
  { label: "Refrigerante (cola/guaraná)", kcal: 140, unit: "1 lata (~350 ml)", category: "bebidas", carbs: 36 },
  { label: "Refrigerante diet/zero", kcal: 5, unit: "1 lata (~350 ml)", category: "bebidas" },
  { label: "Suco de caixinha", kcal: 110, unit: "1 copo (~200 ml)", category: "bebidas", carbs: 27 },
  { label: "Cerveja", kcal: 150, unit: "1 lata (~350 ml)", category: "bebidas", carbs: 13, protein: 1 },
  { label: "Vinho tinto", kcal: 130, unit: "1 taça (~150 ml)", category: "bebidas", carbs: 4 },
  { label: "Água de coco", kcal: 60, unit: "1 copo (~200 ml)", category: "bebidas", carbs: 14, protein: 0.5 },
  { label: "Energético", kcal: 110, unit: "1 lata (~250 ml)", category: "bebidas", carbs: 27 },
];

// ───────────────────────────── INDUSTRIALIZADOS ─────────────────────────────
const INDUSTRIALIZADOS: PortionItem[] = [
  { label: "Hambúrguer de fast-food", kcal: 540, unit: "1 unidade (~200 g)", category: "industrializados", protein: 25, carbs: 40, fat: 30 },
  { label: "Hot dog", kcal: 350, unit: "1 unidade (~150 g)", category: "industrializados", protein: 11, carbs: 33, fat: 18 },
  { label: "Cachorro-quente (pão+salsicha+molho)", kcal: 280, unit: "1 unidade (~120 g)", category: "industrializados", protein: 9, carbs: 30, fat: 12 },
  { label: "X-salada", kcal: 500, unit: "1 unidade (~250 g)", category: "industrializados", protein: 22, carbs: 38, fat: 28 },
  { label: "X-bacon", kcal: 580, unit: "1 unidade (~280 g)", category: "industrializados", protein: 26, carbs: 38, fat: 34 },
  { label: "Miojo / Lámen (instantâneo)", kcal: 430, unit: "1 pacote (~85 g)", category: "industrializados", protein: 10, carbs: 60, fat: 17 },
  { label: "Sushi (1 unidade de salmão)", kcal: 70, unit: "1 unidade (~30 g)", category: "industrializados", protein: 5, carbs: 9, fat: 1.5 },
  { label: "Temaki", kcal: 320, unit: "1 unidade (~200 g)", category: "industrializados", protein: 12, carbs: 45, fat: 9 },
  { label: "Batata chips (salgadinho)", kcal: 150, unit: "1 porção (~50 g)", category: "industrializados", protein: 2, carbs: 13, fat: 10 },
  { label: "Pipoca de micro-ondas", kcal: 110, unit: "1 pacote (~50 g)", category: "industrializados", protein: 2, carbs: 13, fat: 5 },
  { label: "Salgado de festa (risole/coxinha)", kcal: 170, unit: "1 unidade média", category: "industrializados", protein: 6, carbs: 16, fat: 9 },
  { label: "Pastel frito", kcal: 240, unit: "1 unidade média (~100 g)", category: "industrializados", protein: 6, carbs: 22, fat: 13 },
  { label: "Empada", kcal: 200, unit: "1 unidade (~70 g)", category: "industrializados", protein: 5, carbs: 18, fat: 12 },
  { label: "Torta salgada (fatia)", kcal: 320, unit: "1 fatia (~150 g)", category: "industrializados", protein: 10, carbs: 28, fat: 18 },
];

export const PORTION_TABLE: PortionItem[] = [
  ...GRAOS,
  ...MASSAS,
  ...TUBERCULOS,
  ...LEGUMINOSAS,
  ...VEGETAIS,
  ...FRUTAS,
  ...CARNES,
  ...OVOS,
  ...LATICINIOS,
  ...PAES,
  ...GORDURAS,
  ...ACUCARES,
  ...BEBIDAS,
  ...INDUSTRIALIZADOS,
];

export const CATEGORY_LABEL: Record<FoodCategory, string> = {
  grãos: "Grãos",
  massas: "Massas",
  tubérculos: "Tubérculos",
  leguminosas: "Leguminosas",
  vegetais: "Vegetais",
  frutas: "Frutas",
  carnes: "Carnes / peixes",
  ovos: "Ovos",
  laticínios: "Laticínios",
  pães: "Pães",
  gorduras: "Gorduras / óleos",
  açúcares: "Açúcares / doces",
  bebidas: "Bebidas",
  industrializados: "Industrializados",
};

export const CATEGORY_ORDER: FoodCategory[] = [
  "carnes",
  "ovos",
  "laticínios",
  "massas",
  "grãos",
  "tubérculos",
  "leguminosas",
  "vegetais",
  "frutas",
  "pães",
  "gorduras",
  "açúcares",
  "bebidas",
  "industrializados",
];

/**
 * kcal por grama de alguns alimentos comuns — útil para estimar porções
 * a partir do prato servido (ex.: "uns 150 g de arroz").
 */
export const KCAL_PER_GRAM: Record<string, number> = {
  arroz_branco: 1.3,
  arroz_integral: 1.1,
  feijao: 0.95,
  frango_grelhado: 1.65,
  carne_magra: 2.0,
  ovo: 1.55,
  pao_frances: 2.7,
  pao_integral: 2.8,
  macarrao: 1.3,
  batata: 0.86,
  azeite: 8.8,
  manteiga: 7.2,
  acucar: 4.0,
};

/**
 * Texto curto explicando a regra de cálculo Atwater usada para estimar
 * kcal a partir dos macronutrientes.
 */
export function explainCalorieMath(): string {
  return (
    "Cálculo Atwater: kcal = (proteína × 4) + (carboidrato × 4) + (gordura × 9) " +
    "para 100 g do alimento. Esses fatores vêm da energia média de cada " +
    "macronutriente no corpo humano."
  );
}
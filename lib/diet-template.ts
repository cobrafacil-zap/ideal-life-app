import type { Profile } from "@/types/database";

/**
 * Geração determinística de plano alimentar para reeducação.
 *
 * Sem chamada de IA: regras simples baseadas em TDEE, sexo e faixa calórica.
 * O total é limitado a `max(1200, min(tdee − 500, 1800))` — seguro e realista
 * para quem quer perder peso sem cortar drasticamente.
 */

type Sex = "feminino" | "masculino" | "nao_informado" | null | undefined;
type Tier = "low" | "mid" | "high";

export type DietMeal = {
  label: string;
  kcal: number;
  items: string[];
};

export type DietPlan = {
  totalKcal: number;
  meals: DietMeal[];
  notes: string[];
};

// Distribuição padrão das 5 refeições (soma = 100%).
const DISTRIBUTION: { key: DietMeal["label"]; pct: number }[] = [
  { key: "Café da manhã", pct: 0.25 },
  { key: "Almoço", pct: 0.35 },
  { key: "Lanche da tarde", pct: 0.15 },
  { key: "Jantar", pct: 0.2 },
  { key: "Ceia", pct: 0.05 },
];

// Templates por sexo × faixa calórica. Strings curtas em pt-BR.
const TEMPLATES: Record<
  Sex extends infer _ ? string : never,
  Record<Tier, Record<DietMeal["label"], string[]>>
> = {
  feminino: {
    low: {
      "Café da manhã": [
        "1 ovo mexido + 1 fatia pão integral + 1 fruta pequena",
      ],
      "Almoço": [
        "Arroz 3 colheres de sopa + feijão 1 concha pequena + frango grelhado 100g + salada à vontade",
      ],
      "Lanche da tarde": ["1 iogurte natural + 1 col. sopa de granola"],
      "Jantar": ["Sopa de legumes com frango desfiado 80g"],
      "Ceia": ["1 xícara de chá de camomila"],
    },
    mid: {
      "Café da manhã": [
        "2 ovos mexidos + 2 fatias pão integral + 1 fruta + café sem açúcar",
      ],
      "Almoço": [
        "Arroz 4 colheres de sopa + feijão 1 concha + frango grelhado 120g + salada + 1 col. sobremesa de azeite",
      ],
      "Lanche da tarde": ["1 fruta + 1 col. sopa de pasta de amendoim"],
      "Jantar": ["Omelete com 2 ovos + legumes refogados"],
      "Ceia": ["1 copo de leite desnatado"],
    },
    high: {
      "Café da manhã": [
        "Tapioca média + 1 ovo + queijo branco 30g + 1 fruta",
      ],
      "Almoço": [
        "Arroz 5 colheres + feijão 1 concha + carne magra 150g + salada + abóbora cozida 80g",
      ],
      "Lanche da tarde": ["Iogurte natural + banana + 1 col. sopa de aveia"],
      "Jantar": ["Frango grelhado 120g + purê de batata 100g + salada"],
      "Ceia": ["1 copo de leite desnatado + 1 col. chá de mel"],
    },
  },
  masculino: {
    low: {
      "Café da manhã": [
        "2 ovos mexidos + 1 fatia pão integral + 1 fruta",
      ],
      "Almoço": [
        "Arroz 4 colheres + feijão 1 concha + frango grelhado 120g + salada à vontade",
      ],
      "Lanche da tarde": ["1 fruta + 1 col. sopa de pasta de amendoim"],
      "Jantar": ["Sopa de legumes com frango 100g"],
      "Ceia": ["1 xícara de chá"],
    },
    mid: {
      "Café da manhã": [
        "3 ovos mexidos + 2 fatias pão integral + 1 fruta + café sem açúcar",
      ],
      "Almoço": [
        "Arroz 5 colheres + feijão 1 concha + frango/carne 150g + salada + 1 col. sobremesa azeite",
      ],
      "Lanche da tarde": ["Iogurte natural + granola + banana"],
      "Jantar": ["Omelete 3 ovos + legumes refogados + salada"],
      "Ceia": ["1 copo de leite desnatado"],
    },
    high: {
      "Café da manhã": [
        "Tapioca grande + 2 ovos + queijo 30g + 1 fruta + café",
      ],
      "Almoço": [
        "Arroz 6 colheres + feijão 1 concha grande + carne magra 180g + salada + abóbora 100g",
      ],
      "Lanche da tarde": ["Sanduíche pão integral + peito de peru + queijo"],
      "Jantar": ["Frango grelhado 150g + batata doce 150g + salada"],
      "Ceia": ["Leite + aveia + mel"],
    },
  },
  nao_informado: {
    low: { ...TEMPLATES.feminino.low },
    mid: { ...TEMPLATES.feminino.mid },
    high: { ...TEMPLATES.feminino.high },
  },
};

function tierFor(goalKcal: number): Tier {
  if (goalKcal < 1400) return "low";
  if (goalKcal < 1700) return "mid";
  return "high";
}

function sexBucket(sex: Sex): keyof typeof TEMPLATES {
  if (sex === "masculino") return "masculino";
  return "feminino"; // cai aqui também quando "nao_informado" / null
}

/**
 * `tdee` em kcal/dia (gasto total diário estimado).
 * `sex` e `goalKcal` ajustam os templates e a meta calórica final.
 */
export function generateDietPlan(
  tdee: number,
  sex: Sex,
  goalKcal?: number,
): DietPlan {
  const target = Math.max(1200, Math.min(1800, goalKcal ?? tdee - 500));
  const tier = tierFor(target);
  const bucket = sexBucket(sex);
  const tpl = TEMPLATES[bucket][tier];

  const meals = DISTRIBUTION.map((d) => {
    const kcal = Math.round(target * d.pct);
    return {
      label: d.key,
      kcal,
      items: tpl[d.key] ?? [],
    } satisfies DietMeal;
  });

  // Nota: arredondamento pode dar 1 kcal a mais/menos — somamos para o "total".
  const totalKcal = meals.reduce((sum, m) => sum + m.kcal, 0);

  const notes: string[] = [
    "Beba pelo menos 2 L de água por dia.",
    "Prefira preparos grelhados, cozidos ou no vapor.",
    "Esta é uma sugestão genérica — um nutricionista pode personalizar para você.",
  ];

  return { totalKcal, meals, notes };
}

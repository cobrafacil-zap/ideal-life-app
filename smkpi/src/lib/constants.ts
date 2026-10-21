import type { GoalCadence, GoalPriority, GoalScope } from "./types";

export const SCOPE_LABEL: Record<GoalScope, string> = {
  pessoal: "Pessoal",
  profissional: "Profissional",
  neutro: "Neutra",
};

export const PRIORITY_LABEL: Record<GoalPriority, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  urgente: "Urgente",
};

export const PRIORITY_ORDER: Record<GoalPriority, number> = {
  urgente: 0,
  alta: 1,
  media: 2,
  baixa: 3,
};

export const PRIORITY_TONE: Record<GoalPriority, string> = {
  baixa: "text-ink-faint bg-ink/5 ring-1 ring-inset ring-line",
  media: "text-iris-dark bg-iris-soft ring-1 ring-inset ring-iris/20",
  alta: "text-amber-dark bg-amber-soft ring-1 ring-inset ring-amber/25",
  urgente: "text-rose-dark bg-rose-soft ring-1 ring-inset ring-rose/25",
};

export const CADENCE_LABEL: Record<GoalCadence, string> = {
  anual: "Anual",
  mensal: "Mensal",
  semanal: "Semanal",
  "sem-prazo": "Sem prazo",
};

export const CADENCE_ORDER: Record<GoalCadence, number> = {
  semanal: 0,
  mensal: 1,
  anual: 2,
  "sem-prazo": 3,
};

export const UNIT_OPTIONS = [
  "R$",
  "kg",
  "g",
  "cm",
  "m",
  "%",
  "horas",
  "minutos",
  "dias",
  "un.",
  "vendas",
  "leads",
  "páginas",
  "aulas",
  "km",
  "litros",
  "passos",
  "clientes",
];

/** Ícones disponíveis para metas e hábitos (lucide-react). */
export const ICON_OPTIONS = [
  "target",
  "trending-up",
  "briefcase",
  "rocket",
  "wallet",
  "heart-pulse",
  "dumbbell",
  "book-open",
  "graduation-cap",
  "users",
  "plane",
  "building-2",
  "lightbulb",
  "home",
  "car",
  "sparkles",
  "star",
  "flag",
  "trophy",
  "zap",
  "brain",
  "coffee",
  "droplets",
  "mountain",
  "shopping-bag",
  "gift",
  "globe",
  "piano",
  "camera",
];

/** Paleta sugerida para categorias. */
export const CATEGORY_PALETTE = [
  { color: "#4F46E5", name: "Índigo" },
  { color: "#0E9F6E", name: "Esmeralda" },
  { color: "#D97706", name: "Âmbar" },
  { color: "#E11D48", name: "Rosa" },
  { color: "#0891B2", name: "Ciano" },
  { color: "#7C3AED", name: "Violeta" },
  { color: "#DB2777", name: "Fúcsia" },
  { color: "#65A30D", name: "Lima" },
  { color: "#475569", name: "Grafite" },
  { color: "#EA580C", name: "Laranja" },
];

/** Categorias padrão do app (o usuário pode criar as suas). */
export const DEFAULT_CATEGORIES: Array<{
  name: string;
  slug: string;
  color: string;
  icon: string;
  scope: GoalScope;
}> = [
  { name: "Pessoal", slug: "pessoal", color: "#0E9F6E", icon: "heart-pulse", scope: "pessoal" },
  { name: "Profissional", slug: "profissional", color: "#4F46E5", icon: "briefcase", scope: "profissional" },
  { name: "Financeiro", slug: "financeiro", color: "#0891B2", icon: "wallet", scope: "neutro" },
  { name: "Saúde", slug: "saude", color: "#E11D48", icon: "dumbbell", scope: "pessoal" },
  { name: "Estudos", slug: "estudos", color: "#7C3AED", icon: "graduation-cap", scope: "pessoal" },
  { name: "Relacionamentos", slug: "relacionamentos", color: "#DB2777", icon: "users", scope: "pessoal" },
  { name: "Viagens", slug: "viagens", color: "#D97706", icon: "plane", scope: "pessoal" },
  { name: "Empresa", slug: "empresa", color: "#475569", icon: "building-2", scope: "profissional" },
  { name: "Projetos", slug: "projetos", color: "#EA580C", icon: "rocket", scope: "profissional" },
];

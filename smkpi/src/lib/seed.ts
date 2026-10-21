import { DEFAULT_CATEGORIES } from "./constants";
import type {
  AppState,
  Category,
  Dream,
  Goal,
  Habit,
  HabitLog,
  ProgressEntry,
  Step,
} from "./types";
import { toISODate } from "./utils";

const USER = "local";

function d(offsetDays: number, base: Date): string {
  const date = new Date(base);
  date.setDate(date.getDate() + offsetDays);
  return toISODate(date);
}

function yearEnd(base: Date): string {
  return `${base.getFullYear()}-12-31`;
}

function yearStart(base: Date): string {
  return `${base.getFullYear()}-01-01`;
}

function monthEnd(base: Date, offsetMonths = 0): string {
  const date = new Date(base.getFullYear(), base.getMonth() + offsetMonths + 1, 0);
  return toISODate(date);
}

/**
 * Estado de demonstração completo — carregado na primeira abertura do app
 * (modo local) e também serve de referência para o seed do Supabase.
 */
export function buildSeedState(now: Date = new Date()): AppState {
  const nowIso = toISODate(now);
  const createdAt = d(-210, now);
  const updatedAt = d(-1, now);

  /* ── Categorias ─────────────────────────────────────── */
  const categories: Category[] = DEFAULT_CATEGORIES.map((c, i) => ({
    id: `cat_${c.slug}`,
    userId: USER,
    name: c.name,
    slug: c.slug,
    color: c.color,
    icon: c.icon,
    scope: c.scope,
    isCustom: false,
    createdAt: d(-200 + i, now),
  }));

  categories.push({
    id: "cat_negocios_digitais",
    userId: USER,
    name: "Negócios Digitais",
    slug: "negocios-digitais",
    color: "#7C3AED",
    icon: "globe",
    scope: "profissional",
    isCustom: true,
    createdAt: d(-45, now),
  });

  /* ── Metas ───────────────────────────────────────────── */
  const goals: Goal[] = [
    {
      id: "g_faturar_100k",
      userId: USER,
      title: "Faturar R$ 100.000",
      description:
        "Fechar o ano com R$ 100 mil de faturamento. Foco em vendas recorrentes e parceiras B2B.",
      categoryId: "cat_profissional",
      scope: "profissional",
      priority: "urgente",
      status: "ativa",
      cadence: "anual",
      startDate: yearStart(now),
      dueDate: yearEnd(now),
      parentGoalId: null,
      metricStart: 0,
      metricCurrent: 35000,
      metricTarget: 100000,
      metricUnit: "R$",
      metricDirection: "increase",
      icon: "trending-up",
      cover: null,
      notes:
        "Contratar 2 freelancers para aumentar capacidade de entrega. Priorizar contratos de R$ 5k+.",
      createdAt,
      updatedAt,
      completedAt: null,
    },
    {
      id: "g_peso_70",
      userId: USER,
      title: "Chegar aos 70 kg",
      description:
        "Reduzir 15 kg de forma saudável, combinando treino de força, cardio e reeducação alimentar.",
      categoryId: "cat_saude",
      scope: "pessoal",
      priority: "alta",
      status: "ativa",
      cadence: "sem-prazo",
      startDate: d(-120, now),
      dueDate: monthEnd(now, 3),
      parentGoalId: null,
      metricStart: 85,
      metricCurrent: 80,
      metricTarget: 70,
      metricUnit: "kg",
      metricDirection: "decrease",
      icon: "dumbbell",
      cover: null,
      notes: "Meta de 0,5 kg por semana. Pesar sempre pela manhã, em jejum.",
      createdAt,
      updatedAt: d(-4, now),
      completedAt: null,
    },
    {
      id: "g_guardar_50k",
      userId: USER,
      title: "Guardar R$ 50.000",
      description:
        "Construir reserva para o ano que vem: aporte automático de 20% da receita mensal.",
      categoryId: "cat_financeiro",
      scope: "neutro",
      priority: "alta",
      status: "ativa",
      cadence: "anual",
      startDate: yearStart(now),
      dueDate: `${now.getFullYear() + 1}-03-31`,
      parentGoalId: null,
      metricStart: 0,
      metricCurrent: 15000,
      metricTarget: 50000,
      metricUnit: "R$",
      metricDirection: "increase",
      icon: "wallet",
      cover: null,
      notes: "Reserva em Tesouro Selic + CDB de liquidez diária.",
      createdAt,
      updatedAt: d(-6, now),
      completedAt: null,
    },
    {
      id: "g_produto",
      userId: USER,
      title: "Lançar novo produto digital",
      description:
        "Produto próprio (curso + templates) para vender de forma recorrente e escalar o faturamento.",
      categoryId: "cat_projetos",
      scope: "profissional",
      priority: "urgente",
      status: "ativa",
      cadence: "mensal",
      startDate: d(-60, now),
      dueDate: d(25, now),
      parentGoalId: "g_faturar_100k",
      metricStart: 0,
      metricCurrent: 50,
      metricTarget: 100,
      metricUnit: "%",
      metricDirection: "increase",
      icon: "rocket",
      cover: null,
      notes: "Lançamento em duas fases: pré-venda (outubro) e campanha aberta (novembro).",
      createdAt,
      updatedAt: d(-2, now),
      completedAt: null,
    },
    {
      id: "g_faturar_1m",
      userId: USER,
      title: "Faturar R$ 1.000.000 no ano",
      description:
        "A meta-mãe do ano. Tudo o que for vendido alimenta esta meta e as metas filhas mensais.",
      categoryId: "cat_empresa",
      scope: "profissional",
      priority: "alta",
      status: "ativa",
      cadence: "anual",
      startDate: yearStart(now),
      dueDate: yearEnd(now),
      parentGoalId: null,
      metricStart: 0,
      metricCurrent: 385000,
      metricTarget: 1000000,
      metricUnit: "R$",
      metricDirection: "increase",
      icon: "building-2",
      cover: null,
      notes: "Decompor em 12 meses de R$ 83 mil.",
      createdAt,
      updatedAt: d(-3, now),
      completedAt: null,
    },
    {
      id: "g_faturar_mes",
      userId: USER,
      title: "Faturar R$ 83.000 no mês",
      description: "Meta mensal alinhada ao plano anual de R$ 1 milhão.",
      categoryId: "cat_profissional",
      scope: "profissional",
      priority: "alta",
      status: "ativa",
      cadence: "mensal",
      startDate: `${now.getFullYear()}-${`${now.getMonth() + 1}`.padStart(2, "0")}-01`,
      dueDate: monthEnd(now, 0),
      parentGoalId: "g_faturar_1m",
      metricStart: 0,
      metricCurrent: 72000,
      metricTarget: 83000,
      metricUnit: "R$",
      metricDirection: "increase",
      icon: "briefcase",
      cover: null,
      notes: "Contrato de retainer com 2 clientes novos fecha a meta.",
      createdAt,
      updatedAt: d(-1, now),
      completedAt: null,
    },
    {
      id: "g_leads_semana",
      userId: USER,
      title: "Gerar 20 oportunidades comerciais",
      description:
        "20 novos leads qualificados por semana. Meta semanal que alimenta a meta mensal.",
      categoryId: "cat_negocios_digitais",
      scope: "profissional",
      priority: "media",
      status: "ativa",
      cadence: "semanal",
      startDate: d(-7, now),
      dueDate: d(4, now),
      parentGoalId: "g_faturar_mes",
      metricStart: 0,
      metricCurrent: 14,
      metricTarget: 20,
      metricUnit: "leads",
      metricDirection: "increase",
      icon: "zap",
      cover: null,
      notes: "Prospectar 30 empresas por dia no LinkedIn + 10 e-mails personalizados.",
      createdAt,
      updatedAt: d(-1, now),
      completedAt: null,
    },
    {
      id: "g_leitura",
      userId: USER,
      title: "Ler 24 livros no ano",
      description: "2 livros por mês sobre negócios, tecnologia e comportamento.",
      categoryId: "cat_estudos",
      scope: "pessoal",
      priority: "media",
      status: "ativa",
      cadence: "anual",
      startDate: yearStart(now),
      dueDate: yearEnd(now),
      parentGoalId: null,
      metricStart: 0,
      metricCurrent: 7,
      metricTarget: 24,
      metricUnit: "livros",
      metricDirection: "increase",
      icon: "book-open",
      cover: null,
      notes: "",
      createdAt,
      updatedAt: d(-8, now),
      completedAt: null,
    },
    {
      id: "g_certificacao",
      userId: USER,
      title: "Certificação AWS Solutions Architect",
      description: "Estudar, simular provas eagy o certificado.",
      categoryId: "cat_estudos",
      scope: "pessoal",
      priority: "media",
      status: "ativa",
      cadence: "sem-prazo",
      startDate: d(-90, now),
      dueDate: d(60, now),
      parentGoalId: null,
      metricStart: 0,
      metricCurrent: null,
      metricTarget: null,
      metricUnit: "%",
      metricDirection: "increase",
      icon: "graduation-cap",
      cover: null,
      notes: "Prova marcada para o próximo trimestre.",
      createdAt,
      updatedAt: d(-10, now),
      completedAt: null,
    },
    {
      id: "g_time",
      userId: USER,
      title: "Contratar 5 pessoas para o time",
      description: " time próprio de 5 pessoas (2 devs, 1 designer, 1 comercial, 1 operações).",
      categoryId: "cat_empresa",
      scope: "profissional",
      priority: "alta",
      status: "ativa",
      cadence: "anual",
      startDate: yearStart(now),
      dueDate: `${now.getFullYear() + 1}-02-28`,
      parentGoalId: "g_faturar_1m",
      metricStart: 0,
      metricCurrent: 2,
      metricTarget: 5,
      metricUnit: "pessoas",
      metricDirection: "increase",
      icon: "users",
      cover: null,
      notes: "Primeiro hires (dev sênior) já fechado.",
      createdAt,
      updatedAt: d(-12, now),
      completedAt: null,
    },
    {
      id: "g_maratona",
      userId: USER,
      title: "Correr 42 km em uma maratona",
      description: "Treinar 4 meses para a maratona da cidade.",
      categoryId: "cat_saude",
      scope: "pessoal",
      priority: "media",
      status: "ativa",
      cadence: "sem-prazo",
      startDate: d(-150, now),
      dueDate: d(95, now),
      parentGoalId: "g_peso_70",
      metricStart: 0,
      metricCurrent: 21,
      metricTarget: 42,
      metricUnit: "km",
      metricDirection: "increase",
      icon: "mountain",
      cover: null,
      notes: "Plano de treino de 12 semanas.",
      createdAt,
      updatedAt: d(-3, now),
      completedAt: null,
    },
    {
      id: "g_viagem_japao",
      userId: USER,
      title: "Viagem para o Japão",
      description: "Duas semanas de viagem: Tóquio, Quioto e Osaka.",
      categoryId: "cat_viagens",
      scope: "pessoal",
      priority: "baixa",
      status: "ativa",
      cadence: "sem-prazo",
      startDate: d(-40, now),
      dueDate: d(220, now),
      parentGoalId: null,
      metricStart: 0,
      metricCurrent: 6200,
      metricTarget: 18000,
      metricUnit: "R$",
      metricDirection: "increase",
      icon: "plane",
      cover: null,
      notes: "Guardar R$ 1.200 por mês nos próximos 8 meses.",
      createdAt,
      updatedAt: d(-7, now),
      completedAt: null,
    },
    {
      id: "g_site",
      userId: USER,
      title: "Lançar meu site pessoal",
      description: "Portfólio, blog e página de contato no ar.",
      categoryId: "cat_projetos",
      scope: "profissional",
      priority: "media",
      status: "concluida",
      cadence: "sem-prazo",
      startDate: d(-120, now),
      dueDate: d(-35, now),
      parentGoalId: null,
      metricStart: 0,
      metricCurrent: null,
      metricTarget: null,
      metricUnit: "%",
      metricDirection: "increase",
      icon: "globe",
      cover: null,
      notes: "No ar desde o mês passado.",
      createdAt: d(-120, now),
      updatedAt: d(-35, now),
      completedAt: d(-35, now),
    },
    {
      id: "g_reserva",
      userId: USER,
      title: "Reserva de emergência de 6 meses",
      description: "Seis meses de custo de vida guardados em liquidez.",
      categoryId: "cat_financeiro",
      scope: "neutro",
      priority: "alta",
      status: "concluida",
      cadence: "anual",
      startDate: d(-400, now),
      dueDate: d(-60, now),
      parentGoalId: null,
      metricStart: 0,
      metricCurrent: 48000,
      metricTarget: 48000,
      metricUnit: "R$",
      metricDirection: "increase",
      icon: "shield-check",
      cover: null,
      notes: "",
      createdAt: d(-400, now),
      updatedAt: d(-60, now),
      completedAt: d(-60, now),
    },
    {
      id: "g_promocao",
      userId: USER,
      title: "Campanha de anúncio de fim de ano",
      description: "Preparar e rodar a campanha de maior volume do ano.",
      categoryId: "cat_negocios_digitais",
      scope: "profissional",
      priority: "alta",
      status: "ativa",
      cadence: "mensal",
      startDate: d(-30, now),
      dueDate: d(-2, now),
      parentGoalId: "g_produto",
      metricStart: 0,
      metricCurrent: 70,
      metricTarget: 100,
      metricUnit: "%",
      metricDirection: "increase",
      icon: "megaphone",
      cover: null,
      notes: "Campanha atrasada — precisa ser replanejada esta semana.",
      createdAt,
      updatedAt: d(-5, now),
      completedAt: null,
    },
    {
      id: "g_ingles",
      userId: USER,
      title: "Certificação de inglês (B2)",
      description: "Preparar e fazer o exame de inglês B2.",
      categoryId: "cat_estudos",
      scope: "pessoal",
      priority: "baixa",
      status: "concluida",
      cadence: "sem-prazo",
      startDate: d(-300, now),
      dueDate: d(-90, now),
      parentGoalId: null,
      metricStart: 0,
      metricCurrent: null,
      metricTarget: null,
      metricUnit: "%",
      metricDirection: "increase",
      icon: "globe",
      cover: null,
      notes: "",
      createdAt: d(-300, now),
      updatedAt: d(-90, now),
      completedAt: d(-90, now),
    },
  ];

  /* ── Etapas ──────────────────────────────────────────── */
  const stepDefs: Array<{ goal: string; title: string; done: boolean; doneOffset?: number }> = [
    { goal: "g_produto", title: "Criar ideia", done: true, doneOffset: -55 },
    { goal: "g_produto", title: "Definir produto", done: true, doneOffset: -45 },
    { goal: "g_produto", title: "Criar identidade visual", done: true, doneOffset: -30 },
    { goal: "g_produto", title: "Criar página de vendas", done: false },
    { goal: "g_produto", title: "Criar anúncios", done: false },
    { goal: "g_produto", title: "Iniciar campanha", done: false },
    { goal: "g_certificacao", title: "Assistir curso completo", done: true, doneOffset: -80 },
    { goal: "g_certificacao", title: "Simular 5 provas", done: true, doneOffset: -40 },
    { goal: "g_certificacao", title: "Agendar a prova", done: true, doneOffset: -20 },
    { goal: "g_certificacao", title: "Revisão final", done: false },
    { goal: "g_site", title: "Escolher domínio", done: true, doneOffset: -110 },
    { goal: "g_site", title: "Montar portfólio", done: true, doneOffset: -80 },
    { goal: "g_site", title: "Publicar", done: true, doneOffset: -35 },
    { goal: "g_promocao", title: "Definir oferta", done: true, doneOffset: -25 },
    { goal: "g_promocao", title: "Produzir criativos", done: true, doneOffset: -15 },
    { goal: "g_promocao", title: "Configurar anúncios", done: true, doneOffset: -8 },
    { goal: "g_promocao", title: "Subir campanha", done: false },
    { goal: "g_maratona", title: "Rodar 10 km contínuos", done: true, doneOffset: -60 },
    { goal: "g_maratona", title: "Rodar 21 km (meia-maratona)", done: true, doneOffset: -20 },
    { goal: "g_maratona", title: "Rodar 30 km", done: false },
    { goal: "g_maratona", title: "Prova da maratona", done: false },
    { goal: "g_faturar_100k", title: "Fechar 3 contratos recorrentes", done: true, doneOffset: -20 },
    { goal: "g_faturar_100k", title: "Abrir 2 parcerias", done: true, doneOffset: -10 },
    { goal: "g_faturar_100k", title: "Lançar oferta de Black Friday", done: false },
  ];

  const steps: Step[] = stepDefs.map((s, i) => ({
    id: `st_${i}_${s.goal}`,
    userId: USER,
    goalId: s.goal,
    title: s.title,
    done: s.done,
    doneAt: s.done && s.doneOffset !== undefined ? d(s.doneOffset, now) : null,
    position: i,
    createdAt: d(-60, now),
  }));

  /* ── Histórico de progresso ──────────────────────────── */
  const progress: ProgressEntry[] = [];
  let p = 0;
  const push = (
    goalId: string,
    loggedAt: string,
    value: number,
    note: string,
  ) => {
    progress.push({
      id: `pg_${p++}`,
      userId: USER,
      goalId,
      loggedAt,
      value,
      note,
      createdAt: `${loggedAt}T12:00:00.000Z`,
    });
  };

  push("g_faturar_100k", d(-150, now), 8000, "Primeira venda do ano");
  push("g_faturar_100k", d(-120, now), 14000, "Contrato de R$ 6 mil");
  push("g_faturar_100k", d(-95, now), 18000, "Retainer enterprise");
  push("g_faturar_100k", d(-70, now), 22000, "Campanha de parcerias");
  push("g_faturar_100k", d(-45, now), 27000, "Projeto de implantação");
  push("g_faturar_100k", d(-25, now), 31000, "3 novos contratos");
  push("g_faturar_100k", d(-10, now), 35000, "Faturamento do mês fechado");

  push("g_peso_70", d(-115, now), 85, "Peso inicial");
  push("g_peso_70", d(-90, now), 83.5, "Bom ritmo de jejum intermitente");
  push("g_peso_70", d(-60, now), 82, "Treino 4x por semana");
  push("g_peso_70", d(-30, now), 81, "Semana de viagem no exterior");
  push("g_peso_70", d(-4, now), 80, "Peso de hoje");

  push("g_guardar_50k", d(-200, now), 2000, "Começo da reserva");
  push("g_guardar_50k", d(-150, now), 5000, "Aporte mensal");
  push("g_guardar_50k", d(-100, now), 9000, "Bônus de vendas");
  push("g_guardar_50k", d(-60, now), 12000, "Aporte automático");
  push("g_guardar_50k", d(-6, now), 15000, "Aporte do mês");

  push("g_faturar_1m", d(-120, now), 90000, "Trimestre 1");
  push("g_faturar_1m", d(-60, now), 220000, "Trimestre 2");
  push("g_faturar_1m", d(-30, now), 330000, "Trimestre 3");
  push("g_faturar_1m", d(-3, now), 385000, "Acumulado do ano");

  push("g_faturar_mes", d(-20, now), 21000, "Primeira semana");
  push("g_faturar_mes", d(-10, now), 38000, "Dois contratos novos");
  push("g_faturar_mes", d(-1, now), 72000, "Contrato de retainer assinado");

  push("g_leads_semana", d(-6, now), 9, "Semana passada");
  push("g_leads_semana", d(-1, now), 14, "Até hoje");

  push("g_leitura", d(-120, now), 2, "Jan e Fev");
  push("g_leitura", d(-60, now), 5, "Livros do trimestre");
  push("g_leitura", d(-8, now), 7, "Terminei o sétimo");

  push("g_time", d(-120, now), 1, "Dev sênior");
  push("g_time", d(-12, now), 2, "Designer");

  push("g_maratona", d(-100, now), 10, "10 km");
  push("g_maratona", d(-60, now), 16, "16 km no parque");
  push("g_maratona", d(-20, now), 21, "Meia-maratona concluída");
  push("g_maratona", d(-3, now), 24, "Longão de domingo");

  push("g_viagem_japao", d(-30, now), 2000, "Primeiro aporte");
  push("g_viagem_japao", d(-7, now), 6200, "Reserva da viagem");

  push("g_reserva", d(-400, now), 12000, "Início da reserva");
  push("g_reserva", d(-300, now), 25000, "Aportes + corte de custo");
  push("g_reserva", d(-180, now), 38000, "Metade da meta");
  push("g_reserva", d(-60, now), 48000, "Reserva completa!");

  push("g_produto", d(-20, now), 50, "Metade do funil de lançamento");
  push("g_promocao", d(-5, now), 70, "Criativos prontos");

  /* ── Hábitos ─────────────────────────────────────────── */
  const habits: Habit[] = [
    {
      id: "hb_agua",
      userId: USER,
      goalId: "g_peso_70",
      title: "Beber 2L de água",
      icon: "droplets",
      color: "#0891B2",
      targetPerWeek: 7,
      createdAt: d(-120, now),
    },
    {
      id: "hb_treino",
      userId: USER,
      goalId: "g_peso_70",
      title: "Treinar musculação",
      icon: "dumbbell",
      color: "#E11D48",
      targetPerWeek: 4,
      createdAt: d(-120, now),
    },
    {
      id: "hb_cardio",
      userId: USER,
      goalId: "g_maratona",
      title: "Fazer cardio",
      icon: "heart-pulse",
      color: "#4F46E5",
      targetPerWeek: 3,
      createdAt: d(-100, now),
    },
    {
      id: "hb_dieta",
      userId: USER,
      goalId: "g_peso_70",
      title: "Comer dentro da dieta",
      icon: "sparkles",
      color: "#0E9F6E",
      targetPerWeek: 7,
      createdAt: d(-120, now),
    },
    {
      id: "hb_leitura",
      userId: USER,
      goalId: "g_leitura",
      title: "Ler 30 minutos",
      icon: "book-open",
      color: "#7C3AED",
      targetPerWeek: 6,
      createdAt: d(-120, now),
    },
    {
      id: "hb_campanha",
      userId: USER,
      goalId: "g_produto",
      title: "Trabalhar na campanha",
      icon: "megaphone",
      color: "#D97706",
      targetPerWeek: 5,
      createdAt: d(-60, now),
    },
  ];

  const habitLogs: HabitLog[] = [];
  let h = 0;
  const pushLog = (habitId: string, logDate: string) => {
    habitLogs.push({
      id: `hl_${h++}`,
      userId: USER,
      habitId,
      logDate,
      createdAt: `${logDate}T08:00:00.000Z`,
    });
  };

  // 45 dias de registros com adesão variável (determinístico).
  const patterns: Record<string, number[]> = {
    hb_agua: [0, 1, 2, 3, 4, 5, 6],
    hb_treino: [0, 2, 4, 6],
    hb_cardio: [1, 3, 6],
    hb_dieta: [0, 1, 2, 4, 5, 6],
    hb_leitura: [0, 1, 3, 4, 6],
    hb_campanha: [0, 1, 2, 3, 4],
  };

  for (let i = 45; i >= 0; i--) {
    const date = d(-i, now);
    Object.entries(patterns).forEach(([habitId, days]) => {
      const inPattern = days.includes(i % 7);
      const skip = (i * 7 + habitId.length) % 11 === 0;
      if (inPattern && !skip) pushLog(habitId, date);
    });
  }

  /* ── Sonhos ──────────────────────────────────────────── */
  const dreams: Dream[] = [
    {
      id: "dr_casa",
      userId: USER,
      title: "Comprar uma casa",
      description:
        "Um apartamento com 3 quartos, varanda e uma vista boa. Quero morar num bairro tranquilo.",
      imageUrl: null,
      estimatedValue: 750000,
      desiredDate: `${now.getFullYear() + 3}-12-31`,
      status: "sonho",
      goalId: null,
      createdAt: d(-120, now),
    },
    {
      id: "dr_europa",
      userId: USER,
      title: "Viajar para a Europa",
      description:
        "Três semanas por mês: Portugal, Espanha, França e Itália. Com arte e história no roteiro.",
      imageUrl: null,
      estimatedValue: 40000,
      desiredDate: `${now.getFullYear() + 1}-09-30`,
      status: "sonho",
      goalId: null,
      createdAt: d(-100, now),
    },
    {
      id: "dr_empresa_10m",
      userId: USER,
      title: "Construir uma empresa de R$ 10 milhões",
      description:
        "Uma operação de 30 pessoas, presente em 3 cidades e faturamento recorrente.",
      imageUrl: null,
      estimatedValue: 10000000,
      desiredDate: `${now.getFullYear() + 5}-12-31`,
      status: "sonho",
      goalId: null,
      createdAt: d(-90, now),
    },
    {
      id: "dr_carro",
      userId: USER,
      title: "Comprar um carro novo",
      description: "Um SUV hybrid, zero km, para a família.",
      imageUrl: null,
      estimatedValue: 180000,
      desiredDate: `${now.getFullYear() + 2}-06-30`,
      status: "sonho",
      goalId: null,
      createdAt: d(-60, now),
    },
    {
      id: "dr_independencia",
      userId: USER,
      title: "Independência financeira",
      description:
        "Três anos de custo de vida investidos, sem depender de salário.",
      imageUrl: null,
      estimatedValue: 600000,
      desiredDate: `${now.getFullYear() + 4}-12-31`,
      status: "sonho",
      goalId: null,
      createdAt: d(-200, now),
    },
  ];

  return {
    categories,
    goals,
    steps,
    progress,
    habits,
    habitLogs,
    dreams,
    achievements: [],
    settings: {
      userId: USER,
      displayName: "Você",
      currency: "BRL",
      theme: "system",
      notificationsEnabled: true,
      notifyStaleDays: 7,
      notifyDueDays: 10,
      notifyNearCompletion: 85,
      updatedAt: nowIso,
    },
  };
}

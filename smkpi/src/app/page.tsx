"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Flame,
  Gauge,
  ListChecks,
  Sparkles,
  Target,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProgressBar, ProgressRing } from "@/components/ui/Progress";
import { Icon } from "@/components/ui/Icon";
import { EmptyState } from "@/components/ui/EmptyState";
import { EvolutionChart } from "@/components/charts/Charts";
import { GoalFormModal } from "@/components/goals/GoalFormModal";
import { analyzeProgress } from "@/app/actions/ai";
import { ProgressUpdateModal } from "@/components/goals/ProgressUpdateModal";
import { useStore } from "@/lib/data/store";
import {
  buildGoalViews,
  categoryBreakdown,
  evolutionSeries,
  summarize,
  weeklyPriorities,
  type GoalView,
} from "@/lib/selectors";
import { DEADLINE_TONE_CLASS, paceLabel } from "@/lib/progress";
import { cn } from "@/lib/utils";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "neutral",
  href,
}: {
  label: string;
  value: number | string;
  hint?: string;
  icon: React.ReactNode;
  tone?: "neutral" | "accent" | "success" | "warning" | "danger";
  href?: string;
}) {
  const tones = {
    neutral: "bg-ink/5 text-ink-soft",
    accent: "bg-iris-soft text-iris-dark",
    success: "bg-jade-soft text-jade-dark",
    warning: "bg-amber-soft text-amber-dark",
    danger: "bg-rose-soft text-rose-dark",
  };
  const content = (
    <div className="flex items-start gap-3">
      <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", tones[tone])}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[10.5px] font-semibold uppercase leading-tight tracking-[0.06em] text-ink-faint sm:text-[11px] sm:tracking-[0.08em]">{label}</p>
        <p className="mt-0.5 font-display text-2xl font-bold tabular leading-none text-ink">{value}</p>
        {hint ? <p className="mt-1 truncate text-[11px] text-ink-faint">{hint}</p> : null}
      </div>
    </div>
  );
  if (href) {
    return (
      <Link href={href} className="card card-hover block p-4">
        {content}
      </Link>
    );
  }
  return <div className="card p-4">{content}</div>;
}

function ScopeSummary({
  title,
  subtitle,
  data,
  color,
  icon,
}: {
  title: string;
  subtitle: string;
  data: { total: number; concluidas: number; progress: number };
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="h-full">
      <div className="flex items-center gap-3">
        <span
          className="grid h-10 w-10 place-items-center rounded-xl"
          style={{ background: `${color}1a`, color }}
        >
          {icon}
        </span>
        <div>
          <h3 className="font-display text-[15px] font-semibold text-ink">{title}</h3>
          <p className="text-[12px] text-ink-faint">{subtitle}</p>
        </div>
      </div>
      <div className="mt-4 flex items-baseline justify-between">
        <span className="font-display text-3xl font-bold tabular text-ink">
          {Math.round(data.progress)}%
        </span>
        <span className="text-[12px] font-medium text-ink-faint">
          {data.concluidas} de {data.total} concluídas
        </span>
      </div>
      <ProgressBar value={data.progress} color={color} className="mt-2" />
    </Card>
  );
}

export default function DashboardPage() {
  const { state } = useStore();
  const [formOpen, setFormOpen] = useState(false);
  const [progressTarget, setProgressTarget] = useState<GoalView | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInsight, setAiInsight] = useState<{
    headline: string;
    bullets: string[];
    focus: string;
  } | null>(null);
  const [aiError, setAiError] = useState("");

  const views = useMemo(() => buildGoalViews(state), [state]);
  const summary = useMemo(() => summarize(state, views), [state, views]);
  const series = useMemo(() => evolutionSeries(state, views, 12), [state, views]);
  const priorities = useMemo(() => weeklyPriorities(views), [views]);
  const categories = useMemo(() => categoryBreakdown(state, views), [state, views]);

  const urgent = views.filter(
    (v) => v.goal.priority === "urgente" && v.goal.status === "ativa",
  );
  const late = views.filter((v) => v.deadline.tone === "late");

  const name = state.settings.displayName?.trim();

  const runAi = async () => {
    setAiLoading(true);
    setAiError("");
    const result = await analyzeProgress({
      overall: summary.overallProgress,
      ativas: summary.ativas,
      concluidas: summary.concluidas,
      atrasadas: summary.atrasadas,
      proximas: summary.proximas,
      goals: views
        .filter((v) => v.goal.status === "ativa")
        .slice(0, 12)
        .map((v) => ({
          title: v.goal.title,
          progress: v.breakdown.total,
          deadline: v.deadline.label,
          priority: v.goal.priority,
        })),
    });
    setAiLoading(false);
    if (!result.available || !result.data?.headline) {
      setAiError(result.message);
      return;
    }
    setAiInsight(result.data);
  };

  return (
    <div className="space-y-5">
      {/* Hero */}
      <section className="surface-grid relative overflow-hidden rounded-card border border-line bg-surface p-5 shadow-card sm:p-7">
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-iris">
              {greeting()}
              {name ? `, ${name}` : ""}
            </p>
            <h2 className="mt-1.5 font-display text-2xl font-bold leading-tight tracking-tight text-ink sm:text-[28px]">
              O que você quer conquistar?
            </h2>
            <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed text-ink-soft">
              Você tem <strong className="text-ink">{summary.ativas} metas ativas</strong> com{" "}
              <strong className="text-ink">{Math.round(summary.overallProgress)}% de progresso médio</strong>
              {summary.proximas > 0 ? (
                <>
                  {" "}· <strong className="text-amber-dark">{summary.proximas} próximas do prazo</strong>
                </>
              ) : null}
              {summary.atrasadas > 0 ? (
                <>
                  {" "}· <strong className="text-rose-dark">{summary.atrasadas} atrasadas</strong>
                </>
              ) : null}
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button leadingIcon={<Target className="h-4 w-4" />} onClick={() => setFormOpen(true)}>
                Nova meta
              </Button>
              {views.find((v) => v.goal.status === "ativa") ? (
                <Button
                  variant="outline"
                  leadingIcon={<TrendingUp className="h-4 w-4" />}
                  onClick={() => setProgressTarget(views.find((v) => v.goal.status === "ativa")!)}
                >
                  Atualizar progresso
                </Button>
              ) : null}
              <Link href="/evolucao">
                <Button variant="ghost" trailingIcon={<ArrowRight className="h-4 w-4" />}>
                  Ver minha evolução
                </Button>
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-5 rounded-2xl border border-line bg-base/60 p-4 sm:p-5">
            <ProgressRing value={summary.overallProgress} size={112} stroke={11}>
              <div className="text-center">
                <p className="font-display text-2xl font-bold tabular leading-none text-ink">
                  {Math.round(summary.overallProgress)}%
                </p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-ink-faint">
                  geral
                </p>
              </div>
            </ProgressRing>
            <div className="space-y-2.5">
              <div>
                <p className="text-[11px] font-medium text-ink-faint">Metas concluídas</p>
                <p className="font-display text-lg font-bold tabular text-ink">{summary.concluidas}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-ink-faint">Perto de concluir</p>
                <p className="font-display text-lg font-bold tabular text-jade">
                  {summary.pertoDeConcluir}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-ink-faint">Sem prazo</p>
                <p className="font-display text-lg font-bold tabular text-ink">{summary.semPrazo}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* KPIs */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Metas ativas"
          value={summary.ativas}
          hint={`${summary.total} cadastradas no total`}
          icon={<Target className="h-5 w-5" />}
          tone="accent"
          href="/metas"
        />
        <StatCard
          label="Concluídas"
          value={summary.concluidas}
          hint={`${summary.concluidasNoAno} neste ano`}
          icon={<CheckCircle2 className="h-5 w-5" />}
          tone="success"
          href="/evolucao"
        />
        <StatCard
          label="Atrasadas"
          value={summary.atrasadas}
          hint={summary.atrasadas ? "Precisam de atenção" : "Tudo em dia"}
          icon={<TriangleAlert className="h-5 w-5" />}
          tone="danger"
          href="/metas?status=ativa"
        />
        <StatCard
          label="Próximas do prazo"
          value={summary.proximas}
          hint="15 dias ou menos"
          icon={<CalendarClock className="h-5 w-5" />}
          tone="warning"
          href="/metas"
        />
      </section>

      {/* Evolução + prioridades */}
      <section className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Gráfico de evolução"
            description="Progresso médio das suas metas nas últimas 12 semanas"
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <EvolutionChart data={series} />
        </Card>

        <Card>
          <CardHeader
            title="Metas prioritárias da semana"
            description="O que exige sua atenção agora"
            icon={<ListChecks className="h-4 w-4" />}
            action={
              <Link href="/metas" className="text-[12px] font-semibold text-iris hover:underline">
                Ver todas
              </Link>
            }
          />
          {priorities.length === 0 ? (
            <EmptyState
              icon={<Sparkles className="h-5 w-5" />}
              title="Nenhuma prioridade na semana"
              description="Crie metas com prazo para vê-las aqui."
            />
          ) : (
            <ul className="space-y-3">
              {priorities.map((v) => (
                <li key={v.goal.id}>
                  <Link
                    href={`/metas/${v.goal.id}`}
                    className="group flex items-start gap-3 rounded-xl p-2 transition-colors hover:bg-ink/[0.03]"
                  >
                    <span
                      className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg"
                      style={{
                        background: `${v.category?.color ?? "#4F46E5"}1a`,
                        color: v.category?.color ?? "#4F46E5",
                      }}
                    >
                      <Icon name={v.goal.icon} className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-[13.5px] font-semibold text-ink group-hover:text-iris">
                          {v.goal.title}
                        </span>
                        {v.goal.priority === "urgente" ? (
                          <Flame className="h-3.5 w-3.5 shrink-0 text-rose" />
                        ) : null}
                      </span>
                      <span className="mt-1 flex items-center gap-2">
                        <span
                          className={cn(
                            "rounded-pill px-1.5 py-0.5 text-[10px] font-semibold",
                            DEADLINE_TONE_CLASS[v.deadline.tone],
                          )}
                        >
                          {v.deadline.label}
                        </span>
                        <span className="text-[11px] text-ink-faint">
                          {paceLabel(v.goal, v.breakdown.total)}
                        </span>
                      </span>
                      <ProgressBar value={v.breakdown.total} className="mt-1.5" height="h-1.5" />
                    </span>
                    <span className="shrink-0 text-[12px] font-bold tabular text-ink-soft">
                      {Math.round(v.breakdown.total)}%
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      {/* Escopos + categorias */}
      <section className="grid gap-5 lg:grid-cols-3">
        <ScopeSummary
          title="Metas pessoais"
          subtitle="Saúde, estudos, família e vida"
          data={summary.pessoal}
          color="#0E9F6E"
          icon={<Sparkles className="h-5 w-5" />}
        />
        <ScopeSummary
          title="Metas profissionais"
          subtitle="Negócios, carreira e projetos"
          data={summary.profissional}
          color="#4F46E5"
          icon={<Gauge className="h-5 w-5" />}
        />
        <Card>
          <CardHeader title="Progresso por categoria" description="Onde você está mais perto" />
          {categories.length === 0 ? (
            <p className="text-[13px] text-ink-faint">Sem categorias em uso.</p>
          ) : (
            <ul className="space-y-3">
              {categories.slice(0, 5).map((c) => (
                <li key={c.name}>
                  <div className="mb-1 flex items-center justify-between text-[12px]">
                    <span className="font-medium text-ink">{c.name}</span>
                    <span className="font-bold tabular text-ink-soft">{Math.round(c.progress)}%</span>
                  </div>
                  <ProgressBar value={c.progress} color={c.color} height="h-1.5" />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      {/* Urgentes / atrasadas */}
      {(urgent.length > 0 || late.length > 0) && (
        <section>
          <Card>
            <CardHeader
              title="Precisa de atenção"
              description="Metas urgentes ou com prazo vencido"
              icon={<TriangleAlert className="h-4 w-4" />}
            />
            <div className="flex flex-wrap gap-2">
              {[...late, ...urgent.filter((u) => !late.some((l) => l.goal.id === u.goal.id))].map(
                (v) => (
                  <Link
                    key={v.goal.id}
                    href={`/metas/${v.goal.id}`}
                    className="flex items-center gap-2.5 rounded-xl border border-line bg-base/60 px-3.5 py-2.5 transition-all hover:border-rose/40 hover:bg-rose-soft/40"
                  >
                    <span
                      className="grid h-8 w-8 place-items-center rounded-lg"
                      style={{
                        background: `${v.category?.color ?? "#4F46E5"}1a`,
                        color: v.category?.color ?? "#4F46E5",
                      }}
                    >
                      <Icon name={v.goal.icon} className="h-4 w-4" />
                    </span>
                    <span>
                      <span className="block text-[13px] font-semibold text-ink">{v.goal.title}</span>
                      <span
                        className={cn(
                          "block text-[11px] font-medium",
                          v.deadline.tone === "late" ? "text-rose-dark" : "text-amber-dark",
                        )}
                      >
                        {v.deadline.label} · {Math.round(v.breakdown.total)}%
                      </span>
                    </span>
                  </Link>
                ),
              )}
            </div>
          </Card>
        </section>
      )}

      {/* Insight com IA */}
      <section>
        <Card className="surface-grid">
          <CardHeader
            title="Insight da semana"
            description="Leitura do Gemini sobre o seu momento atual"
            icon={<Sparkles className="h-4 w-4" />}
            action={
              <Button
                size="sm"
                variant="secondary"
                loading={aiLoading}
                leadingIcon={<Sparkles className="h-3.5 w-3.5" />}
                onClick={runAi}
              >
                Analisar com IA
              </Button>
            }
          />
          {aiInsight ? (
            <div>
              <p className="font-display text-[15px] font-semibold text-ink">{aiInsight.headline}</p>
              <ul className="mt-3 space-y-1.5">
                {aiInsight.bullets.map((b, i) => (
                  <li key={i} className="flex gap-2 text-[13px] leading-relaxed text-ink-soft">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-iris" />
                    {b}
                  </li>
                ))}
              </ul>
              {aiInsight.focus ? (
                <p className="mt-3 rounded-xl bg-iris-soft px-3.5 py-2.5 text-[13px] font-medium text-iris-dark">
                  Foque agora: {aiInsight.focus}
                </p>
              ) : null}
            </div>
          ) : aiError ? (
            <p className="text-[13px] text-ink-faint">{aiError}</p>
          ) : (
            <p className="text-[13px] text-ink-faint">
              Clique em “Analisar com IA” para receber uma leitura objective do seu
              progresso, dos prazos apertados e do que merece atenção nesta semana.
            </p>
          )}
        </Card>
      </section>

      <GoalFormModal open={formOpen} onClose={() => setFormOpen(false)} />
      <ProgressUpdateModal
        view={progressTarget}
        open={Boolean(progressTarget)}
        onClose={() => setProgressTarget(null)}
      />
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Award,
  CalendarCheck,
  CheckCircle2,
  Flame,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProgressBar, ProgressRing } from "@/components/ui/Progress";
import { Icon } from "@/components/ui/Icon";
import { EmptyState } from "@/components/ui/EmptyState";
import { CategoryChart, CompletedChart, ScopeChart, TrendChart } from "@/components/charts/Charts";
import { useStore } from "@/lib/data/store";
import {
  buildGoalViews,
  categoryBreakdown,
  completedByMonth,
  evolutionStats,
  evolutionSeries,
} from "@/lib/selectors";
import { currentStreak } from "@/lib/achievements";
import { formatDate, formatMetric } from "@/lib/utils";

export default function EvolucaoPage() {
  const { state } = useStore();
  const today = new Date();
  const year = today.getFullYear();

  const views = useMemo(() => buildGoalViews(state), [state]);
  const stats = useMemo(() => evolutionStats(state, views, today), [state, views, today]);
  const months = useMemo(() => completedByMonth(state, today), [state, today]);
  const categories = useMemo(() => categoryBreakdown(state, views), [state, views]);
  const series = useMemo(() => evolutionSeries(state, views, 12), [state, views]);
  const streak = useMemo(() => currentStreak(state, today), [state, today]);

  const scopeSeries = useMemo(
    () =>
      series.map((s) => ({
        label: s.label,
        pessoal: s.pessoal,
        profissional: s.profissional,
      })),
    [series],
  );

  const concluded = views
    .filter((v) => v.goal.status === "concluida")
    .sort((a, b) => (b.goal.completedAt ?? "").localeCompare(a.goal.completedAt ?? ""));

  const firstName = state.settings.displayName?.trim();

  return (
    <div className="space-y-5">
      {/* Hero motivacional */}
      <section className="surface-grid relative overflow-hidden rounded-card border border-line bg-surface p-6 shadow-card sm:p-8">
        <div className="relative flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-pill bg-amber-soft px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-dark">
              <Sparkles className="h-3.5 w-3.5" />
              Sua evolução
            </span>
            <h2 className="mt-3 font-display text-2xl font-bold leading-tight tracking-tight text-ink sm:text-3xl">
              Você concluiu{" "}
              <span className="text-iris">{stats.concludedThisYear} metas</span> este ano.
            </h2>
            <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed text-ink-soft">
              Você está com{" "}
              <strong className="text-ink">{Math.round(stats.percentYear)}% das suas metas de {year} concluídas</strong>
              {stats.near.length > 0 ? (
                <>
                  {" "}·{" "}
                  <strong className="text-jade-dark">
                    {stats.near.length} {stats.near.length === 1 ? "meta está próxima" : "metas estão próximas"} de serem alcançadas
                  </strong>
                </>
              ) : null}
              .
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/conquistas">
                <Button leadingIcon={<Award className="h-4 w-4" />}>Ver conquistas</Button>
              </Link>
              <Link href="/ano">
                <Button variant="outline" leadingIcon={<CalendarCheck className="h-4 w-4" />}>
                  Ver meu ano
                </Button>
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-5 rounded-2xl border border-line bg-base/60 p-5">
            <ProgressRing value={stats.percentYear} size={116} stroke={11}>
              <div className="text-center">
                <p className="font-display text-2xl font-bold tabular leading-none text-ink">
                  {Math.round(stats.percentYear)}%
                </p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-ink-faint">
                  de {year}
                </p>
              </div>
            </ProgressRing>
            <div className="space-y-2.5">
              <div>
                <p className="text-[11px] font-medium text-ink-faint">Progresso geral</p>
                <p className="font-display text-lg font-bold tabular text-ink">
                  {Math.round(stats.totalProgress)}%
                </p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-ink-faint">Sequência de hábitos</p>
                <p className="font-display text-lg font-bold tabular text-amber-dark">
                  {streak} {streak === 1 ? "dia" : "dias"}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-ink-faint">Total de registros</p>
                <p className="font-display text-lg font-bold tabular text-ink">
                  {state.progress.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Números */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            label: "Metas concluídas",
            value: stats.concludedThisYear,
            icon: <CheckCircle2 className="h-5 w-5" />,
            tone: "bg-jade-soft text-jade-dark",
          },
          {
            label: "Perto de concluir",
            value: stats.near.length,
            icon: <Target className="h-5 w-5" />,
            tone: "bg-iris-soft text-iris-dark",
          },
          {
            label: "Sequência atual",
            value: `${streak}d`,
            icon: <Flame className="h-5 w-5" />,
            tone: "bg-amber-soft text-amber-dark",
          },
          {
            label: "Atualizações",
            value: state.progress.length,
            icon: <TrendingUp className="h-5 w-5" />,
            tone: "bg-ink/5 text-ink-soft",
          },
        ].map((item) => (
          <div key={item.label} className="card p-4">
            <div className="flex items-start gap-3">
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${item.tone}`}>
                {item.icon}
              </span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
                  {item.label}
                </p>
                <p className="mt-0.5 font-display text-2xl font-bold tabular leading-none text-ink">
                  {item.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Gráficos */}
      <section className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Metas concluídas por mês"
            description="Ritmo de entrega ao longo do tempo"
            icon={<CheckCircle2 className="h-4 w-4" />}
          />
          <CompletedChart data={months} />
        </Card>
        <Card>
          <CardHeader
            title="Percentual por categoria"
            description="Onde você está mais perto de concluir"
            icon={<Target className="h-4 w-4" />}
          />
          {categories.length ? (
            <CategoryChart data={categories} />
          ) : (
            <p className="text-[13px] text-ink-faint">Sem categorias em uso.</p>
          )}
        </Card>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Evolução pessoal × profissional"
            description="Comparativo das duas frentes"
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <ScopeChart data={scopeSeries} />
        </Card>
        <Card>
          <CardHeader
            title="Progresso geral do portfólio"
            description="Média de todas as metas ao longo do tempo"
            icon={<Award className="h-4 w-4" />}
          />
          <TrendChart data={series.map((s) => ({ label: s.label, value: s.geral }))} />
        </Card>
      </section>

      {/* Timeline */}
      <Card>
        <CardHeader
          title="O que você já conquistou"
          description={`${concluded.length} metas concluídas`}
          icon={<Sparkles className="h-4 w-4" />}
        />
        {concluded.length === 0 ? (
          <EmptyState
            icon={<Target className="h-5 w-5" />}
            title="Nenhuma meta concluída ainda"
            description="Conclua sua primeira meta para começar a construir sua história."
            className="border-0"
          />
        ) : (
          <ol className="relative space-y-4 border-l border-line pl-5">
            {concluded.map((v) => (
              <li key={v.goal.id} className="relative">
                <span className="absolute -left-[26px] top-1 grid h-4 w-4 place-items-center rounded-full border-2 border-surface bg-jade" />
                <Link href={`/metas/${v.goal.id}`} className="group block">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-semibold text-ink group-hover:text-iris">
                        {v.goal.title}
                      </p>
                      <p className="mt-0.5 text-[12px] text-ink-faint">
                        Concluída em {formatDate(v.goal.completedAt)}
                        {v.category ? ` · ${v.category.name}` : ""}
                      </p>
                    </div>
                    <Badge tone="success" className="shrink-0">
                      100%
                    </Badge>
                  </div>
                  {v.goal.metricTarget !== null ? (
                    <p className="mt-1 text-[12px] text-ink-faint">
                      {formatMetric(v.goal.metricTarget, v.goal.metricUnit, state.settings.currency)}
                    </p>
                  ) : null}
                </Link>
              </li>
            ))}
          </ol>
        )}
      </Card>

      {firstName ? null : (
        <Card className="flex flex-wrap items-center justify-between gap-3 border-dashed">
          <div>
            <p className="font-display text-[15px] font-semibold text-ink">
              Deixe o app com a sua cara
            </p>
            <p className="text-[13px] text-ink-faint">
              Adicione seu nome nas configurações para personalizar os resumos.
            </p>
          </div>
          <Link href="/configuracoes">
            <Button variant="outline">Abrir configurações</Button>
          </Link>
        </Card>
      )}
    </div>
  );
}

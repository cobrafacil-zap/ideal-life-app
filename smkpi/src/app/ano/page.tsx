"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarRange, CheckCircle2, ChevronLeft, ChevronRight, Target } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressBar, ProgressRing } from "@/components/ui/Progress";
import { Icon } from "@/components/ui/Icon";
import { EmptyState } from "@/components/ui/EmptyState";
import { useStore } from "@/lib/data/store";
import { buildGoalViews } from "@/lib/selectors";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function AnoPage() {
  const { state } = useStore();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());

  const views = useMemo(() => buildGoalViews(state), [state]);

  const yearViews = views.filter((v) => {
    const g = v.goal;
    return (
      g.startDate?.slice(0, 4) === String(year) ||
      g.dueDate?.slice(0, 4) === String(year) ||
      g.completedAt?.slice(0, 4) === String(year)
    );
  });

  const concluded = yearViews.filter((v) => v.goal.status === "concluida");
  const overall = yearViews.length
    ? yearViews.reduce((acc, v) => acc + v.breakdown.total, 0) / yearViews.length
    : 0;

  const groups = [
    {
      key: "pessoal",
      title: "Metas pessoais",
      color: "#0E9F6E",
      items: yearViews.filter((v) => v.goal.scope === "pessoal"),
    },
    {
      key: "profissional",
      title: "Metas profissionais",
      color: "#4F46E5",
      items: yearViews.filter((v) => v.goal.scope === "profissional"),
    },
    {
      key: "neutro",
      title: "Metas financeiras e outras",
      color: "#0891B2",
      items: yearViews.filter((v) => v.goal.scope === "neutro"),
    },
  ];

  const months = useMemo(() => {
    const names = [
      "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
      "Jul", "Ago", "Set", "Out", "Nov", "Dez",
    ];
    return names.map((name, index) => {
      const key = `${year}-${`${index + 1}`.padStart(2, "0")}`;
      const active = yearViews.filter((v) => {
        const d = v.goal.dueDate ?? v.goal.startDate;
        return d?.slice(0, 7) === key;
      }).length;
      const done = yearViews.filter((v) => {
        const d = v.goal.completedAt;
        return d?.slice(0, 7) === key;
      }).length;
      return { name, key, active, done, current: index === today.getMonth() && year === today.getFullYear() };
    });
  }, [yearViews, year]);

  return (
    <div className="space-y-5">
      {/* Hero do ano */}
      <section className="surface-grid relative overflow-hidden rounded-card border border-line bg-surface p-6 shadow-card sm:p-8">
        <div className="relative flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-pill bg-iris-soft px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-iris-dark">
              <CalendarRange className="h-3.5 w-3.5" />
              Meu ano
            </span>
            <h2 className="mt-3 font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">
              {year}
            </h2>
            <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed text-ink-soft">
              {concluded.length} de {yearViews.length} metas do ano concluídas. Progresso geral de{" "}
              <strong className="text-ink">{Math.round(overall)}%</strong>.
            </p>
            <div className="mt-5 flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                leadingIcon={<ChevronLeft className="h-4 w-4" />}
                onClick={() => setYear((y) => y - 1)}
              >
                {year - 1}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setYear(today.getFullYear())}
              >
                Ano atual
              </Button>
              <Button
                variant="outline"
                size="sm"
                trailingIcon={<ChevronRight className="h-4 w-4" />}
                onClick={() => setYear((y) => Math.min(today.getFullYear() + 1, y + 1))}
                disabled={year >= today.getFullYear()}
              >
                {year + 1}
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-5 rounded-2xl border border-line bg-base/60 p-5">
            <ProgressRing value={overall} size={124} stroke={12}>
              <div className="text-center">
                <p className="font-display text-2xl font-bold tabular leading-none text-ink">
                  {Math.round(overall)}%
                </p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-ink-faint">
                  geral
                </p>
              </div>
            </ProgressRing>
            <div className="space-y-2.5">
              <div>
                <p className="text-[11px] font-medium text-ink-faint">Progresso geral</p>
                <p className="font-display text-lg font-bold tabular text-ink">{Math.round(overall)}%</p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-ink-faint">Metas do ano</p>
                <p className="font-display text-lg font-bold tabular text-ink">{yearViews.length}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-ink-faint">Concluídas</p>
                <p className="font-display text-lg font-bold tabular text-jade">{concluded.length}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Distribuição mensal */}
      <Card>
        <CardHeader
          title="Distribuição no ano"
          description="Metas com prazo (barra) e metas concluídas (destaque) por mês"
        />
        <div className="grid grid-cols-6 gap-2 sm:grid-cols-12">
          {months.map((m) => {
            const max = Math.max(1, ...months.map((x) => x.active));
            return (
              <div key={m.key} className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    "relative w-full overflow-hidden rounded-lg bg-ink/[0.06]",
                    m.current && "ring-2 ring-iris/40",
                  )}
                  style={{ height: 76 }}
                  title={`${m.active} metas com prazo · ${m.done} concluídas`}
                >
                  <div
                    className="absolute inset-x-0 bottom-0 bg-iris/70 transition-all"
                    style={{ height: `${(m.active / max) * 100}%` }}
                  />
                  <div
                    className="absolute inset-x-0 bottom-0 bg-jade transition-all"
                    style={{ height: `${(m.done / max) * 100}%` }}
                  />
                  {m.done > 0 ? (
                    <span className="absolute inset-x-0 top-1 text-center text-[10px] font-bold text-ink">
                      {m.done}
                    </span>
                  ) : null}
                </div>
                <span className="text-[10.5px] font-semibold text-ink-faint">{m.name}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Grupos */}
      {groups.map((group) => {
        if (!group.items.length) return null;
        const done = group.items.filter((v) => v.goal.status === "concluida").length;
        const progress = group.items.length
          ? group.items.reduce((acc, v) => acc + v.breakdown.total, 0) / group.items.length
          : 0;
        return (
          <Card key={group.key}>
            <CardHeader
              title={group.title}
              description={`${done}/${group.items.length} concluídas`}
              action={
                <span
                  className="font-display text-lg font-bold tabular"
                  style={{ color: group.color }}
                >
                  {Math.round(progress)}%
                </span>
              }
            />
            <ProgressBar value={progress} color={group.color} className="mb-4" />
            <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
              {group.items.map((v) => (
                <Link
                  key={v.goal.id}
                  href={`/metas/${v.goal.id}`}
                  className="flex items-center gap-3 rounded-xl border border-line p-3 transition-all hover:border-line-strong hover:bg-ink/[0.02]"
                >
                  <span
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
                    style={{
                      background: `${v.category?.color ?? group.color}1a`,
                      color: v.category?.color ?? group.color,
                    }}
                  >
                    <Icon name={v.goal.icon} className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-semibold text-ink">
                      {v.goal.title}
                    </span>
                    <span className="mt-1 flex items-center gap-2">
                      <span className="text-[11px] text-ink-faint">
                        {v.goal.dueDate ? formatDate(v.goal.dueDate) : "sem prazo"}
                      </span>
                      {v.goal.status === "concluida" ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-jade" />
                      ) : (
                        <span className="text-[11px] font-bold tabular text-ink-soft">
                          {Math.round(v.breakdown.total)}%
                        </span>
                      )}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </Card>
        );
      })}

      {yearViews.length === 0 ? (
        <EmptyState
          icon={<Target className="h-5 w-5" />}
          title={`Nenhuma meta em ${year}`}
          description="Crie metas com data de início ou prazo em 2026 para construir a visão do ano."
        />
      ) : null}
    </div>
  );
}

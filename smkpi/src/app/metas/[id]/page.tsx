"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Clock,
  Flag,
  Link2,
  Pencil,
  Play,
  Target,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProgressBar, ProgressRing } from "@/components/ui/Progress";
import { Icon } from "@/components/ui/Icon";
import { EmptyState } from "@/components/ui/EmptyState";
import { GoalHistoryChart } from "@/components/charts/Charts";
import { StepList } from "@/components/goals/StepList";
import { GoalFormModal } from "@/components/goals/GoalFormModal";
import { ProgressUpdateModal } from "@/components/goals/ProgressUpdateModal";
import { useStore } from "@/lib/data/store";
import { buildGoalViews } from "@/lib/selectors";
import {
  CADENCE_LABEL,
  PRIORITY_LABEL,
  PRIORITY_TONE,
  SCOPE_LABEL,
} from "@/lib/constants";
import { DEADLINE_TONE_CLASS, paceLabel } from "@/lib/progress";
import { cn, formatDate, formatMetric } from "@/lib/utils";

export default function GoalDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { state, updateGoal, deleteGoal } = useStore();

  const [editing, setEditing] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const views = useMemo(() => buildGoalViews(state), [state]);
  const view = views.find((v) => v.goal.id === params.id);

  if (!view) {
    return (
      <EmptyState
        icon={<Target className="h-5 w-5" />}
        title="Meta não encontrada"
        description="Ela pode ter sido excluída ou o link está incorreto."
        action={
          <Link href="/metas">
            <Button>Voltar para minhas metas</Button>
          </Link>
        }
      />
    );
  }

  const { goal, breakdown, deadline, category, steps, progress } = view;
  const parent = state.goals.find((g) => g.id === goal.parentGoalId);
  const children = state.goals.filter((g) => g.parentGoalId === goal.id);
  const habits = state.habits.filter((h) => h.goalId === goal.id);

  const history = [
    ...progress.map((p) => ({ date: p.loggedAt, value: p.value, note: p.note })),
    {
      date: goal.updatedAt.slice(0, 10),
      value: goal.metricCurrent ?? 0,
      note: "",
    },
  ]
    .filter((h) => goal.metricCurrent !== null)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((h) => ({
      label: formatDate(h.date, false),
      value: h.value,
    }));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-faint transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leadingIcon={<Pencil className="h-3.5 w-3.5" />} onClick={() => setEditing(true)}>
            Editar
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setConfirmDelete(true)}
            aria-label="Excluir meta"
            className="text-rose"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Cabeçalho */}
      <section className="card p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-start gap-3.5">
              <span
                className="grid h-13 w-13 shrink-0 place-items-center rounded-2xl p-3.5 text-white shadow-card"
                style={{ background: category?.color ?? "#4F46E5" }}
              >
                <Icon name={goal.icon} className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h2 className="font-display text-xl font-bold leading-tight tracking-tight text-ink sm:text-2xl">
                  {goal.title}
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span
                    className="rounded-pill px-2 py-0.5 text-[11px] font-semibold"
                    style={{
                      background: `${category?.color ?? "#4F46E5"}1a`,
                      color: category?.color ?? "#4F46E5",
                    }}
                  >
                    {category?.name ?? "Sem categoria"}
                  </span>
                  <span className={cn("rounded-pill px-2 py-0.5 text-[11px] font-semibold", PRIORITY_TONE[goal.priority])}>
                    {PRIORITY_LABEL[goal.priority]}
                  </span>
                  <span className="rounded-pill bg-ink/5 px-2 py-0.5 text-[11px] font-medium text-ink-faint">
                    {CADENCE_LABEL[goal.cadence]}
                  </span>
                  <span className="rounded-pill bg-ink/5 px-2 py-0.5 text-[11px] font-medium text-ink-faint">
                    {SCOPE_LABEL[goal.scope]}
                  </span>
                  {goal.status === "concluida" ? (
                    <Badge tone="success" icon={<CheckCircle2 className="h-3 w-3" />}>
                      Concluída
                    </Badge>
                  ) : null}
                </div>
              </div>
            </div>
            {goal.description ? (
              <p className="mt-4 max-w-2xl text-[13.5px] leading-relaxed text-ink-soft">
                {goal.description}
              </p>
            ) : null}
          </div>

          <div className="flex items-center gap-5 rounded-2xl border border-line bg-base/60 p-4">
            <ProgressRing value={breakdown.total} size={104} stroke={10} color={category?.color}>
              <div className="text-center">
                <p className="font-display text-xl font-bold tabular leading-none text-ink">
                  {Math.round(breakdown.total)}%
                </p>
              </div>
            </ProgressRing>
            <div className="space-y-2 text-[12px]">
              <div>
                <p className="text-ink-faint">Atual</p>
                <p className="font-display text-[15px] font-bold tabular text-ink">
                  {formatMetric(goal.metricCurrent, goal.metricUnit, state.settings.currency)}
                </p>
              </div>
              <div>
                <p className="text-ink-faint">Objetivo</p>
                <p className="font-display text-[15px] font-bold tabular text-ink">
                  {formatMetric(goal.metricTarget, goal.metricUnit, state.settings.currency)}
                </p>
              </div>
              {breakdown.remaining !== null ? (
                <div>
                  <p className="text-ink-faint">Falta</p>
                  <p className="font-display text-[15px] font-bold tabular text-iris">
                    {formatMetric(breakdown.remaining, goal.metricUnit, state.settings.currency)}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* prazo */}
        <div className="mt-5 rounded-xl border border-line bg-base/50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-[12px] font-semibold",
                DEADLINE_TONE_CLASS[deadline.tone],
              )}
            >
              <CalendarClock className="h-3.5 w-3.5" />
              {deadline.label}
            </span>
            <div className="flex items-center gap-4 text-[12px] text-ink-faint">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {goal.dueDate ? `Prazo: ${formatDate(goal.dueDate)}` : "Sem prazo"}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Flag className="h-3.5 w-3.5" />
                Início: {goal.startDate ? formatDate(goal.startDate) : "—"}
              </span>
              <Badge tone="accent">{paceLabel(goal, breakdown.total)}</Badge>
            </div>
          </div>
          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between text-[11px] font-medium text-ink-faint">
              <span>Tempo de prazo decorrido</span>
              <span className="tabular">{Math.round(deadline.elapsed)}%</span>
            </div>
            <ProgressBar value={deadline.elapsed} color="var(--amber)" height="h-1.5" />
          </div>
        </div>

        {goal.status === "ativa" ? (
          <Button
            className="mt-4 w-full sm:w-auto"
            leadingIcon={<TrendingUp className="h-4 w-4" />}
            onClick={() => setProgressOpen(true)}
          >
            Registrar atualização de progresso
          </Button>
        ) : (
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="outline"
              leadingIcon={<Play className="h-4 w-4" />}
              onClick={() =>
                updateGoal(goal.id, { status: "ativa", completedAt: null })
              }
            >
              Reabrir meta
            </Button>
            <Button
              variant="secondary"
              leadingIcon={<CheckCircle2 className="h-4 w-4" />}
              onClick={() =>
                updateGoal(goal.id, {
                  status: "concluida",
                  completedAt: new Date().toISOString(),
                })
              }
            >
              Marcar como concluída
            </Button>
          </div>
        )}
      </section>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Etapas */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Etapas"
            description={
              steps.length
                ? `${steps.filter((s) => s.done).length} de ${steps.length} concluídas`
                : "Quebre a meta em passos menores"
            }
            icon={<CheckCircle2 className="h-4 w-4" />}
          />
          <StepList goalId={goal.id} steps={steps} />
        </Card>

        {/* Relação com metas */}
        <Card>
          <CardHeader
            title="Relacionadas"
            description="Metas relacionadas"
            icon={<Link2 className="h-4 w-4" />}
          />
          <div className="space-y-3">
            {parent ? (
              <Link
                href={`/metas/${parent.id}`}
                className="flex items-center gap-2.5 rounded-xl border border-line p-2.5 transition-colors hover:bg-ink/[0.03]"
              >
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-iris-soft text-iris-dark">
                  <Target className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[10px] font-semibold uppercase tracking-wide text-ink-faint">
                    Meta principal
                  </span>
                  <span className="block truncate text-[13px] font-semibold text-ink">
                    {parent.title}
                  </span>
                </span>
              </Link>
            ) : null}

            {children.length ? (
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-ink-faint">
                  Metas subordinadas
                </p>
                <div className="space-y-2">
                  {children.map((c) => (
                    <Link
                      key={c.id}
                      href={`/metas/${c.id}`}
                      className="flex items-center gap-2.5 rounded-xl border border-line p-2.5 transition-colors hover:bg-ink/[0.03]"
                    >
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-ink/5 text-ink-soft">
                        <Target className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-semibold text-ink">
                          {c.title}
                        </span>
                        <ProgressBar
                          value={
                            buildGoalViews(state).find((v) => v.goal.id === c.id)?.breakdown.total ?? 0
                          }
                          className="mt-1"
                          height="h-1"
                        />
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}

            {!parent && children.length === 0 ? (
              <p className="text-[13px] text-ink-faint">
                Esta meta ainda não está vinculada a nenhuma outra.
              </p>
            ) : null}

            {habits.length ? (
              <div className="border-t border-line pt-3">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-ink-faint">
                  Hábitos ligados
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {habits.map((h) => (
                    <span
                      key={h.id}
                      className="rounded-pill bg-ink/5 px-2.5 py-1 text-[11px] font-medium text-ink-soft"
                    >
                      {h.title}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </Card>
      </div>

      {/* Histórico */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Evolução da meta"
            description="Histórico de valores registrados"
            icon={<TrendingUp className="h-4 w-4" />}
          />
          {history.length > 1 ? (
            <GoalHistoryChart data={history} color={category?.color} />
          ) : (
            <EmptyState
              icon={<TrendingUp className="h-5 w-5" />}
              title="Ainda sem histórico"
              description="Registre atualizações de progresso para ver a curva de evolução."
            />
          )}
        </Card>

        <Card>
          <CardHeader
            title="Histórico"
            description={`${progress.length} registros`}
          />
          {progress.length === 0 ? (
            <p className="text-[13px] text-ink-faint">Nenhum registro ainda.</p>
          ) : (
            <ol className="space-y-3">
              {[...progress].reverse().map((p) => (
                <li key={p.id} className="border-l-2 border-line pl-3">
                  <p className="text-[12px] font-semibold text-ink">
                    {formatMetric(p.value, goal.metricUnit, state.settings.currency)}
                  </p>
                  <p className="text-[11px] text-ink-faint">{formatDate(p.loggedAt)}</p>
                  {p.note ? (
                    <p className="mt-0.5 text-[12px] leading-relaxed text-ink-soft">{p.note}</p>
                  ) : null}
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>

      {/* Observações */}
      {goal.notes ? (
        <Card>
          <CardHeader title="Observações" icon={<Flag className="h-4 w-4" />} />
          <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-ink-soft">
            {goal.notes}
          </p>
        </Card>
      ) : null}

      <GoalFormModal open={editing} goal={goal} onClose={() => setEditing(false)} />
      <ProgressUpdateModal
        view={view}
        open={progressOpen}
        onClose={() => setProgressOpen(false)}
      />

      {confirmDelete ? (
        <div className="fixed inset-0 z-[55] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm animate-fade-in"
            onClick={() => setConfirmDelete(false)}
          />
          <div className="relative z-10 w-full max-w-sm animate-scale-in rounded-card border border-line bg-surface p-6 shadow-float">
            <h3 className="font-display text-lg font-semibold text-ink">Excluir esta meta?</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-faint">
              “{goal.title}” será removida junto com seu histórico, etapas e hábitos vinculados.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  deleteGoal(goal.id);
                  router.push("/metas");
                }}
              >
                Excluir
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

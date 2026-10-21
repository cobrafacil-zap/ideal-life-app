"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarClock, MoreVertical, Pencil, Trash2, CheckCircle2, Link2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { ProgressBar } from "@/components/ui/Progress";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useStore } from "@/lib/data/store";
import { CADENCE_LABEL, PRIORITY_LABEL, PRIORITY_TONE } from "@/lib/constants";
import { DEADLINE_TONE_CLASS } from "@/lib/progress";
import type { GoalView } from "@/lib/selectors";
import { cn, formatDate, formatMetric } from "@/lib/utils";
import { GoalFormModal } from "./GoalFormModal";

export function GoalCard({
  view,
  onOpenProgress,
  compact = false,
}: {
  view: GoalView;
  onOpenProgress?: (view: GoalView) => void;
  compact?: boolean;
}) {
  const { state, deleteGoal } = useStore();
  const { toast } = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { goal, breakdown, deadline, category } = view;
  const parent = state.goals.find((g) => g.id === goal.parentGoalId);
  const doneSteps = view.steps.filter((s) => s.done).length;
  const isLate = deadline.tone === "late";

  return (
    <>
      <article
        className={cn(
          "group relative flex flex-col rounded-card border bg-surface p-4 shadow-card transition-all duration-300 sm:p-5",
          "hover:-translate-y-0.5 hover:shadow-raised",
          isLate ? "border-rose/35" : "border-line",
          goal.status === "concluida" && "opacity-90",
        )}
      >
        <div className="flex items-start gap-3">
          <span
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white shadow-sm"
            style={{ background: category?.color ?? "#4F46E5" }}
          >
            <Icon name={goal.icon} className="h-5 w-5" />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <Link href={`/metas/${goal.id}`} className="min-w-0">
                <h3
                  className={cn(
                    "truncate font-display text-[15px] font-semibold leading-snug text-ink transition-colors group-hover:text-iris",
                    goal.status === "concluida" && "line-through decoration-ink-faint/50",
                  )}
                >
                  {goal.title}
                </h3>
              </Link>
              <div className="relative shrink-0">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="grid h-8 w-8 place-items-center rounded-lg text-ink-faint transition-colors hover:bg-ink/5 hover:text-ink"
                  aria-label="Ações"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
                {menuOpen ? (
                  <div
                    className="absolute right-0 top-9 z-20 w-44 overflow-hidden rounded-xl border border-line bg-surface shadow-float animate-scale-in"
                    onMouseLeave={() => setMenuOpen(false)}
                  >
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        setEditing(true);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-[13px] text-ink-soft transition-colors hover:bg-ink/5"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Editar
                    </button>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        setConfirmDelete(true);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-[13px] text-rose transition-colors hover:bg-rose-soft"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Excluir
                    </button>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span
                className="inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-[11px] font-semibold"
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
              {goal.status === "concluida" ? (
                <Badge tone="success" icon={<CheckCircle2 className="h-3 w-3" />}>
                  Concluída
                </Badge>
              ) : null}
            </div>
          </div>
        </div>

        {!compact && goal.description ? (
          <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-ink-faint">
            {goal.description}
          </p>
        ) : null}

        {breakdown.hasMetric ? (
          <div className="mt-4">
            <div className="mb-1.5 flex items-baseline justify-between gap-2 text-[12px]">
              <span className="font-semibold tabular text-ink">
                {formatMetric(goal.metricCurrent, goal.metricUnit, state.settings.currency)}
                <span className="font-normal text-ink-faint"> de </span>
                {formatMetric(goal.metricTarget, goal.metricUnit, state.settings.currency)}
              </span>
              <span className="font-bold tabular text-iris">{Math.round(breakdown.total)}%</span>
            </div>
            <ProgressBar value={breakdown.total} color={category?.color} />
            {breakdown.remaining !== null && breakdown.remaining > 0 ? (
              <p className="mt-1.5 text-[11px] text-ink-faint">
                Faltam{" "}
                <span className="font-semibold text-ink-soft">
                  {formatMetric(breakdown.remaining, goal.metricUnit, state.settings.currency)}
                </span>
              </p>
            ) : null}
          </div>
        ) : breakdown.hasSteps ? (
          <div className="mt-4">
            <div className="mb-1.5 flex items-baseline justify-between gap-2 text-[12px]">
              <span className="font-semibold text-ink">
                {doneSteps} de {view.steps.length} etapas concluídas
              </span>
              <span className="font-bold tabular text-iris">{Math.round(breakdown.total)}%</span>
            </div>
            <ProgressBar value={breakdown.total} color={category?.color} />
          </div>
        ) : null}

        <div className="mt-4 flex items-center justify-between gap-2 border-t border-line pt-3">
          {goal.status === "concluida" ? (
            <span className="inline-flex items-center gap-1.5 rounded-pill bg-jade-soft px-2.5 py-1 text-[11px] font-semibold text-jade-dark">
              <CheckCircle2 className="h-3 w-3" />
              Concluída{goal.completedAt ? ` · ${formatDate(goal.completedAt)}` : ""}
            </span>
          ) : (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-[11px] font-semibold",
                DEADLINE_TONE_CLASS[deadline.tone],
              )}
            >
              <CalendarClock className="h-3 w-3" />
              {deadline.label}
            </span>
          )}
          {parent ? (
            <span
              className="inline-flex max-w-[45%] items-center gap-1 truncate text-[11px] text-ink-faint"
              title={`Parte de: ${parent.title}`}
            >
              <Link2 className="h-3 w-3 shrink-0" />
              <span className="truncate">{parent.title}</span>
            </span>
          ) : (
            <span />
          )}
        </div>

        {onOpenProgress && goal.status === "ativa" ? (
          <Button
            size="sm"
            variant="secondary"
            className="mt-3 w-full"
            onClick={() => onOpenProgress(view)}
          >
            Atualizar progresso
          </Button>
        ) : null}
      </article>

      <GoalFormModal open={editing} goal={goal} onClose={() => setEditing(false)} />

      {confirmDelete ? (
        <div className="fixed inset-0 z-[55] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm animate-fade-in"
            onClick={() => setConfirmDelete(false)}
          />
          <div className="relative z-10 w-full max-w-sm animate-scale-in rounded-card border border-line bg-surface p-6 shadow-float">
            <h3 className="font-display text-lg font-semibold text-ink">Excluir esta meta?</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-faint">
              “{goal.title}” e todo o histórico de progresso, etapas e hábitos vinculados
              serão removidos. Esta ação não pode ser desfeita.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  deleteGoal(goal.id);
                  setConfirmDelete(false);
                  toast("Meta excluída.", "info");
                }}
              >
                Excluir
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

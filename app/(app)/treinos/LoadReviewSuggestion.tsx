"use client";

import { useState, useTransition } from "react";
import {
  ArrowUp,
  ArrowRight,
  ArrowDown,
  AlertTriangle,
  Check,
  Info,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  APPLY_SUGGESTION_NOTE,
  REVIEW_DISCLAIMER,
  type ReviewVerdict,
} from "@/lib/workout-rpe";
import { applyLoadSuggestion } from "./actions";
import { cn } from "@/lib/cn";

type Props = {
  exerciseName: string;
  unit: "kg" | "lb";
  currentTargetLoad: number | null;
  lastTopLoadKg: number | null;
  verdict: ReviewVerdict;
};

export function LoadReviewSuggestion({
  exerciseName,
  unit,
  currentTargetLoad,
  lastTopLoadKg,
  verdict,
}: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [applied, setApplied] = useState<{ updated: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // A unidade da sugestão = unidade do exercício (kg ou lb).
  // lastTopLoadKg já vem em kg; convertemos de volta pra unidade escolhida.
  const lastTopInUnit =
    lastTopLoadKg == null
      ? null
      : unit === "lb"
        ? Math.round((lastTopLoadKg / 0.4536) * 100) / 100
        : lastTopLoadKg;

  const suggestedUnit =
    verdict.kind === "increase" && lastTopInUnit != null
      ? Math.round(lastTopInUnit * 1.05 * 100) / 100
      : lastTopInUnit;

  function apply() {
    setError(null);
    if (suggestedUnit == null) return;
    startTransition(async () => {
      try {
        const res = await applyLoadSuggestion({
          exercise_name: exerciseName,
          new_target_load: suggestedUnit,
          load_unit: unit,
        });
        setApplied(res);
        setOpen(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao aplicar.");
      }
    });
  }

  return (
    <div className="rounded-2xl border border-line/60 bg-base/40 p-4">
      <div className="flex items-start gap-3">
        <VerdictIcon kind={verdict.kind} />
        <div className="min-w-0 flex-1">
          <p className="font-display text-sm font-semibold text-ink">
            <VerdictLabel kind={verdict.kind} />
          </p>
          <p className="mt-1 text-[12px] leading-relaxed text-ink-soft">
            {verdict.message}
          </p>
          <p className="mt-2 inline-flex items-start gap-1.5 text-[11px] text-ink-faint">
            <Info size={11} className="mt-0.5 shrink-0" aria-hidden="true" />
            {REVIEW_DISCLAIMER}
          </p>
        </div>
      </div>

      {verdict.kind === "increase" && lastTopInUnit != null && (
        <div className="mt-3 flex items-center justify-between rounded-xl bg-surface px-3 py-2">
          <div className="text-[12px] text-ink-soft">
            Atual:{" "}
            <span className="font-mono text-ink">
              {currentTargetLoad != null ? `${currentTargetLoad} ${unit}` : "—"}
            </span>
            {" · "}
            Sugestão:{" "}
            <span className="font-mono text-ink">
              {suggestedUnit} {unit}
            </span>
          </div>
          {!applied ? (
            <Button
              onClick={() => setOpen(true)}
              variant="secondary"
              size="sm"
              leadingIcon={<Check size={12} />}
            >
              Aplicar
            </Button>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-pill bg-moss-soft px-2 py-1 text-[11px] font-semibold text-moss-dark">
              <Check size={10} aria-hidden="true" />
              Atualizado em {applied.updated}{" "}
              {applied.updated === 1 ? "plano" : "planos"}
            </span>
          )}
        </div>
      )}

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="apply-title"
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 backdrop-blur-sm animate-fade-in sm:items-center"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-t-card bg-base shadow-floating border border-line/60 animate-fade-up sm:rounded-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-line/60 px-4 py-3 sm:px-6">
              <h2 id="apply-title" className="font-display text-lg font-bold text-ink">
                Aplicar sugestão
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft hover:bg-base/60 hover:text-ink"
                aria-label="Fechar"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-3 px-4 py-4 sm:px-6 sm:py-5">
              <p className="text-[12px] text-ink-soft">{APPLY_SUGGESTION_NOTE}</p>
              <div className="rounded-2xl bg-base/40 p-3 text-center">
                <p className="text-[10px] uppercase tracking-wide text-ink-faint">
                  Nova carga alvo
                </p>
                <p className="font-mono text-2xl font-bold text-ink">
                  {suggestedUnit} {unit}
                </p>
                <p className="text-[11px] text-ink-soft">
                  exercício: <strong>{exerciseName}</strong>
                </p>
              </div>
              {error && (
                <p className="text-[12px] text-ember-dark" role="alert">
                  {error}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-line/60 px-4 py-3 sm:px-6">
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={apply}
                loading={isPending}
                variant="primary"
                leadingIcon={<Check size={14} />}
              >
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function VerdictIcon({ kind }: { kind: ReviewVerdict["kind"] }) {
  const cls = "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl";
  if (kind === "increase")
    return (
      <span className={cn(cls, "bg-moss-soft text-moss-dark")}>
        <ArrowUp size={16} aria-hidden="true" />
      </span>
    );
  if (kind === "decrease")
    return (
      <span className={cn(cls, "bg-ember-soft text-ember-dark")}>
        <ArrowDown size={16} aria-hidden="true" />
      </span>
    );
  if (kind === "monitor")
    return (
      <span className={cn(cls, "bg-ember-soft text-ember-dark")}>
        <AlertTriangle size={16} aria-hidden="true" />
      </span>
    );
  return (
    <span className={cn(cls, "bg-gold-soft text-gold-dark")}>
      <ArrowRight size={16} aria-hidden="true" />
    </span>
  );
}

function VerdictLabel({ kind }: { kind: ReviewVerdict["kind"] }) {
  if (kind === "increase") return "Sugestão: pode aumentar a carga";
  if (kind === "decrease") return "Sugestão: pode reduzir a carga";
  if (kind === "monitor") return "Atenção: desconforto recorrente";
  return "Sem mudança sugerida";
}

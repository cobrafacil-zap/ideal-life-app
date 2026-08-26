"use client";

import { useState, useTransition } from "react";
import { Moon, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";
import { saveDailySummary } from "./actions";

/**
 * "Encerrar meu dia" — botão + modal.
 *
 * Mostra o resumo do dia (kcal, água, treino, bem-estar, N de 5 pilares).
 * Ao confirmar, chama `saveDailySummary(date, totals)` que persiste em
 * `daily_summaries`. Modal pode ser reaberto várias vezes — se já existe
 * resumo, mostra "Ontem você cumpriu X%" como reflexão.
 *
 * Client component porque tem estado (open/closed) + transição.
 */

interface EndDayModalProps {
  /** Snapshot do dia atual (passado pelo server). */
  today: {
    kcal: number;
    waterMl: number;
    cardioMin: number;
    workoutMin: number;
    wellbeingPct: number | null;
    completedCount: number; // 0–5
  };
  /** Se o usuário já encerrou este dia antes (mostra reflexão). */
  alreadyClosed: boolean;
  /** % de cumprimento do último dia encerrado (se houver). */
  lastClosedPct: number | null;
}

export function EndDayModal({ today, alreadyClosed, lastClosedPct }: EndDayModalProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      try {
        await saveDailySummary({
          kcalConsumed: today.kcal,
          waterMl: today.waterMl,
          cardioMin: today.cardioMin,
          workoutMin: today.workoutMin,
          wellbeingPct: today.wellbeingPct,
          completedCount: today.completedCount,
        });
        setOpen(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao encerrar o dia.");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "w-full rounded-2xl bg-gradient-to-r from-ember to-ember-tint px-6 py-4",
          "text-white font-display text-base font-semibold shadow-floating",
          "hover:from-ember-dark hover:to-ember active:scale-[0.99] transition-all",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ember-dark",
          "inline-flex items-center justify-center gap-2",
        )}
      >
        <Moon size={18} aria-hidden="true" />
        Encerrar meu dia
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => !isPending && setOpen(false)}
        >
          <div
            className={cn(
              "relative w-full max-w-md rounded-card bg-base shadow-floating border border-line/60",
              "animate-fade-up",
            )}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="end-day-title"
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={isPending}
              aria-label="Fechar"
              className={cn(
                "absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-lg",
                "text-ink-soft hover:bg-base/80 hover:text-ink",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember",
                "disabled:opacity-50",
              )}
            >
              <X size={16} aria-hidden="true" />
            </button>

            <div className="p-6 sm:p-7">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-ember-soft text-ember">
                  <Moon size={18} aria-hidden="true" />
                </span>
                <h2
                  id="end-day-title"
                  className="font-display text-xl font-bold leading-tight text-ink"
                >
                  Encerrar meu dia
                </h2>
              </div>

              {alreadyClosed ? (
                <p className="mt-4 text-[14px] leading-relaxed text-ink-soft">
                  Você já encerrou este dia.{" "}
                  {lastClosedPct != null
                    ? `Cumpriu ${Math.round(lastClosedPct)}% das metas hoje.`
                    : "Continue amanhã — vamos tentar de novo?"}
                </p>
              ) : lastClosedPct != null ? (
                <p className="mt-4 text-[14px] leading-relaxed text-ink-soft">
                  Ontem você cumpriu {Math.round(lastClosedPct)}% das metas.
                  Hoje vamos tentar de novo?
                </p>
              ) : (
                <p className="mt-4 text-[14px] leading-relaxed text-ink-soft">
                  Reserve um momento para fechar o dia. Guardamos o resumo
                  pra você olhar depois.
                </p>
              )}

              <ul className="mt-5 space-y-2 rounded-2xl bg-surface p-4 ring-1 ring-line/40">
                <SummaryLine
                  label="Calorias"
                  value={`${today.kcal.toLocaleString("pt-BR")} kcal`}
                />
                <SummaryLine
                  label="Água"
                  value={`${(today.waterMl / 1000).toFixed(1).replace(".", ",")} L`}
                />
                <SummaryLine
                  label="Cardio"
                  value={`${today.cardioMin} min`}
                />
                <SummaryLine
                  label="Treino"
                  value={`${(today.workoutMin / 60).toFixed(1).replace(".", ",")} h`}
                />
                <SummaryLine
                  label="Bem-estar"
                  value={today.wellbeingPct != null ? `${Math.round(today.wellbeingPct)}%` : "sem check-in"}
                />
                <li className="mt-2 flex items-center justify-between border-t border-line/40 pt-2">
                  <span className="text-[12px] font-semibold uppercase tracking-wider text-ink-soft">
                    Pilares cumpridos
                  </span>
                  <span className="font-mono text-base font-bold text-ink tabular-nums">
                    {today.completedCount} / 5
                    {today.completedCount === 5 && (
                      <Sparkles
                        size={14}
                        className="ml-1 inline text-moss"
                        aria-hidden="true"
                      />
                    )}
                  </span>
                </li>
              </ul>

              {error && (
                <p className="mt-3 rounded-xl bg-ember-soft px-3 py-2 text-[12px] text-ember-dark">
                  {error}
                </p>
              )}

              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={isPending}
                  className={cn(
                    "rounded-pill px-4 py-2 text-[13px] font-semibold text-ink-soft",
                    "hover:bg-base/80 transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2 focus-visible:ring-offset-base",
                  )}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={isPending}
                  className={cn(
                    "rounded-pill bg-ember px-5 py-2 text-[13px] font-semibold text-white",
                    "hover:bg-ember-dark active:scale-[0.97] disabled:opacity-60",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2 focus-visible:ring-offset-base",
                    "transition-all",
                  )}
                >
                  {isPending ? "Salvando..." : alreadyClosed ? "Atualizar resumo" : "Confirmar encerramento"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex items-center justify-between text-[13px]">
      <span className="text-ink-soft">{label}</span>
      <span className="font-mono font-semibold tabular-nums text-ink">
        {value}
      </span>
    </li>
  );
}

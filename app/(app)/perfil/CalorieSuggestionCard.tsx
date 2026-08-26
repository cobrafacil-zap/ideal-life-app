"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Check, Flame, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { updateCalorieGoal } from "./actions";
import type { CalorieSuggestion } from "@/lib/calorie-suggestion";

interface CalorieSuggestionCardProps {
  suggestion: CalorieSuggestion;
  currentCalorieGoal: number | null;
}

const CONFIDENCE_TONE: Record<CalorieSuggestion["confidence"], string> = {
  alta: "bg-moss-soft text-moss-dark",
  media: "bg-gold-soft text-gold-dark",
  baixa: "bg-line text-ink-soft",
};

/**
 * Card com a meta calórica sugerida (TDEE + ajuste da meta).
 *
 * Mostra:
 * - número sugerido em destaque
 * - TDEE base + delta do ajuste
 * - pill de confiança
 * - avisos (se houver)
 * - comparação com a meta atual (se já existir)
 * - botão "Usar como minha meta" / "Atualizar para a sugestão"
 */
export function CalorieSuggestionCard({
  suggestion,
  currentCalorieGoal,
}: CalorieSuggestionCardProps) {
  const [isPending, startTransition] = useTransition();
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const diff =
    currentCalorieGoal != null
      ? suggestion.suggestedKcal - currentCalorieGoal
      : null;

  function handleApply() {
    setError(null);
    startTransition(async () => {
      try {
        await updateCalorieGoal(suggestion.suggestedKcal);
        setApplied(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao aplicar.");
      }
    });
  }

  const buttonLabel = applied
    ? "Sugestão aplicada — revise as metas"
    : currentCalorieGoal == null
      ? "Usar como minha meta"
      : "Atualizar para a sugestão";

  return (
    <Card className="bg-ember-soft/30 border-ember/30">
      <CardHeader
        title={
          <span className="flex items-center gap-2">
            <Sparkles size={16} className="text-ember" aria-hidden="true" />
            Meta calórica sugerida
          </span>
        }
        description={
          suggestion.method === "mifflin"
            ? "Baseado em Mifflin-St Jeor + seu ritmo de treino e alimentação."
            : "Baseado no seu peso atual e nível de atividade (preencha altura e idade para uma estimativa mais precisa)."
        }
        action={
          <span
            className={cn(
              "rounded-pill px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider",
              CONFIDENCE_TONE[suggestion.confidence],
            )}
          >
            confiança {suggestion.confidence}
          </span>
        }
      />

      <div className="flex items-baseline gap-3">
        <Flame size={20} className="text-ember-dark" aria-hidden="true" />
        <p className="font-mono text-4xl font-bold text-ember-dark leading-none">
          {suggestion.suggestedKcal.toLocaleString("pt-BR")}
        </p>
        <p className="text-sm text-ink-soft">kcal/dia</p>
      </div>

      <p className="mt-2 text-[12px] text-ink-soft">
        <strong className="text-ink">Base:</strong>{" "}
        {suggestion.baseKcal.toLocaleString("pt-BR")} kcal
        {suggestion.adjustmentKcal !== 0 && (
          <>
            {" · "}
            <strong className="text-ink">Ajuste:</strong>{" "}
            {suggestion.adjustmentKcal > 0 ? "+" : ""}
            {suggestion.adjustmentKcal} kcal ({suggestion.adjustmentReason})
          </>
        )}
        {suggestion.adjustmentKcal === 0 && (
          <span className="text-ink-faint"> · {suggestion.adjustmentReason}</span>
        )}
      </p>

      {diff != null && Math.abs(diff) > 0 && (
        <p className="mt-1 text-[12px] text-ink-faint">
          Sua meta atual está{" "}
          {diff > 0
            ? `${diff} kcal abaixo`
            : `${Math.abs(diff)} kcal acima`}{" "}
          da sugestão.
        </p>
      )}

      {suggestion.warnings.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {suggestion.warnings.map((w, i) => (
            <li
              key={i}
              className="flex items-start gap-1.5 text-[11px] text-ember-dark"
            >
              <AlertTriangle
                size={12}
                className="mt-0.5 shrink-0"
                aria-hidden="true"
              />
              <span>{w}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4">
        <Button
          type="button"
          onClick={handleApply}
          loading={isPending}
          variant={applied ? "outline" : "primary"}
          fullWidth
          leadingIcon={applied ? <Check size={14} /> : <Flame size={14} />}
          disabled={applied}
        >
          {buttonLabel}
        </Button>
      </div>

      {error && (
        <p className="mt-2 text-[12px] text-ember-dark" role="alert">
          {error}
        </p>
      )}
    </Card>
  );
}
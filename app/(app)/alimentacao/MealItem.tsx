"use client";

import { useTransition } from "react";
import { Trash2, Flame } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { deleteMeal } from "./actions";

interface MealItemProps {
  id: string;
  type: string;
  notes: string | null;
  calories: number | null;
  loggedAt: string;
}

const mealLabels: Record<string, string> = {
  cafe_da_manha: "Café da manhã",
  almoco: "Almoço",
  lanche: "Lanche",
  jantar: "Jantar",
  ceia: "Ceia",
  outra: "Outra",
};

const mealEmoji: Record<string, string> = {
  cafe_da_manha: "☕",
  almoco: "🍽️",
  lanche: "🥪",
  jantar: "🌙",
  ceia: "🌜",
  outra: "🍴",
};

function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function MealItem({ id, type, notes, calories, loggedAt }: MealItemProps) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (typeof window !== "undefined" && !window.confirm("Remover esta refeição?")) {
      return;
    }
    startTransition(async () => {
      await deleteMeal(id);
    });
  }

  return (
    <article className="rounded-2xl border border-line/60 bg-surface p-3 sm:p-4 transition-colors hover:border-ember/30">
      <div className="flex items-start gap-3">
        <span
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ember-soft text-lg"
          aria-hidden="true"
        >
          {mealEmoji[type] ?? "🍴"}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold">
              {mealLabels[type] ?? "Refeição"}
            </p>
            {calories != null && (
              <span className="font-mono text-sm text-ink-soft whitespace-nowrap">
                <Flame
                  size={12}
                  className="inline -mt-0.5 mr-0.5 text-ember"
                  aria-hidden="true"
                />
                {calories} kcal
              </span>
            )}
          </div>
          {notes && (
            <p className="mt-0.5 line-clamp-2 text-[13px] text-ink-soft">
              {notes}
            </p>
          )}
          <p className="mt-1 text-[11px] text-ink-faint">
            Registrada às {formatTime(loggedAt)}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          loading={isPending}
          leadingIcon={<Trash2 size={14} />}
          aria-label={`Remover ${mealLabels[type] ?? "refeição"}`}
        >
          <span className="sr-only">Remover</span>
        </Button>
      </div>
    </article>
  );
}

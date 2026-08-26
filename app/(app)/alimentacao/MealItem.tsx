"use client";

import { useState, useTransition } from "react";
import { Trash2, Flame, Pencil, X, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { deleteMeal, updateMeal } from "./actions";
import { cn } from "@/lib/cn";

interface MealItemProps {
  id: string;
  type: string;
  notes: string | null;
  calories: number | null;
  loggedAt: string;
}

const MEAL_TYPES = [
  { value: "cafe_da_manha", label: "Café" },
  { value: "almoco", label: "Almoço" },
  { value: "lanche", label: "Lanche" },
  { value: "jantar", label: "Jantar" },
  { value: "ceia", label: "Ceia" },
  { value: "outra", label: "Outra" },
] as const;

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

export function MealItem({
  id,
  type,
  notes,
  calories,
  loggedAt,
}: MealItemProps) {
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);

  // Estado do form de edição
  const [editType, setEditType] = useState(type);
  const [editNotes, setEditNotes] = useState(notes ?? "");
  const [editCalories, setEditCalories] = useState(
    calories != null ? String(calories) : "",
  );
  const [editError, setEditError] = useState<string | null>(null);

  function handleDelete() {
    if (
      typeof window !== "undefined" &&
      !window.confirm("Remover esta refeição?")
    ) {
      return;
    }
    startTransition(async () => {
      await deleteMeal(id);
    });
  }

  function startEdit() {
    setEditType(type);
    setEditNotes(notes ?? "");
    setEditCalories(calories != null ? String(calories) : "");
    setEditError(null);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setEditError(null);
  }

  function saveEdit() {
    setEditError(null);
    const caloriesNum = editCalories
      ? parseFloat(editCalories.replace(",", "."))
      : null;
    if (editCalories && (!Number.isFinite(caloriesNum!) || caloriesNum! < 0)) {
      setEditError("Calorias inválidas.");
      return;
    }
    startTransition(async () => {
      try {
        await updateMeal(id, {
          meal_type: editType,
          notes: editNotes,
          total_calories: caloriesNum,
        });
        setEditing(false);
      } catch (err) {
        setEditError(
          err instanceof Error ? err.message : "Erro ao salvar edição.",
        );
      }
    });
  }

  if (editing) {
    return (
      <article className="rounded-2xl border border-ember/30 bg-ember-soft/30 p-3 sm:p-4">
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-[11px] uppercase tracking-wide text-ink-faint">
              Tipo
            </label>
            <div className="flex flex-wrap gap-1.5">
              {MEAL_TYPES.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setEditType(m.value)}
                  aria-pressed={editType === m.value}
                  className={cn(
                    "rounded-pill px-2.5 py-1 text-[12px] transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2 focus-visible:ring-offset-base",
                    editType === m.value
                      ? "bg-ember-gradient text-white shadow-card"
                      : "bg-line/40 text-ink-soft hover:bg-line",
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <TextField
            label="Descrição"
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
            maxLength={500}
          />

          <div className="grid grid-cols-2 gap-2">
            <TextField
              label="Calorias"
              type="text"
              inputMode="numeric"
              value={editCalories}
              onChange={(e) => setEditCalories(e.target.value)}
              trailingAdornment="kcal"
              placeholder="—"
            />
          </div>

          {editError && (
            <p className="text-[12px] text-ember-dark" role="alert">
              {editError}
            </p>
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={saveEdit}
              loading={isPending}
              leadingIcon={<Check size={14} />}
            >
              Salvar
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={cancelEdit}
              leadingIcon={<X size={14} />}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </article>
    );
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
        <div className="flex shrink-0 flex-col gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={startEdit}
            leadingIcon={<Pencil size={14} />}
            aria-label={`Editar ${mealLabels[type] ?? "refeição"}`}
          >
            <span className="sr-only">Editar</span>
          </Button>
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
      </div>
    </article>
  );
}
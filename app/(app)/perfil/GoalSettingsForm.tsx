"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { updateGoalSettings } from "./actions";
import { cn } from "@/lib/cn";

type GoalType = "perder" | "manter" | "ganhar" | "recompor";

const GOAL_OPTIONS: { value: GoalType; label: string; hint: string }[] = [
  { value: "perder", label: "Perder peso", hint: "Inclui meta de queima semanal" },
  { value: "manter", label: "Manter", hint: "Foco em manter o peso atual" },
  { value: "ganhar", label: "Ganhar massa", hint: "Meta acima do peso atual" },
  { value: "recompor", label: "Recompor", hint: "Manter peso, ajustar composição" },
];

/**
 * Formulário enxuto só com objetivo + taxa semanal.
 * Os pesos (inicial / atual / meta) ficam no `GoalProgressCard` ao lado.
 *
 * Salva via `updateGoalSettings` (server action) — não toca nos outros
 * campos do profile.
 */
export function GoalSettingsForm({
  goalType,
  weeklyRateKg,
}: {
  goalType: GoalType | null;
  weeklyRateKg: number | null;
}) {
  const [goalTypeValue, setGoalTypeValue] = useState<GoalType | "">(
    goalType ?? "manter",
  );
  const [rate, setRate] = useState(weeklyRateKg?.toString() ?? "0,5");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLoseGoal = goalTypeValue === "perder";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const r = parseFloat(rate.replace(",", "."));
    if (isLoseGoal && (!Number.isFinite(r) || r < 0.1 || r > 1.0)) {
      setError("Taxa semanal deve estar entre 0,1 e 1,0 kg/semana.");
      return;
    }

    startTransition(async () => {
      try {
        await updateGoalSettings({
          goal_type: goalTypeValue || null,
          weekly_rate_kg: isLoseGoal && !Number.isNaN(r) ? r : null,
        });
        setSaved(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao salvar.");
      }
    });
  }

  const selectClass = cn(
    "block w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss focus-visible:ring-offset-2 focus-visible:ring-offset-base",
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink-soft">
          Objetivo
        </span>
        <select
          value={goalTypeValue}
          onChange={(e) => {
            setGoalTypeValue(e.target.value as GoalType | "");
            setSaved(false);
          }}
          className={selectClass}
        >
          {GOAL_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      {isLoseGoal && (
        <TextField
          label="Taxa semanal (kg/sem)"
          type="text"
          inputMode="decimal"
          value={rate}
          placeholder="0,5"
          trailingAdornment="kg/sem"
          hint="Sugestão: 0,3–0,7 kg/sem"
          onChange={(e) => {
            setRate(e.target.value);
            setSaved(false);
          }}
        />
      )}

      {error && (
        <p className="text-[12px] text-ember-dark" role="alert">
          {error}
        </p>
      )}

      <Button
        type="submit"
        loading={isPending}
        variant={saved ? "outline" : "secondary"}
        fullWidth
      >
        {saved ? "Dados salvos" : "Salvar objetivo"}
      </Button>
    </form>
  );
}

"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { TextField } from "@/components/ui/TextField";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { logWeight, updateGoalWeights } from "@/app/(app)/saude/actions";
import { cn } from "@/lib/cn";

export interface GoalProgressCardProps {
  weightStart: number | null;
  currentWeight: number | null;
  weightGoal: number | null;
}

type SaveState = "idle" | "saving" | "saved";

/**
 * Card "Seu objetivo" — mostra peso inicial / atual / meta como
 * **inputs editáveis** (não valores estáticos) + barra de progresso.
 *
 * - Peso inicial / Meta salvam em `profiles.weight_goal_start_kg` /
 *   `profiles.weight_goal_kg` via `updateGoalWeights`.
 * - Peso atual salva em `body_measurements` via `logWeight` (cada save
 *   insere uma nova linha — mantém histórico e alimenta Evolução do
 *   peso).
 *
 * Cada coluna tem um chip "Salvar" discreto. Após salvar, vira "Salvo ✓"
 * por 2s (padrão igual ao `PhysicalProfileForm`).
 */
export function GoalProgressCard({
  weightStart,
  currentWeight,
  weightGoal,
}: GoalProgressCardProps) {
  const [startValue, setStartValue] = useState(
    weightStart != null ? weightStart.toString().replace(".", ",") : "",
  );
  const [currentValue, setCurrentValue] = useState(
    currentWeight != null ? currentWeight.toString().replace(".", ",") : "",
  );
  const [goalValue, setGoalValue] = useState(
    weightGoal != null ? weightGoal.toString().replace(".", ",") : "",
  );

  // Estado de save independente por coluna.
  const [startState, setStartState] = useState<SaveState>("idle");
  const [currentState, setCurrentState] = useState<SaveState>("idle");
  const [goalState, setGoalState] = useState<SaveState>("idle");

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Refs pros timers de "Salvo ✓" — cancela se o componente desmontar.
  const timersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  useEffect(
    () => () => {
      timersRef.current.forEach((t) => clearTimeout(t));
      timersRef.current = [];
    },
    [],
  );

  function parseKg(value: string): number | null {
    const n = Number(value.replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }

  function flashSaved(setter: (s: SaveState) => void) {
    setter("saved");
    const t = setTimeout(() => setter("idle"), 2000);
    timersRef.current.push(t);
  }

  function handleSaveStart() {
    setError(null);
    const v = parseKg(startValue);
    if (v === null) {
      setError("Informe o peso inicial (entre 20 e 400 kg).");
      return;
    }
    if (v < 20 || v > 400) {
      setError("Peso inicial deve estar entre 20 e 400 kg.");
      return;
    }
    startTransition(async () => {
      setStartState("saving");
      try {
        await updateGoalWeights({
          weight_goal_kg: parseKg(goalValue),
          weight_goal_start_kg: v,
        });
        flashSaved(setStartState);
      } catch (err) {
        setStartState("idle");
        setError(err instanceof Error ? err.message : "Erro ao salvar.");
      }
    });
  }

  function handleSaveCurrent() {
    setError(null);
    const v = parseKg(currentValue);
    if (v === null) {
      setError("Informe o peso atual (entre 20 e 400 kg).");
      return;
    }
    if (v < 20 || v > 400) {
      setError("Peso atual deve estar entre 20 e 400 kg.");
      return;
    }
    startTransition(async () => {
      setCurrentState("saving");
      try {
        await logWeight(v);
        flashSaved(setCurrentState);
      } catch (err) {
        setCurrentState("idle");
        setError(err instanceof Error ? err.message : "Erro ao salvar.");
      }
    });
  }

  function handleSaveGoal() {
    setError(null);
    const v = parseKg(goalValue);
    if (v === null) {
      setError("Informe a meta de peso (entre 20 e 400 kg).");
      return;
    }
    if (v < 20 || v > 400) {
      setError("Meta de peso deve estar entre 20 e 400 kg.");
      return;
    }
    startTransition(async () => {
      setGoalState("saving");
      try {
        await updateGoalWeights({
          weight_goal_kg: v,
          weight_goal_start_kg: parseKg(startValue),
        });
        flashSaved(setGoalState);
      } catch (err) {
        setGoalState("idle");
        setError(err instanceof Error ? err.message : "Erro ao salvar.");
      }
    });
  }

  // Barra de progresso (derivada só pra leitura — não afeta os inputs).
  const startNum = parseKg(startValue);
  const goalNum = parseKg(goalValue);
  const currentNum = currentWeight ?? parseKg(currentValue);

  const totalToGo =
    startNum != null && goalNum != null ? Math.max(0, startNum - goalNum) : 0;
  const lost =
    startNum != null && currentNum != null
      ? Math.max(0, startNum - currentNum)
      : 0;
  const pct =
    totalToGo > 0 ? Math.min(100, Math.round((lost / totalToGo) * 100)) : 0;
  const showProgress = startNum != null && goalNum != null && totalToGo > 0;

  return (
    <div className="rounded-2xl bg-moss-soft/40 p-4 sm:p-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <WeightInput
          label="Peso inicial"
          value={startValue}
          onChange={(v) => {
            setStartValue(v);
            setStartState("idle");
          }}
          onSave={handleSaveStart}
          saveState={startState}
          isPending={isPending}
        />
        <WeightInput
          label="Peso atual"
          value={currentValue}
          onChange={(v) => {
            setCurrentValue(v);
            setCurrentState("idle");
          }}
          onSave={handleSaveCurrent}
          saveState={currentState}
          isPending={isPending}
          highlight
        />
        <WeightInput
          label="Meta"
          value={goalValue}
          onChange={(v) => {
            setGoalValue(v);
            setGoalState("idle");
          }}
          onSave={handleSaveGoal}
          saveState={goalState}
          isPending={isPending}
        />
      </div>

      {showProgress && (
        <>
          <div className="mt-4">
            <ProgressBar
              value={lost}
              max={Math.max(totalToGo, 0.1)}
              colorClass="bg-moss-gradient"
              height="md"
              showValue={false}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[12px] text-ink-soft">
            <span>
              <strong className="font-mono text-ink">
                {lost.toFixed(1).replace(".", ",")} kg
              </strong>{" "}
              perdidos de {totalToGo.toFixed(1).replace(".", ",")} kg
            </span>
            <span className="font-mono font-semibold text-moss-dark">
              {pct}%
            </span>
          </div>
        </>
      )}

      {error && (
        <p className="mt-3 text-[12px] text-ember-dark" role="alert">
          {error}
        </p>
      )}

      <p className="mt-3 text-[11px] text-ink-faint">
        Salvar <strong>peso atual</strong> registra uma nova medição e
        atualiza a Evolução do peso. Os outros dois ficam guardados na
        sua meta.
      </p>
    </div>
  );
}

interface WeightInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
  saveState: SaveState;
  isPending: boolean;
  highlight?: boolean;
}

function WeightInput({
  label,
  value,
  onChange,
  onSave,
  saveState,
  isPending,
  highlight = false,
}: WeightInputProps) {
  return (
    <div>
      <TextField
        label={label}
        type="text"
        inputMode="decimal"
        size="lg"
        value={value}
        placeholder="—"
        trailingAdornment="kg"
        onChange={(e) => onChange(e.target.value)}
        onBlur={(e) => {
          // Auto-formata vírgula → ponto pra visual ficar BR-friendly.
          const v = e.target.value.replace(".", ",");
          if (v !== e.target.value) onChange(v);
        }}
      />
      <div className="mt-1.5 flex justify-end">
        <SaveChip state={saveState} disabled={isPending} onClick={onSave} />
      </div>
    </div>
  );
}

function SaveChip({
  state,
  disabled,
  onClick,
}: {
  state: SaveState;
  disabled: boolean;
  onClick: () => void;
}) {
  const label =
    state === "saved" ? "Salvo ✓" : state === "saving" ? "Salvando…" : "Salvar";
  const tone =
    state === "saved"
      ? "bg-moss-soft text-moss-dark border-moss/30"
      : "bg-surface text-ink-soft border-line hover:border-ember/40 hover:text-ember-dark";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center rounded-pill border px-2.5 py-1 text-[11px] font-semibold transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss focus-visible:ring-offset-2 focus-visible:ring-offset-base",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        tone,
      )}
    >
      {label}
    </button>
  );
}

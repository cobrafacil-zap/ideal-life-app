"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { startNewCycle, logDailySymptoms } from "./actions";
import { cn } from "@/lib/cn";
import { todayBR } from "@/lib/datetime";

const flowOptions = [
  { value: "leve", label: "Leve" },
  { value: "moderado", label: "Moderado" },
  { value: "intenso", label: "Intenso" },
];

const symptomOptions = [
  "cólica",
  "dor de cabeça",
  "inchaço",
  "sensibilidade",
  "alterações de humor",
  "acne",
  "cansaço",
  "desejo por alimentos",
];

export function NewCycleForm() {
  const [date, setDate] = useState(todayBR());
  const [flow, setFlow] = useState(flowOptions[1].value);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (date > todayBR()) {
      setError("A data não pode estar no futuro.");
      return;
    }
    startTransition(async () => {
      try {
        await startNewCycle({ start_date: date, flow_intensity: flow });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao registrar.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <TextField
        label="Primeiro dia da menstruação"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        max={todayBR()}
        error={error ?? undefined}
      />
      <div>
        <span
          className="mb-1.5 block text-sm font-medium text-ink-soft"
          id="flow-label"
        >
          Intensidade do fluxo
        </span>
        <div
          className="grid grid-cols-3 gap-2"
          role="radiogroup"
          aria-labelledby="flow-label"
        >
          {flowOptions.map((f) => {
            const active = flow === f.value;
            return (
              <button
                type="button"
                key={f.value}
                role="radio"
                aria-checked={active}
                onClick={() => setFlow(f.value)}
                className={cn(
                  "rounded-xl py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss focus-visible:ring-offset-2 focus-visible:ring-offset-base",
                  active
                    ? "bg-moss-gradient text-white shadow-card"
                    : "bg-line/50 text-ink-soft hover:bg-line"
                )}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>
      <Button
        type="submit"
        loading={isPending}
        variant="secondary"
        fullWidth
      >
        Registrar novo ciclo
      </Button>
    </form>
  );
}

export function DailySymptomsForm({
  initialPain,
  initialSymptoms,
}: {
  initialPain?: number;
  initialSymptoms?: string[];
}) {
  const [pain, setPain] = useState(initialPain ?? 0);
  const [symptoms, setSymptoms] = useState<string[]>(initialSymptoms ?? []);
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(!!initialPain || !!(initialSymptoms && initialSymptoms.length));
  const [error, setError] = useState<string | null>(null);

  function toggleSymptom(s: string) {
    setSymptoms((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
    setSaved(false);
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      try {
        await logDailySymptoms({ pain_level: pain, symptoms, notes });
        setSaved(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao salvar.");
      }
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-1.5 flex items-center justify-between text-sm">
          <label htmlFor="pain-range" className="font-medium text-ink-soft">
            Dor hoje
          </label>
          <span className="font-mono text-ink tabular-nums">{pain}/10</span>
        </div>
        <input
          id="pain-range"
          type="range"
          min={0}
          max={10}
          step={1}
          value={pain}
          onChange={(e) => {
            setPain(Number(e.target.value));
            setSaved(false);
          }}
          className="w-full accent-moss"
          aria-valuemin={0}
          aria-valuemax={10}
          aria-valuenow={pain}
        />
        <div className="mt-1 flex justify-between text-[10px] text-ink-faint">
          <span>Sem dor</span>
          <span>Intensa</span>
        </div>
      </div>

      <div>
        <span className="mb-2 block text-sm font-medium text-ink-soft">
          Sintomas
        </span>
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Sintomas do dia"
        >
          {symptomOptions.map((s) => {
            const active = symptoms.includes(s);
            return (
              <button
                key={s}
                type="button"
                aria-pressed={active}
                onClick={() => toggleSymptom(s)}
                className={cn(
                  "rounded-pill px-3 py-1.5 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss focus-visible:ring-offset-2 focus-visible:ring-offset-base",
                  active
                    ? "bg-moss-gradient text-white shadow-card"
                    : "bg-line/50 text-ink-soft hover:bg-line"
                )}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>

      <TextField
        label="Notas (opcional)"
        placeholder="Algo importante que você queira lembrar hoje."
        value={notes}
        onChange={(e) => {
          setNotes(e.target.value);
          setSaved(false);
        }}
        maxLength={300}
      />

      {error && (
        <p className="text-[12px] text-ember-dark" role="alert">
          {error}
        </p>
      )}

      <Button
        onClick={handleSave}
        loading={isPending}
        disabled={saved}
        variant={saved ? "outline" : "primary"}
        fullWidth
      >
        {saved ? "Registrado" : "Salvar sintomas de hoje"}
      </Button>
    </div>
  );
}

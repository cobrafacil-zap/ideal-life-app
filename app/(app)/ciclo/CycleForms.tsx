"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { startNewCycle, logDailySymptoms } from "./actions";

const flowOptions = ["leve", "moderado", "intenso"];
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
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [flow, setFlow] = useState(flowOptions[1]);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(() => startNewCycle({ start_date: date, flow_intensity: flow }));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <TextField
        label="Primeiro dia da menstruação"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />
      <div>
        <span className="mb-1.5 block text-sm font-medium text-ink-soft">
          Intensidade do fluxo
        </span>
        <div className="flex gap-2">
          {flowOptions.map((f) => (
            <button
              type="button"
              key={f}
              onClick={() => setFlow(f)}
              className={`flex-1 rounded-xl py-2 text-sm capitalize transition-colors ${
                flow === f ? "bg-moss text-white" : "bg-line/50 text-ink-soft"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      <Button type="submit" loading={isPending} variant="secondary" className="w-full">
        Registrar novo ciclo
      </Button>
    </form>
  );
}

export function DailySymptomsForm() {
  const [pain, setPain] = useState(0);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function toggleSymptom(s: string) {
    setSymptoms((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
    setSaved(false);
  }

  function handleSave() {
    startTransition(async () => {
      await logDailySymptoms({ pain_level: pain, symptoms });
      setSaved(true);
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-1.5 flex items-center justify-between text-sm">
          <span className="font-medium text-ink-soft">Dor hoje</span>
          <span className="font-mono">{pain}/10</span>
        </div>
        <input
          type="range"
          min={0}
          max={10}
          value={pain}
          onChange={(e) => {
            setPain(Number(e.target.value));
            setSaved(false);
          }}
          className="w-full accent-moss"
        />
      </div>

      <div>
        <span className="mb-2 block text-sm font-medium text-ink-soft">Sintomas</span>
        <div className="flex flex-wrap gap-2">
          {symptomOptions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => toggleSymptom(s)}
              className={`rounded-pill px-3 py-1.5 text-[13px] capitalize transition-colors ${
                symptoms.includes(s) ? "bg-moss text-white" : "bg-line/50 text-ink-soft"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <Button onClick={handleSave} loading={isPending} disabled={saved} className="w-full">
        {saved ? "Registrado" : "Salvar sintomas de hoje"}
      </Button>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { ProgressRings } from "@/components/ui/ProgressRing";
import { Button } from "@/components/ui/Button";
import { saveCheckin } from "./actions";
import { cn } from "@/lib/cn";

const metrics = [
  { key: "energy" as const, label: "Energia", color: "stroke-ember" },
  { key: "mood" as const, label: "Humor", color: "stroke-moss" },
  { key: "disposition" as const, label: "Disposição", color: "stroke-ink" },
];

const PRESETS = [3, 5, 7, 9];

export function CheckinCard({
  initial,
}: {
  initial: { energy: number; mood: number; disposition: number };
}) {
  const [values, setValues] = useState(initial);
  const [saved, setSaved] = useState(true);
  const [isPending, startTransition] = useTransition();

  function update(key: keyof typeof values, value: number) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function handleSave() {
    startTransition(async () => {
      await saveCheckin(values);
      setSaved(true);
    });
  }

  const overall = Math.round(((values.energy + values.mood + values.disposition) / 30) * 100);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative">
        <ProgressRings
          rings={metrics.map((m) => ({ value: values[m.key], max: 10, color: m.color }))}
          size={180}
          strokeWidth={11}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="font-mono text-2xl font-semibold leading-none">
            {overall}%
          </span>
          <span className="mt-1 text-[11px] text-ink-faint">bem-estar hoje</span>
        </div>
      </div>

      <div className="w-full space-y-4">
        {metrics.map((m) => (
          <div key={m.key}>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <label
                htmlFor={`checkin-${m.key}`}
                className="font-medium text-ink-soft"
              >
                {m.label}
              </label>
              <span className="font-mono text-ink tabular-nums">
                {values[m.key]}/10
              </span>
            </div>
            <input
              id={`checkin-${m.key}`}
              type="range"
              min={0}
              max={10}
              step={1}
              value={values[m.key]}
              onChange={(e) => update(m.key, Number(e.target.value))}
              className="w-full accent-ember"
            />
            <div className="mt-2 flex gap-1.5" role="group" aria-label={`Atalhos para ${m.label}`}>
              {PRESETS.map((preset) => {
                const active = values[m.key] === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => update(m.key, preset)}
                    className={cn(
                      "flex-1 rounded-lg border px-2 py-1 text-[12px] font-mono transition-colors",
                      active
                        ? "border-ember bg-ember-soft text-ember-dark"
                        : "border-line/60 bg-surface text-ink-soft hover:border-ember/40"
                    )}
                    aria-pressed={active}
                  >
                    {preset}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <Button
        onClick={handleSave}
        loading={isPending}
        disabled={saved}
        fullWidth
        variant={saved ? "outline" : "primary"}
      >
        {saved ? "Check-in salvo" : "Salvar check-in"}
      </Button>
    </div>
  );
}

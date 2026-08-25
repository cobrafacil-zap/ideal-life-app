"use client";

import { useState, useTransition } from "react";
import { ProgressRings } from "@/components/ui/ProgressRing";
import { Button } from "@/components/ui/Button";
import { saveCheckin } from "./actions";

const metrics = [
  { key: "energy" as const, label: "Energia", color: "stroke-ember" },
  { key: "mood" as const, label: "Humor", color: "stroke-moss" },
  { key: "disposition" as const, label: "Disposição", color: "stroke-ink" },
];

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

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative">
        <ProgressRings
          rings={metrics.map((m) => ({ value: values[m.key], max: 10, color: m.color }))}
          size={168}
          strokeWidth={11}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-2xl font-semibold">
            {Math.round(((values.energy + values.mood + values.disposition) / 30) * 100)}%
          </span>
          <span className="text-[11px] text-ink-faint">bem-estar hoje</span>
        </div>
      </div>

      <div className="w-full space-y-4">
        {metrics.map((m) => (
          <div key={m.key}>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="font-medium text-ink-soft">{m.label}</span>
              <span className="font-mono text-ink">{values[m.key]}</span>
            </div>
            <input
              type="range"
              min={0}
              max={10}
              value={values[m.key]}
              onChange={(e) => update(m.key, Number(e.target.value))}
              className="w-full accent-ember"
            />
          </div>
        ))}
      </div>

      <Button onClick={handleSave} loading={isPending} disabled={saved} className="w-full">
        {saved ? "Check-in salvo" : "Salvar check-in"}
      </Button>
    </div>
  );
}

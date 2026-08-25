"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { logCardio } from "./actions";

const types = ["esteira", "caminhada", "corrida", "bicicleta", "escada", "eliptico", "outro"];

export function CardioSection({
  minutesThisWeek,
  goalMinutes,
}: {
  minutesThisWeek: number;
  goalMinutes: number;
}) {
  const [type, setType] = useState(types[0]);
  const [duration, setDuration] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const dur = parseInt(duration, 10);
    if (!dur) return;
    startTransition(async () => {
      await logCardio({ type, duration_min: dur });
      setDuration("");
    });
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium text-ink-soft">Meta semanal</span>
        <span className="font-mono">
          {minutesThisWeek} / {goalMinutes} min
        </span>
      </div>
      <ProgressBar value={minutesThisWeek} max={goalMinutes} colorClass="bg-ember" />

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {types.map((t) => (
            <button
              type="button"
              key={t}
              onClick={() => setType(t)}
              className={`shrink-0 rounded-pill px-3.5 py-1.5 text-sm capitalize transition-colors ${
                type === t ? "bg-ember text-white" : "bg-line/50 text-ink-soft"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <TextField
              label="Duração (min)"
              type="text"
              inputMode="numeric"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>
          <Button type="submit" loading={isPending} disabled={!duration}>
            Registrar
          </Button>
        </div>
      </form>
    </div>
  );
}

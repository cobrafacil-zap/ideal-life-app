"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { logCardio } from "./actions";
import { cn } from "@/lib/cn";
import { formatHours } from "@/lib/format";
import { Activity, Flame, HeartPulse } from "lucide-react";

const types = [
  { value: "esteira", label: "Esteira" },
  { value: "caminhada", label: "Caminhada" },
  { value: "corrida", label: "Corrida" },
  { value: "bicicleta", label: "Bicicleta" },
  { value: "escada", label: "Escada" },
  { value: "eliptico", label: "Elíptico" },
  { value: "outro", label: "Outro" },
];

const intensityOptions = [
  { value: "leve", label: "Leve", icon: Activity },
  { value: "moderada", label: "Moderada", icon: HeartPulse },
  { value: "intensa", label: "Intensa", icon: Flame },
];

export function CardioSection({
  minutesThisWeek,
  goalMinutes,
  kcalThisWeek = 0,
}: {
  minutesThisWeek: number;
  goalMinutes: number;
  kcalThisWeek?: number;
}) {
  const [type, setType] = useState(types[0].value);
  const [duration, setDuration] = useState("");
  const [intensity, setIntensity] = useState(intensityOptions[1].value);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const dur = parseFloat(duration.replace(",", "."));
    if (!Number.isFinite(dur) || dur <= 0 || dur > 10) {
      setError("Informe uma duração entre 0,25 e 10 horas.");
      return;
    }
    startTransition(async () => {
      await logCardio({ type, duration_h: dur, intensity });
      setDuration("");
    });
  }

  const completed = minutesThisWeek >= goalMinutes;
  const hoursThisWeek = minutesThisWeek / 60;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium text-ink-soft">Meta semanal</span>
        <span className="font-mono text-ink">
          {formatHours(hoursThisWeek)} / {formatHours(goalMinutes / 60)}
        </span>
      </div>
      <ProgressBar
        value={minutesThisWeek}
        max={goalMinutes}
        colorClass={completed ? "bg-moss-gradient" : "bg-ember-gradient"}
      />
      {kcalThisWeek > 0 && (
        <p className="mt-2 text-[12px] text-ink-soft">
          ≈ <span className="font-mono font-semibold text-ember-dark">{kcalThisWeek} kcal</span> queimadas nesta semana
        </p>
      )}
      {completed && (
        <p className="mt-2 inline-flex items-center gap-1.5 rounded-pill bg-moss-soft px-2.5 py-1 text-[12px] font-semibold text-moss-dark">
          Meta semanal atingida
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <span className="mb-1.5 block text-sm font-medium text-ink-soft">
            Tipo
          </span>
          <div
            className="flex gap-2 overflow-x-auto no-scrollbar pb-1"
            role="radiogroup"
            aria-label="Tipo de cardio"
          >
            {types.map((t) => {
              const active = type === t.value;
              return (
                <button
                  type="button"
                  key={t.value}
                  role="radio"
                  aria-checked={active}
                  onClick={() => setType(t.value)}
                  className={cn(
                    "shrink-0 rounded-pill px-3.5 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2 focus-visible:ring-offset-base",
                    active
                      ? "bg-ember-gradient text-white shadow-card"
                      : "bg-line/50 text-ink-soft hover:bg-line"
                  )}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-medium text-ink-soft">
            Intensidade
          </span>
          <div
            className="grid grid-cols-3 gap-2"
            role="radiogroup"
            aria-label="Intensidade"
          >
            {intensityOptions.map((opt) => {
              const active = intensity === opt.value;
              const Icon = opt.icon;
              return (
                <button
                  type="button"
                  key={opt.value}
                  role="radio"
                  aria-checked={active}
                  onClick={() => setIntensity(opt.value)}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-xl py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2 focus-visible:ring-offset-base",
                    active
                      ? "bg-ember-soft text-ember-dark ring-1 ring-ember/30"
                      : "bg-line/50 text-ink-soft hover:bg-line"
                  )}
                >
                  <Icon size={14} aria-hidden="true" />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1">
            <TextField
              label="Duração (h)"
              type="text"
              inputMode="decimal"
              placeholder="0,5"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              error={error ?? undefined}
              trailingAdornment="h"
            />
          </div>
          <Button
            type="submit"
            loading={isPending}
            disabled={!duration}
            className="sm:w-auto"
          >
            Registrar
          </Button>
        </div>
      </form>
      <p className="mt-2 text-[11px] text-ink-faint">
        Duração em horas. Ex.: 0,5 = 30 min · 1 = 1 h · 1,5 = 1 h 30 min.
        A queima calórica é calculada automaticamente (MET × peso × horas).
      </p>
    </div>
  );
}

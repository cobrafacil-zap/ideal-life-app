"use client";

import { useTransition } from "react";
import { Droplets } from "lucide-react";
import { addWater } from "./actions";
import { cn } from "@/lib/cn";

const quickAmounts = [
  { ml: 200, label: "Copo" },
  { ml: 300, label: "Xícara" },
  { ml: 500, label: "Garrafa" },
];

const RING_SIZE = 120;
const STROKE = 10;
const RADIUS = (RING_SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function WaterCard({ consumedMl, goalMl }: { consumedMl: number; goalMl: number }) {
  const [isPending, startTransition] = useTransition();

  function handleAdd(amount: number) {
    startTransition(async () => {
      await addWater(amount);
    });
  }

  const litersConsumed = (consumedMl / 1000).toFixed(2).replace(".", ",");
  const litersGoal = (goalMl / 1000).toFixed(1).replace(".", ",");
  const remainingMl = Math.max(goalMl - consumedMl, 0);
  const completed = consumedMl >= goalMl;
  const pct = goalMl > 0 ? Math.max(0, Math.min(100, (consumedMl / goalMl) * 100)) : 0;
  const dashOffset = CIRCUMFERENCE * (1 - pct / 100);

  return (
    <div className="flex items-center gap-5">
      <div className="relative shrink-0">
        <svg
          width={RING_SIZE}
          height={RING_SIZE}
          viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
          className="-rotate-90"
          role="img"
          aria-label={`${Math.round(pct)}% da meta de água`}
        >
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="var(--line)"
            strokeOpacity="0.4"
            strokeWidth={STROKE}
          />
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="var(--moss)"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            className="transition-[stroke-dashoffset] duration-700 ease-out"
          />
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <Droplets
            size={22}
            className={cn(completed ? "text-moss-dark" : "text-moss")}
            strokeWidth={2.2}
            aria-hidden="true"
          />
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-3xl font-bold leading-none text-ink tabular-nums">
            {litersConsumed}L
          </span>
          <span className="text-[13px] text-ink-soft">de {litersGoal}L</span>
        </div>

        {completed ? (
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-pill bg-moss-soft px-2.5 py-1 text-[12px] font-semibold text-moss-dark">
            Meta atingida — continue se sentir sede.
          </p>
        ) : (
          <p className="mt-2 text-[12px] text-ink-soft">
            Faltam{" "}
            <span className="font-mono font-semibold text-ink">
              {(remainingMl / 1000).toFixed(2).replace(".", ",")}L
            </span>{" "}
            para fechar a meta.
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {quickAmounts.map(({ ml, label }) => (
            <button
              key={ml}
              type="button"
              onClick={() => handleAdd(ml)}
              disabled={isPending}
              aria-label={`Registrar ${ml}ml (${label})`}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5",
                "bg-moss-soft text-moss-dark text-[12px] font-semibold",
                "hover:bg-moss-soft/80 active:scale-[0.97] disabled:opacity-60",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss focus-visible:ring-offset-2 focus-visible:ring-offset-base",
                "transition-all",
              )}
            >
              <span aria-hidden="true">+</span>
              {ml}ml
              <span className="font-normal text-moss-dark/70">· {label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

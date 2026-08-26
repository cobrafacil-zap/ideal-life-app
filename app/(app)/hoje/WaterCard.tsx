"use client";

import { useTransition } from "react";
import { Droplets, Plus } from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { addWater } from "./actions";

const quickAmounts = [
  { ml: 200, label: "Copo" },
  { ml: 300, label: "Xícara" },
  { ml: 500, label: "Garrafa" },
];

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

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-moss-soft text-moss-dark">
            <Droplets size={16} aria-hidden="true" />
          </span>
          <span className="font-semibold">Hoje</span>
        </div>
        <span className="font-mono text-sm text-ink-soft">
          {litersConsumed}L / {litersGoal}L
        </span>
      </div>

      <ProgressBar
        value={consumedMl}
        max={goalMl}
        colorClass={completed ? "bg-moss-gradient" : "bg-moss"}
        showValue
      />

      {completed ? (
        <p className="mt-3 rounded-xl bg-moss-soft px-3 py-2 text-sm font-medium text-moss-dark">
          Meta de água atingida — continue se sentir sede.
        </p>
      ) : (
        <p className="mt-2 text-[12px] text-ink-faint">
          Faltam {(remainingMl / 1000).toFixed(2).replace(".", ",")}L para fechar a meta.
        </p>
      )}

      <div className="mt-4 grid grid-cols-3 gap-2">
        {quickAmounts.map(({ ml, label }) => (
          <button
            key={ml}
            type="button"
            onClick={() => handleAdd(ml)}
            disabled={isPending}
            aria-label={`Registrar ${ml}ml (${label})`}
            className="flex flex-col items-center justify-center gap-0.5 rounded-xl bg-moss-soft py-2.5 text-xs font-semibold text-moss-dark transition-all hover:bg-moss-soft/80 active:scale-[0.97] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss focus-visible:ring-offset-2 focus-visible:ring-offset-base"
          >
            <span className="flex items-center gap-1">
              <Plus size={12} aria-hidden="true" />
              {ml}ml
            </span>
            <span className="text-[10px] font-normal text-moss-dark/80">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

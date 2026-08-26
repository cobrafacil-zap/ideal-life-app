"use client";

import { useTransition } from "react";
import { Droplets } from "lucide-react";
import { addWater } from "./actions";
import { cn } from "@/lib/cn";
import { formatLiters } from "@/lib/format";

const quickAmounts = [
  { ml: 200, label: "Copo" },
  { ml: 300, label: "Xícara" },
  { ml: 500, label: "Garrafa" },
];

/**
 * Card de água — versão compacta. Sem ring (já está no DaySummaryPanel).
 * Header com totais + botões de quick-add horizontais em chips.
 */

export function WaterCard({ consumedMl, goalMl }: { consumedMl: number; goalMl: number }) {
  const [isPending, startTransition] = useTransition();

  function handleAdd(amount: number) {
    startTransition(async () => {
      await addWater(amount);
    });
  }

  const remainingMl = Math.max(goalMl - consumedMl, 0);
  const completed = consumedMl >= goalMl;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-display text-3xl font-bold leading-none tabular-nums text-ink">
          {formatLiters(consumedMl)}
        </p>
        <p className="text-[12px] text-ink-soft">
          de {formatLiters(goalMl)}
        </p>
      </div>

      <p className="mt-2 text-[12px] text-ink-soft">
        {completed ? (
          <span className="inline-flex items-center gap-1.5 rounded-pill bg-moss-soft px-2 py-0.5 font-semibold text-moss-dark">
            Meta atingida ✨
          </span>
        ) : (
          <>
            Faltam{" "}
            <span className="font-mono font-semibold text-ink">
              {formatLiters(remainingMl)}
            </span>{" "}
            para sua meta.
          </>
        )}
      </p>

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
            <Droplets size={12} aria-hidden="true" />
            +{ml}ml
            <span className="font-normal text-moss-dark/70">· {label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useTransition } from "react";
import { Droplets, Plus } from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { addWater } from "./actions";

const quickAmounts = [200, 300, 500];

export function WaterCard({ consumedMl, goalMl }: { consumedMl: number; goalMl: number }) {
  const [isPending, startTransition] = useTransition();

  function handleAdd(amount: number) {
    startTransition(async () => {
      await addWater(amount);
    });
  }

  const litersConsumed = (consumedMl / 1000).toFixed(2);
  const litersGoal = (goalMl / 1000).toFixed(1);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Droplets size={18} className="text-moss" />
          <span className="font-semibold">Água</span>
        </div>
        <span className="font-mono text-sm text-ink-soft">
          {litersConsumed}L / {litersGoal}L
        </span>
      </div>

      <ProgressBar value={consumedMl} max={goalMl} colorClass="bg-moss-gradient bg-moss" />

      <div className="mt-4 flex gap-2">
        {quickAmounts.map((amount) => (
          <button
            key={amount}
            onClick={() => handleAdd(amount)}
            disabled={isPending}
            className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-moss-soft py-2.5 text-sm font-semibold text-moss-dark active:scale-[0.97] transition-transform disabled:opacity-60"
          >
            <Plus size={14} />
            {amount}ml
          </button>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";
import { updatePhysicalProfile } from "./actions";

export function PhysicalProfileForm({
  heightCm,
  weightGoalKg,
}: {
  heightCm: number | null;
  weightGoalKg: number | null;
}) {
  const [height, setHeight] = useState(heightCm?.toString() ?? "");
  const [goal, setGoal] = useState(weightGoalKg?.toString() ?? "");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const h = parseFloat(height.replace(",", "."));
    const g = parseFloat(goal.replace(",", "."));
    startTransition(async () => {
      await updatePhysicalProfile({
        height_cm: Number.isNaN(h) ? null : h,
        weight_goal_kg: Number.isNaN(g) ? null : g,
      });
      setSaved(true);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          label="Altura (cm)"
          type="text"
          inputMode="decimal"
          value={height}
          placeholder="170"
          trailingAdornment="cm"
          onChange={(e) => {
            setHeight(e.target.value);
            setSaved(false);
          }}
        />
        <TextField
          label="Meta de peso (kg)"
          type="text"
          inputMode="decimal"
          value={goal}
          placeholder="70,0"
          trailingAdornment="kg"
          onChange={(e) => {
            setGoal(e.target.value);
            setSaved(false);
          }}
        />
      </div>
      <Button
        type="submit"
        loading={isPending}
        variant={saved ? "outline" : "secondary"}
        fullWidth
      >
        {saved ? "Dados salvos" : "Salvar dados"}
      </Button>
    </form>
  );
}

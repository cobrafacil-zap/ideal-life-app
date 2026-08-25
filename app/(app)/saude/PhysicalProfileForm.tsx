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
    startTransition(async () => {
      await updatePhysicalProfile({
        height_cm: parseFloat(height.replace(",", ".")),
        weight_goal_kg: parseFloat(goal.replace(",", ".")),
      });
      setSaved(true);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <TextField
          label="Altura (cm)"
          type="text"
          inputMode="decimal"
          value={height}
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
          onChange={(e) => {
            setGoal(e.target.value);
            setSaved(false);
          }}
        />
      </div>
      <Button type="submit" loading={isPending} variant="secondary" className="w-full">
        {saved ? "Salvo" : "Salvar dados"}
      </Button>
    </form>
  );
}

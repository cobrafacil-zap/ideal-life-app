"use client";

import { useState, useTransition } from "react";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";
import { updateGoals } from "./actions";

export function GoalsForm({
  waterGoalMl,
  cardioGoalMin,
  workoutGoal,
  calorieGoal,
}: {
  waterGoalMl: number;
  cardioGoalMin: number;
  workoutGoal: number;
  calorieGoal: number | null;
}) {
  const [water, setWater] = useState(String(waterGoalMl));
  const [cardio, setCardio] = useState(String(cardioGoalMin));
  const [workouts, setWorkouts] = useState(String(workoutGoal));
  const [calories, setCalories] = useState(calorieGoal ? String(calorieGoal) : "");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await updateGoals({
        water_goal_ml: parseInt(water, 10),
        cardio_weekly_goal_min: parseInt(cardio, 10),
        workout_weekly_goal: parseInt(workouts, 10),
        calorie_goal: calories ? parseInt(calories, 10) : null,
      });
      setSaved(true);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <TextField
          label="Meta de água (ml)"
          type="text"
          inputMode="numeric"
          value={water}
          onChange={(e) => {
            setWater(e.target.value);
            setSaved(false);
          }}
        />
        <TextField
          label="Cardio semanal (min)"
          type="text"
          inputMode="numeric"
          value={cardio}
          onChange={(e) => {
            setCardio(e.target.value);
            setSaved(false);
          }}
        />
        <TextField
          label="Treinos por semana"
          type="text"
          inputMode="numeric"
          value={workouts}
          onChange={(e) => {
            setWorkouts(e.target.value);
            setSaved(false);
          }}
        />
        <TextField
          label="Meta calórica (opcional)"
          type="text"
          inputMode="numeric"
          value={calories}
          onChange={(e) => {
            setCalories(e.target.value);
            setSaved(false);
          }}
        />
      </div>
      <Button type="submit" loading={isPending} className="w-full">
        {saved ? "Metas salvas" : "Salvar metas"}
      </Button>
    </form>
  );
}

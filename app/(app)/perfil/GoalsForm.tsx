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
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const w = parseInt(water, 10);
    const c = parseInt(cardio, 10);
    const t = parseInt(workouts, 10);
    const cal = calories ? parseInt(calories, 10) : null;
    if (!w || w < 250 || w > 10000) {
      setError("Meta de água deve estar entre 250 e 10.000 ml.");
      return;
    }
    if (!c || c < 0 || c > 2000) {
      setError("Meta de cardio deve estar entre 0 e 2.000 min/semana.");
      return;
    }
    if (!t || t < 0 || t > 14) {
      setError("Meta de treinos deve estar entre 0 e 14 por semana.");
      return;
    }
    if (cal !== null && (cal < 800 || cal > 6000)) {
      setError("Meta calórica deve estar entre 800 e 6.000 kcal.");
      return;
    }
    startTransition(async () => {
      try {
        await updateGoals({
          water_goal_ml: w,
          cardio_weekly_goal_min: c,
          workout_weekly_goal: t,
          calorie_goal: cal,
        });
        setSaved(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao salvar.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          label="Meta de água (ml)"
          type="text"
          inputMode="numeric"
          value={water}
          onChange={(e) => {
            setWater(e.target.value);
            setSaved(false);
          }}
          trailingAdornment="ml/dia"
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
          trailingAdornment="min/sem"
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
          trailingAdornment="x/sem"
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
          placeholder="2000"
          trailingAdornment="kcal"
        />
      </div>

      {error && (
        <p className="text-[12px] text-ember-dark" role="alert">
          {error}
        </p>
      )}

      <Button
        type="submit"
        loading={isPending}
        fullWidth
        variant={saved ? "outline" : "primary"}
      >
        {saved ? "Metas salvas" : "Salvar metas"}
      </Button>
    </form>
  );
}

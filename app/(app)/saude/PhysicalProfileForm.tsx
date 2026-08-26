"use client";

import { useState, useTransition } from "react";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";
import { updatePhysicalProfile } from "./actions";
import { cn } from "@/lib/cn";
import { todayBR } from "@/lib/datetime";

type Sex = "feminino" | "masculino" | "nao_informado";
type Activity = "sedentario" | "leve" | "moderado" | "ativo" | "muito_ativo";

const ACTIVITY_OPTIONS: { value: Activity; label: string }[] = [
  { value: "sedentario", label: "Sedentário" },
  { value: "leve", label: "Leve (1–3x/sem)" },
  { value: "moderado", label: "Moderado (3–5x/sem)" },
  { value: "ativo", label: "Ativo (6–7x/sem)" },
  { value: "muito_ativo", label: "Atleta" },
];

export function PhysicalProfileForm({
  heightCm,
  weightGoalKg,
  birthDate,
  biologicalSex,
  activityLevel,
}: {
  heightCm: number | null;
  weightGoalKg: number | null;
  birthDate?: string | null;
  biologicalSex?: Sex | null;
  activityLevel?: Activity | null;
}) {
  const [height, setHeight] = useState(heightCm?.toString() ?? "");
  const [goal, setGoal] = useState(weightGoalKg?.toString() ?? "");
  const [dob, setDob] = useState(birthDate ?? "");
  const [sex, setSex] = useState<Sex | "">(biologicalSex ?? "");
  const [activity, setActivity] = useState<Activity | "">(activityLevel ?? "");
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
        birth_date: dob || null,
        biological_sex: sex || null,
        activity_level: activity || null,
      });
      setSaved(true);
    });
  }

  const selectClass = cn(
    "block w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss focus-visible:ring-offset-2 focus-visible:ring-offset-base",
  );

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
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-soft">
            Data de nascimento
          </span>
          <input
            type="date"
            value={dob}
            max={todayBR()}
            onChange={(e) => {
              setDob(e.target.value);
              setSaved(false);
            }}
            className={selectClass}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-soft">
            Sexo biológico
          </span>
          <select
            value={sex}
            onChange={(e) => {
              setSex(e.target.value as Sex | "");
              setSaved(false);
            }}
            className={selectClass}
          >
            <option value="">Não informar</option>
            <option value="feminino">Feminino</option>
            <option value="masculino">Masculino</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-soft">
            Nível de atividade
          </span>
          <select
            value={activity}
            onChange={(e) => {
              setActivity(e.target.value as Activity | "");
              setSaved(false);
            }}
            className={selectClass}
          >
            <option value="">Selecione…</option>
            {ACTIVITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="text-[11px] text-ink-faint">
        Esses dados ficam salvos no seu perfil e permitem calcular IMC,
        gasto calórico diário e sugerir uma dieta personalizada.
      </p>
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

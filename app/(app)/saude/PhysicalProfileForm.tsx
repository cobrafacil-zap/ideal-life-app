"use client";

import { useState, useTransition } from "react";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";
import { updatePhysicalProfile } from "./actions";
import { cn } from "@/lib/cn";
import { todayBR } from "@/lib/datetime";

type Sex = "feminino" | "masculino" | "nao_informado";
type Activity = "sedentario" | "leve" | "moderado" | "ativo" | "muito_ativo";
type GoalType = "perder" | "manter" | "ganhar" | "recompor";

const ACTIVITY_OPTIONS: { value: Activity; label: string }[] = [
  { value: "sedentario", label: "Sedentário" },
  { value: "leve", label: "Leve (1–3x/sem)" },
  { value: "moderado", label: "Moderado (3–5x/sem)" },
  { value: "ativo", label: "Ativo (6–7x/sem)" },
  { value: "muito_ativo", label: "Atleta" },
];

const GOAL_OPTIONS: { value: GoalType; label: string; hint: string }[] = [
  { value: "perder", label: "Perder peso", hint: "Inclui meta de queima semanal" },
  { value: "manter", label: "Manter", hint: "Foco em manter o peso atual" },
  { value: "ganhar", label: "Ganhar massa", hint: "Meta acima do peso atual" },
  { value: "recompor", label: "Recompor", hint: "Manter peso, ajustar composição" },
];

export function PhysicalProfileForm({
  heightCm,
  weightGoalKg,
  weightStartKg,
  weeklyRateKg,
  birthDate,
  biologicalSex,
  activityLevel,
  goalType,
}: {
  heightCm: number | null;
  weightGoalKg: number | null;
  weightStartKg: number | null;
  weeklyRateKg: number | null;
  birthDate?: string | null;
  biologicalSex?: Sex | null;
  activityLevel?: Activity | null;
  goalType?: GoalType | null;
}) {
  const [height, setHeight] = useState(heightCm?.toString() ?? "");
  const [goal, setGoal] = useState(weightGoalKg?.toString() ?? "");
  const [start, setStart] = useState(weightStartKg?.toString() ?? "");
  const [rate, setRate] = useState(weeklyRateKg?.toString() ?? "0,5");
  const [goalTypeValue, setGoalTypeValue] = useState<GoalType | "">(
    goalType ?? "manter"
  );
  const [dob, setDob] = useState(birthDate ?? "");
  const [sex, setSex] = useState<Sex | "">(biologicalSex ?? "");
  const [activity, setActivity] = useState<Activity | "">(activityLevel ?? "");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const h = parseFloat(height.replace(",", "."));
    const g = parseFloat(goal.replace(",", "."));
    const s = parseFloat(start.replace(",", "."));
    const r = parseFloat(rate.replace(",", "."));

    // Validação simples (defesa em profundidade; o CHECK no DB também barra).
    if (Number.isFinite(h) && (h < 100 || h > 250)) {
      setError("Altura deve estar entre 100 e 250 cm.");
      return;
    }
    if (Number.isFinite(g) && (g < 20 || g > 400)) {
      setError("Meta de peso deve estar entre 20 e 400 kg.");
      return;
    }
    if (goalTypeValue === "perder" && (!Number.isFinite(s) || s < 20 || s > 400)) {
      setError("Informe o peso inicial (entre 20 e 400 kg) para começar a meta de perda.");
      return;
    }
    if (
      goalTypeValue === "perder" &&
      Number.isFinite(r) &&
      (r < 0.1 || r > 1.0)
    ) {
      setError("Taxa semanal deve estar entre 0,1 e 1,0 kg/semana.");
      return;
    }

    startTransition(async () => {
      try {
        await updatePhysicalProfile({
          height_cm: Number.isNaN(h) ? null : h,
          weight_goal_kg: Number.isNaN(g) ? null : g,
          weight_goal_start_kg:
            goalTypeValue === "perder" && !Number.isNaN(s) ? s : null,
          weekly_rate_kg:
            goalTypeValue === "perder" && !Number.isNaN(r) ? r : null,
          goal_type: goalTypeValue || null,
          birth_date: dob || null,
          biological_sex: sex || null,
          activity_level: activity || null,
        });
        setSaved(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao salvar.");
      }
    });
  }

  const selectClass = cn(
    "block w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss focus-visible:ring-offset-2 focus-visible:ring-offset-base",
  );

  const isLoseGoal = goalTypeValue === "perder";

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
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-soft">
            Objetivo
          </span>
          <select
            value={goalTypeValue}
            onChange={(e) => {
              setGoalTypeValue(e.target.value as GoalType | "");
              setSaved(false);
            }}
            className={selectClass}
          >
            {GOAL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div
        className={cn(
          "grid gap-3 transition-opacity",
          isLoseGoal ? "sm:grid-cols-3" : "sm:grid-cols-1"
        )}
      >
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
        {isLoseGoal && (
          <TextField
            label="Peso inicial (kg)"
            type="text"
            inputMode="decimal"
            value={start}
            placeholder="85,0"
            trailingAdornment="kg"
            hint="Capturado ao definir a meta"
            onChange={(e) => {
              setStart(e.target.value);
              setSaved(false);
            }}
          />
        )}
        {isLoseGoal && (
          <TextField
            label="Taxa semanal (kg/sem)"
            type="text"
            inputMode="decimal"
            value={rate}
            placeholder="0,5"
            trailingAdornment="kg/sem"
            hint="Sugestão: 0,3–0,7 kg/sem"
            onChange={(e) => {
              setRate(e.target.value);
              setSaved(false);
            }}
          />
        )}
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

      {error && (
        <p className="text-[12px] text-ember-dark" role="alert">
          {error}
        </p>
      )}

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
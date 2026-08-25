"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { Camera } from "lucide-react";
import { logMeal } from "./actions";

const mealTypes = [
  { value: "cafe_da_manha", label: "Café da manhã" },
  { value: "almoco", label: "Almoço" },
  { value: "lanche", label: "Lanche" },
  { value: "jantar", label: "Jantar" },
  { value: "ceia", label: "Ceia" },
  { value: "outra", label: "Outra" },
];

export function MealLogForm() {
  const [mealType, setMealType] = useState(mealTypes[0].value);
  const [description, setDescription] = useState("");
  const [calories, setCalories] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await logMeal({
        meal_type: mealType,
        description,
        calories: calories ? parseFloat(calories) : undefined,
      });
      setDescription("");
      setCalories("");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {mealTypes.map((m) => (
          <button
            type="button"
            key={m.value}
            onClick={() => setMealType(m.value)}
            className={`shrink-0 rounded-pill px-3.5 py-1.5 text-sm transition-colors ${
              mealType === m.value ? "bg-ember text-white" : "bg-line/50 text-ink-soft"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <TextField
        label="O que você comeu?"
        placeholder="Arroz, feijão, frango grelhado e salada"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
      />

      <TextField
        label="Calorias estimadas (opcional)"
        type="text"
        inputMode="numeric"
        placeholder="520"
        value={calories}
        onChange={(e) => setCalories(e.target.value)}
      />

      <button
        type="button"
        disabled
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line py-3 text-sm text-ink-faint"
        title="Análise de foto por IA chega na próxima etapa"
      >
        <Camera size={16} />
        Enviar foto do prato (em breve — análise por IA)
      </button>

      <Button type="submit" loading={isPending} disabled={!description} className="w-full">
        Salvar refeição
      </Button>
    </form>
  );
}

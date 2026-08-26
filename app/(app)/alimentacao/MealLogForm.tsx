"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { Camera, Salad, ChevronDown, Calculator } from "lucide-react";
import { logMeal } from "./actions";
import { cn } from "@/lib/cn";
import {
  CalorieCalculator,
  type CalculatedTotals,
} from "@/components/alimentacao/CalorieCalculator";

const mealTypes = [
  { value: "cafe_da_manha", label: "Café", fullLabel: "Café da manhã" },
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
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [showMacros, setShowMacros] = useState(false);
  const [showCalc, setShowCalc] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  function handleCalculatorApply(totals: CalculatedTotals) {
    setCalories(String(totals.calories));
    setProtein(String(totals.protein).replace(/\.0$/, ""));
    setCarbs(String(totals.carbs).replace(/\.0$/, ""));
    setFat(String(totals.fat).replace(/\.0$/, ""));
    setShowMacros(true);
    setShowCalc(false);
    setFeedback("Totais calculados — revise e salve.");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) return;
    setFeedback(null);
    startTransition(async () => {
      try {
        await logMeal({
          meal_type: mealType,
          description: description.trim(),
          calories: calories ? parseFloat(calories.replace(",", ".")) : undefined,
          protein_g: protein ? parseFloat(protein.replace(",", ".")) : undefined,
          carbs_g: carbs ? parseFloat(carbs.replace(",", ".")) : undefined,
          fat_g: fat ? parseFloat(fat.replace(",", ".")) : undefined,
        });
        setDescription("");
        setCalories("");
        setProtein("");
        setCarbs("");
        setFat("");
        setFeedback("Refeição registrada.");
      } catch (err) {
        setFeedback(
          err instanceof Error ? err.message : "Não foi possível registrar."
        );
      }
    });
  }

  const selectedLabel =
    mealTypes.find((m) => m.value === mealType)?.fullLabel ?? "Refeição";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink-soft">
          Tipo
        </label>
        <div
          className="flex gap-2 overflow-x-auto no-scrollbar pb-1"
          role="radiogroup"
          aria-label="Tipo de refeição"
        >
          {mealTypes.map((m) => {
            const active = mealType === m.value;
            return (
              <button
                type="button"
                key={m.value}
                role="radio"
                aria-checked={active}
                onClick={() => setMealType(m.value)}
                className={cn(
                  "shrink-0 rounded-pill px-3.5 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2 focus-visible:ring-offset-base",
                  active
                    ? "bg-ember-gradient text-white shadow-card"
                    : "bg-line/50 text-ink-soft hover:bg-line"
                )}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      <TextField
        label={`O que você comeu em ${selectedLabel.toLowerCase()}?`}
        placeholder="Arroz, feijão, frango grelhado e salada"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
        maxLength={500}
        hint={`${description.length}/500 caracteres`}
      />

      <div className="grid gap-2 sm:grid-cols-3">
        <TextField
          label="Calorias"
          type="text"
          inputMode="numeric"
          placeholder="520"
          value={calories}
          onChange={(e) => setCalories(e.target.value)}
          trailingAdornment="kcal"
        />
        <button
          type="button"
          onClick={() => setShowCalc((v) => !v)}
          aria-expanded={showCalc}
          className="mt-6 inline-flex items-center justify-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink-soft hover:border-ember/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2 focus-visible:ring-offset-base"
        >
          <Calculator size={14} aria-hidden="true" />
          {showCalc ? "Fechar" : "Calcular"}
          <ChevronDown
            size={14}
            className={cn("transition-transform", showCalc && "rotate-180")}
            aria-hidden="true"
          />
        </button>
        <button
          type="button"
          onClick={() => setShowMacros((v) => !v)}
          aria-expanded={showMacros}
          className="mt-6 inline-flex items-center justify-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink-soft hover:border-ember/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2 focus-visible:ring-offset-base"
        >
          <Salad size={14} aria-hidden="true" />
          {showMacros ? "Ocultar" : "Adicionar"} macros
          <ChevronDown
            size={14}
            className={cn("transition-transform", showMacros && "rotate-180")}
            aria-hidden="true"
          />
        </button>
      </div>

      {showCalc && (
        <div className="rounded-2xl border border-line/60 bg-base/40 p-3 animate-fade-up">
          <CalorieCalculator
            onApply={handleCalculatorApply}
            onApplied={() => setShowCalc(false)}
          />
        </div>
      )}

      {showMacros && (
        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-line/60 bg-base/60 p-3 animate-fade-up">
          <TextField
            label="Proteína"
            type="text"
            inputMode="decimal"
            placeholder="30"
            value={protein}
            onChange={(e) => setProtein(e.target.value)}
            trailingAdornment="g"
          />
          <TextField
            label="Carbs"
            type="text"
            inputMode="decimal"
            placeholder="60"
            value={carbs}
            onChange={(e) => setCarbs(e.target.value)}
            trailingAdornment="g"
          />
          <TextField
            label="Gordura"
            type="text"
            inputMode="decimal"
            placeholder="15"
            value={fat}
            onChange={(e) => setFat(e.target.value)}
            trailingAdornment="g"
          />
        </div>
      )}

      <div
        className="flex items-center gap-2 rounded-xl border border-dashed border-line bg-surface/60 px-3 py-2.5 text-[13px] text-ink-soft"
        title="Análise de foto por IA chega na próxima etapa"
      >
        <Camera size={16} aria-hidden="true" />
        <span>Enviar foto do prato (em breve — análise por IA).</span>
      </div>

      {feedback && (
        <p
          className="text-[13px] text-ink-soft"
          role="status"
          aria-live="polite"
        >
          {feedback}
        </p>
      )}

      <Button
        type="submit"
        loading={isPending}
        disabled={!description.trim()}
        fullWidth
      >
        Salvar refeição
      </Button>
    </form>
  );
}
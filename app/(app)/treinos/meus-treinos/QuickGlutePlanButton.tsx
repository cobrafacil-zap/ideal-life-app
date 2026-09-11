"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { addPlanExercise, createWorkoutPlan } from "../actions";

/** Plano "Treino de Glúteo" pré-preenchido. Os nomes batem com o
 *  seed da biblioteca (vide `20260828_exercise_library_v2_data.sql`).
 *  Mantemos 6 exercícios cobrindo o espectro: barra, máquina, peso
 *  corporal e cabo — para o usuário poder escolher o que tem acesso. */
const GLUTE_EXERCISES: Array<{ name: string; reps: string }> = [
  { name: "Hip Thrust", reps: "10-12" },
  { name: "Hip Thrust Machine", reps: "10-12" },
  { name: "Glúteo na máquina", reps: "12-15" },
  { name: "Elevação pélvica", reps: "12-15" },
  { name: "Glute Kickback Machine", reps: "12-15" },
  { name: "Coice unilateral no cabo", reps: "12" },
];

/**
 * Botão de atalho que cria um treino de glúteo com 6 exercícios
 * pré-preenchidos em um único clique. Após criar, navega para o
 * editor do plano para que o usuário ajuste séries, cargas ou remova
 * exercícios.
 */
export function QuickGlutePlanButton({
  variant = "primary",
  fullWidth = false,
}: {
  variant?: "primary" | "secondary";
  fullWidth?: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function create() {
    setError(null);
    startTransition(async () => {
      try {
        const { id: planId } = await createWorkoutPlan({
          name: "Treino de Glúteo",
          description:
            "Plano focado em glúteos: 6 exercícios, 3 séries cada. Ajuste à vontade.",
          scheduled_weekday: null,
        });
        // Insere todos os exercícios em paralelo — cada um é independente.
        await Promise.all(
          GLUTE_EXERCISES.map((ex) =>
            addPlanExercise(planId, {
              exercise_id: null,
              exercise_name: ex.name,
              target_sets: 3,
              target_reps: ex.reps,
              target_load: null,
              load_unit: "kg",
            }),
          ),
        );
        router.push(`/treinos/meus-treinos/${planId}`);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao criar treino.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <Button
        type="button"
        onClick={create}
        loading={isPending}
        fullWidth={fullWidth}
        variant={variant}
        leadingIcon={<Sparkles size={14} />}
      >
        Criar treino de glúteo
      </Button>
      {error && (
        <p className="text-[12px] text-ember-dark" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { useStore } from "@/lib/data/store";
import { computeProgress } from "@/lib/progress";
import type { GoalView } from "@/lib/selectors";
import { formatMetric, toISODate } from "@/lib/utils";

export function ProgressUpdateModal({
  view,
  open,
  onClose,
}: {
  view: GoalView | null;
  open: boolean;
  onClose: () => void;
}) {
  const { state, addProgress, updateGoal } = useStore();
  const { toast } = useToast();
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(toISODate());

  useEffect(() => {
    if (!open || !view) return;
    setValue(view.goal.metricCurrent !== null ? String(view.goal.metricCurrent) : "");
    setNote("");
    setDate(toISODate());
  }, [open, view]);

  if (!view) return null;

  const { goal } = view;
  const numeric = Number(value.replace(",", ".")) || 0;
  const projected = computeProgress(
    { ...goal, metricCurrent: numeric },
    view.steps,
  ).total;

  const submit = () => {
    addProgress(goal.id, numeric, note.trim(), date);
    // se o progresso chegou a 100%, a meta é marcada como concluída
    if (projected >= 100 && goal.status === "ativa") {
      updateGoal(goal.id, { status: "concluida", completedAt: new Date().toISOString() });
      toast("Meta concluída! 🏆");
    } else {
      toast("Progresso atualizado.");
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Atualizar progresso"
      description={goal.title}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={submit}>Registrar atualização</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-line bg-ink/[0.02] p-4">
          <div className="flex items-baseline justify-between">
            <span className="text-[12px] font-medium text-ink-faint">Valor atual</span>
            <span className="text-[12px] font-medium text-ink-faint">Objetivo</span>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-display text-xl font-bold tabular text-ink">
              {formatMetric(goal.metricCurrent, goal.metricUnit, state.settings.currency)}
            </span>
            <span className="font-display text-sm font-semibold tabular text-ink-faint">
              {formatMetric(goal.metricTarget, goal.metricUnit, state.settings.currency)}
            </span>
          </div>
        </div>

        <Field
          label={goal.metricUnit ? `Novo valor (${goal.metricUnit})` : "Novo valor"}
          htmlFor="pg-value"
          hint={`Progresso projetado: ${Math.round(projected)}%`}
        >
          <Input
            id="pg-value"
            autoFocus
            inputMode="decimal"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="0"
          />
        </Field>

        <Field label="Data" htmlFor="pg-date">
          <Input id="pg-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>

        <Field label="Anotação" optional htmlFor="pg-note">
          <Textarea
            id="pg-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="O que aconteceu nesse período?"
          />
        </Field>
      </div>
    </Modal>
  );
}

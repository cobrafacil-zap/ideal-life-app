"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Pencil,
  Save,
  Power,
  Check,
  X,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import {
  addPlanExercise,
  createWorkoutPlan,
  deleteWorkoutPlan,
  removePlanExercise,
  reorderPlanExercises,
  updatePlanExercise,
  updateWorkoutPlan,
  type PlanDetail,
} from "./actions";
import { cn } from "@/lib/cn";
import type {
  Exercise,
  PrimaryMuscleGroup,
} from "@/types/database";
import {
  PRIMARY_MUSCLE_LABEL,
  PRIMARY_MUSCLE_BG,
} from "@/lib/workout";

type ExerciseLibraryItem = Pick<
  Exercise,
  "id" | "name" | "primary_muscle" | "user_id"
> & { signedUrl: string | null };

export function PlanEditor({
  plan,
  library,
}: {
  plan: PlanDetail;
  library: ExerciseLibraryItem[];
}) {
  const router = useRouter();
  const [planState, setPlanState] = useState(plan);
  const [name, setName] = useState(plan.name);
  const [description, setDescription] = useState(plan.description ?? "");
  const [isActive, setIsActive] = useState(plan.is_active);
  const [savedName, setSavedName] = useState(false);
  const [savedMeta, setSavedMeta] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [pickerOpen, setPickerOpen] = useState(false);

  function saveName() {
    setError(null);
    startTransition(async () => {
      try {
        await updateWorkoutPlan(plan.id, { name });
        setSavedName(true);
        setTimeout(() => setSavedName(false), 1500);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro.");
      }
    });
  }

  function saveDescription() {
    setError(null);
    startTransition(async () => {
      try {
        await updateWorkoutPlan(plan.id, { description });
        setSavedMeta(true);
        setTimeout(() => setSavedMeta(false), 1500);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro.");
      }
    });
  }

  function toggleActive() {
    const next = !isActive;
    setIsActive(next);
    startTransition(async () => {
      try {
        await updateWorkoutPlan(plan.id, { is_active: next });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro.");
        setIsActive(!next);
      }
    });
  }

  function moveItem(id: string, dir: -1 | 1) {
    const arr = [...planState.exercises];
    const idx = arr.findIndex((e) => e.id === id);
    if (idx < 0) return;
    const target = idx + dir;
    if (target < 0 || target >= arr.length) return;
    [arr[idx], arr[target]] = [arr[target], arr[idx]];
    setPlanState({ ...planState, exercises: arr });
    startTransition(async () => {
      try {
        await reorderPlanExercises(
          plan.id,
          arr.map((e) => e.id),
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao reordenar.");
      }
    });
  }

  function deletePlan() {
    if (!confirm(`Excluir o plano "${plan.name}"? Os exercícios em si não serão apagados.`)) return;
    startTransition(async () => {
      try {
        await deleteWorkoutPlan(plan.id);
        router.push("/treinos");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao excluir.");
      }
    });
  }

  function onExerciseAdded(rowId: string, exerciseId: string, name: string) {
    setPlanState((prev) => ({
      ...prev,
      exercises: [
        ...prev.exercises,
        {
          id: rowId,
          exercise_id: exerciseId,
          exercise_name: name,
          target_sets: 3,
          target_reps: "10-12",
          target_load: null,
          load_unit: "kg",
          rest_seconds: 60,
          notes: null,
          sort_order: prev.exercises.length,
        },
      ],
    }));
  }

  function onRowUpdated(rowId: string, patch: Partial<PlanDetail["exercises"][number]>) {
    setPlanState((prev) => ({
      ...prev,
      exercises: prev.exercises.map((e) =>
        e.id === rowId ? { ...e, ...patch } : e,
      ),
    }));
  }

  function onRowRemoved(rowId: string) {
    setPlanState((prev) => ({
      ...prev,
      exercises: prev.exercises.filter((e) => e.id !== rowId),
    }));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/treinos"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-soft hover:bg-base/60 hover:text-ink"
          aria-label="Voltar"
        >
          <ArrowLeft size={16} aria-hidden="true" />
        </Link>
        <h1 className="font-display text-xl font-bold text-ink">
          Editar plano
        </h1>
      </div>

      <section className="space-y-3 rounded-card border border-line/60 bg-surface p-4 sm:p-5">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-soft">
            Nome do plano
          </span>
          <div className="flex items-center gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              className="flex-1 rounded-xl border border-line bg-base/40 px-3 py-2 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss focus-visible:ring-offset-2 focus-visible:ring-offset-base"
            />
            <Button
              onClick={saveName}
              loading={isPending}
              variant={savedName ? "outline" : "secondary"}
              leadingIcon={savedName ? <Check size={14} /> : <Save size={14} />}
            >
              {savedName ? "Salvo" : "Salvar"}
            </Button>
          </div>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-soft">
            Descrição (opcional)
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={280}
            rows={2}
            placeholder="Ex.: Peito + tríceps, focado em hipertrofia."
            className="w-full rounded-xl border border-line bg-base/40 px-3 py-2 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss focus-visible:ring-offset-2 focus-visible:ring-offset-base"
          />
          <div className="mt-2 flex justify-end">
            <Button
              onClick={saveDescription}
              loading={isPending}
              variant={savedMeta ? "outline" : "ghost"}
              size="sm"
            >
              {savedMeta ? "Descrição salva" : "Salvar descrição"}
            </Button>
          </div>
        </label>

        <div className="flex items-center justify-between rounded-2xl bg-base/40 p-3">
          <div>
            <p className="text-sm font-semibold text-ink">Plano ativo</p>
            <p className="text-[12px] text-ink-soft">
              Apenas um plano pode estar ativo. Ele é sugerido na Home e na Agenda.
            </p>
          </div>
          <button
            type="button"
            onClick={toggleActive}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-pill border px-3 text-[12px] font-semibold transition-colors",
              isActive
                ? "border-moss/40 bg-moss-soft text-moss-dark"
                : "border-line bg-base/60 text-ink-soft",
            )}
            aria-pressed={isActive}
          >
            <Power size={12} aria-hidden="true" />
            {isActive ? "Ativo" : "Inativo"}
          </button>
        </div>

        {error && (
          <p className="text-[12px] text-ember-dark" role="alert">
            {error}
          </p>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-ink">
            Exercícios do plano ({planState.exercises.length})
          </h2>
          <Button
            onClick={() => setPickerOpen(true)}
            variant="secondary"
            leadingIcon={<Plus size={14} />}
          >
            Adicionar
          </Button>
        </div>

        {planState.exercises.length === 0 ? (
          <div className="rounded-card border border-dashed border-line bg-surface/60 p-6 text-center text-[13px] text-ink-soft">
            Nenhum exercício ainda. Adicione exercícios da sua biblioteca para montar o plano.
          </div>
        ) : (
          <ul className="space-y-2">
            {planState.exercises.map((row, idx) => (
              <PlanExerciseRow
                key={row.id}
                row={row}
                index={idx}
                total={planState.exercises.length}
                onMove={moveItem}
                onUpdate={onRowUpdated}
                onRemove={onRowRemoved}
              />
            ))}
          </ul>
        )}
      </section>

      <div className="flex items-center justify-between border-t border-line/60 pt-4">
        <p className="inline-flex items-center gap-1.5 text-[12px] text-ink-soft">
          <Info size={12} aria-hidden="true" />
          Reordenar salva automaticamente.
        </p>
        <Button
          onClick={deletePlan}
          variant="outline"
          loading={isPending}
          leadingIcon={<Trash2 size={14} />}
        >
          Excluir plano
        </Button>
      </div>

      {pickerOpen && (
        <ExercisePickerDialog
          library={library}
          onClose={() => setPickerOpen(false)}
          onPick={async (exercise) => {
            try {
              const res = await addPlanExercise(plan.id, {
                exercise_id: exercise.id,
                exercise_name: exercise.name,
                target_sets: 3,
                target_reps: "10-12",
                target_load: null,
                load_unit: "kg",
                rest_seconds: 60,
              });
              onExerciseAdded(res.id, exercise.id, exercise.name);
              setPickerOpen(false);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Erro ao adicionar.");
            }
          }}
        />
      )}
    </div>
  );
}

function PlanExerciseRow({
  row,
  index,
  total,
  onMove,
  onUpdate,
  onRemove,
}: {
  row: PlanDetail["exercises"][number];
  index: number;
  total: number;
  onMove: (id: string, dir: -1 | 1) => void;
  onUpdate: (id: string, patch: Partial<PlanDetail["exercises"][number]>) => void;
  onRemove: (id: string) => void;
}) {
  const [sets, setSets] = useState(row.target_sets.toString());
  const [reps, setReps] = useState(row.target_reps);
  const [load, setLoad] = useState(row.target_load?.toString() ?? "");
  const [rest, setRest] = useState(row.rest_seconds.toString());
  const [unit, setUnit] = useState<"kg" | "lb">(row.load_unit);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function save() {
    setError(null);
    startTransition(async () => {
      try {
        await updatePlanExercise(row.id, {
          target_sets: sets,
          target_reps: reps,
          target_load: load === "" ? null : load,
          load_unit: unit,
          rest_seconds: rest,
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro.");
      }
    });
  }

  function remove() {
    if (!confirm(`Remover "${row.exercise_name}" do plano?`)) return;
    startTransition(async () => {
      try {
        await removePlanExercise(row.id);
        onRemove(row.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro.");
      }
    });
  }

  return (
    <li className="rounded-2xl border border-line/60 bg-surface p-3">
      <div className="flex items-start gap-2">
        <div className="flex flex-col items-center gap-0.5">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => onMove(row.id, -1)}
            className="inline-flex h-6 w-6 items-center justify-center rounded text-ink-faint hover:text-ink disabled:opacity-30"
            aria-label="Mover para cima"
          >
            <ChevronUp size={14} aria-hidden="true" />
          </button>
          <GripVertical size={12} aria-hidden="true" className="text-ink-faint" />
          <button
            type="button"
            disabled={index === total - 1}
            onClick={() => onMove(row.id, 1)}
            className="inline-flex h-6 w-6 items-center justify-center rounded text-ink-faint hover:text-ink disabled:opacity-30"
            aria-label="Mover para baixo"
          >
            <ChevronDown size={14} aria-hidden="true" />
          </button>
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-sm font-semibold text-ink">
            {row.exercise_name}
          </p>

          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <TextField
              label="Séries"
              type="text"
              inputMode="numeric"
              value={sets}
              onChange={(e) => setSets(e.target.value)}
              size="sm"
            />
            <TextField
              label="Reps"
              type="text"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              placeholder="10-12"
              size="sm"
            />
            <div className="space-y-1">
              <span className="block text-[11px] font-medium text-ink-soft">
                Carga
              </span>
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  inputMode="decimal"
                  value={load}
                  placeholder="—"
                  onChange={(e) => setLoad(e.target.value)}
                  className="w-full rounded-xl border border-line bg-base/40 px-2 py-2 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss focus-visible:ring-offset-2 focus-visible:ring-offset-base"
                />
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as "kg" | "lb")}
                  className="rounded-xl border border-line bg-base/40 px-1.5 py-2 text-sm text-ink"
                  aria-label="Unidade"
                >
                  <option value="kg">kg</option>
                  <option value="lb">lb</option>
                </select>
              </div>
            </div>
            <TextField
              label="Descanso (s)"
              type="text"
              inputMode="numeric"
              value={rest}
              onChange={(e) => setRest(e.target.value)}
              size="sm"
            />
          </div>

          {error && (
            <p className="mt-1 text-[12px] text-ember-dark" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={save}
            className={cn(
              "inline-flex h-8 items-center gap-1 rounded-pill border px-2 text-[11px] font-semibold",
              saved
                ? "border-moss/40 bg-moss-soft text-moss-dark"
                : "border-line bg-base/60 text-ink-soft hover:text-ink",
            )}
          >
            {saved ? <Check size={12} aria-hidden="true" /> : <Save size={12} aria-hidden="true" />}
            {saved ? "Salvo" : "Salvar"}
          </button>
          <button
            type="button"
            onClick={remove}
            className="inline-flex h-8 items-center justify-center gap-1 rounded-pill border border-line bg-base/60 px-2 text-[11px] text-ink-soft hover:text-ember-dark"
            aria-label={`Remover ${row.exercise_name}`}
          >
            <Trash2 size={12} aria-hidden="true" />
          </button>
        </div>
      </div>
    </li>
  );
}

function ExercisePickerDialog({
  library,
  onClose,
  onPick,
}: {
  library: ExerciseLibraryItem[];
  onClose: () => void;
  onPick: (item: ExerciseLibraryItem) => void | Promise<void>;
}) {
  const [search, setSearch] = useState("");
  const [muscle, setMuscle] = useState<PrimaryMuscleGroup | "all">("all");

  const filtered = library.filter((ex) => {
    if (muscle !== "all" && ex.primary_muscle !== muscle) return false;
    if (search) {
      const t = search.toLowerCase();
      if (!ex.name.toLowerCase().includes(t)) return false;
    }
    return true;
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="picker-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 backdrop-blur-sm animate-fade-in sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-card bg-base shadow-floating border border-line/60 animate-fade-up sm:rounded-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line/60 px-4 py-3 sm:px-6">
          <h2 id="picker-title" className="font-display text-lg font-bold text-ink">
            Escolher exercício
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft hover:bg-base/60 hover:text-ink"
            aria-label="Fechar"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-3 px-4 py-4 sm:px-6 sm:py-5">
          <TextField
            label="Buscar"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nome do exercício"
            autoFocus
          />

          <div className="flex flex-wrap gap-1.5">
            <FilterChip active={muscle === "all"} onClick={() => setMuscle("all")}>
              Todos
            </FilterChip>
            {(["peito", "costas", "pernas", "ombros", "bracos", "core"] as PrimaryMuscleGroup[]).map((m) => (
              <FilterChip key={m} active={muscle === m} onClick={() => setMuscle(m)}>
                {PRIMARY_MUSCLE_LABEL[m]}
              </FilterChip>
            ))}
          </div>

          {filtered.length === 0 ? (
            <p className="rounded-2xl bg-base/40 p-4 text-center text-[12px] text-ink-soft">
              Nada por aqui — ajuste a busca ou crie o exercício na biblioteca.
            </p>
          ) : (
            <ul className="max-h-72 space-y-1 overflow-y-auto">
              {filtered.map((ex) => {
                const bg = PRIMARY_MUSCLE_BG[ex.primary_muscle as keyof typeof PRIMARY_MUSCLE_BG] ?? PRIMARY_MUSCLE_BG.outro;
                return (
                  <li key={ex.id}>
                    <button
                      type="button"
                      onClick={() => onPick(ex)}
                      className="flex w-full items-center gap-3 rounded-xl border border-line/60 bg-surface p-2 text-left hover:border-ember/40"
                    >
                      <span
                        className={cn(
                          "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[12px] font-bold text-white",
                          bg,
                        )}
                      >
                        {ex.name.slice(0, 2).toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm">{ex.name}</span>
                      <span className="text-[10px] text-ink-faint">
                        {PRIMARY_MUSCLE_LABEL[ex.primary_muscle as PrimaryMuscleGroup] ?? ex.primary_muscle}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-pill border px-2.5 py-1 text-[12px]",
        active
          ? "border-ember/40 bg-ember-soft text-ember-dark"
          : "border-line/70 bg-surface text-ink-soft hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}

export function NewPlanForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Dê um nome para o plano.");
      return;
    }
    startTransition(async () => {
      try {
        const res = await createWorkoutPlan({ name, description: description || null });
        router.push(`/treinos/planos/${res.id}`);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro.");
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-card border border-line/60 bg-surface p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <Link
          href="/treinos"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-soft hover:bg-base/60 hover:text-ink"
          aria-label="Voltar"
        >
          <ArrowLeft size={16} aria-hidden="true" />
        </Link>
        <h1 className="font-display text-xl font-bold text-ink">Novo plano</h1>
      </div>

      <TextField
        label="Nome do plano"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Ex.: Peito + tríceps A"
        autoFocus
        maxLength={80}
      />
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink-soft">
          Descrição (opcional)
        </span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          maxLength={280}
          placeholder="Notas sobre foco, duração esperada, dia da semana…"
          className="w-full rounded-xl border border-line bg-base/40 px-3 py-2 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss focus-visible:ring-offset-2 focus-visible:ring-offset-base"
        />
      </label>

      {error && (
        <p className="text-[12px] text-ember-dark" role="alert">
          {error}
        </p>
      )}

      <Button type="submit" loading={isPending} fullWidth leadingIcon={<Plus size={14} />}>
        Criar plano
      </Button>
    </form>
  );
}


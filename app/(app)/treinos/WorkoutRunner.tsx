"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Check,
  Trash2,
  AlertTriangle,
  Flag,
  X,
  Pencil,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import {
  cancelWorkoutSession,
  deleteSet,
  finishWorkoutSession,
  logSet,
  updateSet,
  type ExerciseListItem,
} from "./actions";
import { cn } from "@/lib/cn";
import { SuccessOverlay } from "@/components/ui/SuccessOverlay";
import {
  RPE_DESCRIPTORS,
  minutesToHours,
  EXERCISE_CATEGORY_LABEL,
  PRIMARY_MUSCLE_LABEL,
} from "@/lib/workout";
import { matchesAny } from "@/lib/text-search";
import { ZoomableMedia } from "@/components/ui/ZoomableMedia";
import type { PrimaryMuscleGroup, ExerciseCategory } from "@/types/database";

type PlanExerciseRow = {
  id: string;
  exercise_id: string | null;
  exercise_name: string;
  target_sets: number;
  target_reps: string;
  target_load: number | null;
  load_unit: "kg" | "lb";
};

export type ExistingSet = {
  id: string;
  exercise_id: string | null;
  exercise_name: string;
  set_number: number;
  reps: number | null;
  load: number | null;
  load_unit: "kg" | "lb";
  rpe: number | null;
  discomfort: number | null;
};

export function WorkoutRunner({
  sessionId,
  workoutName,
  startedAt,
  planExercises,
  initialSets,
  library,
  signedUrls,
}: {
  sessionId: string;
  workoutName: string;
  startedAt: string;
  planExercises: PlanExerciseRow[];
  initialSets: ExistingSet[];
  library: ExerciseListItem[];
  signedUrls?: Record<string, string | null>;
}) {
  const router = useRouter();
  const [sets, setSets] = useState<ExistingSet[]>(initialSets);
  const [now, setNow] = useState(() => Date.now());
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const elapsedMin = Math.max(
    1,
    Math.round((now - new Date(startedAt).getTime()) / 60000),
  );

  /** Mapa de exercícios já registrados, agrupados por nome. */
  const grouped = useMemo(() => {
    const map = new Map<string, ExistingSet[]>();
    for (const s of sets) {
      const arr = map.get(s.exercise_name) ?? [];
      arr.push(s);
      map.set(s.exercise_name, arr);
    }
    // Ordena por set_number dentro de cada grupo.
    for (const arr of map.values()) arr.sort((a, b) => a.set_number - b.set_number);
    return map;
  }, [sets]);

  /** Plano pré-preenchido (sugestões) — combina com os que já foram registrados. */
  const planNames = useMemo(
    () => new Set(planExercises.map((p) => p.exercise_name)),
    [planExercises],
  );

  /** Exercícios avulsos: já registrados mas sem linha no plano. */
  const adHocNames = useMemo(
    () =>
      Array.from(grouped.keys()).filter((name) => !planNames.has(name)),
    [grouped, planNames],
  );

  function startRest(_seconds: number) {
    // Cronômetro de descanso removido — produto não usa mais.
  }

  const [success, setSuccess] = useState<string | null>(null);

  function addSet(input: {
    exerciseName: string;
    exerciseId: string | null;
    reps: number;
    load: number | null;
    loadUnit: "kg" | "lb";
    rpe: number | null;
    discomfort: number | null;
    targetLoad: number | null;
    targetReps: string;
  }) {
    const exerciseGroups = grouped.get(input.exerciseName) ?? [];
    const nextSetNumber = exerciseGroups.length + 1;
    startTransition(async () => {
      try {
        const res = await logSet({
          session_id: sessionId,
          exercise_id: input.exerciseId,
          exercise_name: input.exerciseName,
          set_number: nextSetNumber,
          reps: input.reps,
          load: input.load,
          load_unit: input.loadUnit,
          rpe: input.rpe,
          discomfort: input.discomfort,
        });
        const created: ExistingSet = {
          id: res.id,
          exercise_id: input.exerciseId,
          exercise_name: input.exerciseName,
          set_number: nextSetNumber,
          reps: input.reps,
          load: input.load,
          load_unit: input.loadUnit,
          rpe: input.rpe,
          discomfort: input.discomfort,
        };
        setSets((prev) => [...prev, created]);
        // Cronômetro de descanso removido — não inicia mais timer.
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao registrar.");
      }
    });
  }

  function removeOneSet(setId: string) {
    startTransition(async () => {
      try {
        await deleteSet(setId);
        setSets((prev) => prev.filter((s) => s.id !== setId));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao remover.");
      }
    });
  }

  function patchSetLocal(setId: string, patch: Partial<ExistingSet>) {
    setSets((prev) => prev.map((s) => (s.id === setId ? { ...s, ...patch } : s)));
  }

  async function persistPatch(setId: string, patch: Partial<ExistingSet>) {
    try {
      await updateSet(setId, {
        reps: patch.reps,
        load: patch.load,
        rpe: patch.rpe,
        discomfort: patch.discomfort,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    }
  }

  function cancelSession() {
    if (!confirm("Cancelar este treino? As séries registradas serão apagadas.")) return;
    startTransition(async () => {
      try {
        await cancelWorkoutSession(sessionId);
        router.push("/treinos");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro.");
      }
    });
  }

  function finishSession(rpe: number | null) {
    startTransition(async () => {
      try {
        await finishWorkoutSession({
          session_id: sessionId,
          duration_min: elapsedMin,
          user_rpe: rpe,
        });
        setSuccess("Treino finalizado");
        // Tempo para o usuário ver o overlay antes de navegar.
        setTimeout(() => router.push("/treinos/historico"), 800);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao finalizar.");
      }
    });
  }

  return (
    <div className="space-y-5">
      <SuccessOverlay
        open={success !== null}
        onDone={() => setSuccess(null)}
        title={success ?? ""}
      />
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => router.push("/treinos")}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-soft hover:bg-base/60 hover:text-ink"
          aria-label="Voltar"
        >
          <ArrowLeft size={16} aria-hidden="true" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-xl font-bold text-ink">
            {workoutName}
          </h1>
          <p className="text-[12px] text-ink-soft">
            Em andamento · {formatElapsed(now - new Date(startedAt).getTime())}
          </p>
        </div>
      </div>

      {error && (
        <p
          className="rounded-2xl bg-ember-soft px-3 py-2 text-[12px] text-ember-dark"
          role="alert"
        >
          {error}
        </p>
      )}

      {/* Cronômetro de descanso removido. */}

      <section className="space-y-3">
        {planExercises.length > 0 ? (
          planExercises.map((row) => (
            <ExerciseBlock
              key={row.id}
              planRow={row}
              existing={grouped.get(row.exercise_name) ?? []}
              libraryMatch={
                row.exercise_id
                  ? library.find((ex) => ex.id === row.exercise_id)
                  : undefined
              }
              signedUrl={
                row.exercise_id ? (signedUrls?.[row.exercise_id] ?? null) : null
              }
              onAdd={(payload) =>
                addSet({
                  exerciseName: row.exercise_name,
                  exerciseId: row.exercise_id,
                  targetLoad: row.target_load,
                  targetReps: row.target_reps,
                  ...payload,
                })
              }
              onRemove={removeOneSet}
              onPatchLocal={patchSetLocal}
              onPersist={persistPatch}
            />
          ))
        ) : (
          <div className="rounded-card border border-dashed border-line bg-surface/60 p-6 text-center">
            <p className="text-[13px] text-ink-soft">
              Este treino não tem exercícios pré-definidos.
            </p>
            <Button
              onClick={() => setPickerOpen(true)}
              variant="secondary"
              className="mt-3"
              leadingIcon={<Plus size={14} />}
            >
              Adicionar exercício
            </Button>
          </div>
        )}

        {Object.keys(grouped).length > 0 && planNames.size === 0 && (
          <p className="text-[11px] text-ink-faint">
            Adicionando exercícios avulsos (sem plano).
          </p>
        )}

        {adHocNames.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-display text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
              Exercícios avulsos
            </h3>
            {adHocNames.map((name) => {
              const libraryMatch = library.find(
                (ex) => ex.name === name,
              );
              return (
                <AdHocBlock
                  key={name}
                  exerciseName={name}
                  existing={grouped.get(name) ?? []}
                  libraryMatch={libraryMatch}
                  signedUrl={
                    libraryMatch
                      ? (signedUrls?.[libraryMatch.id] ?? null)
                      : null
                  }
                  onAdd={(payload) =>
                    addSet({
                      exerciseName: name,
                      exerciseId: libraryMatch?.id ?? null,
                      targetLoad: null,
                      targetReps: "10",
                      ...payload,
                    })
                  }
                  onRemove={removeOneSet}
                  onPatchLocal={patchSetLocal}
                  onPersist={persistPatch}
                />
              );
            })}
          </div>
        )}

        {planExercises.length > 0 && (
          <Button
            onClick={() => setPickerOpen(true)}
            variant="ghost"
            leadingIcon={<Plus size={14} />}
          >
            Adicionar exercício avulso
          </Button>
        )}
      </section>

      <div className="sticky bottom-20 z-10 flex items-center justify-end gap-2 rounded-card border border-line/60 bg-surface/85 p-3 shadow-floating backdrop-blur md:bottom-6">
        <Button
          variant="outline"
          onClick={cancelSession}
          loading={isPending}
          leadingIcon={<X size={14} />}
        >
          Cancelar
        </Button>
        <Button
          onClick={() => setFinishing(true)}
          loading={isPending}
          variant="primary"
          leadingIcon={<Flag size={14} />}
        >
          Finalizar
        </Button>
      </div>

      {pickerOpen && (
        <AdHocExercisePicker
          library={library}
          onClose={() => setPickerOpen(false)}
          onPick={(ex) => {
            setPickerOpen(false);
            // Cria um bloco avulso para esse exercício.
            // Adicionamos direto um set 1.
            addSet({
              exerciseName: ex.name,
              exerciseId: ex.id,
              reps: 0,
              load: null,
              loadUnit: "kg",
              rpe: null,
              discomfort: null,
              targetLoad: null,
              targetReps: "10",
            });
          }}
        />
      )}

      {finishing && (
        <FinishDialog
          onClose={() => setFinishing(false)}
          onConfirm={(rpe) => {
            setFinishing(false);
            finishSession(rpe);
          }}
          setCount={sets.length}
          durationMin={elapsedMin}
        />
      )}
    </div>
  );
}

function ExerciseBlock({
  planRow,
  existing,
  libraryMatch,
  signedUrl,
  onAdd,
  onRemove,
  onPatchLocal,
  onPersist,
}: {
  planRow: PlanExerciseRow;
  existing: ExistingSet[];
  libraryMatch?: ExerciseListItem;
  signedUrl?: string | null;
  onAdd: (input: {
    reps: number;
    load: number | null;
    loadUnit: "kg" | "lb";
    rpe: number | null;
    discomfort: number | null;
  }) => void;
  onRemove: (setId: string) => void;
  onPatchLocal: (setId: string, patch: Partial<ExistingSet>) => void;
  onPersist: (setId: string, patch: Partial<ExistingSet>) => Promise<void>;
}) {
  return (
    <div className="rounded-card border border-line/60 bg-surface p-4">
      {/* Mídia grande — fundamental pra reconhecer o exercício em tempo real. */}
      <div className="mb-3">
        <ZoomableMedia
          exercise={
            libraryMatch ?? {
              id: planRow.id,
              name: planRow.exercise_name,
              primary_muscle: "outro",
              secondary_muscles: [],
              equipment: null,
              image_url: null,
              animation_url: null,
              user_id: null,
            }
          }
          signedUrl={signedUrl ?? null}
          full
        />
      </div>
      <div className="mb-2 flex items-baseline justify-between">
        <div>
          <p className="font-display text-sm font-bold text-ink">
            {planRow.exercise_name}
          </p>
          <p className="text-[11px] text-ink-soft">
            Alvo: {planRow.target_sets}× {planRow.target_reps}
            {planRow.target_load != null
              ? ` · ${planRow.target_load} ${planRow.load_unit}`
              : ""}
          </p>
        </div>
        <span className="rounded-pill bg-line/60 px-2 py-0.5 text-[10px] font-semibold text-ink-soft">
          {existing.length}/{planRow.target_sets}
        </span>
      </div>

      {existing.length > 0 && (
        <ul className="mb-3 divide-y divide-line/40">
          {existing.map((s) => (
            <SetLine
              key={s.id}
              setRow={s}
              targetReps={planRow.target_reps}
              onRemove={onRemove}
              onPatchLocal={onPatchLocal}
              onPersist={onPersist}
            />
          ))}
        </ul>
      )}

      <NewSetForm
        key={`form-${existing.length}`}
        unit={planRow.load_unit}
        targetLoad={planRow.target_load}
        targetReps={planRow.target_reps}
        onSubmit={onAdd}
      />
    </div>
  );
}

function SetLine({
  setRow,
  targetReps,
  onRemove,
  onPatchLocal,
  onPersist,
}: {
  setRow: ExistingSet;
  targetReps: string;
  onRemove: (setId: string) => void;
  onPatchLocal: (setId: string, patch: Partial<ExistingSet>) => void;
  onPersist: (setId: string, patch: Partial<ExistingSet>) => Promise<void>;
}) {
  const [reps, setReps] = useState(setRow.reps?.toString() ?? "");
  const [load, setLoad] = useState(setRow.load?.toString() ?? "");
  const [rpe, setRpe] = useState<number | null>(setRow.rpe);
  const [discomfort, setDiscomfort] = useState<number | null>(setRow.discomfort);

  function commit() {
    const r = reps === "" ? null : parseInt(reps, 10);
    const l = load === "" ? null : parseFloat(load.replace(",", "."));
    const patch: Partial<ExistingSet> = {
      reps: r != null && Number.isFinite(r) ? r : null,
      load: l != null && Number.isFinite(l) ? Math.round(l * 100) / 100 : null,
      rpe,
      discomfort,
    };
    onPatchLocal(setRow.id, patch);
    void onPersist(setRow.id, patch);
  }

  return (
    <li className="grid grid-cols-[24px_1fr_1fr_1fr_1fr_auto] items-center gap-2 py-2 text-[12px]">
      <span className="font-mono font-semibold text-ink-soft">
        #{setRow.set_number}
      </span>
      <input
        type="text"
        inputMode="numeric"
        value={reps}
        onChange={(e) => setReps(e.target.value)}
        onBlur={commit}
        placeholder="reps"
        aria-label={`Repetições da série ${setRow.set_number}`}
        className="rounded-lg border border-line bg-base/40 px-2 py-1 text-center text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss"
      />
      <input
        type="text"
        inputMode="decimal"
        value={load}
        onChange={(e) => setLoad(e.target.value)}
        onBlur={commit}
        placeholder="kg"
        aria-label={`Carga da série ${setRow.set_number}`}
        className="rounded-lg border border-line bg-base/40 px-2 py-1 text-center text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss"
      />
      <SmallPicker
        value={rpe}
        onChange={(v) => {
          setRpe(v);
          const patch: Partial<ExistingSet> = {
            rpe: v,
            discomfort,
          };
          onPatchLocal(setRow.id, patch);
          void onPersist(setRow.id, patch);
        }}
        label="RPE"
        min={1}
        max={10}
      />
      <SmallPicker
        value={discomfort}
        onChange={(v) => {
          setDiscomfort(v);
          const patch: Partial<ExistingSet> = {
            rpe,
            discomfort: v,
          };
          onPatchLocal(setRow.id, patch);
          void onPersist(setRow.id, patch);
        }}
        label="Dor"
        min={0}
        max={10}
        allowZero
      />
      <button
        type="button"
        onClick={() => onRemove(setRow.id)}
        className="inline-flex h-7 w-7 items-center justify-center rounded text-ink-faint hover:text-ember-dark"
        aria-label="Remover série"
      >
        <Trash2 size={12} aria-hidden="true" />
      </button>
    </li>
  );
}

function SmallPicker({
  value,
  onChange,
  label,
  min,
  max,
  allowZero,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  label: string;
  min: number;
  max: number;
  allowZero?: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-[10px] font-medium uppercase text-ink-faint">
        {label}
      </span>
      <select
        value={value ?? ""}
        onChange={(e) => {
          const v = e.target.value === "" ? null : parseInt(e.target.value, 10);
          onChange(v);
        }}
        className="rounded-lg border border-line bg-base/40 px-1.5 py-1 text-ink"
        aria-label={label}
      >
        <option value="">—</option>
        {Array.from({ length: max - min + 1 }, (_, i) => i + min).map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
    </div>
  );
}

function NewSetForm({
  unit,
  targetLoad,
  targetReps,
  onSubmit,
}: {
  unit: "kg" | "lb";
  targetLoad: number | null;
  targetReps: string;
  onSubmit: (input: {
    reps: number;
    load: number | null;
    loadUnit: "kg" | "lb";
    rpe: number | null;
    discomfort: number | null;
  }) => void;
}) {
  const [reps, setReps] = useState(parseRepsDefault(targetReps));
  const [load, setLoad] = useState(targetLoad?.toString() ?? "");
  const [rpe, setRpe] = useState<number | null>(null);
  const [discomfort, setDiscomfort] = useState<number | null>(null);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const r = parseInt(reps, 10);
        if (!Number.isFinite(r) || r < 0) return;
        const l = load === "" ? null : parseFloat(load.replace(",", "."));
        onSubmit({
          reps: r,
          load: l != null && Number.isFinite(l) ? Math.round(l * 100) / 100 : null,
          loadUnit: unit,
          rpe,
          discomfort,
        });
        setRpe(null);
        setDiscomfort(null);
      }}
      className="grid grid-cols-2 gap-2 sm:grid-cols-5"
    >
      <TextField
        label="Reps"
        type="text"
        inputMode="numeric"
        value={reps}
        onChange={(e) => setReps(e.target.value)}
        size="sm"
      />
      <TextField
        label={`Carga (${unit})`}
        type="text"
        inputMode="decimal"
        value={load}
        onChange={(e) => setLoad(e.target.value)}
        placeholder="—"
        size="sm"
      />
      <SmallPicker
        value={rpe}
        onChange={setRpe}
        label="RPE"
        min={1}
        max={10}
      />
      <SmallPicker
        value={discomfort}
        onChange={setDiscomfort}
        label="Dor"
        min={0}
        max={10}
        allowZero
      />
      <Button type="submit" variant="secondary" leadingIcon={<Plus size={14} />}>
        Adicionar
      </Button>
    </form>
  );
}

function FinishDialog({
  onClose,
  onConfirm,
  setCount,
  durationMin,
}: {
  onClose: () => void;
  onConfirm: (rpe: number | null) => void;
  setCount: number;
  durationMin: number;
}) {
  const [rpe, setRpe] = useState<number | null>(null);
  const hours = minutesToHours(durationMin);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="finish-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 backdrop-blur-sm animate-fade-in sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-card bg-base shadow-floating border border-line/60 animate-fade-up sm:rounded-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-line/60 px-4 py-3 sm:px-6">
          <h2 id="finish-title" className="font-display text-lg font-bold text-ink">
            Finalizar treino
          </h2>
        </div>

        <div className="space-y-4 px-4 py-4 sm:px-6 sm:py-5">
          <div className="rounded-2xl bg-base/40 p-3 text-center">
            <p className="text-[11px] uppercase tracking-wide text-ink-faint">
              Resumo
            </p>
            <p className="font-mono text-2xl font-bold text-ink">
              {Math.floor(hours)}h {Math.round((hours % 1) * 60)}min
            </p>
            <p className="text-[12px] text-ink-soft">
              {setCount} {setCount === 1 ? "série registrada" : "séries registradas"}
            </p>
          </div>

          <div>
            <p className="mb-1.5 block text-sm font-medium text-ink-soft">
              Como você se sentiu? (opcional)
            </p>
            <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-10">
              {RPE_DESCRIPTORS.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setRpe(d.value)}
                  className={cn(
                    "rounded-lg border px-1.5 py-1.5 text-[12px] font-semibold",
                    rpe === d.value
                      ? "border-ember/40 bg-ember-soft text-ember-dark"
                      : "border-line bg-surface text-ink-soft hover:text-ink",
                  )}
                  title={`${d.value} — ${d.label}: ${d.hint}`}
                >
                  {d.value}
                </button>
              ))}
            </div>
            {rpe != null && (
              <p className="mt-2 text-[11px] text-ink-soft">
                {RPE_DESCRIPTORS[rpe - 1]?.label} ·{" "}
                {RPE_DESCRIPTORS[rpe - 1]?.hint}
              </p>
            )}
          </div>

          <p className="inline-flex items-start gap-1.5 rounded-2xl bg-base/40 p-3 text-[11px] text-ink-soft">
            <AlertTriangle size={12} className="mt-0.5 shrink-0" aria-hidden="true" />
            RPE é só registro. Não é diagnóstico nem prescrição — ajuste a carga
            sempre com base em como você se sente. Se notar desconforto
            recorrente, vale conversar com um profissional de educação física
            ou fisioterapia.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-line/60 px-4 py-3 sm:px-6">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={() => onConfirm(rpe)}
            variant="primary"
            leadingIcon={<Check size={14} />}
          >
            Confirmar
          </Button>
        </div>
      </div>
    </div>
  );
}

function AdHocBlock({
  exerciseName,
  existing,
  libraryMatch,
  signedUrl,
  onAdd,
  onRemove,
  onPatchLocal,
  onPersist,
}: {
  exerciseName: string;
  existing: ExistingSet[];
  libraryMatch?: ExerciseListItem;
  signedUrl?: string | null;
  onAdd: (input: {
    reps: number;
    load: number | null;
    loadUnit: "kg" | "lb";
    rpe: number | null;
    discomfort: number | null;
  }) => void;
  onRemove: (setId: string) => void;
  onPatchLocal: (setId: string, patch: Partial<ExistingSet>) => void;
  onPersist: (setId: string, patch: Partial<ExistingSet>) => Promise<void>;
}) {
  return (
    <div className="rounded-card border border-line/60 bg-surface p-4">
      {/* Mídia grande — fundamental pra reconhecer o exercício em tempo real. */}
      <div className="mb-3">
        <ZoomableMedia
          exercise={
            libraryMatch ?? {
              id: exerciseName,
              name: exerciseName,
              primary_muscle: "outro",
              secondary_muscles: [],
              equipment: null,
              image_url: null,
              animation_url: null,
              user_id: null,
            }
          }
          signedUrl={signedUrl ?? null}
          full
        />
      </div>
      <div className="mb-2 flex items-baseline justify-between">
        <div>
          <p className="font-display text-sm font-bold text-ink">
            {exerciseName}
          </p>
          <p className="text-[11px] text-ink-soft">
            Exercício avulso · sem meta pré-definida
          </p>
        </div>
        <span className="rounded-pill bg-line/60 px-2 py-0.5 text-[10px] font-semibold text-ink-soft">
          {existing.length} {existing.length === 1 ? "série" : "séries"}
        </span>
      </div>

      {existing.length > 0 && (
        <ul className="mb-3 divide-y divide-line/40">
          {existing.map((s) => (
            <SetLine
              key={s.id}
              setRow={s}
              targetReps="10"
              onRemove={onRemove}
              onPatchLocal={onPatchLocal}
              onPersist={onPersist}
            />
          ))}
        </ul>
      )}

      <NewSetForm
        key={`adhoc-form-${existing.length}`}
        unit="kg"
        targetLoad={null}
        targetReps="10"
        onSubmit={onAdd}
      />
    </div>
  );
}

function AdHocExercisePicker({
  library,
  onClose,
  onPick,
}: {
  library: ExerciseListItem[];
  onClose: () => void;
  onPick: (ex: ExerciseListItem) => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = library.filter((ex) => {
    const term = search.trim();
    if (!term) return true;
    const cat = ex.category as ExerciseCategory | null;
    const pm = ex.primary_muscle as PrimaryMuscleGroup | null;
    const categoryLabel = cat ? (EXERCISE_CATEGORY_LABEL[cat] ?? "") : "";
    const muscleLabel = pm ? (PRIMARY_MUSCLE_LABEL[pm] ?? "") : "";
    return matchesAny(term, [
      ex.name,
      ex.equipment ?? "",
      muscleLabel,
      categoryLabel,
      ...(ex.aliases ?? []),
    ]);
  });
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="adhoc-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 backdrop-blur-sm animate-fade-in sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-card bg-base shadow-floating border border-line/60 animate-fade-up sm:rounded-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line/60 px-4 py-3 sm:px-6">
          <h2 id="adhoc-title" className="font-display text-lg font-bold text-ink">
            Adicionar exercício
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
          <div className="relative">
            <Search
              size={14}
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="🔍 Pesquisar exercício…"
              aria-label="Pesquisar exercício"
              className={cn(
                "w-full rounded-pill border border-line bg-surface py-2.5 pl-9 text-sm text-ink placeholder:text-ink-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss focus-visible:ring-offset-2 focus-visible:ring-offset-base",
                search ? "pr-9" : "pr-3",
              )}
              autoFocus
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Limpar pesquisa"
                className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-ink-soft hover:bg-base/60 hover:text-ink"
              >
                <X size={14} aria-hidden="true" />
              </button>
            )}
          </div>
          {filtered.length === 0 ? (
            <p className="rounded-2xl bg-base/40 p-4 text-center text-[12px] text-ink-soft">
              Nada por aqui.
            </p>
          ) : (
            <ul className="max-h-72 space-y-1 overflow-y-auto">
              {filtered.map((ex) => (
                <li key={ex.id}>
                  <button
                    type="button"
                    onClick={() => onPick(ex)}
                    className="flex w-full items-center gap-3 rounded-xl border border-line/60 bg-surface p-2 text-left hover:border-ember/40"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm">{ex.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function parseRepsDefault(reps: string): string {
  const m = reps.match(/^(\d+)/);
  return m?.[1] ?? "10";
}

function formatElapsed(ms: number): string {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}min`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// re-exporta pra não dar warning de "import unused"
export { Pencil };

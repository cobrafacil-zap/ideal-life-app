"use client";

import { useMemo, useState } from "react";
import { Search, X, Plus, Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { ExerciseMedia } from "./ExerciseMedia";
import type {
  EquipmentKind,
  Exercise,
  PrimaryMuscleGroup,
} from "@/types/database";
import {
  PRIMARY_MUSCLE_LABEL,
  PRIMARY_MUSCLE_ORDER,
} from "@/lib/workout";

type ExerciseForPicker = Pick<
  Exercise,
  | "id"
  | "name"
  | "primary_muscle"
  | "secondary_muscles"
  | "equipment"
  | "image_url"
  | "animation_url"
  | "user_id"
>;

type SignedMap = Record<string, string | null>;

type Props = {
  open: boolean;
  onClose: () => void;
  exercises: ExerciseForPicker[];
  signedUrls: SignedMap;
  /** Ids já adicionados (para mostrar ✓ em vez de "+ Adicionar"). */
  selectedIds?: string[];
  onAdd: (exercise: ExerciseForPicker) => Promise<void> | void;
};

/**
 * Cardápio visual de exercícios. Modal full-screen com busca + grupos
 * musculares. Cada card mostra mídia + nome + grupo + equipamento + botão.
 *
 * Mostra apenas exercícios pré-determinados pelo sistema (catálogo
 * global). O caller deve passar `exercises` já filtrado para `scope: "global"`.
 */
export function ExercisePicker({
  open,
  onClose,
  exercises,
  signedUrls,
  selectedIds = [],
  onAdd,
}: Props) {
  const [query, setQuery] = useState("");

  const grouped = useMemo(() => {
    const term = query.trim().toLowerCase();
    const filtered = term
      ? exercises.filter(
          (ex) =>
            ex.name.toLowerCase().includes(term) ||
            (ex.equipment ?? "").toLowerCase().includes(term) ||
            (PRIMARY_MUSCLE_LABEL[
              ex.primary_muscle as PrimaryMuscleGroup
            ] ?? "")
              .toLowerCase()
              .includes(term),
        )
      : exercises;

    const map = new Map<PrimaryMuscleGroup, ExerciseForPicker[]>();
    for (const ex of filtered) {
      const key = (ex.primary_muscle as PrimaryMuscleGroup) ?? "outro";
      const list = map.get(key) ?? [];
      list.push(ex);
      map.set(key, list);
    }
    return map;
  }, [exercises, query]);

  if (!open) return null;

  const orderedGroups = PRIMARY_MUSCLE_ORDER.filter((g) => grouped.has(g));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="picker-title"
      className="fixed inset-0 z-50 flex flex-col bg-base animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-line/60 bg-base/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-soft hover:bg-base/60 hover:text-ink"
            aria-label="Fechar"
          >
            <X size={16} aria-hidden="true" />
          </button>
          <div className="min-w-0 flex-1">
            <h2
              id="picker-title"
              className="font-display text-lg font-bold text-ink"
            >
              Adicionar exercícios
            </h2>
            <p className="text-[11px] text-ink-soft">
              Toque em "+ Adicionar" para incluir no treino.
            </p>
          </div>
        </div>
        <div className="mx-auto max-w-3xl px-4 pb-3">
          <label className="relative block">
            <span className="sr-only">Buscar exercício</span>
            <Search
              size={14}
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Qual exercício você procura?"
              className="w-full rounded-pill border border-line bg-surface py-2.5 pl-9 pr-3 text-sm text-ink placeholder:text-ink-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss focus-visible:ring-offset-2 focus-visible:ring-offset-base"
              autoFocus
            />
          </label>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto w-full max-w-3xl flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {orderedGroups.length === 0 ? (
          <div className="rounded-card border border-dashed border-line bg-surface/60 p-6 text-center text-[13px] text-ink-soft">
            Nenhum exercício encontrado para “{query}”.
          </div>
        ) : (
          orderedGroups.map((group) => (
            <section key={group}>
              <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wide text-ink-soft">
                {PRIMARY_MUSCLE_LABEL[group]}
                <span className="text-[10px] font-normal normal-case text-ink-faint">
                  {grouped.get(group)?.length ?? 0} exercícios
                </span>
              </h3>
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {grouped.get(group)?.map((ex) => {
                  const isSelected = selectedIds.includes(ex.id);
                  return (
                    <li
                      key={ex.id}
                      className={cn(
                        "flex items-stretch gap-3 rounded-2xl border border-line/60 bg-surface p-3 transition-colors",
                        isSelected
                          ? "border-moss/40 bg-moss-soft/30"
                          : "hover:border-ember/40",
                      )}
                    >
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl">
                        <ExerciseMedia
                          exercise={ex}
                          signedUrl={signedUrls[ex.id] ?? null}
                          size="lg"
                        />
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <p className="truncate font-display text-sm font-semibold text-ink">
                          {ex.name}
                        </p>
                        <p className="text-[11px] text-ink-soft">
                          {PRIMARY_MUSCLE_LABEL[
                            ex.primary_muscle as PrimaryMuscleGroup
                          ] ?? "Outro"}
                          {ex.equipment && ex.equipment !== "nenhum"
                            ? ` · ${equipmentShortLabel(ex.equipment as EquipmentKind)}`
                            : ""}
                        </p>
                        <div className="mt-auto pt-2">
                          <AddButton
                            isSelected={isSelected}
                            onClick={() => onAdd(ex)}
                          />
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))
        )}
      </div>
    </div>
  );
}

function AddButton({
  isSelected,
  onClick,
}: {
  isSelected: boolean;
  onClick: () => void;
}) {
  if (isSelected) {
    return (
      <span className="inline-flex h-8 items-center gap-1.5 rounded-pill bg-moss-soft px-3 text-[11px] font-semibold text-moss-dark">
        <Check size={12} aria-hidden="true" />
        Adicionado
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-8 items-center gap-1.5 rounded-pill bg-ember px-3 text-[11px] font-semibold text-white transition-colors hover:bg-ember-dark"
    >
      <Plus size={12} aria-hidden="true" />
      Adicionar
    </button>
  );
}

function equipmentShortLabel(eq: EquipmentKind): string {
  switch (eq) {
    case "haltere": return "Haltere";
    case "barra": return "Barra";
    case "maquina": return "Máquina";
    case "elastico": return "Elástico";
    case "cabo": return "Cabo";
    case "kettlebell": return "Kettlebell";
    case "outro": return "Outro";
    case "nenhum": return "Peso corporal";
  }
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CalendarDays,
  Dumbbell,
  Play,
  X,
  Check,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { setPlanWeekday, startWorkoutSession } from "./actions";
import { cn } from "@/lib/cn";

const WEEKDAYS = [
  { value: 0, short: "Dom", long: "Domingo" },
  { value: 1, short: "Seg", long: "Segunda" },
  { value: 2, short: "Ter", long: "Terça" },
  { value: 3, short: "Qua", long: "Quarta" },
  { value: 4, short: "Qui", long: "Quinta" },
  { value: 5, short: "Sex", long: "Sexta" },
  { value: 6, short: "Sáb", long: "Sábado" },
] as const;

export type SchedulePlan = {
  id: string;
  name: string;
  is_active: boolean;
  scheduled_weekday: number | null;
};

export function WeeklySchedule({
  plans,
  weekStart,
  sessionsByDate,
  todayDate,
}: {
  plans: SchedulePlan[];
  /** ISO date da segunda-feira da semana (yyyy-MM-dd). */
  weekStart: string;
  sessionsByDate: Record<string, { id: string; workout_name: string; finished: boolean }[]>;
  /** ISO date de hoje (yyyy-MM-dd). */
  todayDate: string;
}) {
  return (
    <div className="space-y-4">
      <p className="text-[12px] text-ink-soft">
        Defina um plano para cada dia. Você pode ter o mesmo plano em vários dias ou
        deixar dias sem treino.
      </p>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {WEEKDAYS.map((day) => {
          const dateIso = dateForWeekday(weekStart, day.value);
          const isToday = dateIso === todayDate;
          const plansForDay = plans.filter((p) => p.scheduled_weekday === day.value);
          const sessions = sessionsByDate[dateIso] ?? [];
          return (
            <DayCard
              key={day.value}
              day={day}
              dateIso={dateIso}
              isToday={isToday}
              plansForDay={plansForDay}
              sessions={sessions}
              allPlans={plans}
            />
          );
        })}
      </div>
    </div>
  );
}

function DayCard({
  day,
  dateIso,
  isToday,
  plansForDay,
  sessions,
  allPlans,
}: {
  day: { value: number; short: string; long: string };
  dateIso: string;
  isToday: boolean;
  plansForDay: SchedulePlan[];
  sessions: { id: string; workout_name: string; finished: boolean }[];
  allPlans: SchedulePlan[];
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function start(planId: string | null, name: string) {
    setError(null);
    startTransition(async () => {
      try {
        const res = await startWorkoutSession({
          workout_plan_id: planId,
          workout_name: name,
        });
        router.push(`/treinos/sessao/${res.id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao iniciar.");
      }
    });
  }

  function removeSchedule(planId: string) {
    startTransition(async () => {
      try {
        await setPlanWeekday(planId, null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao limpar.");
      }
    });
  }

  return (
    <div
      className={cn(
        "rounded-2xl border bg-surface p-3",
        isToday ? "border-ember/50 shadow-card" : "border-line/60",
      )}
    >
      <div className="mb-2 flex items-baseline justify-between">
        <div>
          <p
            className={cn(
              "font-display text-sm font-bold",
              isToday ? "text-ember" : "text-ink",
            )}
          >
            {day.short}
          </p>
          <p className="text-[10px] text-ink-faint">{formatDayNumber(dateIso)}</p>
        </div>
        {isToday && (
          <span className="rounded-pill bg-ember-soft px-1.5 py-0.5 text-[9px] font-bold uppercase text-ember-dark">
            hoje
          </span>
        )}
      </div>

      <ul className="space-y-1.5">
        {plansForDay.map((p) => (
          <li key={p.id}>
            <div className="flex items-center gap-1 rounded-xl bg-base/40 px-2 py-1.5">
              <Dumbbell size={12} aria-hidden="true" className="text-ember shrink-0" />
              <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-ink">
                {p.name}
              </span>
              <button
                type="button"
                onClick={() => removeSchedule(p.id)}
                className="inline-flex h-5 w-5 items-center justify-center rounded text-ink-faint hover:bg-line/60 hover:text-ember-dark"
                aria-label={`Remover ${p.name} de ${day.long}`}
              >
                <X size={10} aria-hidden="true" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => start(p.id, p.name)}
              disabled={isPending}
              className="mt-1 flex w-full items-center justify-center gap-1 rounded-pill bg-ember px-2 py-1 text-[11px] font-semibold text-white hover:bg-ember-dark disabled:opacity-60"
            >
              <Play size={10} aria-hidden="true" />
              Iniciar
            </button>
          </li>
        ))}

        {sessions.map((s) => (
          <li key={s.id}>
            <div
              className={cn(
                "flex items-center gap-1 rounded-xl border px-2 py-1.5 text-[11px]",
                s.finished
                  ? "border-moss/30 bg-moss-soft text-moss-dark"
                  : "border-ember/30 bg-ember-soft text-ember-dark",
              )}
            >
              {s.finished ? (
                <Check size={10} aria-hidden="true" />
              ) : (
                <AlertTriangle size={10} aria-hidden="true" />
              )}
              <span className="min-w-0 flex-1 truncate">{s.workout_name}</span>
              {!s.finished && (
                <Link
                  href={`/treinos/sessao/${s.id}`}
                  className="font-semibold underline-offset-2 hover:underline"
                >
                  retomar
                </Link>
              )}
            </div>
          </li>
        ))}

        {plansForDay.length === 0 && sessions.length === 0 && (
          <li>
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-line/60 bg-base/30 px-2 py-3 text-[11px] text-ink-faint hover:border-ember/40 hover:text-ember-dark"
            >
              + plano
            </button>
          </li>
        )}
      </ul>

      {(plansForDay.length > 0 || sessions.length > 0) && (
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="mt-2 w-full text-[10px] font-medium text-ink-faint hover:text-ink"
        >
          + adicionar
        </button>
      )}

      {error && (
        <p className="mt-1 text-[10px] text-ember-dark" role="alert">
          {error}
        </p>
      )}

      {pickerOpen && (
        <PlanPickerDialog
          weekdayLabel={day.long}
          plans={allPlans}
          onClose={() => setPickerOpen(false)}
          onPick={async (plan) => {
            try {
              await setPlanWeekday(plan.id, day.value);
              setPickerOpen(false);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Erro.");
            }
          }}
        />
      )}
    </div>
  );
}

function PlanPickerDialog({
  weekdayLabel,
  plans,
  onClose,
  onPick,
}: {
  weekdayLabel: string;
  plans: SchedulePlan[];
  onClose: () => void;
  onPick: (plan: SchedulePlan) => void | Promise<void>;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="plan-picker-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 backdrop-blur-sm animate-fade-in sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-card bg-base shadow-floating border border-line/60 animate-fade-up sm:rounded-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line/60 px-4 py-3 sm:px-6">
          <h2 id="plan-picker-title" className="font-display text-lg font-bold text-ink">
            Plano para {weekdayLabel}
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

        <div className="max-h-80 space-y-1 overflow-y-auto p-4 sm:p-6">
          {plans.length === 0 ? (
            <p className="rounded-2xl bg-base/40 p-4 text-center text-[12px] text-ink-soft">
              Você ainda não tem planos. Crie um em /treinos/planos.
            </p>
          ) : (
            <ul className="space-y-1">
              {plans.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => onPick(p)}
                    className="flex w-full items-center gap-3 rounded-xl border border-line/60 bg-surface p-3 text-left hover:border-ember/40"
                  >
                    <Dumbbell size={14} aria-hidden="true" className="text-ember" />
                    <span className="flex-1 truncate text-sm">{p.name}</span>
                    {p.is_active && (
                      <span className="rounded-pill bg-moss-soft px-1.5 py-0.5 text-[10px] font-semibold text-moss-dark">
                        ativo
                      </span>
                    )}
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

function formatDayNumber(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

/** Calcula o ISO date de um weekday na semana que começa em `weekStartISO`. */
function dateForWeekday(weekStartISO: string, weekday: number): string {
  // weekStartISO é segunda-feira; JS getDay retorna 0=domingo.
  // Distância de segunda até `weekday` (0..6).
  const start = new Date(weekStartISO + "T00:00:00");
  const mondayOffset = weekday === 0 ? 6 : weekday - 1;
  start.setDate(start.getDate() + mondayOffset);
  const y = start.getFullYear();
  const m = String(start.getMonth() + 1).padStart(2, "0");
  const d = String(start.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function WeeklyHeader({ weekStart }: { weekStart: string }) {
  return (
    <div className="flex items-center gap-2 text-[12px] text-ink-soft">
      <CalendarDays size={14} aria-hidden="true" />
      <span>Semana de {formatLongDate(weekStart)}</span>
    </div>
  );
}

function formatLongDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
  }).format(date);
}

// Re-exports para evitar warnings de imports não usados.
export { Trash2 };
